import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { api } from "@/src/api";

const colors = { background: "#F8F7F4", ink: "#1C1C1E", muted: "#74736F", brand: "#1F4E3D", border: "#E5E5EA" };

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.me().then(() => router.replace("/(tabs)" as never)).catch(() => undefined).finally(() => setLoading(false));
  }, [router]);

  const submit = async () => {
    if (!email.trim() || password.length < 6) {
      setError("Informe seu e-mail e uma senha com pelo menos 6 caracteres.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await api.login(email.trim(), password);
      router.replace("/(tabs)" as never);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Não foi possível entrar.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <View style={styles.loading}><ActivityIndicator color={colors.brand} size="large" /></View>;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.root}>
      <View style={[styles.content, { paddingTop: insets.top + 28, paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.logoRow}><View style={styles.logo}><Ionicons name="stats-chart" size={22} color="#FFFFFF" /></View><Text style={styles.eyebrow}>CENTRAL DE CAMPANHA</Text></View>
        <View style={styles.headingBlock}><Text style={styles.title}>Decisões melhores começam com dados.</Text><Text style={styles.subtitle}>Acompanhe o caminho até a meta da sua campanha com clareza.</Text></View>
        <View style={styles.formCard}>
          <Text style={styles.cardTitle}>Entrar no UrnaPro</Text>
          <Text style={styles.label}>E-mail da equipe</Text>
          <View style={styles.inputWrap}><Ionicons name="mail-outline" size={19} color={colors.muted} /><TextInput testID="login-email" autoCapitalize="none" keyboardType="email-address" placeholder="voce@campanha.com" placeholderTextColor="#A5A4A0" style={styles.input} value={email} onChangeText={setEmail} /></View>
          <Text style={styles.label}>Senha</Text>
          <View style={styles.inputWrap}><Ionicons name="lock-closed-outline" size={19} color={colors.muted} /><TextInput testID="login-password" secureTextEntry placeholder="Sua senha" placeholderTextColor="#A5A4A0" style={styles.input} value={password} onChangeText={setPassword} /></View>
          {!!error && <Text style={styles.error}>{error}</Text>}
          <Pressable testID="login-submit" accessibilityRole="button" onPress={submit} disabled={submitting} style={({ pressed }) => [styles.button, pressed && styles.pressed, submitting && styles.disabled]}>{submitting ? <ActivityIndicator color="#FFFFFF" /> : <><Text style={styles.buttonText}>Acessar painel</Text><Ionicons name="arrow-forward" size={19} color="#FFFFFF" /></>}</Pressable>
        </View>
        <View style={styles.trustRow}><Ionicons name="shield-checkmark-outline" size={18} color={colors.brand} /><Text style={styles.trustText}>Ambiente protegido para sua equipe</Text></View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background }, loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }, content: { flex: 1, paddingHorizontal: 24, justifyContent: "center" },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 28 }, logo: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center" }, eyebrow: { color: colors.brand, fontSize: 11, fontWeight: "800", letterSpacing: 1.4 }, headingBlock: { marginBottom: 30 }, title: { color: colors.ink, fontSize: 31, lineHeight: 37, fontWeight: "800", letterSpacing: -0.7 }, subtitle: { color: colors.muted, fontSize: 16, lineHeight: 23, marginTop: 12, maxWidth: 340 },
  formCard: { backgroundColor: "#FFFFFF", borderRadius: 20, borderWidth: 1, borderColor: colors.border, padding: 20, shadowColor: "#1C1C1E", shadowOpacity: 0.05, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 2 }, cardTitle: { color: colors.ink, fontSize: 20, fontWeight: "800", marginBottom: 22 }, label: { color: colors.ink, fontSize: 13, fontWeight: "700", marginBottom: 8, marginTop: 4 }, inputWrap: { minHeight: 52, borderWidth: 1, borderColor: colors.border, borderRadius: 13, flexDirection: "row", alignItems: "center", paddingHorizontal: 14, marginBottom: 14, backgroundColor: "#FCFCFB" }, input: { flex: 1, color: colors.ink, fontSize: 16, marginLeft: 10, paddingVertical: 12 }, error: { color: "#B91C1C", fontSize: 13, lineHeight: 19, marginBottom: 12 }, button: { minHeight: 52, borderRadius: 14, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 10, marginTop: 4 }, buttonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" }, pressed: { opacity: 0.82, transform: [{ scale: 0.99 }] }, disabled: { opacity: 0.65 }, trustRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, marginTop: 22 }, trustText: { color: colors.muted, fontSize: 12, fontWeight: "600" },
});