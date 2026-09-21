-- org-portal-5.sql
--
-- Code court par établissement, pour les QR codes. Un QR code qui encode
-- reportlost.org/q/k7m2p compte 29 modules de côté ; la même affiche avec
-- l'adresse complète de la page en compte 41. Moins dense = plus lisible en
-- petit format (cartes), et nettement plus propre à l'œil.
--   reportlost.org/q/<code>  → page de l'établissement (objets détenus)
--   reportlost.org/f/<code>  → formulaire « Found something? »
--
-- À exécuter AVANT de déployer. Relançable sans risque.

-- 5 caractères sans voyelles ni caractères ambigus (0/o, 1/l) : rien qui
-- ressemble à un mot, rien qui se confonde si quelqu'un le recopie à la main.
create or replace function org_short_code() returns text
language plpgsql
as $$
declare
  alphabet constant text := '23456789bcdfghjkmnpqrstvwxz';
  candidate text;
  i integer;
begin
  loop
    candidate := '';
    for i in 1..5 loop
      candidate := candidate || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from organizations o where o.short_code = candidate);
  end loop;
  return candidate;
end;
$$;

alter table organizations add column if not exists short_code text;

-- Un établissement à la fois : dans un UPDATE unique, chaque ligne ignorerait
-- le code que la précédente vient de recevoir.
do $$
declare r record;
begin
  for r in select id from organizations where short_code is null loop
    update organizations set short_code = org_short_code() where id = r.id;
  end loop;
end $$;

alter table organizations alter column short_code set default org_short_code();
alter table organizations alter column short_code set not null;

create unique index if not exists organizations_short_code_idx on organizations (short_code);

revoke execute on function org_short_code() from public, anon, authenticated;
grant  execute on function org_short_code() to service_role;
