import "../global.css";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { View } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import { Archivo_900Black } from "@expo-google-fonts/archivo";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
} from "@expo-google-fonts/jetbrains-mono";
import { DemoBanner, Loading } from "../components/ui";
import { COLORS } from "../lib/theme";
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

  // Une famille par graisse : React Native ne synthétise pas le gras.
  const [fontsLoaded] = useFonts({
    Archivo_900Black,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
  });

  const [userId, setUserId] = useState<string | null>(
    () => initialDemoUser()?.id ?? null,
  );
  const [email, setEmail] = useState<string | null>(
    () => initialDemoUser()?.email ?? null,
  );
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

  // Monter les écrans avant les polices ferait clignoter la typo display.
  if (!fontsLoaded) return <Loading />;

  return (
    <AuthContext.Provider value={{ userId, email, isLoading, refresh }}>
      <StatusBar style="light" />
      <View className="flex-1 bg-bg">
        {demo ? <DemoBanner /> : null}
        <Stack
          screenOptions={{
            headerShown: false,
            animation: "fade",
            contentStyle: { backgroundColor: COLORS.bg },
          }}
        />
      </View>
    </AuthContext.Provider>
  );
}
