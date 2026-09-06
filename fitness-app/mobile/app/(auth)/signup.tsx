import { useState } from "react";
import { KeyboardAvoidingView, Platform, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../_layout";
import { Button, ErrorText, Screen, Subtitle, Title } from "../../components/ui";
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
      className="flex-1"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Screen center>
        <View className="items-center mb-10">
          <Text className="text-5xl mb-3">🎯</Text>
          <Title>Créer un compte</Title>
          <Subtitle>9 questions et votre programme est prêt</Subtitle>
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
          className="border border-slate-300 bg-white rounded-xl px-4 py-3.5 text-base"
          placeholder={`Mot de passe (min. ${MIN_PASSWORD} caractères)`}
          placeholderTextColor="#94a3b8"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="new-password"
        />
        <Text className="text-xs h-5 mt-1 mb-4 text-red-600">
          {tooShort ? `Minimum ${MIN_PASSWORD} caractères.` : ""}
        </Text>

        <View className="gap-3">
          <Button
            label="S'inscrire"
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
      </Screen>
    </KeyboardAvoidingView>
  );
}
