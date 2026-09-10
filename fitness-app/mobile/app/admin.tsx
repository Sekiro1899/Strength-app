/**
 * Panneau d'administration.
 *
 * Trois sections : la bibliothèque d'exercices en Kanban, les personae et
 * leurs programmes, le référentiel des règles de gestion.
 *
 * L'accès repose sur `users.role = 'admin'` côté Supabase, avec des policies
 * RLS qui refusent l'écriture à tous les autres. Le masquage côté client n'est
 * qu'un confort : le bundle JavaScript est lisible par quiconque ouvre
 * l'application. C'est pour cette raison qu'aucune donnée d'autre pratiquant
 * n'apparaît sur cet écran — seulement le catalogue, que le bundle contient
 * déjà.
 */

import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "./_layout";
import {
  Button,
  Display,
  ErrorText,
  GlassIconButton,
  Loading,
  MonoLabel,
  Screen,
} from "../components/ui";
import { ExerciseForm } from "../components/admin/ExerciseForm";
import { ExerciseKanban } from "../components/admin/ExerciseKanban";
import { PersonaPrograms } from "../components/admin/PersonaPrograms";
import { RulesReference } from "../components/admin/RulesReference";
import { fetchAdminAccess, fetchExerciseLibrary, saveExercise } from "../lib/admin";
import type { AdminAccess } from "../lib/admin";
import type { Exercise } from "../lib/types";

type Tab = "library" | "personas" | "rules";

const TABS: { key: Tab; label: string }[] = [
  { key: "library", label: "Bibliothèque" },
  { key: "personas", label: "Personae" },
  { key: "rules", label: "Règles" },
];

export default function AdminScreen() {
  const router = useRouter();
  const { userId, isLoading: authLoading } = useAuth();

  const [access, setAccess] = useState<AdminAccess | null>(null);
  const [library, setLibrary] = useState<Exercise[]>([]);
  const [tab, setTab] = useState<Tab>("library");
  /** null = pas d'édition · "new" = création · sinon la fiche ouverte. */
  const [editing, setEditing] = useState<Exercise | "new" | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    try {
      const granted = await fetchAdminAccess(userId);
      setAccess(granted);
      if (granted.allowed) setLibrary(await fetchExerciseLibrary());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Chargement impossible.");
    }
  }, [userId]);

  useEffect(() => {
    if (authLoading) return;
    if (!userId) {
      router.replace("/login");
      return;
    }
    load().finally(() => setLoading(false));
  }, [userId, authLoading, load, router]);

  if (loading) return <Loading label="Vérification des droits" />;

  if (!access?.allowed) {
    return (
      <Screen center>
        <Display size={22} className="text-center mb-3">
          Accès refusé
        </Display>
        <Text className="font-body text-[12px] text-muted text-center mb-6">
          {access?.reason ?? "Ce compte n'a pas accès à l'administration."}
        </Text>
        <Button label="Retour" onPress={() => router.replace("/dashboard")} />
      </Screen>
    );
  }

  // La fiche prend tout l'écran : elle est longue, et la survoler à moitié
  // produit exactement les exercices incomplets qu'on cherche à éviter.
  if (editing !== null) {
    return (
      <SafeAreaView className="flex-1 bg-bg">
        <View className="flex-1 w-full max-w-[560px] mx-auto px-5 pt-4">
          <ExerciseForm
            exercise={editing === "new" ? null : editing}
            library={library}
            canWrite={access.canWrite}
            onCancel={() => setEditing(null)}
            onSave={async (exercise) => {
              await saveExercise(exercise);
              await load();
              setEditing(null);
            }}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <View className="flex-1 w-full max-w-[900px] mx-auto px-5 pt-4">
        <View className="flex-row items-center gap-3 mb-4">
          <GlassIconButton
            icon="‹"
            label="Retour"
            onPress={() => router.replace("/dashboard")}
          />
          <View className="flex-1">
            <MonoLabel tone="accent">Administration</MonoLabel>
          </View>
        </View>

        <ErrorText message={error} />

        {/* L'écriture indisponible se DIT. Griser un bouton sans expliquer
            laisse chercher la faute du mauvais côté. */}
        {!access.canWrite && access.reason ? (
          <View className="rounded-xl border border-line bg-surface px-3.5 py-3 mb-3">
            <Text className="font-mono text-[9px] uppercase tracking-label text-muted">
              Lecture seule
            </Text>
            <Text className="font-body text-[11px] text-muted mt-1.5 leading-4">
              {access.reason}
            </Text>
          </View>
        ) : null}

        <View className="flex-row gap-1.5 mb-4">
          {TABS.map((t) => (
            <Pressable
              key={t.key}
              accessibilityRole="tab"
              aria-selected={tab === t.key}
              onPress={() => setTab(t.key)}
              className={`flex-1 rounded-lg border py-2.5 items-center active:opacity-70 ${
                tab === t.key ? "bg-accent border-accent" : "bg-surface border-line"
              }`}
            >
              <Text
                className={`font-mono text-[10px] uppercase tracking-label ${
                  tab === t.key ? "text-black" : "text-muted"
                }`}
              >
                {t.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {tab === "library" ? (
          <ExerciseKanban
            library={library}
            canWrite={access.canWrite}
            onCreate={() => setEditing("new")}
            onOpen={(exercise) => setEditing(exercise)}
          />
        ) : (
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ paddingBottom: 32 }}
            showsVerticalScrollIndicator={false}
          >
            {tab === "personas" ? <PersonaPrograms /> : <RulesReference />}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}
