import { useEffect, useState } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) checkOnboarding(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        if (session) checkOnboarding(session.user.id);
        else {
          setOnboardingCompleted(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const checkOnboarding = async (userId: string) => {
    const { data } = await supabase
      .from("users")
      .select("onboarding_completed")
      .eq("id", userId)
      .single();

    setOnboardingCompleted(data?.onboarding_completed ?? false);
    setLoading(false);
  };

  useEffect(() => {
    if (loading) return;

    const currentRoute = segments[0];

    if (!session) {
      if (currentRoute !== "auth") router.replace("/auth");
    } else if (onboardingCompleted === false) {
      if (currentRoute !== "questionnaire" && currentRoute !== "onboarding-result") {
        router.replace("/questionnaire");
      }
    } else if (onboardingCompleted === true) {
      if (currentRoute === "auth" || currentRoute === "questionnaire") {
        router.replace("/dashboard");
      }
    }
  }, [session, onboardingCompleted, loading, segments]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="auth" />
      <Stack.Screen name="questionnaire" options={{ title: "Questionnaire" }} />
      <Stack.Screen name="onboarding-result" options={{ title: "Resultat" }} />
      <Stack.Screen name="dashboard" options={{ title: "Dashboard" }} />
      <Stack.Screen name="index" />
    </Stack>
  );
}
