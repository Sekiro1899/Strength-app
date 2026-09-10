# Brancher Supabase

Ce guide part de zéro. Il explique ce qu'est Supabase, ce que l'application
attend de lui, et dans quel ordre faire les choses — y compris ce qui casse si
on s'arrête au milieu.

---

## 1. Ce qu'est Supabase, en une minute

Supabase est une base de données **PostgreSQL** hébergée, avec trois choses
posées par-dessus :

| Brique | À quoi elle sert ici |
|---|---|
| **Auth** | Comptes et mots de passe. Chaque compte reçoit un identifiant (`auth.uid()`). |
| **API REST auto-générée** | Chaque table devient une URL. C'est ce que `lib/supabase.ts` appelle. |
| **Row Level Security (RLS)** | Des règles SQL qui décident, ligne par ligne, qui peut lire et écrire. |

Le point à comprendre avant tout le reste : **la clé « anon » est publique**.
Elle est compilée dans le bundle JavaScript, donc lisible par n'importe quel
visiteur. Ce n'est pas une fuite, c'est le fonctionnement prévu — mais cela veut
dire que **la seule chose qui protège les données, c'est RLS**. Masquer un écran
côté client ne protège rien.

Deux clés existent :

- `EXPO_PUBLIC_SUPABASE_ANON_KEY` — publique, soumise à RLS. Celle de l'app.
- `SUPABASE_SERVICE_ROLE_KEY` — **contourne RLS**. Elle ne doit jamais quitter
  le serveur : ni dans le mobile, ni dans une variable `EXPO_PUBLIC_*`, ni dans
  un commit. Elle sert aux scripts d'import et au backend FastAPI.

---

## 2. Ce que l'app fait aujourd'hui, sans Supabase

Sans identifiants, `isDemoMode()` renvoie `true` et **tout le flux fonctionne en
local**, dans le navigateur : compte, questionnaire, programme, génération de
séance, suivi, historique. Les données vivent dans `localStorage`.

C'est le mode dans lequel tourne la préprod actuelle. Il n'a rien d'un
brouillon : c'est le mode d'itération sur les écrans.

---

## 3. Attention : Supabase seul ne suffit pas

Poser les deux variables Supabase fait sortir l'app du mode démo. À partir de
là, elle attend **aussi** un backend FastAPI :

```
lib/data.ts  → generateWorkout()  → lib/api.ts  → POST {EXPO_PUBLIC_API_URL}/workout/generate
```

Sans `EXPO_PUBLIC_API_URL`, la génération de séance échoue avec
« EXPO_PUBLIC_API_URL n'est pas défini ». Le reste de l'app (auth, dashboard,
profil, historique) fonctionne, mais on ne peut plus lancer de séance.

**Donc : soit les trois variables, soit aucune.** Un demi-branchement donne une
application cassée, pas une application partielle.

Le backend est dans `fitness-app/backend/` (FastAPI). Il s'héberge sur
Railway, Render, Fly.io ou équivalent. Il lui faut `SUPABASE_URL` et
`SUPABASE_SERVICE_ROLE_KEY`.

---

## 4. Créer le projet

1. Aller sur [supabase.com](https://supabase.com), créer un projet.
2. Choisir une région proche (Europe West pour la France).
3. Noter le mot de passe de la base — il ne sera plus affiché.
4. Dans **Project Settings → API**, relever :
   - `Project URL` → `EXPO_PUBLIC_SUPABASE_URL`
   - `anon public` → `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → à garder côté serveur uniquement

---

## 5. Créer les tables

Dans **SQL Editor**, coller et exécuter, dans cet ordre :

1. `fitness-app/docs/schema.sql` — les tables, les contraintes, RLS.
2. `fitness-app/supabase/migrations/20240101_handle_new_user.sql` — crée la
   ligne `users` à chaque inscription. Sans lui, un compte existe dans
   `auth.users` mais pas dans `users`, et l'app ne trouve jamais le profil.

Si la base a été créée **avant aujourd'hui**, jouer aussi :

3. `fitness-app/supabase/migrations/20260910_admin_metrics_rls.sql`

Cette dernière migration corrige un défaut de sécurité réel : le schéma créait
des règles de lecture publique sur les tables de référence (exercices,
programmes, questionnaire) **sans activer RLS dessus**. Une règle sur une table
sans RLS est inerte, et l'accès retombe alors sur les droits par défaut de
Supabase — qui autorisent l'écriture. Autrement dit, n'importe quel visiteur
muni de la clé publique pouvait modifier ou vider la bibliothèque d'exercices.
La migration active RLS et referme la porte.

Elle ajoute aussi quatre colonnes dont le moteur dépend et qui manquaient au
schéma : `movement_family`, `is_regression`, `unilateral`, `high_impact`.

---

## 6. Remplir les données de référence

Depuis `fitness-app/docs/` :

```bash
pip install -r requirements.txt
export SUPABASE_URL="https://xxx.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="eyJ..."

python seed.py              # personae, programmes, questionnaire, phases
python import_exercises.py  # la bibliothèque d'exercices
```

`import_exercises.py` **préserve** les champs enrichis d'un exercice déjà
présent (`movement_family`, `unilateral`, `high_impact`, `is_regression`,
`video_url`, `image_url`). Le rejouer ne détruit donc pas le travail de
qualification fait depuis le panneau admin.

---

## 7. Se donner le rôle administrateur

Le panneau admin s'ouvre sur `users.role = 'admin'`. Aucun compte ne l'a au
départ, et **personne ne peut se l'accorder depuis l'application** : un
déclencheur SQL remet l'ancienne valeur.

1. Créer son compte normalement dans l'app.
2. Dans **SQL Editor** :

```sql
UPDATE users SET role = 'admin' WHERE email = 'ton@email';
SELECT email, role FROM users WHERE role = 'admin';
```

L'éditeur SQL n'a pas de jeton JWT applicatif : c'est précisément pour cela
qu'il passe le déclencheur, là où l'application ne le peut pas.

---

## 8. Poser les variables sur Vercel

**Project Settings → Environment Variables** :

| Variable | Valeur | Portée |
|---|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | l'URL du projet | Production + Preview |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | la clé anon | Production + Preview |
| `EXPO_PUBLIC_API_URL` | l'URL du backend FastAPI | Production + Preview |

Puis **redéployer** : les variables `EXPO_PUBLIC_*` sont lues à la compilation,
pas à l'exécution. Les poser sans relancer un build ne change rien.

Pour garder une préprod en mode démo tout en branchant la production, poser
`EXPO_PUBLIC_DEMO_MODE=1` sur la portée Preview uniquement.

---

## 9. Vérifier

| Ce qu'on vérifie | Comment | Attendu |
|---|---|---|
| Le mode | Le bandeau « démo » en haut de l'app | Absent |
| L'inscription | Créer un compte | Une ligne dans `users` |
| Les données de référence | `SELECT count(*) FROM exercises` | 134 |
| Le rôle | Ouvrir `/admin` | Le Kanban, écriture active |
| Le verrou | Se connecter avec un compte non-admin | « Accès refusé » |
| Le vrai verrou | Depuis la console : `supabase.from('exercises').insert(…)` avec un compte non-admin | Erreur RLS |

La dernière ligne est la seule qui compte. Les cinq autres vérifient l'écran ;
celle-là vérifie le serveur.

---

## 10. Revenir en arrière

Retirer les trois variables et redéployer : l'app repasse en mode démo. Rien
n'est perdu côté Supabase — les données restent, elles ne sont simplement plus
lues.
