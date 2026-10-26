-- ============================================================
-- CANADA — phase 2d : paiement en dollars canadiens
-- À lancer dans le SQL editor de Supabase AVANT le déploiement du code.
-- (Le webhook sait se passer de ces colonnes si elles manquent, mais il
--  faut les créer pour garder la trace du montant réellement payé.)
-- Idempotent.
--
-- lost_items.contribution reste le PALIER interne en référence US
-- (12 = Automatic search, 25 = Team-assisted), lu partout dans le site.
-- Les deux colonnes ci-dessous gardent ce que Stripe a réellement encaissé.
-- ============================================================

ALTER TABLE lost_items ADD COLUMN IF NOT EXISTS paid_amount   numeric(10,2);
ALTER TABLE lost_items ADD COLUMN IF NOT EXISTS paid_currency text;

-- Historique : tous les paiements passés sont en USD, montant = contribution.
UPDATE lost_items
SET paid_amount = contribution, paid_currency = 'usd'
WHERE paid = true AND paid_amount IS NULL AND coalesce(contribution, 0) > 0;

-- Contrôle
SELECT coalesce(paid_currency, '(non payé)') AS devise,
       count(*)                              AS signalements,
       sum(paid_amount)                      AS total_encaisse
FROM lost_items
GROUP BY 1
ORDER BY 1;
