import { useEffect, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import {
  Body,
  Button,
  Card,
  ChoiceRow,
  Display,
  ErrorText,
  GradientCard,
  Loading,
  MetaPill,
  MonoLabel,
  ProgressBar,
  Screen,
} from "../components/ui";
import { COLORS, personaGradient } from "../lib/theme";
import { fetchFeedbackPoll, scoreFeedback } from "../lib/data";
import { PROGRAMS } from "../lib/fixtures";
import type {
  FeedbackAnswers,
  FeedbackOutcome,
  FeedbackPollOption,
  FeedbackPollQuestion,
  SatisfactionTier,
} from "../lib/types";

const TIER_COPY: Record<
  SatisfactionTier,
  { tag: string; title: string; body: string }
> = {
  very_satisfied: {
    tag: "Cycle réussi",
    title: "On garde\nle cap",
    body: "Les charges augmentent progressivement sur le prochain cycle.",
  },
  moderate: {
    tag: "Cycle correct",
    title: "On ajuste\nà la marge",
    body: "Quelques variantes vont rendre le prochain cycle plus efficace.",
  },
  unsatisfied: {
    tag: "Cycle difficile",
    title: "On change\nl'approche",
    body: "Le programme est adapté pour mieux coller à tes contraintes.",
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

  // fp_q2 : la sous-échelle n'apparaît que si le facteur en demande une.
  const selectedFactorOption = questionOptions.find((o) => o.value === factor);
  const needsSubscale = Boolean(selectedFactorOption?.has_subscale);

  if (loading) return <Loading label="Chargement" />;

  // ── Résultat ──
  if (outcome) {
    const copy = TIER_COPY[outcome.satisfaction_tier];
    const redirected = PROGRAMS.find((p) => p.id === outcome.redirected_program_id);

    return (
      <Screen
        footer={
          <Button
            label="Retour au dashboard"
            onPress={() => router.replace("/dashboard")}
          />
        }
      >
        <View className="items-center mb-6">
          <MonoLabel tone="accent" className="mb-3">
            {copy.tag}
          </MonoLabel>
          <Display size={30} className="text-center">
            {copy.title}
          </Display>
          <Body className="text-center mt-3">{copy.body}</Body>
        </View>

        <Card className="mb-3">
          <MonoLabel className="mb-2">Score global</MonoLabel>
          <View className="flex-row items-baseline">
            <Text className="font-display text-accent text-[40px]">
              {outcome.score_global.toFixed(1)}
            </Text>
            <Text className="font-display text-muted text-[18px] ml-1">/ 5</Text>
          </View>
          <View className="mt-3">
            <ProgressBar value={outcome.score_global / 5} height={4} />
          </View>
          <Text className="font-body text-[10px] text-muted mt-2.5">
            (satisfaction + facteur limitant) ÷ 2
          </Text>
        </Card>

        {outcome.applied_variant_ids.length > 0 ? (
          <Card className="mb-3">
            <MonoLabel className="mb-3">Variantes appliquées</MonoLabel>
            <View className="flex-row flex-wrap gap-2">
              {outcome.applied_variant_ids.map((id) => (
                <View
                  key={id}
                  className="border border-accent/40 bg-accent/10 rounded-lg px-2.5 py-1.5"
                >
                  <Text className="font-mono text-[10px] uppercase tracking-label text-accent">
                    {id.replace(/_/g, " ")}
                  </Text>
                </View>
              ))}
            </View>
          </Card>
        ) : null}

        {redirected ? (
          <GradientCard colors={personaGradient("AW")}>
            <Text className="font-mono text-[9px] uppercase tracking-label text-white/70 mb-2">
              Programme suggéré
            </Text>
            <Text className="font-display text-white uppercase text-[20px] mb-1">
              {redirected.name}
            </Text>
            {redirected.tagline ? (
              <Text className="font-body text-[12px] text-white/85 mb-3.5">
                {redirected.tagline}
              </Text>
            ) : null}
            <View className="flex-row gap-2.5">
              <MetaPill
                dark
                label="Durée"
                value={
                  redirected.is_continuous
                    ? "Continu"
                    : `${redirected.duration_weeks} sem`
                }
              />
              <MetaPill
                dark
                label="Fréq"
                value={`${redirected.frequency_per_week_min}-${redirected.frequency_per_week_max}×`}
              />
            </View>
          </GradientCard>
        ) : null}

        <Text className="font-body text-[10px] text-muted text-center mt-5 leading-4">
          L'application effective des variantes passera par POST
          /feedback/redirect, pas encore livré côté backend.
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

    setOutcome(
      scoreFeedback(
        {
          score_q1: scoreQ1!,
          q2_factor: factor as FeedbackAnswers["q2_factor"],
          q2_subscale: needsSubscale ? subscale : null,
          q3_new_objective: objective!,
        },
        options,
      ),
    );
  }

  return (
    <Screen
      footer={
        <View className="flex-row gap-2.5">
          {step > 0 ? (
            <View className="flex-1">
              <Button
                label="Retour"
                variant="ghost"
                onPress={() => setStep((s) => s - 1)}
              />
            </View>
          ) : null}
          <View className="flex-[2]">
            <Button
              label={step === questions.length - 1 ? "Voir le résultat" : "Suivant"}
              onPress={handleNext}
              disabled={!canAdvance()}
            />
          </View>
        </View>
      }
    >
      <View className="items-center mb-6">
        <MonoLabel className="mb-2" tone="accent">
          Bilan de cycle
        </MonoLabel>
        <Display size={24} className="text-center">
          Aide-nous à{"\n"}calibrer la suite
        </Display>
      </View>

      <View className="mb-6">
        <ProgressBar value={(step + 1) / questions.length} />
      </View>

      <ErrorText message={error} />

      <Text className="font-body-sb text-[14px] text-ink mb-4 leading-5">
        {step + 1}. {question.text}
      </Text>

      {/* fp_q1 : échelle 1-5 en tuiles carrées */}
      {step === 0 ? (
        <View className="flex-row gap-1.5 mb-2">
          {questionOptions.map((option) => {
            const value = Number(option.value);
            const active = scoreQ1 === value;
            return (
              <Pressable
                key={option.id}
                accessibilityRole="radio"
                accessibilityState={{ checked: active }}
                accessibilityLabel={option.label}
                onPress={() => setScoreQ1(value)}
                className={`flex-1 aspect-square rounded-xl border items-center justify-center ${
                  active ? "bg-accent border-accent" : "bg-surface border-line"
                }`}
              >
                <Text
                  className={`font-display text-[20px] ${
                    active ? "text-black" : "text-muted"
                  }`}
                >
                  {value}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : (
        questionOptions.map((option) => (
          <ChoiceRow
            key={option.id}
            label={option.label}
            sublabel={option.sublabel}
            selected={
              step === 1 ? factor === option.value : objective === option.value
            }
            onPress={() => {
              if (step === 1) {
                setFactor(option.value);
                setSubscale(null);
              } else {
                setObjective(option.value);
              }
            }}
          />
        ))
      )}

      {scoreQ1 !== null && step === 0 ? (
        <Text className="font-body text-[11px] text-muted text-center mt-3">
          {questionOptions.find((o) => Number(o.value) === scoreQ1)?.sublabel}
        </Text>
      ) : null}

      {/* Sous-échelle d'impact — fp_q2 uniquement */}
      {step === 1 && needsSubscale && question.subscale ? (
        <View className="mt-5">
          <MonoLabel tone="accent" className="mb-3">
            {question.subscale.text}
          </MonoLabel>
          {question.subscale.options.map((sub) => (
            <ChoiceRow
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
