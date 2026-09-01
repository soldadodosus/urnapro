# UrnaPro — PRD

## Problema
Aplicativo móvel para equipes de campanha acompanharem meta de votos, votos já contabilizados e votos estimados, gerando projeções nos cenários Ruim, Real e Otimista.

## Arquitetura
- Frontend: Expo SDK 54, React Native, Expo Router, abas Painel/Dados/Equipe, armazenamento seguro de token.
- Backend: FastAPI em `0.0.0.0:8001`, JWT, bcrypt e endpoints REST sob `/api`.
- Dados: MongoDB usando `MONGO_URL` e `DB_NAME` do ambiente; campanha compartilhada e usuários com papéis.
- Projeções: Ruim = 70%, Real = 100%, Otimista = 130% dos votos estimados, somados aos votos contabilizados.

## Personas
- Administrador: coordena a campanha, atualiza números e convida colaboradores.
- Colaborador: registra e atualiza os números da campanha, acompanha projeções e equipe.

## Requisitos centrais (estáticos)
- Login por e-mail e senha com sessão persistida.
- Uma campanha compartilhada com meta, contabilizados e estimados.
- Projeções e percentual da meta em três cenários.
- Dashboard visual com métricas, barras comparativas e progresso.
- Permissões distintas para administrador e colaborador.
- Interface móvel moderna, acessível, com estados de carregamento/erro e áreas seguras.

## Implementado em 2026-09-01
- API completa de autenticação, campanha, projeções, atualização e equipe.
- Contas de demonstração documentadas em `test_credentials.md`.
- Dashboard UrnaPro com alternância de cenários e comparação visual.
- Formulário geral para atualizar os três números e salvar no MongoDB.
- Gestão de equipe com convite de colaborador exclusivo para administrador.
- Sessão segura, chave JWT obrigatória com 32+ caracteres e configuração canônica `EXPO_BACKEND_URL`.
- Testes backend e fluxo mobile validados; modal de convite verificado em 390×844.

## Backlog priorizado

### P0 — restante
- Nenhum bloqueador conhecido para o fluxo principal.

### P1
- Histórico de atualizações com autor, data e comparação entre versões.
- Criação/seleção de mais de uma campanha por conta de administrador.
- Convites com link ou código de acesso e redefinição de senha.

### P2
- Exportação de relatório em PDF/CSV.
- Filtros e recortes por região ou equipe quando o modelo de dados evoluir.
- Notificações de meta, atualização e proximidade do objetivo.

## Próximas tarefas
1. Validar o app em dispositivos iOS e Android físicos.
2. Definir política operacional para troca das senhas iniciais.
3. Priorizar histórico ou múltiplas campanhas conforme a operação da equipe.