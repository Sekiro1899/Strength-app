import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "./_layout";
import {
  Button,
  Card,
  ErrorText,
  Label,
  Loading,
  Pill,
  Screen,
} from "../components/ui";
import { fetchOnboardingResult } from "../lib/data";
import { TIEBREAK_ORDER } from "../lib/scoring";
import type { OnboardingResult, PersonaCode } from "../lib/types";

const PERSONA_LABELS: Record<PersonaCode, string> = {
  SMB: "Summer Muscle Builder",
  BF: "Brut Force",
  AW: "Athlete Wannabe",
  CR: "Corporate Rusher",
  SAV: "Savage",
};

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

  if (loading || authLoading) return <Loading label="Calcul de votre profil…" />;

  if (!result) {
    return (
      <Screen center>
        <ErrorText message={error ?? "Profil introuvable."} />
        <Button label="Refaire le questionnaire" onPress={() => router.replace("/questionnaire")} />
      </Screen>
    );
  }

  const { persona, program, scores } = result;
  const tint = persona.color ?? "#1565C0";
  const maxScore = Math.max(...Object.values(scores), 1);

  const duration = program.is_continuous
    ? "En continu"
    : `${program.duration_weeks} semaines`;
  const frequency =
    program.frequency_per_week_min === program.frequency_per_week_max
      ? `${program.frequency_per_week_min}×/sem`
      : `${program.frequency_per_week_min}–${program.frequency_per_week_max}×/sem`;
  const sessionLength =
    program.session_duration_min === program.session_duration_max
      ? `${program.session_duration_min} min`
      : `${program.session_duration_min}–${program.session_duration_max} min`;

  return (
    <Screen
      footer={
        <Button
          label="Démarrer mon programme"
          onPress={() => router.replace("/dashboard")}
          color={tint}
        />
      }
    >
      <View className="items-center mb-6">
        <Label>Votre profil</Label>
        <View
          className="w-24 h-24 rounded-full items-center justify-center my-4"
          style={{ backgroundColor: `${tint}1F` }}
        >
          <Text className="text-5xl">{persona.icon}</Text>
        </View>
        <Text className="text-2xl font-bold text-center text-slate-900">
          {persona.name}
        </Text>
        {persona.tagline ? (
          <Text className="text-sm text-slate-500 text-center mt-1">
            {persona.tagline}
          </Text>
        ) : null}
      </View>

      {persona.description ? (
        <Card className="mb-4">
          <Text className="text-sm text-slate-700 leading-5">
            {persona.description}
          </Text>
        </Card>
      ) : null}

      <Card tint={tint} className="mb-4">
        <Label>Programme assigné</Label>
        <View className="flex-row items-center mt-2 mb-1">
          <Text className="text-2xl mr-2">{program.icon}</Text>
          <Text className="text-lg font-bold text-slate-900 flex-1">
            {program.name}
          </Text>
        </View>
        {program.tagline ? (
          <Text className="text-sm text-slate-600 mb-4">{program.tagline}</Text>
        ) : null}
        <View className="flex-row flex-wrap gap-2">
          <Pill label="Durée" value={duration} />
          <Pill label="Fréquence" value={frequency} />
          <Pill label="Séance" value={sessionLength} />
        </View>
      </Card>

      {/* Le détail du score rend l'attribution lisible — utile pour itérer
          sur la pondération du questionnaire. */}
      <Card>
        <Label>Détail du scoring</Label>
        <View className="mt-3 gap-2">
          {TIEBREAK_ORDER.map((code) => {
            const value = scores[code];
            const isWinner = code === persona.code;
            const width = Math.max(0, (value / maxScore) * 100);
            return (
              <View key={code} className="flex-row items-center">
                <Text
                  className={`w-11 text-[11px] ${
                    isWinner ? "font-bold text-slate-900" : "text-slate-400"
                  }`}
                >
                  {code}
                </Text>
                <View className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden mx-2">
                  <View
                    className="h-full rounded-full"
                    style={{
                      width: `${width}%`,
                      backgroundColor: isWinner ? tint : "#cbd5e1",
                    }}
                  />
                </View>
                <Text
                  className={`w-7 text-right text-[11px] ${
                    isWinner ? "font-bold text-slate-900" : "text-slate-400"
                  }`}
                >
                  {value}
                </Text>
              </View>
            );
          })}
        </View>
        <Text className="text-[11px] text-slate-400 mt-3 leading-4">
          {PERSONA_LABELS[persona.code]} l'emporte. Égalité départagée dans
          l'ordre CR › SMB › AW › BF › SAV.
        </Text>
      </Card>
    </Screen>
  );
}
