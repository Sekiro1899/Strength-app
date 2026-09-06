/**
 * Kit UI — primitives partagées par tous les écrans.
 *
 * Tout est en NativeWind (className). Les seules props `style` restantes
 * portent des couleurs dynamiques venant de la base (persona.color,
 * program.color) : Tailwind ne peut pas générer ces classes à la compilation.
 *
 * Contrainte web : `max-w-[520px] mx-auto` cadre le contenu sur grand écran
 * pour que le rendu navigateur reste proche du rendu mobile.
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

export const BRAND = "#1565C0";

// ─────────────────────────────────────────────
// Layout
// ─────────────────────────────────────────────

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
    <View className={`w-full max-w-[520px] mx-auto px-6 ${center ? "flex-1 justify-center" : ""}`}>
      {children}
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      {scroll ? (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingVertical: 24, flexGrow: 1 }}
        >
          {body}
        </ScrollView>
      ) : (
        <View className="flex-1 py-6">{body}</View>
      )}
      {footer ? (
        <View className="w-full max-w-[520px] mx-auto px-6 pb-6 pt-3">
          {footer}
        </View>
      ) : null}
    </SafeAreaView>
  );
}

export function Card({
  children,
  className = "",
  tint,
}: {
  children: ReactNode;
  className?: string;
  tint?: string | null;
}) {
  return (
    <View
      className={`rounded-2xl p-5 border border-slate-200 ${className}`}
      style={tint ? { backgroundColor: `${tint}14`, borderColor: `${tint}33` } : { backgroundColor: "#fff" }}
    >
      {children}
    </View>
  );
}

export function Title({ children }: { children: ReactNode }) {
  return <Text className="text-2xl font-bold text-slate-900">{children}</Text>;
}

export function Subtitle({ children }: { children: ReactNode }) {
  return <Text className="text-sm text-slate-500 mt-1">{children}</Text>;
}

export function Label({ children }: { children: ReactNode }) {
  return (
    <Text className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
      {children}
    </Text>
  );
}

// ─────────────────────────────────────────────
// Contrôles
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
  variant?: "primary" | "secondary" | "ghost";
  disabled?: boolean;
  loading?: boolean;
  color?: string | null;
}) {
  const inactive = disabled || loading;
  const tint = color ?? BRAND;

  if (variant === "primary") {
    return (
      <Pressable
        accessibilityRole="button"
        className={`rounded-xl py-4 items-center ${inactive ? "opacity-40" : ""}`}
        style={{ backgroundColor: tint }}
        onPress={onPress}
        disabled={inactive}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-white text-base font-semibold">{label}</Text>
        )}
      </Pressable>
    );
  }

  if (variant === "secondary") {
    return (
      <Pressable
        accessibilityRole="button"
        className={`rounded-xl py-4 items-center border-2 bg-transparent ${inactive ? "opacity-40" : ""}`}
        style={{ borderColor: tint }}
        onPress={onPress}
        disabled={inactive}
      >
        <Text className="text-base font-semibold" style={{ color: tint }}>
          {label}
        </Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      className={`py-3 items-center ${inactive ? "opacity-40" : ""}`}
      onPress={onPress}
      disabled={inactive}
    >
      <Text className="text-sm" style={{ color: tint }}>
        {label}
      </Text>
    </Pressable>
  );
}

export function ProgressBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <View className="h-2 bg-slate-200 rounded-full overflow-hidden">
      <View
        className="h-full rounded-full"
        style={{ width: `${pct}%`, backgroundColor: BRAND }}
      />
    </View>
  );
}

export function Choice({
  label,
  sublabel,
  selected,
  onPress,
  multi = false,
}: {
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
      className={`flex-row items-start rounded-xl border-2 p-4 mb-3 ${
        selected ? "border-blue-600 bg-blue-50" : "border-slate-200 bg-white"
      }`}
      onPress={onPress}
    >
      <View
        className={`w-5 h-5 mr-3 mt-0.5 items-center justify-center border-2 ${
          multi ? "rounded-md" : "rounded-full"
        } ${selected ? "border-blue-600 bg-blue-600" : "border-slate-300"}`}
      >
        {selected ? (
          <Text className="text-white text-[11px] font-bold">✓</Text>
        ) : null}
      </View>
      <View className="flex-1">
        <Text
          className={`text-[15px] leading-5 ${
            selected ? "text-blue-900 font-semibold" : "text-slate-800"
          }`}
        >
          {label}
        </Text>
        {sublabel ? (
          <Text className="text-xs text-slate-500 mt-1">{sublabel}</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

export function Stat({
  icon,
  value,
  caption,
}: {
  icon: string;
  value: string | number;
  caption: string;
}) {
  return (
    <View className="flex-1 bg-white rounded-2xl p-4 border border-slate-200 items-center">
      <Text className="text-2xl">{icon}</Text>
      <Text className="text-2xl font-bold text-slate-900 mt-1">{value}</Text>
      <Text className="text-[11px] text-slate-500 mt-0.5">{caption}</Text>
    </View>
  );
}

export function Pill({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <View className="bg-white/80 rounded-lg px-3 py-2 border border-slate-200">
      <Text className="text-[10px] text-slate-500 uppercase tracking-wide">
        {label}
      </Text>
      <Text className="text-sm font-semibold text-slate-900 mt-0.5">
        {value}
      </Text>
    </View>
  );
}

// ─────────────────────────────────────────────
// États
// ─────────────────────────────────────────────

export function Loading({ label }: { label?: string }) {
  return (
    <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center">
      <ActivityIndicator size="large" color={BRAND} />
      {label ? (
        <Text className="text-sm text-slate-500 mt-3">{label}</Text>
      ) : null}
    </SafeAreaView>
  );
}

export function ErrorText({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <View className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
      <Text className="text-red-700 text-sm">{message}</Text>
    </View>
  );
}

/** Bandeau visible uniquement quand l'app tourne sans backend. */
export function DemoBanner() {
  return (
    <View className="bg-amber-100 border-b border-amber-200 px-4 py-2">
      <Text className="text-[11px] text-amber-900 text-center">
        Mode démo — données locales, aucun backend requis
      </Text>
    </View>
  );
}
