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
import { COLORS, PERSONA_COLORS } from "../../lib/theme";
import { isDemoMode, signIn } from "../../lib/data";

/**
 * Écran d'accueil + connexion.
 *
 * Le motif d'orbites reprend l'écran 01 du prototype : les 5 personas
 * gravitent autour du chiffre, ce qui annonce visuellement le profilage.
 */
function Orbit() {
  return (
    <View className="h-[200px] my-6 items-center justify-center">
      <View className="absolute w-[220px] h-[220px] rounded-full border border-line opacity-50" />
      <View className="absolute w-[164px] h-[164px] rounded-full border border-line" />

      <View
        className="w-[92px] h-[92px] rounded-full items-center justify-center"
        style={{
          backgroundColor: COLORS.accent,
          shadowColor: COLORS.accent,
          shadowOpacity: 0.45,
          shadowRadius: 40,
          shadowOffset: { width: 0, height: 0 },
        }}
      >
        <Text className="font-display text-black text-[34px]">5</Text>
      </View>

      <View
        className="absolute w-3 h-3 rounded-full top-[8px]"
        style={{ backgroundColor: COLORS.ink }}
      />
      <View
        className="absolute w-3 h-3 rounded-full bottom-[22px] right-[36px]"
        style={{ backgroundColor: PERSONA_COLORS.AW }}
      />
      <View
        className="absolute w-3 h-3 rounded-full bottom-[34px] left-[36px]"
        style={{ backgroundColor: PERSONA_COLORS.CR }}
      />
      <View
        className="absolute w-2.5 h-2.5 rounded-full top-[44px] right-[16px]"
        style={{ backgroundColor: PERSONA_COLORS.SAV }}
      />
    </View>
  );
}

export default function LoginScreen() {
  const router = useRouter();
  const { refresh } = useAuth();

  const [showForm, setShowForm] = useState(false);
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
      className="flex-1 bg-bg"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Screen scroll={false}>
        <View className="flex-1 justify-between">
          <View>
            <MonoLabel tone="accent" className="mb-5">
              Strength · v0.1
            </MonoLabel>
            <Display size={36}>
              Construisons{"\n"}ton{" "}
              <Text className="text-accent">programme</Text>.
            </Display>
            <Body className="mt-4">
              Une app de musculation personnalisée selon ton profil, ton temps
              et ton ambition.
            </Body>
          </View>

          {showForm ? (
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
                placeholder="••••••••"
                placeholderTextColor={COLORS.muted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="current-password"
                onSubmitEditing={handleLogin}
              />
            </View>
          ) : (
            <Orbit />
          )}

          <View className="gap-2.5">
            {showForm ? (
              <>
                <Button
                  label="Se connecter"
                  onPress={handleLogin}
                  loading={loading}
                  disabled={!email || !password}
                />
                <Button
                  label="Créer un compte"
                  variant="ghost"
                  onPress={() => router.push("/signup")}
                />
              </>
            ) : (
              <>
                <Button
                  label="Démarrer le profilage"
                  onPress={() => router.push("/signup")}
                />
                <Button
                  label="J'ai déjà un compte"
                  variant="ghost"
                  onPress={() => setShowForm(true)}
                />
              </>
            )}

            {isDemoMode() ? (
              <Text className="font-mono text-[9px] uppercase tracking-label text-muted text-center mt-2 leading-4">
                Mode démo — n'importe quel identifiant fonctionne
              </Text>
            ) : null}
          </View>
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}
