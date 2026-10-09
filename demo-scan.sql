-- demo-scan.sql — compteur du scan photo de la démonstration publique.
--
-- /lost-property/demo laisse n'importe qui envoyer une photo et voir la fiche
-- se remplir. C'est l'argument qui vend l'outil, et c'est aussi le seul appel
-- payant accessible sans compte : sans plafond, c'est une facture ouverte à
-- qui veut. Deux limites, par jour :
--   • par visiteur  (adresse IP hachée, jamais stockée en clair)
--   • pour tout le site (le budget quotidien d'Anna)
--
-- Les deux plafonds se règlent par variables d'environnement sur Vercel :
--   DEMO_SCAN_PER_IP   (défaut 5)
--   DEMO_SCAN_DAILY    (défaut 100)
--
-- À exécuter une fois dans l'éditeur SQL de Supabase. Relançable sans risque.

create table if not exists demo_scan_usage (
  jour      date    not null,
  seau      text    not null,          -- 'global' ou le haché d'une adresse IP
  utilises  integer not null default 0,
  primary key (jour, seau)
);

create index if not exists demo_scan_usage_jour_idx on demo_scan_usage (jour);

alter table demo_scan_usage enable row level security;

-- Consomme un scan si les DEUX plafonds le permettent. Les lignes sont
-- verrouillées avant lecture : deux requêtes simultanées ne peuvent pas
-- passer toutes les deux sur le dernier jeton disponible.
create or replace function demo_scan_consume(
  p_seau            text,
  p_plafond_ip      integer,
  p_plafond_global  integer
)
returns table(allowed boolean, ip_used integer, global_used integer)
language plpgsql
as $$
declare
  v_jour   date := (now() at time zone 'utc')::date;
  v_ip     integer;
  v_global integer;
begin
  -- Un seau nommé « global » viendrait fausser le double décompte.
  if p_seau is null or p_seau = 'global' or length(p_seau) < 8 then
    return query select false, 0, 0;
    return;
  end if;

  insert into demo_scan_usage (jour, seau) values (v_jour, 'global')
    on conflict (jour, seau) do nothing;
  insert into demo_scan_usage (jour, seau) values (v_jour, p_seau)
    on conflict (jour, seau) do nothing;

  select utilises into v_global from demo_scan_usage
   where jour = v_jour and seau = 'global' for update;
  select utilises into v_ip from demo_scan_usage
   where jour = v_jour and seau = p_seau for update;

  if v_global >= p_plafond_global or v_ip >= p_plafond_ip then
    return query select false, v_ip, v_global;
    return;
  end if;

  update demo_scan_usage set utilises = utilises + 1
   where jour = v_jour and seau in ('global', p_seau);

  return query select true, v_ip + 1, v_global + 1;
end $$;

-- Par défaut Supabase expose toute fonction à la clé publique : sans ça,
-- n'importe qui pourrait appeler le compteur directement.
revoke execute on function demo_scan_consume(text, integer, integer) from public, anon, authenticated;
grant  execute on function demo_scan_consume(text, integer, integer) to service_role;

-- Ménage : le compteur ne sert qu'au jour courant.
delete from demo_scan_usage where jour < (now() at time zone 'utc')::date - 30;

-- Vérification : consommation du jour.
select seau, utilises from demo_scan_usage
 where jour = (now() at time zone 'utc')::date
 order by (seau = 'global') desc, utilises desc;
