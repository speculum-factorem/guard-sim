import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import { registerRequest } from "../api";
import { emailValidationMessage, passwordValidationMessage } from "../authValidation";
import { useAuth } from "../context/AuthContext";
import { colors } from "../theme";
import type { RootStackParamList } from "../navigation/types";

export function RegisterScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { applyAuthResponse } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const [consentError, setConsentError] = useState<string | null>(null);

  async function onSubmit() {
    setError(null);
    const e = emailValidationMessage(email);
    const p = passwordValidationMessage(password, "register");
    setEmailError(e);
    setPasswordError(p);
    if (!consent) {
      setConsentError("Для регистрации необходимо согласие на обработку персональных данных");
    } else {
      setConsentError(null);
    }
    if (e || p || !consent) return;
    setBusy(true);
    try {
      const r = await registerRequest(email.trim(), password);
      await applyAuthResponse(r);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка регистрации");
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Регистрация</Text>
          <Text style={styles.sub}>
            Создайте аккаунт — прогресс хранится на сервере. Пароль не короче 8 символов.
          </Text>
          {error ? (
            <View style={styles.errBox}>
              <Text style={styles.errText}>{error}</Text>
            </View>
          ) : null}
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[styles.input, emailError ? styles.inputBad : null]}
            value={email}
            onChangeText={(t) => {
              setEmail(t);
              if (emailError) setEmailError(emailValidationMessage(t));
            }}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="you@example.com"
            placeholderTextColor={colors.muted}
          />
          {emailError ? <Text style={styles.fieldErr}>{emailError}</Text> : null}
          <Text style={styles.label}>Пароль</Text>
          <TextInput
            style={[styles.input, passwordError ? styles.inputBad : null]}
            value={password}
            onChangeText={(t) => {
              setPassword(t);
              if (passwordError) setPasswordError(passwordValidationMessage(t, "register"));
            }}
            secureTextEntry
            placeholder="••••••••"
            placeholderTextColor={colors.muted}
          />
          {passwordError ? <Text style={styles.fieldErr}>{passwordError}</Text> : null}
          <View style={styles.consentRow}>
            <Switch
              value={consent}
              onValueChange={(v) => {
                setConsent(v);
                if (v) setConsentError(null);
              }}
              trackColor={{ false: colors.border, true: colors.accentDim }}
              thumbColor={consent ? colors.accent : "#888"}
            />
            <Text style={styles.consentText}>Согласие на обработку персональных данных</Text>
          </View>
          {consentError ? <Text style={styles.fieldErr}>{consentError}</Text> : null}
          <Pressable
            style={({ pressed }) => [styles.btnPrimary, pressed && styles.pressed, busy && styles.disabled]}
            onPress={() => void onSubmit()}
            disabled={busy}
          >
            <Text style={styles.btnPrimaryText}>{busy ? "Регистрация…" : "Создать аккаунт"}</Text>
          </Pressable>
          <Pressable onPress={() => navigation.navigate("Login")}>
            <Text style={styles.link}>Уже есть аккаунт? Войти</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 40 },
  title: { color: colors.text, fontSize: 26, fontWeight: "800", marginBottom: 8 },
  sub: { color: colors.muted, fontSize: 15, lineHeight: 22, marginBottom: 20 },
  errBox: {
    backgroundColor: "rgba(240,113,120,0.12)",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  errText: { color: colors.danger, fontSize: 14 },
  label: { color: colors.muted, fontSize: 13, marginBottom: 6, fontWeight: "600" },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    marginBottom: 8,
  },
  inputBad: { borderColor: colors.danger },
  fieldErr: { color: colors.danger, fontSize: 13, marginBottom: 12 },
  consentRow: { flexDirection: "row", alignItems: "center", gap: 12, marginVertical: 12 },
  consentText: { flex: 1, color: colors.text, fontSize: 14, lineHeight: 20 },
  btnPrimary: {
    backgroundColor: colors.accent,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  btnPrimaryText: { color: "#04210f", fontWeight: "700", fontSize: 16 },
  link: { color: colors.accentBlue, marginTop: 20, fontSize: 15, textAlign: "center" },
  pressed: { opacity: 0.88 },
  disabled: { opacity: 0.5 },
});
