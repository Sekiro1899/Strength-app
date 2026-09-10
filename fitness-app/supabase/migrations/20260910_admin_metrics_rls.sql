-- ============================================================
-- Panneau admin, métriques d'entraînement, et fermeture des
-- tables de référence.
--
-- À jouer sur un projet Supabase existant. Sur un projet neuf,
-- docs/schema.sql contient déjà tout ceci — cette migration sert
-- aux bases créées avant.
-- ============================================================


-- ------------------------------------------------------------
-- 1. Colonnes que le moteur lit et qui manquaient au schéma
--
-- Ces quatre colonnes pilotent la génération depuis plusieurs
-- versions et vivaient uniquement dans les fixtures du client.
-- Sur une base créée à partir de l'ancien schema.sql, l'import
-- d'exercices les perdait en silence : le générateur Python
-- lisait alors des exercices sans famille de mouvement, donc
-- sans dédoublonnage, et sans drapeau d'impact.
-- ------------------------------------------------------------

ALTER TABLE exercises
    -- Deux exercices de la même famille ne sont jamais servis dans
    -- la même séance (tractions et tractions négatives).
    ADD COLUMN IF NOT EXISTS movement_family VARCHAR(40),
    -- Variante allégée : sa place est dans le bloc principal d'un
    -- débutant ou d'un pratiquant âgé, pas dans celui des autres.
    ADD COLUMN IF NOT EXISTS is_regression BOOLEAN NOT NULL DEFAULT FALSE,
    -- Un côté à la fois : pas de repos entre les deux côtés.
    ADD COLUMN IF NOT EXISTS unilateral BOOLEAN NOT NULL DEFAULT FALSE,
    -- Saut, réception au sol, barre rattrapée en mouvement. Écarté
    -- quand les articulations sont à ménager.
    ADD COLUMN IF NOT EXISTS high_impact BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS exercises_movement_family_idx
    ON exercises (movement_family);


-- ------------------------------------------------------------
-- 2. Poids de corps
--
-- Sans lui, une séance de tractions et de dips pèse zéro kilo :
-- la charge saisie ne compte que le lest.
-- ------------------------------------------------------------

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS body_weight_kg NUMERIC(5,1)
        CHECK (body_weight_kg IS NULL OR body_weight_kg BETWEEN 30 AND 250);


-- ------------------------------------------------------------
-- 3. Rôle d'administration
--
-- Colonne dédiée plutôt qu'une liste d'e-mails en dur : une liste
-- côté client se contourne en lisant le bundle JavaScript, qui est
-- public par construction.
-- ------------------------------------------------------------

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'member'
        CHECK (role IN ('member', 'admin'));

-- Personne ne se promeut soi-même.
--
-- La policy users_own_data autorise un pratiquant à modifier SA
-- ligne — ce qui inclurait la colonne role. Le déclencheur remet
-- l'ancienne valeur pour toute écriture qui ne vient pas de la clé
-- de service : accorder le rôle admin se fait depuis le tableau de
-- bord Supabase, jamais depuis l'application.
CREATE OR REPLACE FUNCTION public.freeze_user_role()
RETURNS TRIGGER AS $$
BEGIN
    -- On bloque UNIQUEMENT les écritures venues de l'application,
    -- c'est-à-dire porteuses d'un JWT anon ou authenticated. Sans
    -- cette précision, l'éditeur SQL du tableau de bord — qui n'a
    -- aucune claim JWT — serait bloqué lui aussi, et plus personne
    -- ne pourrait accorder le premier rôle admin.
    IF NEW.role IS DISTINCT FROM OLD.role
       AND coalesce(
             current_setting('request.jwt.claims', true)::jsonb ->> 'role',
             ''
           ) IN ('authenticated', 'anon')
    THEN
        NEW.role := OLD.role;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS freeze_user_role_trigger ON users;
CREATE TRIGGER freeze_user_role_trigger
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION public.freeze_user_role();


-- ------------------------------------------------------------
-- 4. Fermeture des tables de référence
--
-- ⚠ Correctif de sécurité, indépendant du panneau admin.
--
-- Le schéma créait des policies « public read » sur les tables de
-- référence mais n'activait JAMAIS row level security dessus. Une
-- policy sur une table sans RLS est inerte : l'accès retombe alors
-- sur les GRANT par défaut de Supabase, qui donnent le CRUD complet
-- aux rôles anon et authenticated.
--
-- Or la clé anon est publiée dans le bundle du client
-- (EXPO_PUBLIC_SUPABASE_ANON_KEY). N'importe quel visiteur pouvait
-- donc modifier ou vider la bibliothèque d'exercices, les
-- programmes et le questionnaire.
--
-- Activer RLS rend les policies existantes effectives : lecture
-- pour tous, écriture pour personne — sauf la clé de service, qui
-- contourne RLS par nature (import, seed, backend).
-- ------------------------------------------------------------

ALTER TABLE personas                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_phases              ENABLE ROW LEVEL SECURITY;
ALTER TABLE persona_program_eligibility ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE questionnaire_questions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE questionnaire_options       ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_poll_questions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_poll_options       ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_variants            ENABLE ROW LEVEL SECURITY;
ALTER TABLE alternative_program_pitches ENABLE ROW LEVEL SECURITY;


-- ------------------------------------------------------------
-- 5. Écriture sur les exercices, réservée aux administrateurs
--
-- C'est le verrou du panneau admin. Le masquage de l'écran côté
-- client n'en est pas un : il évite d'afficher un bouton inutile,
-- rien de plus.
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND role = 'admin'
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

DROP POLICY IF EXISTS "exercises_admin_insert" ON exercises;
CREATE POLICY "exercises_admin_insert" ON exercises
    FOR INSERT TO authenticated
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "exercises_admin_update" ON exercises;
CREATE POLICY "exercises_admin_update" ON exercises
    FOR UPDATE TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Pas de policy DELETE : un exercice supprimé casserait les
-- références des séances déjà générées (session_logs.exercise_id).
-- Un exercice à retirer se retire de `target_programs`.


-- ------------------------------------------------------------
-- 6. Journal des séries
--
-- La policy session_logs_own existe déjà et couvre la lecture comme
-- l'écriture. Il manquait l'index : « Mes entraînements » lit tout
-- l'historique d'un pratiquant à chaque ouverture.
-- ------------------------------------------------------------

CREATE INDEX IF NOT EXISTS session_logs_user_logged_idx
    ON session_logs (user_id, logged_at);


-- ------------------------------------------------------------
-- 7. Se donner le rôle admin
--
-- À jouer une fois, depuis l'éditeur SQL du tableau de bord
-- Supabase — qui utilise la clé de service et contourne donc le
-- déclencheur ci-dessus.
--
--     UPDATE users SET role = 'admin' WHERE email = 'ton@email';
--
-- Vérification :
--
--     SELECT email, role FROM users WHERE role = 'admin';
-- ------------------------------------------------------------
