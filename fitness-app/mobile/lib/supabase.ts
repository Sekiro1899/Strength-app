import "react-native-url-polyfill/auto";
import { Platform } from "react-native";
import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

/**
 * Mode démo — actif dès qu'il manque des identifiants Supabase, ou si
 * EXPO_PUBLIC_DEMO_MODE=1. Permet d'ouvrir l'app dans un navigateur et de
 * dérouler tout le flux sans backend. Voir lib/demoStore.ts.
 */
export function isDemoMode(): boolean {
  if (process.env.EXPO_PUBLIC_DEMO_MODE === "1") return true;
  return !supabaseUrl || !supabaseAnonKey;
}

/**
 * expo-secure-store s'appuie sur le Keychain iOS / Keystore Android : il
 * n'existe pas sur le web. On bascule sur localStorage côté navigateur, avec
 * un no-op si le storage est indisponible (navigation privée, SSR).
 */
const webStorage = {
  getItem: async (key: string) => {
    try {
      return globalThis.localStorage?.getItem(key) ?? null;
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      globalThis.localStorage?.setItem(key, value);
    } catch {
      /* storage bloqué — la session ne survivra pas au reload */
    }
  },
  removeItem: async (key: string) => {
    try {
      globalThis.localStorage?.removeItem(key);
    } catch {
      /* idem */
    }
  },
};

const nativeStorage = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

const storage = Platform.OS === "web" ? webStorage : nativeStorage;

/**
 * En mode démo les identifiants sont des placeholders : le client est construit
 * mais jamais appelé (la façade lib/data.ts court-circuite vers demoStore).
 */
export const supabase = createClient(
  supabaseUrl || "https://demo.invalid",
  supabaseAnonKey || "demo-anon-key",
  {
    auth: {
      storage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);
