import { useEffect, useMemo, useState } from "react";
import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import {
  Button,
  Card,
  Choice,
  ErrorText,
  Label,
  Loading,
  ProgressBar,
  Screen,
  Title,
} from "../components/ui";
import { fetchFeedbackPoll, scoreFeedback } from "../lib/data";
import { PROGRAMS } from "../lib/fixtures";
import type {
  FeedbackAnswers,
  FeedbackOutcome,
  FeedbackPollOption,
  FeedbackPollQuestion,
  SatisfactionTier,
} from "../lib/types";

const TIER_COPY: Record<SatisfactionTier, { icon: string; title: string; body: string }> = {
  very_satisfied: {
    icon: "🎉",
    title: "Excellent cycle",
    body: "On garde le cap et on augmente progressivement la charge.",
  },
  moderate: {
    icon: "👌",
    title: "Cycle correct",
    body: "Quelques ajustements vont rendre le prochain cycle plus efficace.",
  },
  unsatisfied: {
    icon: "🔧",
    title: "On ajuste",
    body: "Le programme va être adapté pour mieux coller à vos contraintes.",
  },
};

export default function FeedbackScreen() {
  const router = useRouter();

  const [questions, setQuestions] = useState<FeedbackPollQuestion[]>([]);
  const [options, setOptions] = useState<FeedbackPollOption[]>([]);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [scoreQ1, setScoreQ1] = useState<number | null>(null);
  const [factor, setFactor] = useState<string | null>(null);
  const [subscale, setSubscale] = useState<number | null>(null);
  const [objective, setObjective] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<FeedbackOutcome | null>(null);

  useEffect(() => {
    let active = true;
    fetchFeedbackPoll()
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
  }, []);

  const question = questions[step];
  const questionOptions = useMemo(
    () => options.filter((o) => o.question_id === question?.id),
    [options, question?.id],
  );

  // fp_q2 : le sous-score d'impact n'apparaît que si le facteur en demande un.
  const selectedFactorOption = questionOptions.find((o) => o.value === factor);
  const needsSubscale = Boolean(selectedFactorOption?.has_subscale);

  if (loading) return <Loading label="Chargement du questionnaire…" />;

  // ── Écran de résultat ──
  if (outcome) {
    const copy = TIER_COPY[outcome.satisfaction_tier];
    const redirected = PROGRAMS.find((p) => p.id === outcome.redirected_program_id);

    return (
      <Screen
        center
        footer={
          <Button label="Retour au dashboard" onPress={() => router.replace("/dashboard")} />
        }
      >
        <View className="items-center mb-6">
          <Text className="text-5xl mb-3">{copy.icon}</Text>
          <Title>{copy.title}</Title>
          <Text className="text-sm text-slate-500 text-center mt-2">{copy.body}</Text>
        </View>

        <Card className="mb-3">
          <Label>Score global</Label>
          <Text className="text-3xl font-bold text-slate-900 mt-1">
            {outcome.score_global.toFixed(1)}
            <Text className="text-base text-slate-400"> / 5</Text>
          </Text>
          <Text className="text-[11px] text-slate-400 mt-1">
            (satisfaction + facteur limitant) ÷ 2
          </Text>
        </Card>

        {outcome.applied_variant_ids.length > 0 ? (
          <Card className="mb-3">
            <Label>Variantes appliquées</Label>
            <View className="flex-row flex-wrap gap-2 mt-2">
              {outcome.applied_variant_ids.map((id) => (
                <View key={id} className="bg-blue-50 rounded-lg px-3 py-1.5">
                  <Text className="text-xs text-blue-800 font-medium">
                    {id.replace(/_/g, " ")}
                  </Text>
                </View>
              ))}
            </View>
          </Card>
        ) : null}

        {redirected ? (
          <Card tint={redirected.color}>
            <Label>Programme suggéré</Label>
            <View className="flex-row items-center mt-2">
              <Text className="text-2xl mr-2">{redirected.icon}</Text>
              <Text className="text-base font-bold text-slate-900 flex-1">
                {redirected.name}
              </Text>
            </View>
            {redirected.tagline ? (
              <Text className="text-xs text-slate-600 mt-1">{redirected.tagline}</Text>
            ) : null}
          </Card>
        ) : null}

        <Text className="text-[11px] text-slate-400 text-center mt-5 leading-4">
          L'application effective des variantes passera par POST /feedback/redirect,
          pas encore livré côté backend.
        </Text>
      </Screen>
    );
  }

  if (!question) {
    return (
      <Screen center>
        <ErrorText message={error ?? "Questionnaire indisponible."} />
        <Button label="Retour" onPress={() => router.replace("/dashboard")} />
      </Screen>
    );
  }

  function canAdvance(): boolean {
    if (step === 0) return scoreQ1 !== null;
    if (step === 1) return factor !== null && (!needsSubscale || subscale !== null);
    return objective !== null;
  }

  function handleNext() {
    if (!canAdvance()) return;

    if (step < questions.length - 1) {
      setStep((s) => s + 1);
      return;
    }

    const answers: FeedbackAnswers = {
      score_q1: scoreQ1!,
      q2_factor: factor as FeedbackAnswers["q2_factor"],
      q2_subscale: needsSubscale ? subscale : null,
      q3_new_objective: objective!,
    };
    setOutcome(scoreFeedback(answers, options));
  }

  const selectedValue =
    step === 0 ? (scoreQ1 !== null ? String(scoreQ1) : null) : step === 1 ? factor : objective;

  return (
    <Screen
      footer={
        <View className="flex-row gap-3">
          {step > 0 ? (
            <View className="flex-1">
              <Button
                label="Retour"
                variant="secondary"
                onPress={() => setStep((s) => s - 1)}
              />
            </View>
          ) : null}
          <View className="flex-1">
            <Button
              label={step === questions.length - 1 ? "Voir le résultat" : "Suivant"}
              onPress={handleNext}
              disabled={!canAdvance()}
            />
          </View>
        </View>
      }
    >
      <View className="mb-6">
        <Label>
          Feedback {step + 1} sur {questions.length}
        </Label>
        <View className="mt-2">
          <ProgressBar value={(step + 1) / questions.length} />
        </View>
      </View>

      <ErrorText message={error} />

      <Text className="text-xl font-bold text-slate-900 leading-7 mb-5">
        {question.text}
      </Text>

      {questionOptions.map((option) => (
        <Choice
          key={option.id}
          label={option.label}
          sublabel={option.sublabel}
          selected={selectedValue === option.value}
          onPress={() => {
            if (step === 0) setScoreQ1(Number(option.value));
            else if (step === 1) {
              setFactor(option.value);
              setSubscale(null);
            } else setObjective(option.value);
          }}
        />
      ))}

      {/* Sous-échelle d'impact — uniquement pour fp_q2 avec has_subscale. */}
      {step === 1 && needsSubscale && question.subscale ? (
        <View className="mt-4">
          <Text className="text-sm font-semibold text-slate-800 mb-3">
            {question.subscale.text}
          </Text>
          {question.subscale.options.map((sub) => (
            <Choice
              key={sub.value}
              label={sub.label}
              sublabel={sub.sublabel}
              selected={subscale === sub.value}
              onPress={() => setSubscale(sub.value)}
            />
          ))}
        </View>
      ) : null}
    </Screen>
  );
}
