-- org-ai-quota.sql
--
-- Plafond mensuel du scan par photo (le seul appel payant du portail,
-- ~1 centime par objet). Sans plafond, un bureau qui photographie tout son
-- stock, ou un script maladroit, transforme un outil offert en facture ouverte.
--
-- Le compteur est incrémenté et testé DANS LA MÊME transaction : deux agents
-- qui scannent en même temps ne peuvent pas passer tous les deux au-delà.
--
-- organizations.ai_quota permet de relever le plafond établissement par
-- établissement — c'est la marche payante : on vend un quota, pas un outil.
--
-- À exécuter AVANT de déployer.

create table if not exists org_ai_usage (
  org_id uuid not null references organizations(id) on delete cascade,
  month  text not null,                 -- 'YYYY-MM', en UTC
  used   integer not null default 0,
  primary key (org_id, month)
);

alter table organizations
  add column if not exists ai_quota integer;

comment on column organizations.ai_quota is
  'Plafond mensuel de scans photo. NULL = plafond par défaut du site.';

-- Consomme un scan si le quota le permet. Renvoie l''état après opération.
create or replace function org_ai_consume(p_org uuid, p_limit integer)
returns table(allowed boolean, used integer, quota integer)
language plpgsql
as $$
declare
  v_month text := to_char(now() at time zone 'utc', 'YYYY-MM');
  v_quota integer;
  v_used  integer;
begin
  select coalesce(o.ai_quota, p_limit) into v_quota
  from organizations o where o.id = p_org;
  if v_quota is null then v_quota := p_limit; end if;

  insert into org_ai_usage (org_id, month, used)
  values (p_org, v_month, 0)
  on conflict (org_id, month) do nothing;

  -- Verrou de ligne : la lecture et l''écriture ne peuvent pas être entrelacées.
  select u.used into v_used
  from org_ai_usage u
  where u.org_id = p_org and u.month = v_month
  for update;

  if v_used >= v_quota then
    return query select false, v_used, v_quota;
    return;
  end if;

  update org_ai_usage u set used = u.used + 1
  where u.org_id = p_org and u.month = v_month
  returning u.used into v_used;

  return query select true, v_used, v_quota;
end;
$$;

-- Rend le scan décompté quand l''appel a échoué : on ne facture pas un raté.
create or replace function org_ai_refund(p_org uuid)
returns void
language sql
as $$
  update org_ai_usage
  set used = greatest(used - 1, 0)
  where org_id = p_org
    and month = to_char(now() at time zone 'utc', 'YYYY-MM');
$$;
