# Veille automatique des objets perdus (match-watch)

Cherche en ligne des annonces de personnes qui ont **trouvé** un objet correspondant à un signalement, filtre avec l'IA, et t'envoie **un digest quotidien** à valider. Pas de scraping de groupes privés.

## Ce qui a été ajouté

- `lib/matchWatch/core.ts` — recherche Serper + jugement Claude Haiku + cadence.
- `lib/matchWatch/fbGroups.ts` — liens de recherche Facebook prêts à cliquer (registre à compléter).
- `lib/matchWatch/email.ts` — construction + envoi du digest (nodemailer, même SMTP que `/api/send-mail`).
- `app/api/match-watch/route.ts` — worker de recherche (cron).
- `app/api/match-digest/route.ts` — envoi du digest (cron).
- `vercel.json` — 2 crons quotidiens.
- `matchwatch-supabase.sql` — migration base.

## Installation (3 étapes)

1. **Base** : exécute `matchwatch-supabase.sql` dans le SQL editor de Supabase.

2. **Variables d'environnement** (Vercel + `.env.local`) :
   ```
   SERPER_API_KEY=...              # https://serper.dev (2 500 requêtes offertes)
   ANTHROPIC_API_KEY=...           # https://console.anthropic.com (juge les candidats, Haiku)
   CRON_SECRET=une_longue_chaine   # protège les routes ; Vercel l'envoie automatiquement aux crons
   MATCH_DIGEST_TO=ton@email.com   # sinon NEXT_PUBLIC_REPORT_NOTIFICATION_EMAIL est utilisé
   # SMTP déjà en place (SMTP_* ou ZOHO_*) pour l'envoi
   ```
   Optionnel : `ANTHROPIC_MODEL` (défaut `claude-haiku-4-5`), `MATCH_BATCH` (10), `MATCH_MAX_JUDGE` (5), `MATCH_TIME_BUDGET_MS` (50000).

3. **Déploie** (`git push`). Les crons se lancent tout seuls : recherche à 7h UTC, digest à 8h30 UTC.

## Comment ça marche

- Chaque signalement est cherché selon une **cadence dégressive** : tous les jours la 1ʳᵉ semaine, puis 1×/semaine, puis 1×/mois, et on arrête à 6 mois (colonne `next_search_at`).
- Par passage : Haiku génère 1-3 termes (vocabulaire d'un *trouveur*), on interroge Serper au niveau **ville** (web + `site:facebook.com`), et seulement si rien, on **escalade** au lieu précis.
- Haiku juge chaque résultat : *trouveur* vs *propriétaire*, cohérence lieu/date/descriptif → `yes` / `maybe` / `no`.
- Seuls `yes`/`maybe` partent dans le digest. Anti-doublon par URL (`match_candidates`).
- Le digest inclut, par signalement, les candidats **et** des liens de recherche Facebook prêts à cliquer (ta vérif manuelle des groupes fermés en 2 clics).

## Tester manuellement

```
# worker (avec le secret)
curl "https://reportlost.org/api/match-watch?key=TON_CRON_SECRET"
# digest
curl "https://reportlost.org/api/match-digest?key=TON_CRON_SECRET"
```

## Coût (≈ 10 signalements/jour)

~14 000 requêtes Serper/mois → quelques euros (gratuit tant que les 2 500 crédits offerts durent) + Haiku quelques euros. Vercel Cron et l'email : gratuits (SMTP existant).

## Groupes Facebook

Complète `FB_GROUPS` dans `lib/matchWatch/fbGroups.ts` avec les groupes dont **tu es membre** (une fois par ville). Le digest fabrique les liens de recherche — tu restes le seul à lire les groupes (aucune automatisation d'accès).

## Limite d'échelle à connaître

Le worker draine autant de signalements que possible en ~50 s par exécution (plan Vercel Hobby = 1 cron/jour). Si un jour le volume dépasse cette capacité, il suffit de **lancer le cron worker plusieurs fois par jour** (Vercel Pro) — la logique `next_search_at` gère déjà tout le reste sans doublon.
