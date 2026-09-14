-- publication-mail-sent.sql
--
-- Deux mails différents partageaient le même drapeau `mail_sent` :
--   1. /api/save-report envoie « one step away from going live » quand le
--      brouillon est enregistré, à la fin de l'étape 2, et pose mail_sent ;
--   2. /api/public/send-publication-email envoie « your report is published,
--      the search hasn't started yet » aux dépôts gratuits, à l'étape 5.
--
-- Comme le second testait mail_sent, déjà posé par le premier, il ne partait
-- jamais. Les clients qui choisissaient l'annonce gratuite ne recevaient donc
-- que le mail d'activation, qui leur disait à tort que leur annonce n'était pas
-- encore publiée. Chaque mail a maintenant son propre drapeau.
alter table lost_items
  add column if not exists publication_mail_sent boolean not null default false;
