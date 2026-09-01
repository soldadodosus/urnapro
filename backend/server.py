from datetime import datetime, timezone
import logging
import os
import uuid
from pathlib import Path
from typing import Any, Dict, List

import bcrypt
import jwt
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, ConfigDict, EmailStr, Field


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]
JWT_SECRET = os.getenv("JWT_SECRET")
if not JWT_SECRET or len(JWT_SECRET) < 32:
    raise RuntimeError("JWT_SECRET must be configured with at least 32 characters")
JWT_ALGORITHM = "HS256"
security = HTTPBearer(auto_error=False)

app = FastAPI(title="UrnaPro API")
api_router = APIRouter(prefix="/api")
logger = logging.getLogger(__name__)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)


class UserPublic(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    name: str
    email: EmailStr
    role: str


class AuthResponse(BaseModel):
    token: str
    user: UserPublic


class CampaignUpdate(BaseModel):
    target_votes: int = Field(ge=1, le=10_000_000)
    confirmed_votes: int = Field(ge=0, le=10_000_000)
    estimated_votes: int = Field(ge=0, le=10_000_000)


class CampaignResponse(CampaignUpdate):
    id: str
    name: str
    updated_at: str
    updated_by: str
    scenarios: Dict[str, Dict[str, Any]]


class CollaboratorCreate(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    email: EmailStr
    password: str = Field(min_length=6)


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))
    except (ValueError, TypeError):
        return False


def public_user(document: Dict[str, Any]) -> UserPublic:
    return UserPublic(
        id=document["id"],
        name=document["name"],
        email=document["email"],
        role=document["role"],
    )


def token_for(user: Dict[str, Any]) -> str:
    return jwt.encode(
        {"sub": user["id"], "role": user["role"], "exp": datetime.now(timezone.utc).timestamp() + 60 * 60 * 24 * 7},
        JWT_SECRET,
        algorithm=JWT_ALGORITHM,
    )


async def current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Autenticação necessária")
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
    except jwt.PyJWTError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Sessão inválida") from exc
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuário não encontrado")
    return user


async def require_admin(user: Dict[str, Any] = Depends(current_user)) -> Dict[str, Any]:
    if user["role"] != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acesso exclusivo do administrador")
    return user


def campaign_with_scenarios(document: Dict[str, Any]) -> CampaignResponse:
    target = document["target_votes"]
    confirmed = document["confirmed_votes"]
    estimated = document["estimated_votes"]
    factors = {"ruim": 0.70, "real": 1.00, "otimista": 1.30}
    scenarios = {}
    for key, factor in factors.items():
        projected = round(confirmed + estimated * factor)
        scenarios[key] = {
            "factor": factor,
            "projected_votes": projected,
            "target_percentage": round((projected / target) * 100, 1),
            "reaches_target": projected >= target,
        }
    return CampaignResponse(
        id=document["id"],
        name=document["name"],
        target_votes=target,
        confirmed_votes=confirmed,
        estimated_votes=estimated,
        updated_at=document["updated_at"],
        updated_by=document.get("updated_by", "Equipe"),
        scenarios=scenarios,
    )


@api_router.get("/")
async def root() -> Dict[str, str]:
    return {"message": "UrnaPro API online"}


@api_router.post("/auth/login", response_model=AuthResponse)
async def login(input_data: LoginRequest) -> AuthResponse:
    user = await db.users.find_one({"email": input_data.email.lower()}, {"_id": 0})
    if not user or not verify_password(input_data.password, user["password_hash"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="E-mail ou senha incorretos")
    return AuthResponse(token=token_for(user), user=public_user(user))


@api_router.get("/auth/me", response_model=UserPublic)
async def me(user: Dict[str, Any] = Depends(current_user)) -> UserPublic:
    return public_user(user)


@api_router.get("/campaign", response_model=CampaignResponse)
async def get_campaign(user: Dict[str, Any] = Depends(current_user)) -> CampaignResponse:
    document = await db.campaigns.find_one({"id": "campaign-main"}, {"_id": 0})
    if not document:
        raise HTTPException(status_code=404, detail="Campanha não encontrada")
    return campaign_with_scenarios(document)


@api_router.put("/campaign", response_model=CampaignResponse)
async def update_campaign(input_data: CampaignUpdate, user: Dict[str, Any] = Depends(current_user)) -> CampaignResponse:
    if input_data.confirmed_votes > input_data.target_votes * 2:
        raise HTTPException(status_code=400, detail="Votos contabilizados parecem acima do limite esperado")
    values = input_data.model_dump()
    values.update({"updated_at": now_iso(), "updated_by": user["name"]})
    await db.campaigns.update_one({"id": "campaign-main"}, {"$set": values}, upsert=False)
    document = await db.campaigns.find_one({"id": "campaign-main"}, {"_id": 0})
    if not document:
        raise HTTPException(status_code=404, detail="Campanha não encontrada")
    return campaign_with_scenarios(document)


@api_router.get("/team", response_model=List[UserPublic])
async def get_team(user: Dict[str, Any] = Depends(current_user)) -> List[UserPublic]:
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).sort("role", 1).to_list(100)
    return [public_user(item) for item in users]


@api_router.post("/team", response_model=UserPublic)
async def create_team_member(input_data: CollaboratorCreate, user: Dict[str, Any] = Depends(require_admin)) -> UserPublic:
    email = input_data.email.lower()
    if await db.users.find_one({"email": email}, {"_id": 0}):
        raise HTTPException(status_code=409, detail="Este e-mail já está na equipe")
    document = {
        "id": str(uuid.uuid4()),
        "name": input_data.name,
        "email": email,
        "role": "collaborator",
        "password_hash": hash_password(input_data.password),
        "created_at": now_iso(),
    }
    await db.users.insert_one(document)
    return public_user(document)


@app.on_event("startup")
async def seed_database() -> None:
    demo_users = [
        {"id": "demo-admin", "name": "Marina Costa", "email": "admin@urnapro.app", "role": "admin", "password": "UrnaPro@2026"},
        {"id": "demo-collaborator", "name": "Rafael Lima", "email": "colaborador@urnapro.app", "role": "collaborator", "password": "UrnaPro@2026"},
    ]
    for item in demo_users:
        await db.users.update_one(
            {"email": item["email"]},
            {"$setOnInsert": {
                "id": item["id"],
                "name": item["name"],
                "email": item["email"],
                "role": item["role"],
                "password_hash": hash_password(item["password"]),
                "created_at": now_iso(),
            }},
            upsert=True,
        )
    await db.campaigns.update_one(
        {"id": "campaign-main"},
        {"$setOnInsert": {
            "id": "campaign-main",
            "name": "Campanha Municipal 2026",
            "target_votes": 12000,
            "confirmed_votes": 6380,
            "estimated_votes": 4100,
            "updated_at": now_iso(),
            "updated_by": "Marina Costa",
        }},
        upsert=True,
    )


app.include_router(api_router)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client() -> None:
    client.close()