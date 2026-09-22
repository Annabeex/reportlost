-- index-diagnostic.sql — LECTURE SEULE. Index existants sur les tables les plus
-- lues, et taille de chaque table. À coller dans le SQL Editor de Supabase,
-- résultat à copier à Claude.
select c.relname as "table",
       pg_size_pretty(pg_total_relation_size(c.oid)) as taille,
       coalesce(s.n_live_tup, 0) as lignes,
       coalesce((select string_agg(indexdef, E'\n' order by indexname)
                 from pg_indexes i where i.schemaname = 'public' and i.tablename = c.relname), '(aucun index)') as index
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
left join pg_stat_user_tables s on s.relid = c.oid
where n.nspname = 'public' and c.relkind = 'r'
  and c.relname in ('lost_items','found_items','case_messages','events','match_candidates','us_cities','city_guides','org_matches','org_item_events','organizations')
order by pg_total_relation_size(c.oid) desc;
