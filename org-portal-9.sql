-- org-portal-9.sql — texte d'introduction et horaires du bureau, affichés en
-- haut de la page publique de l'établissement, modifiables par ses admins.
-- Texte brut uniquement (jamais de HTML) : rendu tel quel, sans mise en forme.
-- À exécuter AVANT de déployer. Relançable sans risque.
alter table organizations
  add column if not exists public_intro text,
  add column if not exists public_hours text,
  add column if not exists public_location text;
