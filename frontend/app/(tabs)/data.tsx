import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { api, Campaign } from "@/src/api";

const c = { bg: "#F8F7F4", ink: "#1C1C1E", muted: "#74736F", brand: "#1F4E3D", pale: "#E5EFEA", white: "#FFFFFF", line: "#E5E5EA", error: "#B91C1C" };

export default function DataScreen() {
  const insets = useSafeAreaInsets();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [target, setTarget] = useState("");
  const [confirmed, setConfirmed] = useState("");
  const [estimated, setEstimated] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try { const result = await api.campaign(); setCampaign(result); setTarget(String(result.target_votes)); setConfirmed(String(result.confirmed_votes)); setEstimated(String(result.estimated_votes)); } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Falha ao carregar os dados."); } finally { setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const save = async () => {
    const values = [target, confirmed, estimated].map((item) => Number(item.replace(/\D/g, "")));
    if (!values[0] || values.some((value) => Number.isNaN(value) || value < 0)) { setError("Preencha todos os campos com números válidos."); return; }
    setSaving(true); setError(""); setMessage("");
    try { const result = await api.updateCampaign({ target_votes: values[0], confirmed_votes: values[1], estimated_votes: values[2] }); setCampaign(result); setMessage("Dados atualizados com sucesso."); } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Não foi possível salvar."); } finally { setSaving(false); }
  };

  if (loading) return <View style={styles.loading}><ActivityIndicator color={c.brand} size="large" /></View>;
  return <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.root}><ScrollView contentContainerStyle={{ paddingTop: insets.top + 22, paddingBottom: insets.bottom + 24 }} keyboardShouldPersistTaps="handled">
    <View style={styles.header}><View><Text style={styles.kicker}>GESTÃO DA CAMPANHA</Text><Text style={styles.title}>Atualizar dados</Text></View><View style={styles.headerIcon}><Ionicons name="create-outline" size={21} color={c.brand} /></View></View>
    <Text style={styles.intro}>Mantenha os números da equipe em dia. As projeções são recalculadas automaticamente.</Text>
    <View style={styles.formCard}><Field testID="data-target" icon="flag-outline" label="Meta de votos" helper="Objetivo definido pela campanha" value={target} onChangeText={setTarget} /><Field testID="data-confirmed" icon="checkmark-circle-outline" label="Votos já contabilizados" helper="Confirmações registradas até agora" value={confirmed} onChangeText={setConfirmed} /><Field testID="data-estimated" icon="people-outline" label="Votos estimados" helper="Intenções e projeções da equipe" value={estimated} onChangeText={setEstimated} /><View style={styles.formula}><Ionicons name="sparkles-outline" size={18} color={c.brand} /><View style={{ flex: 1 }}><Text style={styles.formulaTitle}>Cálculo automático</Text><Text style={styles.formulaText}>Ruim 70% · Real 100% · Otimista 130% dos votos estimados.</Text></View></View>{!!error && <Text style={styles.error}>{error}</Text>}{!!message && <Text style={styles.success}>{message}</Text>}<Pressable testID="data-save" onPress={save} disabled={saving} style={({ pressed }) => [styles.button, pressed && styles.pressed, saving && styles.disabled]}>{saving ? <ActivityIndicator color="#FFFFFF" /> : <><Ionicons name="save-outline" size={19} color="#FFFFFF" /><Text style={styles.buttonText}>Salvar atualizações</Text></>}</Pressable></View>
    {campaign && <View style={styles.note}><Ionicons name="time-outline" size={17} color={c.muted} /><Text style={styles.noteText}>Última atualização por {campaign.updated_by}</Text></View>}
  </ScrollView></KeyboardAvoidingView>;
}

function Field({ testID, icon, label, helper, value, onChangeText }: { testID: string; icon: keyof typeof Ionicons.glyphMap; label: string; helper: string; value: string; onChangeText: (value: string) => void }) { return <View style={styles.field}><View style={styles.fieldIcon}><Ionicons name={icon} size={19} color={c.brand} /></View><View style={styles.fieldCopy}><Text style={styles.fieldLabel}>{label}</Text><Text style={styles.helper}>{helper}</Text></View><TextInput testID={testID} accessibilityLabel={label} keyboardType="number-pad" value={value} onChangeText={onChangeText} style={styles.numberInput} selectTextOnFocus /></View>; }

const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: c.bg }, loading: { flex: 1, backgroundColor: c.bg, alignItems: "center", justifyContent: "center" }, header: { paddingHorizontal: 24, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, kicker: { color: c.brand, fontSize: 11, letterSpacing: 1.5, fontWeight: "800" }, title: { color: c.ink, fontSize: 29, fontWeight: "800", marginTop: 5 }, headerIcon: { width: 46, height: 46, borderRadius: 15, backgroundColor: c.pale, alignItems: "center", justifyContent: "center" }, intro: { color: c.muted, fontSize: 15, lineHeight: 22, marginHorizontal: 24, marginTop: 15, marginBottom: 22 }, formCard: { backgroundColor: c.white, borderRadius: 22, borderWidth: 1, borderColor: c.line, marginHorizontal: 20, padding: 18 }, field: { minHeight: 73, borderBottomWidth: 1, borderBottomColor: c.line, flexDirection: "row", alignItems: "center", paddingVertical: 10 }, fieldIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: c.pale, alignItems: "center", justifyContent: "center" }, fieldCopy: { flex: 1, marginLeft: 11 }, fieldLabel: { color: c.ink, fontSize: 14, fontWeight: "800" }, helper: { color: c.muted, fontSize: 11, marginTop: 4 }, numberInput: { width: 78, color: c.ink, fontSize: 20, fontWeight: "800", textAlign: "right", paddingVertical: 10 }, formula: { backgroundColor: c.pale, borderRadius: 14, padding: 14, flexDirection: "row", gap: 11, alignItems: "flex-start", marginTop: 20 }, formulaTitle: { color: c.brand, fontSize: 13, fontWeight: "800" }, formulaText: { color: c.brand, opacity: 0.8, fontSize: 12, lineHeight: 18, marginTop: 3 }, error: { color: c.error, fontSize: 13, lineHeight: 18, marginTop: 14 }, success: { color: c.brand, fontSize: 13, lineHeight: 18, marginTop: 14, fontWeight: "700" }, button: { minHeight: 52, backgroundColor: c.brand, borderRadius: 14, marginTop: 20, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 9 }, buttonText: { color: c.white, fontSize: 15, fontWeight: "800" }, pressed: { opacity: 0.8, transform: [{ scale: 0.99 }] }, disabled: { opacity: 0.65 }, note: { marginHorizontal: 24, marginTop: 20, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 }, noteText: { color: c.muted, fontSize: 12 } });