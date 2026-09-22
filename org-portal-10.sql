-- org-portal-10.sql — rapprochement automatique activable par établissement.
-- À exécuter AVANT de déployer. Relançable sans risque.
alter table organizations
  add column if not exists auto_match boolean not null default true;
comment on column organizations.auto_match is
  'Si faux : aucun rapprochement automatique entre pertes déclarées et inventaire pour cet établissement, et rien dans « To review ».';
