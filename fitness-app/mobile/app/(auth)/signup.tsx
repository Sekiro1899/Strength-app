import { useState } from "react";
import { KeyboardAvoidingView, Platform, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../_layout";
import {
  Body,
  Button,
  Display,
  ErrorText,
  MonoLabel,
  Screen,
} from "../../components/ui";
import { COLORS } from "../../lib/theme";
import { signUp } from "../../lib/data";

const MIN_PASSWORD = 6;

export default function SignupScreen() {
  const router = useRouter();
  const { refresh } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const tooShort = password.length > 0 && password.length < MIN_PASSWORD;

  async function handleSignup() {
    setError(null);
    setLoading(true);
    try {
      await signUp(email.trim(), password);
      refresh();
      router.replace("/questionnaire");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Inscription impossible.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-bg"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Screen scroll={false} backdrop="auth">
        <View className="flex-1 justify-between">
          <View>
            <MonoLabel tone="accent" className="mb-5">
              Étape 01 · Compte
            </MonoLabel>
            <Display size={34}>
              Neuf questions,{"\n"}
              <Text className="text-accent">un programme</Text>.
            </Display>
            <Body className="mt-4">
              On identifie ton persona parmi cinq profils, puis on assigne le
              programme qui te correspond.
            </Body>
          </View>

          <View>
            <ErrorText message={error} />

            <MonoLabel className="mb-2">Email</MonoLabel>
            <TextInput
              className="bg-surface border border-line rounded-[14px] px-4 py-3.5 font-body text-[14px] text-ink mb-4"
              placeholder="toi@exemple.com"
              placeholderTextColor={COLORS.muted}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              inputMode="email"
            />

            <MonoLabel className="mb-2">Mot de passe</MonoLabel>
            <TextInput
              className="bg-surface border border-line rounded-[14px] px-4 py-3.5 font-body text-[14px] text-ink"
              placeholder={`${MIN_PASSWORD} caractères minimum`}
              placeholderTextColor={COLORS.muted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="new-password"
            />
            <Text className="font-mono text-[9px] uppercase tracking-label text-danger h-4 mt-2">
              {tooShort ? `Minimum ${MIN_PASSWORD} caractères` : ""}
            </Text>
          </View>

          <View className="gap-2.5">
            <Button
              label="Commencer le profilage"
              onPress={handleSignup}
              loading={loading}
              disabled={!email || password.length < MIN_PASSWORD}
            />
            <Button
              label="J'ai déjà un compte"
              variant="ghost"
              onPress={() => router.replace("/login")}
            />
          </View>
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}
