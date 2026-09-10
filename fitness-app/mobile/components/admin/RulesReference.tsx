/**
 * Référentiel des règles de gestion.
 *
 * Les valeurs affichées sont lues dans les constantes du moteur (voir
 * lib/rules.ts) : elles ne peuvent pas diverger du code. Chaque règle indique
 * où elle s'applique — c'est ce qui permet d'aller vérifier plutôt que de
 * croire l'écran.
 */

import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { RULE_SECTIONS } from "../../lib/rules";
import type { Rule } from "../../lib/rules";

function RuleCard({ rule }: { rule: Rule }) {
  return (
    <View className="rounded-xl border border-line bg-surface px-3.5 py-3 mb-2">
      <Text className="font-body-sb text-[13px] text-ink">{rule.title}</Text>
      <Text className="font-body text-[11px] text-muted mt-1.5 leading-4">
        {rule.text}
      </Text>

      {rule.values?.length ? (
        <View className="mt-2.5 rounded-lg bg-bg border border-line/60 px-2.5 py-2">
          {rule.values.map((value, i) => (
            <View
              key={`${value.label}-${i}`}
              className="flex-row items-baseline justify-between py-1"
            >
              <Text className="font-body text-[11px] text-muted flex-1 pr-3">
                {value.label}
              </Text>
              <Text className="font-mono-md text-[11px] text-accent text-right">
                {value.value}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      <Text className="font-mono text-[9px] text-muted/70 mt-2">{rule.source}</Text>
    </View>
  );
}

export function RulesReference() {
  const [open, setOpen] = useState<string | null>(RULE_SECTIONS[0].key);

  return (
    <View>
      <Text className="font-body text-[12px] text-muted mb-4">
        Les nombres de cette page sont lus dans le code du moteur, pas recopiés :
        modifier un réglage change ce qui s'affiche ici. La ligne grise sous
        chaque règle dit où elle s'applique.
      </Text>

      {RULE_SECTIONS.map((section) => {
        const expanded = open === section.key;
        return (
          <View key={section.key} className="mb-3">
            <Pressable
              accessibilityRole="button"
              aria-expanded={expanded}
              onPress={() => setOpen(expanded ? null : section.key)}
              className="flex-row items-center justify-between rounded-xl border border-line bg-surface/60 px-3.5 py-3 active:opacity-70"
            >
              <View className="flex-1 pr-3">
                <Text className="font-display text-ink text-[17px]">
                  {section.title}
                </Text>
                <Text className="font-body text-[11px] text-muted mt-0.5">
                  {section.rules.length} règle{section.rules.length > 1 ? "s" : ""}
                </Text>
              </View>
              <Text className="font-mono text-[14px] text-muted">
                {expanded ? "−" : "+"}
              </Text>
            </Pressable>

            {expanded ? (
              <View className="mt-2">
                <Text className="font-body text-[11px] text-muted mb-3 leading-4">
                  {section.intro}
                </Text>
                {section.rules.map((rule) => (
                  <RuleCard key={rule.title} rule={rule} />
                ))}
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}
