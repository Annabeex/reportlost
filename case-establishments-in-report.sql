-- case-establishments-in-report.sql
-- Un établissement suivi dans un dossier figure par défaut dans le compte rendu
-- remis au client. On le décoche quand on renonce à le contacter, ou quand il
-- n'apporte rien au dossier : la ligne reste en base pour mémoire, elle
-- disparaît simplement de ce que le client lit.
alter table case_establishments
  add column if not exists in_report boolean not null default true;
