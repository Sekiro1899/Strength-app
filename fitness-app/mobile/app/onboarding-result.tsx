import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "./_layout";
import {
  Body,
  Button,
  Card,
  Display,
  ErrorText,
  GradientCard,
  Loading,
  MetaPill,
  MonoLabel,
  Screen,
} from "../components/ui";
import { personaColor, personaGradient } from "../lib/theme";
import { fetchOnboardingResult } from "../lib/data";
import { TIEBREAK_ORDER } from "../lib/scoring";
import type { OnboardingResult } from "../lib/types";

export default function OnboardingResultScreen() {
  const router = useRouter();
  const { userId, isLoading: authLoading } = useAuth();

  const [result, setResult] = useState<OnboardingResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!userId) {
      router.replace("/login");
      return;
    }

    let active = true;
    fetchOnboardingResult(userId)
      .then((r) => active && setResult(r))
      .catch((e) => active && setError(e.message))
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, [userId, authLoading, router]);

  if (loading || authLoading) return <Loading label="Calcul du profil" />;

  if (!result) {
    return (
      <Screen center>
        <ErrorText message={error ?? "Profil introuvable."} />
        <Button
          label="Refaire le questionnaire"
          onPress={() => router.replace("/questionnaire")}
        />
      </Screen>
    );
  }

  const { persona, program, scores } = result;
  const tint = personaColor(persona.code);
  const gradient = personaGradient(persona.code);
  const maxScore = Math.max(...Object.values(scores), 1);

  const duration = program.is_continuous
    ? "Continu"
    : `${program.duration_weeks} sem`;
  const frequency =
    program.frequency_per_week_min === program.frequency_per_week_max
      ? `${program.frequency_per_week_min}×`
      : `${program.frequency_per_week_min}-${program.frequency_per_week_max}×`;

  return (
    <Screen
      footer={
        <Button
          label="Démarrer mon programme"
          onPress={() => router.replace("/dashboard")}
        />
      }
    >
      <View className="items-center mb-4">
        <MonoLabel tone="accent">Profil identifié</MonoLabel>
      </View>

      {/* Carte persona — dégradé plein, signature de l'écran 03 */}
      <View className="mb-5">
        <GradientCard colors={gradient} className="items-center py-7">
          <Text className="text-[52px] mb-2">{persona.icon}</Text>
          <View className="items-center">
            <Text
              className="font-display text-white uppercase text-[26px] text-center"
              style={{ lineHeight: 27 }}
            >
              {persona.name}
            </Text>
          </View>
          {persona.tagline ? (
            <Text className="font-body text-[12px] text-white/90 text-center mt-2.5 leading-[17px]">
              {persona.tagline}
            </Text>
          ) : null}
        </GradientCard>
      </View>

      {persona.description ? (
        <Card className="mb-4">
          <Body className="text-ink">{persona.description}</Body>
        </Card>
      ) : null}

      {/* Programme assigné */}
      <Card className="mb-4">
        <MonoLabel tone="accent" className="mb-2">
          Programme assigné
        </MonoLabel>
        <Display size={20} className="mb-2">
          {program.name}
        </Display>
        {program.tagline ? <Body className="mb-4">{program.tagline}</Body> : null}
        <View className="flex-row gap-2.5">
          <MetaPill label="Durée" value={duration} />
          <MetaPill label="Fréq" value={`${frequency}/sem`} />
          <MetaPill
            label="Séance"
            value={`${program.session_duration_min}′`}
          />
        </View>
      </Card>

      {/* Détail du scoring — rend l'attribution lisible et débuggable */}
      <Card>
        <MonoLabel className="mb-3">Détail du scoring</MonoLabel>
        <View className="gap-2">
          {TIEBREAK_ORDER.map((code) => {
            const value = scores[code];
            const isWinner = code === persona.code;
            const width = Math.max(0, (value / maxScore) * 100);
            return (
              <View key={code} className="flex-row items-center">
                <Text
                  className={`w-9 font-mono-md text-[10px] ${
                    isWinner ? "text-ink" : "text-muted"
                  }`}
                >
                  {code}
                </Text>
                <View className="flex-1 h-1.5 bg-bg rounded-full overflow-hidden mx-2">
                  <View
                    className="h-full rounded-full"
                    style={{
                      width: `${width}%`,
                      backgroundColor: isWinner ? tint : "#2a2a3a",
                    }}
                  />
                </View>
                <Text
                  className={`w-6 text-right font-mono-md text-[10px] ${
                    isWinner ? "text-ink" : "text-muted"
                  }`}
                >
                  {value}
                </Text>
              </View>
            );
          })}
        </View>
        <Text className="font-body text-[10px] text-muted mt-3 leading-4">
          Égalité départagée dans l'ordre CR › SMB › AW › BF › SAV.
        </Text>
      </Card>
    </Screen>
  );
}
