import { useCallback, useEffect, useState } from "react";
import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "./_layout";
import { Backdrop } from "../components/Backdrop";
import {
  Body,
  Button,
  Display,
  ErrorText,
  GlassCard,
  Loading,
  MonoLabel,
  Screen,
} from "../components/ui";
import { fetchProfile, signOut } from "../lib/data";
import type { ProfileView } from "../lib/data";
import { AGE_LABELS, LEVEL_LABELS } from "../lib/profile";
import { PERSONA_COLORS } from "../lib/theme";

/** Une ligne d'information — libellé à gauche, valeur à droite. */
function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-baseline justify-between py-2.5 border-b border-line/50">
      <Text className="font-mono text-[10px] uppercase tracking-label text-muted">
        {label}
      </Text>
      <Text className="font-body-sb text-[13px] text-ink text-right flex-1 ml-4">
        {value}
      </Text>
    </View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { userId, email, refresh } = useAuth();

  const [view, setView] = useState<ProfileView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    try {
      setView(await fetchProfile(userId, new Date()));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <Loading label="Chargement du profil" />;

  if (!view) {
    return (
      <Screen center>
        <ErrorText message={error ?? "Profil introuvable."} />
        <Button label="Retour" onPress={() => router.replace("/dashboard")} />
      </Screen>
    );
  }

  const { persona, program, profile, completedCount, totalPlanned, streak } = view;
  const accent = persona ? PERSONA_COLORS[persona.code] : undefined;

  return (
    <View className="flex-1 bg-bg">
      <Backdrop variant="profile" />
      <Screen
        footer={
          <View className="gap-2.5">
            <Button
              label="Mes séances"
              variant="glass"
              onPress={() => router.push("/sessions")}
            />
            <Button
              label="Se déconnecter"
              variant="ghost"
              onPress={async () => {
                await signOut();
                refresh();
                router.replace("/login");
              }}
            />
          </View>
        }
      >
        <View className="flex-row items-center gap-3 mb-6">
          <Button label="‹" variant="glass" onPress={() => router.back()} />
        </View>

        <MonoLabel tone="accent" className="mb-2">
          Mon profil
        </MonoLabel>
        <Display size={26} className="mb-1">
          {(email ?? "athlète").split("@")[0]}
        </Display>
        <Body className="text-[12px] mb-6">{email}</Body>

        <ErrorText message={error} />

        {persona ? (
          <GlassCard className="mb-3">
            <MonoLabel className="text-[9px]">Persona</MonoLabel>
            <Text
              className="font-display text-[22px] mt-1"
              style={accent ? { color: accent } : undefined}
            >
              {persona.name}
            </Text>
            {persona.tagline ? (
              <Text className="font-body text-[12px] text-muted mt-1">
                {persona.tagline}
              </Text>
            ) : null}
          </GlassCard>
        ) : null}

        <GlassCard className="mb-3">
          <MonoLabel className="text-[9px]">Ce qui pilote mes séances</MonoLabel>
          <View className="mt-2">
            <Row label="Programme" value={program?.name ?? "—"} />
            <Row label="Niveau" value={LEVEL_LABELS[profile.level]} />
            <Row
              label="Âge"
              value={profile.ageBand ? AGE_LABELS[profile.ageBand] : "—"}
            />
            <Row
              label="Variantes allégées"
              value={
                profile.allowRegressions
                  ? "Autorisées dans le bloc principal"
                  : "Écartées — charge libre privilégiée"
              }
            />
          </View>
          <Text className="font-body text-[11px] text-muted mt-3">
            {profile.allowRegressions
              ? "Air squat, pompes sur genoux et bench dips restent proposés : ils servent à installer le mouvement."
              : "Air squat, pompes sur genoux et bench dips sont réservés à l'échauffement — en séance, le moteur préfère goblet squat et barre."}
          </Text>
        </GlassCard>

        <GlassCard>
          <MonoLabel className="text-[9px]">Avancement</MonoLabel>
          <View className="flex-row mt-2">
            <View className="flex-1">
              <Text className="font-display text-accent text-[26px]">
                {completedCount}
                <Text className="font-body text-[12px] text-muted"> / {totalPlanned}</Text>
              </Text>
              <Text className="font-body text-[11px] text-muted mt-0.5">
                séances du cycle
              </Text>
            </View>
            <View className="w-px bg-line mx-4" />
            <View className="flex-1">
              <Text className="font-display text-ink text-[26px]">
                {streak}
                <Text className="font-body text-[12px] text-muted">
                  {" "}
                  {streak > 1 ? "jours" : "jour"}
                </Text>
              </Text>
              <Text className="font-body text-[11px] text-muted mt-0.5">
                série en cours
              </Text>
            </View>
          </View>
        </GlassCard>
      </Screen>
    </View>
  );
}
