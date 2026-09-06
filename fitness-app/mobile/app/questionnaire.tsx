import { useEffect, useMemo, useState } from "react";
import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "./_layout";
import {
  Button,
  Choice,
  ErrorText,
  Label,
  Loading,
  ProgressBar,
  Screen,
} from "../components/ui";
import { fetchQuestionnaire, submitQuestionnaire } from "../lib/data";
import { PERSONA_CODE_TO_ID, scoreAnswers, toggleMultiChoice } from "../lib/scoring";
import type { QuestionnaireOption, QuestionnaireQuestion } from "../lib/types";

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

  if (loading || authLoading) return <Loading label="Chargement du questionnaire…" />;

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
      await submitQuestionnaire(
        userId,
        answers,
        scores,
        PERSONA_CODE_TO_ID[winner],
      );
      router.replace("/onboarding-result");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Envoi impossible.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen
      footer={
        <View className="flex-row gap-3">
          {index > 0 ? (
            <View className="flex-1">
              <Button
                label="Retour"
                variant="secondary"
                onPress={() => setIndex((i) => i - 1)}
                disabled={submitting}
              />
            </View>
          ) : null}
          <View className="flex-1">
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
      <View className="mb-6">
        <View className="flex-row justify-between items-center mb-2">
          <Label>
            Question {index + 1} sur {questions.length}
          </Label>
          <Text className="text-xs text-slate-400">
            {Math.round(((index + 1) / questions.length) * 100)} %
          </Text>
        </View>
        <ProgressBar value={(index + 1) / questions.length} />
      </View>

      <ErrorText message={error} />

      <Text className="text-xl font-bold text-slate-900 leading-7 mb-2">
        {question.text}
      </Text>
      <Text className="text-xs text-slate-500 mb-5">
        {isMulti ? "Plusieurs réponses possibles" : "Une seule réponse"}
      </Text>

      {questionOptions.map((option) => (
        <Choice
          key={option.id}
          label={option.label}
          selected={selectedValues.includes(option.value)}
          onPress={() => select(option.value)}
          multi={isMulti}
        />
      ))}

      {question.note ? (
        <Text className="text-xs text-slate-400 italic mt-1">{question.note}</Text>
      ) : null}
    </Screen>
  );
}
