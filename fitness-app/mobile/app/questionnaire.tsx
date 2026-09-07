import { useEffect, useMemo, useState } from "react";
import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "./_layout";
import {
  Button,
  ChoiceRow,
  Display,
  ErrorText,
  Loading,
  MonoLabel,
  ProgressBar,
  Screen,
} from "../components/ui";
import { optionLetter } from "../lib/theme";
import { fetchQuestionnaire, submitQuestionnaire } from "../lib/data";
import { PERSONA_CODE_TO_ID, scoreAnswers, toggleMultiChoice } from "../lib/scoring";
import type { QuestionnaireOption, QuestionnaireQuestion } from "../lib/types";

/** Intitulé court affiché en sur-titre, dérivé du rôle de segmentation. */
const ROLE_LABELS: Record<string, string> = {
  primary: "Profil",
  major_differentiator: "Objectif principal",
  secondary: "Historique",
  constraint: "Contraintes",
  psychological_differentiator: "Rapport à l'effort",
};

export default function QuestionnaireScreen() {
  const router = useRouter();
  const { userId, isLoading: authLoading } = useAuth();

  const [questions, setQuestions] = useState<QuestionnaireQuestion[]>([]);
  const [options, setOptions] = useState<QuestionnaireOption[]>([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!userId) {
      router.replace("/login");
      return;
    }

    let active = true;
    fetchQuestionnaire()
      .then(({ questions, options }) => {
        if (!active) return;
        setQuestions(questions);
        setOptions(options);
      })
      .catch((e) => active && setError(e.message))
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, [userId, authLoading, router]);

  const question = questions[index];
  const questionOptions = useMemo(
    () => options.filter((o) => o.question_id === question?.id),
    [options, question?.id],
  );

  if (loading || authLoading) return <Loading label="Chargement" />;

  if (!question) {
    return (
      <Screen center>
        <ErrorText message={error ?? "Aucune question disponible."} />
        <Button label="Réessayer" onPress={() => router.replace("/questionnaire")} />
      </Screen>
    );
  }

  const isMulti = question.type === "multiple_choice";
  const isLast = index === questions.length - 1;
  const answer = answers[question.id];
  const selectedValues = Array.isArray(answer) ? answer : answer ? [answer] : [];
  const canAdvance = selectedValues.length > 0;

  function select(value: string) {
    setAnswers((prev) => {
      if (!isMulti) return { ...prev, [question.id]: value };
      const current = Array.isArray(prev[question.id])
        ? (prev[question.id] as string[])
        : [];
      return {
        ...prev,
        [question.id]: toggleMultiChoice(current, value, questionOptions),
      };
    });
  }

  async function handleNext() {
    if (!canAdvance) return;
    if (!isLast) {
      setIndex((i) => i + 1);
      return;
    }
    if (!userId) return;

    setError(null);
    setSubmitting(true);
    try {
      const { winner, scores } = scoreAnswers(answers, options);
      await submitQuestionnaire(userId, answers, scores, PERSONA_CODE_TO_ID[winner]);
      router.replace("/onboarding-result");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Envoi impossible.");
    } finally {
      setSubmitting(false);
    }
  }

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <Screen
      footer={
        <View className="flex-row gap-2.5">
          {index > 0 ? (
            <View className="flex-1">
              <Button
                label="Retour"
                variant="ghost"
                onPress={() => setIndex((i) => i - 1)}
                disabled={submitting}
              />
            </View>
          ) : null}
          <View className="flex-[2]">
            <Button
              label={isLast ? "Voir mon profil" : "Suivant"}
              onPress={handleNext}
              disabled={!canAdvance}
              loading={submitting}
            />
          </View>
        </View>
      }
    >
      <View className="flex-row justify-between items-center mb-3">
        <Text className="font-mono text-[11px] tracking-label text-muted">
          <Text className="text-accent">{pad(index + 1)}</Text> / {pad(questions.length)}
        </Text>
        <MonoLabel>{isMulti ? "Choix multiple" : "Choix unique"}</MonoLabel>
      </View>

      <View className="mb-7">
        <ProgressBar value={(index + 1) / questions.length} />
      </View>

      <ErrorText message={error} />

      <MonoLabel tone="accent" className="mb-3">
        {ROLE_LABELS[question.segmentation_role ?? ""] ?? "Profilage"}
      </MonoLabel>

      <View className="mb-7">
        <Display size={22}>{question.text}</Display>
      </View>

      {questionOptions.map((option, i) => (
        <ChoiceRow
          key={option.id}
          letter={optionLetter(i)}
          label={option.label}
          selected={selectedValues.includes(option.value)}
          onPress={() => select(option.value)}
          multi={isMulti}
        />
      ))}

      {question.note ? (
        <Text className="font-body text-[11px] text-muted italic mt-2 leading-4">
          {question.note}
        </Text>
      ) : null}
    </Screen>
  );
}
