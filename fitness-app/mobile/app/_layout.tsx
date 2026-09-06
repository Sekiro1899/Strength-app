import "../global.css";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { View } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { DemoBanner } from "../components/ui";
import { isDemoMode, supabase } from "../lib/supabase";
import { demoCurrentUser } from "../lib/demoStore";

interface AuthState {
  userId: string | null;
  email: string | null;
  isLoading: boolean;
  /** À appeler après login/signup/logout pour resynchroniser le contexte. */
  refresh: () => void;
}

const AuthContext = createContext<AuthState>({
  userId: null,
  email: null,
  isLoading: true,
  refresh: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

/**
 * En mode démo l'état d'auth vit en localStorage : il est lisible
 * SYNCHRONEMENT. On l'initialise donc dès le premier rendu, sinon il existe
 * une frame où userId vaut null et les gardes d'écran renvoient vers /login
 * juste après une inscription réussie.
 */
const initialDemoUser = () => (isDemoMode() ? demoCurrentUser() : null);

export default function RootLayout() {
  const demo = isDemoMode();

  const [userId, setUserId] = useState<string | null>(
    () => initialDemoUser()?.id ?? null,
  );
  const [email, setEmail] = useState<string | null>(
    () => initialDemoUser()?.email ?? null,
  );
  // Supabase impose un aller-retour asynchrone ; la démo non.
  const [isLoading, setIsLoading] = useState(!demo);

  const refresh = useCallback(() => {
    if (!demo) return;
    const user = demoCurrentUser();
    setUserId(user?.id ?? null);
    setEmail(user?.email ?? null);
  }, [demo]);

  useEffect(() => {
    if (demo) return;

    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setUserId(data.session?.user.id ?? null);
      setEmail(data.session?.user.email ?? null);
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user.id ?? null);
      setEmail(session?.user.email ?? null);
      setIsLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [demo]);

  return (
    <AuthContext.Provider value={{ userId, email, isLoading, refresh }}>
      <StatusBar style="dark" />
      <View className="flex-1 bg-slate-50">
        {demo ? <DemoBanner /> : null}
        <Stack screenOptions={{ headerShown: false, animation: "fade" }} />
      </View>
    </AuthContext.Provider>
  );
}
