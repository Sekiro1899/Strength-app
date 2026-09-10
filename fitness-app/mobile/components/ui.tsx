/**
 * Kit UI — direction artistique éditoriale / brutaliste sportive.
 *
 * Règles de composition (issues de docs/ui-prototype.html) :
 *  - Titres    : Archivo Black, CAPITALES, interlignage serré (0.95–1.1)
 *  - Étiquettes: JetBrains Mono, 10–11px, tracking large, souvent lime
 *  - Corps     : Inter
 *  - Accent    : lime #e3ff5c sur fond charbon ; le lime porte l'action
 *  - Surfaces  : #1c1c28 bordé #2a2a3a, rayons 12–24px
 *
 * Tout est en NativeWind. Les rares `style` restants portent des couleurs
 * dynamiques (persona) que Tailwind ne peut pas générer à la compilation.
 */

import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { glassStyle } from "./Backdrop";
import { COLORS, GRADIENT_DIRECTION } from "../lib/theme";

// ─────────────────────────────────────────────
// Layout
// ─────────────────────────────────────────────

/**
 * Cadre d'écran. `max-w-[420px] mx-auto` garde la proportion mobile dans le
 * navigateur au lieu d'étirer la mise en page sur toute la largeur.
 */
export function Screen({
  children,
  scroll = true,
  center = false,
  footer,
}: {
  children: ReactNode;
  scroll?: boolean;
  center?: boolean;
  footer?: ReactNode;
}) {
  const body = (
    <View
      className={`w-full max-w-[420px] mx-auto px-5 ${center ? "flex-1 justify-center" : ""}`}
    >
      {children}
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-bg">
      {scroll ? (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingVertical: 24, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        >
          {body}
        </ScrollView>
      ) : (
        <View className="flex-1 py-6">{body}</View>
      )}
      {footer ? (
        <View className="w-full max-w-[420px] mx-auto px-5 pb-5 pt-3">
          {footer}
        </View>
      ) : null}
    </SafeAreaView>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <View className={`bg-surface border border-line rounded-card p-4 ${className}`}>
      {children}
    </View>
  );
}

/** Carte vitrée — se pose sur le fond d'écran sans l'effacer. */
export function GlassCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <View style={glassStyle} className={`rounded-card p-4 ${className}`}>
      {children}
    </View>
  );
}

/** Bandeau vitré cliquable — accès profil et historique depuis le dashboard. */
export function GlassBanner({
  label,
  detail,
  onPress,
}: {
  label: string;
  detail: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={glassStyle}
      className="flex-row items-center rounded-card px-4 py-3.5 active:opacity-70"
    >
      <View className="flex-1">
        <Text className="font-body-sb text-[14px] text-ink">{label}</Text>
        <Text className="font-body text-[11px] text-muted mt-0.5">{detail}</Text>
      </View>
      <Text className="text-muted text-[18px] leading-[20px]">›</Text>
    </Pressable>
  );
}

/** Carte pleine couleur en dégradé — persona, programme, minuteur. */
export function GradientCard({
  colors,
  children,
  className = "",
}: {
  colors: [string, string];
  children: ReactNode;
  className?: string;
}) {
  return (
    <LinearGradient
      colors={colors}
      start={GRADIENT_DIRECTION.start}
      end={GRADIENT_DIRECTION.end}
      style={{ borderRadius: 20, overflow: "hidden" }}
    >
      <View className={`p-5 ${className}`}>{children}</View>
    </LinearGradient>
  );
}

// ─────────────────────────────────────────────
// Typographie
// ─────────────────────────────────────────────

/** Titre display. `size` en px pour piloter finement l'interlignage. */
export function Display({
  children,
  size = 24,
  className = "",
  color,
}: {
  children: ReactNode;
  size?: number;
  className?: string;
  color?: string;
}) {
  return (
    <Text
      className={`font-display text-ink uppercase tracking-display ${className}`}
      style={{ fontSize: size, lineHeight: size * 1.02, ...(color ? { color } : {}) }}
    >
      {children}
    </Text>
  );
}

/** Étiquette mono en capitales — le liant graphique de toute l'app. */
export function MonoLabel({
  children,
  tone = "muted",
  className = "",
}: {
  children: ReactNode;
  tone?: "muted" | "accent" | "ink" | "dark";
  className?: string;
}) {
  const toneClass =
    tone === "accent"
      ? "text-accent"
      : tone === "ink"
        ? "text-ink"
        : tone === "dark"
          ? "text-black/60"
          : "text-muted";
  return (
    <Text
      className={`font-mono text-[10px] uppercase tracking-label ${toneClass} ${className}`}
    >
      {children}
    </Text>
  );
}

export function Body({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <Text className={`font-body text-[13px] text-muted leading-5 ${className}`}>
      {children}
    </Text>
  );
}

// ─────────────────────────────────────────────
// Actions
// ─────────────────────────────────────────────

