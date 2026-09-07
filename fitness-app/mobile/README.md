# Strength App — Front mobile & web

Une seule base de code Expo qui tourne dans le navigateur **et** s'exporte en
app iOS / Android. Le navigateur sert à itérer vite ; les binaires natifs
sortent du même code via EAS.

## Démarrer

```bash
npm install
npm run web        # http://localhost:8081 — mode démo si pas de .env
npm run ios        # simulateur iOS
npm run android    # émulateur Android
```

Sans fichier `.env`, l'app démarre en **mode démo** : le flux complet
(signup → questionnaire → persona → dashboard → séance → feedback) fonctionne
en local, sans Supabase ni FastAPI. Un bandeau ambre le signale.

Pour brancher le vrai backend, copier `.env.example` en `.env` et renseigner
les clés.

## Direction artistique

Éditorial / brutaliste sportif. Référence : `../docs/ui-prototype.html`.

- **Fond** charbon `#0a0a0f`, surfaces `#1c1c28` bordées `#2a2a3a`
- **Accent** lime `#e3ff5c` — il porte l'action, toujours avec du texte noir
- **Display** Archivo Black, CAPITALES, interlignage serré
- **Étiquettes** JetBrains Mono, 10px, tracking large
- **Corps** Inter

Les tokens vivent à deux endroits, à garder synchronisés :
`tailwind.config.js` (classes) et `lib/theme.ts` (valeurs passées aux props
natives — dégradés, `ActivityIndicator`, `RefreshControl`).

Les couleurs persona affichées viennent de `lib/theme.ts`, **pas** de
`personas.color` en base : ces valeurs ont été choisies pour un fond clair et
deviennent illisibles sur charbon.

## Architecture

Les écrans ne parlent jamais directement à Supabase ni à `fetch`. Tout passe
par une façade unique, ce qui permet de basculer live ↔ démo sans toucher à
l'UI.

```
app/                     écrans (expo-router, routes = fichiers)
  index.tsx              aiguillage login / questionnaire / dashboard
  (auth)/login|signup    → URLs /login et /signup
  questionnaire.tsx      9 questions + scoring persona
  onboarding-result.tsx  persona + programme + détail du scoring
  dashboard.tsx          programme, prochaine séance, streak, énergie
  session.tsx            aperçu de séance (4 blocs)
  tracking.tsx           suivi série par série + minuteur de repos
  feedback.tsx           poll 3 questions + variantes

components/ui.tsx        primitives NativeWind partagées
lib/theme.ts             tokens non exprimables en classe (dégradés…)

lib/
  types.ts       ← CONTRAT : miroir de schema.sql + models/workout.py
  data.ts        ← FAÇADE : seule porte d'entrée des écrans
  supabase.ts      client + détection du mode démo + storage web/natif
  api.ts           client FastAPI (/workout/generate)
  scoring.ts       scoring persona (pur, testable)
  protocol.ts      miroir de engine/generator.py (protocole → focus)
  demoStore.ts     backend local (auth, programmes, génération de séance)
  fixtures.ts      GÉNÉRÉ depuis docs/data/*.json — ne pas éditer
```

### Répartition backend

| Besoin | Voie |
|---|---|
| Auth, CRUD standard | SDK Supabase |
| `/workout/generate` | FastAPI |
| `/feedback/redirect` | FastAPI *(pas encore livré côté backend)* |

### Fichiers synchronisés avec le backend

Trois fichiers doivent rester alignés avec le Python, sinon le front et le
moteur divergent silencieusement :

- `lib/types.ts` ↔ `docs/schema.sql` + `backend/models/workout.py`
- `lib/protocol.ts` ↔ `backend/engine/generator.py` (`PROTOCOL_SCHEDULE`)
- `lib/fixtures.ts` ↔ `docs/data/*.json` — régénérer avec :

```bash
npm run gen:fixtures
```

## Vérifier

```bash
npm run typecheck     # tsc --noEmit
npm run build:web     # export du bundle web
```

## Notes

- Le persona **SAV** a `primary_program_id = null` en seed (rotation sur les
  5 programmes). `resolveProgramId` retombe sur
  `persona_program_eligibility` trié par `rank_order`, sinon l'insert
  échouerait sur la contrainte NOT NULL de `user_programs.program_id`.
- `expo-secure-store` n'existe pas sur le web : `lib/supabase.ts` bascule sur
  `localStorage` selon `Platform.OS`.
- Les `overrides` npm épinglent metro/reanimated : NativeWind 4.1 tire sinon
  un second React Native (0.87) incompatible avec Expo 52.
