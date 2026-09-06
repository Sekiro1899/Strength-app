import { useState } from "react";
import { KeyboardAvoidingView, Platform, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../_layout";
import { Button, ErrorText, Screen, Subtitle, Title } from "../../components/ui";
import { isDemoMode, signIn } from "../../lib/data";

export default function LoginScreen() {
  const router = useRouter();
  const { refresh } = useAuth();

  const [email, setEmail] = useState(isDemoMode() ? "demo@strength.app" : "");
  const [password, setPassword] = useState(isDemoMode() ? "demo1234" : "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setError(null);
    setLoading(true);
    try {
      const result = await signIn(email.trim(), password);
      refresh();
      router.replace(result.onboardingCompleted ? "/dashboard" : "/questionnaire");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Connexion impossible.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Screen center>
        <View className="items-center mb-10">
          <Text className="text-5xl mb-3">🏋️</Text>
          <Title>Strength App</Title>
          <Subtitle>Votre programme sportif personnalisé</Subtitle>
        </View>

        <ErrorText message={error} />

        <TextInput
          className="border border-slate-300 bg-white rounded-xl px-4 py-3.5 text-base mb-3"
          placeholder="Email"
          placeholderTextColor="#94a3b8"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          inputMode="email"
        />

        <TextInput
          className="border border-slate-300 bg-white rounded-xl px-4 py-3.5 text-base mb-5"
          placeholder="Mot de passe"
          placeholderTextColor="#94a3b8"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="current-password"
          onSubmitEditing={handleLogin}
        />

        <View className="gap-3">
          <Button
            label="Se connecter"
            onPress={handleLogin}
            loading={loading}
            disabled={!email || !password}
          />
          <Button
            label="Créer un compte"
            variant="secondary"
            onPress={() => router.push("/signup")}
          />
        </View>

        {isDemoMode() ? (
          <Text className="text-xs text-slate-400 text-center mt-6 leading-4">
            Mode démo : n'importe quel email/mot de passe fonctionne.{"\n"}
            Aucune donnée n'est envoyée.
          </Text>
        ) : null}
      </Screen>
    </KeyboardAvoidingView>
  );
}