export function Button({
  label,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
  color,
}: {
  label: string;
  onPress: () => void;
  variant?: "primary" | "ghost" | "persona" | "glass";
  disabled?: boolean;
  loading?: boolean;
  color?: string;
}) {
  const inactive = disabled || loading;

  // Verre : translucide, bordure claire, flou du fond sur le web. Pour une
  // action secondaire qui doit rester lisible par-dessus le fond d'écran.
  if (variant === "glass") {
    return (
      <Pressable
        accessibilityRole="button"
        className={`rounded-2xl py-4 items-center active:opacity-70 ${
          inactive ? "opacity-40" : ""
        }`}
        style={glassStyle}
        onPress={onPress}
        disabled={inactive}
      >
        {loading ? (
          <ActivityIndicator color={COLORS.ink} />
        ) : (
          <Text className="font-body-sb text-[14px] text-ink">{label}</Text>
        )}
      </Pressable>
    );
  }

  if (variant === "ghost") {
    return (
      <Pressable
        accessibilityRole="button"
        className={`rounded-2xl py-4 items-center border border-line bg-transparent active:opacity-70 ${
          inactive ? "opacity-40" : ""
        }`}
        onPress={onPress}
        disabled={inactive}
      >
        <Text className="font-body-sb text-[14px] text-ink">{label}</Text>
      </Pressable>
    );
  }

  // Le lime porte l'action principale : texte noir dessus, halo coloré.
  const bg = variant === "persona" && color ? color : COLORS.accent;

  return (
    <Pressable
      accessibilityRole="button"
      className={`rounded-2xl py-4 items-center active:scale-[0.98] ${
        inactive ? "opacity-40" : ""
      }`}
      style={{
        backgroundColor: bg,
        shadowColor: bg,
        shadowOpacity: 0.3,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 10 },
      }}
      onPress={onPress}
      disabled={inactive}
    >
      {loading ? (
        <ActivityIndicator color="#000" />
      ) : (
        <Text className="font-body-sb text-[14px] text-black">{label}</Text>
      )}
    </Pressable>
  );
}

/** Option de questionnaire : pastille lettrée + libellé, lime si choisie. */
export function ChoiceRow({
  letter,
  label,
  sublabel,
  selected,
  onPress,
  multi = false,
}: {
  letter?: string;
  label: string;
  sublabel?: string | null;
  selected: boolean;
  onPress: () => void;
  multi?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole={multi ? "checkbox" : "radio"}
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      className={`flex-row items-center gap-3 rounded-[14px] border px-4 py-3.5 mb-2 ${
        selected ? "bg-accent border-accent" : "bg-surface border-line"
      }`}
    >
      {letter ? (
        <View
          className={`w-6 h-6 rounded-full items-center justify-center ${
            selected ? "bg-black" : "bg-bg"
          }`}
        >
          <Text
            className={`font-mono-md text-[11px] ${
              selected ? "text-accent" : "text-muted"
            }`}
          >
            {letter}
          </Text>
        </View>
      ) : null}

      <View className="flex-1">
        <Text
          className={`font-body text-[13px] leading-[18px] ${
            selected ? "text-black font-body-sb" : "text-ink"
          }`}
        >
          {label}
        </Text>
        {sublabel ? (
          <Text
            className={`font-body text-[11px] mt-0.5 ${
              selected ? "text-black/60" : "text-muted"
            }`}
          >
            {sublabel}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

// ─────────────────────────────────────────────
// Blocs d'information
// ─────────────────────────────────────────────

export function ProgressBar({
  value,
  height = 3,
}: {
  value: number;
  height?: number;
}) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <View
      className="bg-line rounded-full overflow-hidden w-full"
      style={{ height }}
    >
      <View
        className="h-full bg-accent rounded-full"
        style={{ width: `${pct}%` }}
      />
    </View>
  );
}

/** Pastille métrique : étiquette mono + valeur display. */
export function MetaPill({
  label,
  value,
  dark = false,
}: {
  label: string;
  value: string | number;
  dark?: boolean;
}) {
  return (
    <View
      className={`flex-1 rounded-[10px] px-3 py-2.5 ${dark ? "bg-black/20" : "bg-bg"}`}
    >
      <Text
        className={`font-mono text-[9px] uppercase tracking-label ${
          dark ? "text-white/60" : "text-muted"
        }`}
      >
        {label}
      </Text>
      <Text
        className={`font-display text-[15px] mt-0.5 ${dark ? "text-white" : "text-ink"}`}
      >
        {value}
      </Text>
    </View>
  );
}

/** Puce d'exercice affichée en aperçu de séance. */
export function Chip({ label }: { label: string }) {
  return (
    <View className="bg-bg rounded-lg px-2.5 py-1.5">
      <Text className="font-body text-[11px] text-muted" numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

/** En-tête de bloc de séance : symbole + nom lime, durée en mono. */
export function BlockHeader({
  symbol,
  name,
  meta,
}: {
  symbol: string;
  name: string;
  meta: string;
}) {
  return (
    <View className="flex-row justify-between items-center mb-2.5">
      <Text className="font-display text-[13px] uppercase tracking-[0.05em] text-accent">
        {symbol} {name}
      </Text>
      <Text className="font-mono text-[10px] uppercase tracking-label text-muted">
        {meta}
      </Text>
    </View>
  );
}

// ─────────────────────────────────────────────
// États
// ─────────────────────────────────────────────

export function Loading({ label }: { label?: string }) {
  return (
    <SafeAreaView className="flex-1 bg-bg items-center justify-center">
      <ActivityIndicator size="large" color={COLORS.accent} />
      {label ? (
        <Text className="font-mono text-[10px] uppercase tracking-label text-muted mt-4">
          {label}
        </Text>
      ) : null}
    </SafeAreaView>
  );
}

export function ErrorText({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <View className="border border-danger/40 bg-danger/10 rounded-[14px] px-4 py-3 mb-4">
      <Text className="font-body text-[12px] text-danger leading-4">{message}</Text>
    </View>
  );
}

/** Bandeau visible uniquement quand l'app tourne sans backend. */
export function DemoBanner() {
  return (
    <View className="bg-accent/10 border-b border-accent/20 px-4 py-1.5">
      <Text className="font-mono text-[9px] uppercase tracking-label text-accent text-center">
        Mode démo · données locales
      </Text>
    </View>
  );
}
