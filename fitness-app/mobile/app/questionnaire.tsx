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

interface Option {
  id: string;
  label: string;
  value: string;
  question_id: string;
}

interface Question {
  id: string;
  question_number: number;
  text: string;
  type: string;
  options: Option[];
}

interface Answer {
  question_id: string;
  option_ids: string[];
}

export default function QuestionnaireScreen() {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    const { data: qs, error: qErr } = await supabase
      .from("questionnaire_questions")
      .select("id, question_number, text, type")
      .eq("questionnaire_id", "initial_profiling_v3")
      .order("question_number");

    if (qErr || !qs) {
      Alert.alert("Erreur", "Impossible de charger le questionnaire");
      return;
    }

    const { data: opts, error: oErr } = await supabase
      .from("questionnaire_options")
      .select("id, question_id, label, value")
      .in(
        "question_id",
        qs.map((q) => q.id)
      );

    if (oErr || !opts) {
      Alert.alert("Erreur", "Impossible de charger les options");
      return;
    }

    const merged: Question[] = qs.map((q) => ({
      ...q,
      options: opts.filter((o) => o.question_id === q.id),
    }));

    setQuestions(merged);
    setLoading(false);
  };

  const currentQuestion = questions[currentIndex];
  const isMultipleChoice = currentQuestion?.type === "multiple_choice";
  const selectedOptions = answers[currentQuestion?.id] || [];

  const toggleOption = (optionId: string) => {
    const qId = currentQuestion.id;
    const current = answers[qId] || [];

    // Pour les options exclusives (ex: q8_d "Flexible")
    if (isMultipleChoice) {
      if (current.includes(optionId)) {
        setAnswers({ ...answers, [qId]: current.filter((id) => id !== optionId) });
      } else {
        setAnswers({ ...answers, [qId]: [...current, optionId] });
      }
    } else {
      setAnswers({ ...answers, [qId]: [optionId] });
    }
  };

  const canProceed = selectedOptions.length > 0;

  const handleNext = () => {
    if (!canProceed) return;

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);

    const formattedAnswers: Answer[] = Object.entries(answers).map(
      ([question_id, option_ids]) => ({ question_id, option_ids })
    );

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        Alert.alert("Erreur", "Session expirée");
        router.replace("/auth");
        return;
      }

      const res = await supabase.functions.invoke("score-questionnaire", {
        body: { answers: formattedAnswers },
      });

      if (res.error) throw res.error;

      const result = res.data;

      // Naviguer vers le résultat avec les données
      router.replace({
        pathname: "/onboarding-result",
        params: {
          persona_id: result.persona_id,
          persona_code: result.persona_code,
          program_id: result.program_id,
          phase_id: result.phase_id || "",
          protocol: result.protocol || "",
          user_program_id: result.user_program_id,
        },
      });
    } catch (err: any) {
      Alert.alert("Erreur", err.message || "Erreur lors de la soumission");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1565C0" />
      </View>
    );
  }

  if (!currentQuestion) return null;

  return (
    <View style={styles.container}>
      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View
          style={[
            styles.progressBar,
            { width: `${((currentIndex + 1) / questions.length) * 100}%` },
          ]}
        />
      </View>

      <Text style={styles.counter}>
        {currentIndex + 1} / {questions.length}
      </Text>

      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.questionText}>{currentQuestion.text}</Text>

        {isMultipleChoice && (
          <Text style={styles.hint}>Plusieurs réponses possibles</Text>
        )}

        {currentQuestion.options.map((opt) => {
          const isSelected = selectedOptions.includes(opt.id);
          return (
            <Pressable
              key={opt.id}
              style={[styles.option, isSelected && styles.optionSelected]}
              onPress={() => toggleOption(opt.id)}
            >
              <Text
                style={[
                  styles.optionText,
                  isSelected && styles.optionTextSelected,
                ]}
              >
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Navigation buttons */}
      <View style={styles.navRow}>
        {currentIndex > 0 && (
          <Pressable style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>Retour</Text>
          </Pressable>
        )}

        <Pressable
          style={[
            styles.nextButton,
            !canProceed && styles.nextButtonDisabled,
            currentIndex === 0 && { flex: 1 },
          ]}
          onPress={handleNext}
          disabled={!canProceed || submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.nextButtonText}>
              {currentIndex === questions.length - 1 ? "Terminer" : "Suivant"}
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  progressContainer: {
    height: 4,
    backgroundColor: "#e0e0e0",
  },
  progressBar: {
    height: 4,
    backgroundColor: "#1565C0",
  },
  counter: {
    textAlign: "center",
    color: "#999",
    fontSize: 13,
    marginTop: 12,
  },
  scrollArea: { flex: 1 },
  scrollContent: { padding: 24, paddingTop: 16 },
  questionText: {
    fontSize: 20,
    fontWeight: "600",
    lineHeight: 28,
    marginBottom: 24,
  },
  hint: {
    fontSize: 13,
    color: "#888",
    marginBottom: 16,
    fontStyle: "italic",
  },
  option: {
    borderWidth: 1.5,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  optionSelected: {
    borderColor: "#1565C0",
    backgroundColor: "#E3F2FD",
  },
  optionText: { fontSize: 15, color: "#333", lineHeight: 22 },
  optionTextSelected: { color: "#1565C0", fontWeight: "600" },
  navRow: {
    flexDirection: "row",
    padding: 24,
    paddingTop: 12,
    gap: 12,
  },
  backButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#1565C0",
  },
  backButtonText: { color: "#1565C0", fontSize: 16, fontWeight: "600" },
  nextButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#1565C0",
  },
  nextButtonDisabled: { opacity: 0.4 },
  nextButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
