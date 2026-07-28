-- 🏛️ Portail établissements phase 1b : visibilité publique contrôlée.
-- À exécuter une fois dans le SQL editor de Supabase.

-- Interrupteur global de la page publique (choix de l'établissement)
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS public_listing boolean NOT NULL DEFAULT true;

-- Par objet : visible publiquement ? + libellé public générique
-- (la description détaillée et la photo ne sortent JAMAIS publiquement :
--  elles servent de preuve de propriété lors des réclamations)
ALTER TABLE found_items
  ADD COLUMN IF NOT EXISTS public_visible boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS public_label text;
