import { useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { supabase } from "../lib/supabase";
import { generateWorkout } from "../lib/api";

const PERSONA_INFO: Record<string, { name: string; icon: string; color: string }> = {
  SMB: { name: "Summer Muscle Builder", icon: "💪", color: "#E91E8C" },
  BF: { name: "Brut Force", icon: "🏋️", color: "#B71C1C" },
  AW: { name: "Athlete Wannabe", icon: "⚡", color: "#1565C0" },
  CR: { name: "Corporate Rusher", icon: "⏱️", color: "#2E7D32" },
  SAV: { name: "Savage", icon: "🔥", color: "#6A1B9A" },
};

export default function OnboardingResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    persona_id: string;
    persona_code: string;
    program_id: string;
    phase_id: string;
    protocol: string;
    user_program_id: string;
  }>();

  const [generatingWorkout, setGeneratingWorkout] = useState(false);
  const [sessionGenerated, setSessionGenerated] = useState(false);

  const info = PERSONA_INFO[params.persona_code] || PERSONA_INFO.SMB;

  const handleGenerateFirstSession = async () => {
    setGeneratingWorkout(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifie");

      await generateWorkout({
        user_id: user.id,
        user_program_id: params.user_program_id,
        persona_id: params.persona_id,
        program_id: params.program_id,
        phase_id: params.phase_id || undefined,
        week_number: 1,
        day_number: 1,
        energy_level: 3,
      });

      setSessionGenerated(true);
    } catch (err: any) {
      Alert.alert("Erreur", err.message || "Impossible de generer la seance");
    } finally {
      setGeneratingWorkout(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={[styles.iconContainer, { backgroundColor: info.color + "20" }]}>
        <Text style={styles.icon}>{info.icon}</Text>
      </View>

      <Text style={styles.title}>Ton profil : {info.name}</Text>
      <Text style={styles.code}>{params.persona_code}</Text>
      <Text style={styles.description}>
        Ton programme personnalise est pret. Lance ta premiere seance
        pour commencer ton parcours.
      </Text>

      {!sessionGenerated ? (
        <Pressable
          style={[styles.button, generatingWorkout && styles.buttonDisabled]}
          onPress={handleGenerateFirstSession}
          disabled={generatingWorkout}
        >
          {generatingWorkout ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              Generer ma premiere seance
            </Text>
          )}
        </Pressable>
      ) : (
        <>
          <View style={styles.successBox}>
            <Text style={styles.successText}>
              Ta premiere seance a ete generee !
            </Text>
          </View>
          <Pressable
            style={styles.button}
            onPress={() => router.replace("/dashboard")}
          >
            <Text style={styles.buttonText}>Voir mon dashboard</Text>
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#fff",
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  icon: { fontSize: 48 },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 4,
  },
  code: {
    fontSize: 14,
    color: "#999",
    marginBottom: 16,
  },
  description: {
    fontSize: 15,
    color: "#555",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  button: {
    backgroundColor: "#1565C0",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: "center",
    width: "100%",
    marginBottom: 16,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  successBox: {
    backgroundColor: "#E8F5E9",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    width: "100%",
  },
  successText: {
    color: "#2E7D32",
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },
});
