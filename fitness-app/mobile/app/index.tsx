import { useEffect } from "react";
import { useRootNavigationState, useRouter } from "expo-router";
import { useAuth } from "./_layout";
import { Loading } from "../components/ui";
import { getCurrentUser } from "../lib/data";

/**
 * Aiguillage d'entrée — décide où atterrir selon l'état du compte :
 *   pas de session          → /login
 *   onboarding non terminé  → /questionnaire
 *   sinon                   → /dashboard
 */
export default function IndexScreen() {
  const { userId, isLoading } = useAuth();
  const router = useRouter();

  // En mode démo l'état d'auth est disponible dès le premier rendu : sans ce
  // garde-fou, la redirection partirait avant que le Stack racine soit monté
  // ("Attempted to navigate before mounting the Root Layout component").
  const rootState = useRootNavigationState();
  const navigatorReady = Boolean(rootState?.key);

  useEffect(() => {
    if (!navigatorReady || isLoading) return;

    if (!userId) {
      router.replace("/login");
      return;
    }

    let active = true;
    getCurrentUser(userId)
      .then((user) => {
        if (!active) return;
        router.replace(user?.onboarding_completed ? "/dashboard" : "/questionnaire");
      })
      .catch(() => {
        if (active) router.replace("/questionnaire");
      });

    return () => {
      active = false;
    };
  }, [navigatorReady, userId, isLoading, router]);

  return <Loading />;
}
