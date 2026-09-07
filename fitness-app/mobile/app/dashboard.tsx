import { useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "../lib/supabase";
import { generateWorkout } from "../lib/api";

interface UserProgram {
  id: string;
  program_id: string;
  persona_id: string;
  protocol: string;
  current_phase_id: string | null;
  current_week: number;
  programs: { name: string; tagline: string; icon: string; color: string };
}

interface Session {
  id: string;
  session_label: string;
  focus: string;
  protocol: string;
  week_number: number;
  day_number: number;
  status: string;
  warmup_block: any[];
  main_block: any[];
  core_block: any[];
  finisher_block: any[];
}

export default function DashboardScreen() {
  const router = useRouter();
  const [userProgram, setUserProgram] = useState<UserProgram | null>(null);
  const [latestSession, setLatestSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // Charger le programme actif
    const { data: up } = await supabase
      .from("user_programs")
      .select("id, program_id, persona_id, protocol, current_phase_id, current_week, programs(name, tagline, icon, color)")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (up) setUserProgram(up as unknown as UserProgram);

    // Charger la dernière séance
    const { data: sess } = await supabase
      .from("sessions")
      .select("id, session_label, focus, protocol, week_number, day_number, status, warmup_block, main_block, core_block, finisher_block")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (sess) setLatestSession(sess as Session);

    setLoading(false);
  };

  const handleGenerateNext = async () => {
    if (!userProgram) return;
    setGenerating(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifie");

      const nextDay = latestSession ? latestSession.day_number + 1 : 1;

      await generateWorkout({
        user_id: user.id,
        user_program_id: userProgram.id,
        persona_id: userProgram.persona_id,
        program_id: userProgram.program_id,
        phase_id: userProgram.current_phase_id || undefined,
        week_number: userProgram.current_week,
        day_number: nextDay,
        energy_level: 3,
      });

      await loadData();
    } catch (err: any) {
      Alert.alert("Erreur", err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1565C0" />
      </View>
    );
  }

  const totalExercises = latestSession
    ? (latestSession.warmup_block?.length ?? 0) +
      (latestSession.main_block?.length ?? 0) +
      (latestSession.core_block?.length ?? 0) +
      (latestSession.finisher_block?.length ?? 0)
    : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Programme actif */}
      {userProgram && (
        <View style={styles.programCard}>
          <Text style={styles.programIcon}>{userProgram.programs?.icon}</Text>
          <Text style={styles.programName}>{userProgram.programs?.name}</Text>
          <Text style={styles.programTagline}>{userProgram.programs?.tagline}</Text>
          <Text style={styles.programMeta}>
            Semaine {userProgram.current_week} | Protocole : {userProgram.protocol || "auto"}
          </Text>
        </View>
      )}

      {/* Dernière séance */}
      {latestSession && (
        <View style={styles.sessionCard}>
          <Text style={styles.sectionTitle}>Derniere seance</Text>
          <Text style={styles.sessionLabel}>{latestSession.session_label}</Text>
          <Text style={styles.sessionMeta}>
            Semaine {latestSession.week_number} | Jour {latestSession.day_number} | {totalExercises} exercices
          </Text>
          <Text style={styles.sessionStatus}>
            Statut : {latestSession.status}
          </Text>

          {/* Blocs résumés */}
          <View style={styles.blocksContainer}>
            <BlockSummary label="Warmup" count={latestSession.warmup_block?.length ?? 0} />
            <BlockSummary label="Main" count={latestSession.main_block?.length ?? 0} />
            <BlockSummary label="Core" count={latestSession.core_block?.length ?? 0} />
            <BlockSummary label="Finisher" count={latestSession.finisher_block?.length ?? 0} />
          </View>
        </View>
      )}

      {/* Actions */}
      <Pressable
        style={[styles.button, generating && styles.buttonDisabled]}
        onPress={handleGenerateNext}
        disabled={generating}
      >
        {generating ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Generer la seance suivante</Text>
        )}
      </Pressable>

      <Pressable style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Se deconnecter</Text>
      </Pressable>
    </ScrollView>
  );
}

function BlockSummary({ label, count }: { label: string; count: number }) {
  return (
    <View style={styles.blockChip}>
      <Text style={styles.blockLabel}>{label}</Text>
      <Text style={styles.blockCount}>{count}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  content: { padding: 16, paddingBottom: 40 },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  programCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  programIcon: { fontSize: 40, marginBottom: 8 },
  programName: { fontSize: 20, fontWeight: "bold", marginBottom: 4 },
  programTagline: { fontSize: 14, color: "#666", textAlign: "center", marginBottom: 8 },
  programMeta: { fontSize: 13, color: "#999" },
  sessionCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: { fontSize: 13, color: "#999", fontWeight: "600", marginBottom: 8, textTransform: "uppercase" },
  sessionLabel: { fontSize: 18, fontWeight: "bold", marginBottom: 4 },
  sessionMeta: { fontSize: 14, color: "#555", marginBottom: 4 },
  sessionStatus: { fontSize: 13, color: "#1565C0", marginBottom: 12 },
  blocksContainer: { flexDirection: "row", gap: 8 },
  blockChip: {
    flex: 1,
    backgroundColor: "#E3F2FD",
    borderRadius: 8,
    padding: 8,
    alignItems: "center",
  },
  blockLabel: { fontSize: 11, color: "#1565C0", fontWeight: "600" },
  blockCount: { fontSize: 16, fontWeight: "bold", color: "#0D47A1" },
  button: {
    backgroundColor: "#1565C0",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  logoutButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  logoutText: { color: "#999", fontSize: 14 },
});
