-- securite-diagnostic.sql — LECTURE SEULE, ne modifie rien.
-- À lancer dans le SQL Editor de Supabase, puis copier le résultat à Claude.
-- Il montre, pour chaque table : la protection par ligne est-elle active, et
-- quelles règles s'appliquent. Puis l'état des buckets de stockage.
select 1 as ordre, 'table' as quoi, c.relname::text as nom,
       case when c.relrowsecurity then 'RLS ACTIVE' else '⚠️ RLS INACTIVE' end as etat,
       coalesce((
         select string_agg(p.policyname || ' [' || p.cmd || ' · ' || array_to_string(p.roles, ',') || ' · ' || p.permissive || '] ' || coalesce(p.qual, '') , E'\n' order by p.policyname)
         from pg_policies p where p.schemaname = 'public' and p.tablename = c.relname
       ), '(aucune règle)') as regles
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r'
union all
select 2, 'bucket', b.id::text, case when b.public then '⚠️ PUBLIC' else 'privé' end, ''
from storage.buckets b
union all
select 3, 'règle de stockage', p.policyname::text, p.cmd || ' · ' || array_to_string(p.roles, ','),
       coalesce(p.qual, '') || coalesce(' / check: ' || p.with_check, '')
from pg_policies p where p.schemaname = 'storage' and p.tablename = 'objects'
order by 1, 3;
