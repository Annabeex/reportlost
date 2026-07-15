# 📘 ReportLost.org — Documentation technique

> **Comment maintenir ce document** : après chaque chantier, demander à l'assistant « mets à jour DOCUMENTATION.md avec ce qu'on vient de faire ». Dernière mise à jour : **13 juillet 2026**.

---

## Sommaire

1. [Vue d'ensemble](#1-vue-densemble)
2. [Pages publiques](#2-pages-publiques)
3. [Pages admin](#3-pages-admin)
4. [Routes API](#4-routes-api)
5. [Automatisations](#5-automatisations)
6. [Circuit des emails](#6-circuit-des-emails)
7. [Base de données (Supabase)](#7-base-de-données-supabase)
8. [Prompts IA](#8-prompts-ia)
9. [Scripts locaux](#9-scripts-locaux)
10. [SEO](#10-seo)
11. [Variables d'environnement](#11-variables-denvironnement)
12. [Pannes connues et leçons apprises](#12-pannes-connues-et-leçons-apprises)

---

## 1. Vue d'ensemble

**Stack** : Next.js 14 (App Router) sur Vercel · Supabase (base + storage) · Stripe (paiements) · Zoho Mail (emails, `support@reportlost.org`) · Mailgun (emails entrants sur `*@scan.reportlost.org`) · FreeScout auto-hébergé sur inbox.pas-bete.com (support client, appli mobile) · Serper (recherches Google) · Anthropic Claude (rédaction, veille) · Gemini (images de villes).

**Le produit** : les gens signalent un objet ou animal perdu ; publication gratuite, accompagnement payant (12 $ Extended / 25 $ Maximum / 30 $ Pet Priority). L'équipe contacte police + établissements, publie sur les réseaux, et une veille automatique cherche des « found » correspondants pendant 6 mois (12 mois à partir de 25 $, seuil `MATCH_PREMIUM_CONTRIB`).

**Arborescence utile** :

```
app/               pages + API (App Router)
components/        composants React
lib/               logique partagée (mailer, veille, supabase, slugs…)
scripts/           scripts à lancer en local (node scripts/xxx)
public/            statiques (robots.txt, sitemap index, images)
*.sql              migrations à exécuter dans le SQL editor Supabase
vercel.json        crons
```

---

## 2. Pages publiques

| Route | Rôle |
|---|---|
| `/` | Accueil. Blocs How It Works (titre → page assistance) / Why / Who Is This For. |
| `/report` | Formulaire principal (objets). 5 étapes : description → lieu → contact → contribution → paiement. |
| `/report-lost-pet` | Formulaire **animaux** : libellés adaptés (petMode) + formule unique Pet Priority 30 $. |
| `/lost-item-recovery-assistance-usa` | **Page canonique de l'offre** (SEO + ChatGPT Search) : prestations, 3 formules, FAQ conversationnelle, JSON-LD Service/Offer/FAQ. |
| `/lost-pet-poster` | **Générateur d'affiche animal gratuit** (client-side : photo jamais uploadée). Exemple pré-rempli, QR mailto, export PNG/PDF (html-to-image). Compteur anonyme via `/api/track`. |
| `/lost-and-found/[state]` | Page État (ISR 24h). |
| `/lost-and-found/[state]/[city]` | **Page ville** (ISR 24h, maxDuration 60). Ordre : hero → signalements récents réels (90 j, liés aux `/lost/slug`) + carte commissariats → formulaire → guide (si publié) ou gabarit générique. Résolution robuste des noms à ponctuation (St. Louis). 5 grandes villes = composants dédiés en dur (`NycContent`…). |
| `/lost-and-found/category/[category]` | Pages catégories d'objets. |
| `/lost/[slug]` | Page publique d'un signalement (ISR 1h). Contenu frais unique → SEO longue traîne. |
| `/case/[public_id]` | **Compte rendu client** : bandeau statut (formule + date de fin de veille), carte stickers QR (≥ 25 $), carte poster animaux (catégorie pets), blocs de suivi rédigés. `?edit=1` = éditeur (admin, Basic Auth via middleware). |
| `/qr/[token]`, `/stickers`, `/scan-demo` | Produit stickers QR (relais trouveur → propriétaire). |
| `/universities/...` | Programme universités (formulaire gratuit, `forceFreeMode`). |
| Autres : `/about`, `/contact`, `/how-it-works`, `/helpcenter`, `/legal`, `/terms`, `/privacy`, `/cookies`. |

---

## 3. Pages admin

Protégées par **Basic Auth** (middleware, `ADMIN_USER`/`ADMIN_PASS`) sur `/admin/*` et `/api/admin/*`.

| Route | Rôle |
|---|---|
| `/admin` | Liste des signalements. Stats : lost/found/paid/TC/**free reports**/**posters téléchargés**. Boutons par ligne : 🔎 recherche, 📸 image sociale, 👥 kit FB (1ʳᵉ ville non cochée), 🗂️ Dossier (payés), View post, Edit suivi, 🗑 suppression. En-tête : 👥 Kits Facebook, 🏙️ Guides ville. |
| `/admin/case/[id]` | **Page dossier** (payés) : timeline des échanges (emails archivés, notes) + assistant IA avec contexte complet + composeur (Valider & envoyer). Boutons rapides : ✉️ mail initial, 🏢 qui contacter (recherche web), 📋 résumé. Suivi établissements (cases mail/formulaire). Liens cliquables partout. |
| `/admin/city-guides` | **Générateur de guides ville**. Compteur global (publiées/vérifiées/brouillons/objectif 6000). Tableau top 6000 par population avec statut. Éditeur JSON + aperçu + 🌐 voir la page + 🖼️ générer l'image + badge « à vérifier » + ✓ marquer vérifié. |
| `/admin/city-guides/preview` | Aperçu d'un guide (brouillon inclus) avec la vraie structure de page (placeholders formulaire/carte). Lit la base en direct (pas de cache). |
| `/admin/group-kit` | **Kit groupe Facebook** : nom (ville + État, sans « Exchange »), description aérée, 📌 post à épingler (lien en tête), posts FOUND réels (semaine, 3 visés), bannière (image de base + « VILLE, ST » une ligne). Case « groupe créé » + tableau des villes par population. |
| `/admin/poster/[id]` | Image sociale « WANTED » d'un signalement + légende EN/FR structurée. |

---

## 4. Routes API

### Cœur du produit
| Route | Rôle |
|---|---|
| `POST /api/save-report` | Enregistre/actualise un signalement. Anti-doublon par **empreinte journalière** (titre+desc+ville+date+email+jour). Reprise brouillon par `rid` (URL toujours, localStorage < 24 h). Envoie le mail client « Publish your report » (une fois, flag `mail_sent`) et **une seule** notification support (à la capture de l'email). Emails via `lib/mailer` (SMTP direct). |
| `POST /api/create-payment-intent` | Crée le PaymentIntent Stripe. |
| `POST /api/stripe-webhook` | Confirme le paiement : `paid=true`, mail de confirmation client (direct SMTP, flag `payment_email_sent`). |
| `POST /api/inbound-email` | **Webhook Mailgun** (`*@scan.reportlost.org`). `12345@scan` : relais trouveur→propriétaire (BCC support@) + archivage dossier. Réponse du propriétaire : transmise à support@ (pas de boucle). `archive@scan` : archivage pur des copies support@ (transfert Zoho entrant + Auto Bcc FreeScout sortant), rattachement par `#12345` (sujet/corps) ou email du correspondant, **payés uniquement**. |
| `POST /api/send-mail` | Route email générique (auth `MAIL_API_KEY`, rate limit). Utilisée par le front et les follow-ups. Les envois internes n'y passent plus (→ `lib/mailer`). |

### Dossiers (admin)
| Route | Rôle |
|---|---|
| `GET /api/admin/case-data` | Contexte complet d'un dossier (signalement, messages, candidats veille, établissements). |
| `POST /api/admin/case-chat` | Chat Claude avec contexte dossier (payés). |
| `POST /api/admin/case-places` | « Qui contacter » : requêtes Serper réelles → synthèse email-first + 📍 adresse de référence (bâtiment public) + brouillon (adresse relais `item{id}@reportlost.org`, signé Anna). **Sauvegardé automatiquement en note**. |
| `POST /api/admin/case-send` | Envoi depuis le dossier : from `support@`, **Reply-To `{public_id}@scan.reportlost.org`** (les réponses reviennent seules au dossier), gabarit HTML ReportLost (bandeau vert + puces), archivage `case_messages`. |
| `case-note`, `case-establishment`, `case-message-delete` | Notes internes, suivi établissements (CRUD), suppression d'un message. |

### Guides ville (admin)
| Route | Rôle |
|---|---|
| `POST /api/admin/city-guide-generate` | 6 recherches Serper → guide CityGuide (JSON) avec retry anti-troncature → photo Gemini si pas d'image (remplace Pexels) → upsert + `autoPublish` (publication directe non vérifiée) + **revalidatePath** + title/meta SEO si vides. |
| `GET/PUT /api/admin/city-guide` | Liste (+ totaux, + mode `?cities=1&limit=6000` paginé pour la liste de travail), sauvegarde, publication/dépublication (revalidation ISR), flag `verified`. |
| `POST /api/admin/city-image-generate` | (Re)génère uniquement la photo IA d'une ville. |
| `POST /api/admin/group-kit`, `GET/PUT /api/admin/fb-group-done` | Kit Facebook + suivi « groupe créé » (`us_cities.fb_group_done`). |

### Veille (crons Vercel, cf. §5)
`GET /api/match-watch` (7h UTC) · `GET /api/match-digest` (8h30 UTC) — protégés par `CRON_SECRET`.

### Divers
`/api/banner` (bannière FB) · `/api/poster/[id]` + `/api/admin/poster-caption/[id]` (image sociale + légende) · `/api/sticker-sheet`, `/api/qr-sheet` (planches QR) · `/api/og/*` (images OpenGraph) · `/api/recent-lost` · `/api/object-suggest` · `/api/generate-report-slug` · `/api/admin/list` · `/api/admin/resend-publish-email` · `/api/track` (compteurs anonymes poster) · `/api/test-mail`, `/api/test-mail-direct` (diagnostics SMTP) · `/api/apivision` (Google Vision) · `/api/pexels`.

---

## 5. Automatisations

### Veille objets perdus (match-watch) — `lib/matchWatch/*`
1. **Cron 7h UTC** `/api/match-watch` : dossiers payés ≥ seuil (`MATCH_MIN_CONTRIB`) ou `force_search`, dus selon `next_search_at`. Par dossier : Haiku génère 1-3 requêtes « trouveur » → Serper (web + facebook) → Haiku juge chaque résultat (`yes/maybe/no`) → `match_candidates` (anti-doublon URL). Cadence dégressive : quotidien (7 j) → hebdo (30 j) → mensuel ; arrêt à **180 j** (365 j si contribution ≥ 25).
2. **Cron 8h30 UTC** `/api/match-digest` : envoie à `MATCH_DIGEST_TO` (= `veille@reportlost.org` → dossier Zoho « Veille » → mailbox FreeScout dédiée, sans notifications) les candidats non encore envoyés + liens de recherche FB prêts à cliquer.

### Génération de guides ville (campagne SEO)
`node scripts/generate-city-guides-batch.mjs 150` : prend les villes **sans guide** dans le top 6000 par population, appelle l'API de génération (auto-publish, non vérifié), retry réseau. Lots séquentiels (jamais en parallèle). Photo IA générée dans la foulée si `GEMINI_API_KEY`. Relecture a posteriori via badge orange.

### Archivage des emails dans les dossiers
Tout mail envoyé/reçu autour d'un dossier payé atterrit dans `case_messages` : envois admin (direct), réponses (Reply-To tracké → Mailgun), mails spontanés support@ (transfert Zoho → archive@ → rattachement par `#id` ou email), envois FreeScout (Auto Bcc → archive@).

### Revalidation ISR
Publication/dépublication d'un guide → `revalidatePath` de la page ville. Un déploiement purge tout le cache ISR.

---

## 6. Circuit des emails

**Sortants** (SMTP Zoho direct via `lib/mailer`, from `support@reportlost.org`) :
| Déclencheur | Mail | Garde-fou |
|---|---|---|
| Email client capturé (formulaire) | « Publish your report » au client + notification support | flags `mail_sent` / une notif par dossier |
| Paiement confirmé (webhook Stripe) | « Payment received » au client | `payment_email_sent` |
| Envoi depuis un dossier admin | mail au destinataire (HTML brandé) | Reply-To tracké |
| Cron digest | digest veille → `veille@` | `emailed` sur les candidats |
| Relais QR (`12345@scan`) | message du trouveur → propriétaire | BCC support@ |

**Entrants** :
- `support@reportlost.org` (Zoho) → FreeScout (IMAP, mailbox clients) **et** transfert copie → `archive@scan.reportlost.org` → webhook → archivage dossier.
- `veille@reportlost.org` (alias) → filtre Zoho → dossier « Veille » → mailbox FreeScout Veille (IMAP folder `Veille`).
- `*@scan.reportlost.org` (MX Mailgun) → route unique `store+notify` vers le webhook (**pas de forward** : quota 1 route, et le forward créait une boucle avec le transfert Zoho).

⚠️ **Règles à ne pas casser** : jamais de `fetch` HTTP interne pour envoyer un mail (timeouts) → `sendMailDirect` ; jamais de fire & forget pour un envoi SMTP en serverless (la fonction gèle) → toujours `await`.

---

## 7. Base de données (Supabase)

| Table | Rôle |
|---|---|
| `lost_items` | Signalements (+ QR stickers). Colonnes clés : `public_id` (5 chiffres), `fingerprint` (anti-doublon journalier), `mail_sent`, `payment_email_sent`, `paid`, `contribution`, `slug`, veille (`search_status`, `next_search_at`, `last_searched_at`, `force_search`), `case_followup` (blocs compte rendu). |
| `found_items` | Objets trouvés déclarés. |
| `us_cities` | Villes US : SEO (`static_title`, `static_content`), image (`image_url`, `image_alt`), `fb_group_done`, population, lat/lng… |
| `match_candidates` | Pistes de veille par dossier (verdict, confiance, `emailed`). |
| `case_messages` | Timeline des dossiers : `direction` in/out/note, sujet, corps. |
| `case_establishments` | Établissements contactés par dossier (cases mail/formulaire). |
| `city_guides` | Guides ville : `guide` (JSON CityGuide), `status` draft/published, `verified`. |
| `events` | Compteurs anonymes (poster_png, poster_pdf). |

Storage : bucket public `city-images` (photos IA des villes). RLS activé partout (accès serveur via service role uniquement). Migrations : fichiers `*.sql` à la racine.

---

## 8. Prompts IA

| Où | Modèle | Ce qu'il fait |
|---|---|---|
| `app/api/admin/city-guide-generate/route.ts` | `CITY_GUIDE_MODEL` (déf. Haiku) | Guide ville « similaire mais différent » : plan modèle NYC, reformulation par ville, cartes ajustées au réel (pas de métro sans métro), liens = structures officielles ou entreprises concernées (jamais de concurrents), carte pet → lien `/report-lost-pet`, veille mise en avant, ton rassurant, pas de tirets, pas de « guide », pas de « reunite/connect ». |
| `app/api/admin/case-chat/route.ts` | `CASE_CHAT_MODEL` (déf. Haiku) | Assistant de dossier : contexte complet + template mail initial (modèle Blythe) + suggestions établissements. Emails : texte brut sans markdown, adresse relais pour les établissements, signatures fixes. |
| `app/api/admin/case-places/route.ts` | idem | Qui contacter : requêtes Serper puis synthèse **email-first** stricte (rien d'inventé), adresse de référence pour formulaires police, brouillon relais anonyme. |
| `app/api/admin/group-kit/route.ts` | `ANTHROPIC_MODEL` | Kit FB : nom (ville+État, sans Exchange), description aérée avec emojis, 📌 post épinglé (lien en premier), posts FOUND réels (semaine). Bannis globaux : « reunite/connect… », tirets, contenus sombres. |
| `lib/matchWatch/core.ts` | Haiku | Veille : génération de requêtes « trouveur » + jugement des candidats (+ description de la photo du dossier). |
| `app/api/poster/[id]/route.tsx` + `poster-caption` | Haiku | Titre court du poster (type d'objet 1-2 mots) + légende sociale structurée 5 blocs. |
| `lib/cityImage.ts` | `GEMINI_IMAGE_MODEL` (déf. gemini-2.5-flash-image) | Photo réaliste de la ville (sans texte/personnes), stockée dans `city-images`. |

---

## 9. Scripts locaux

| Script | Usage |
|---|---|
| `generate-city-guides-batch.mjs` | `node scripts/generate-city-guides-batch.mjs 150` — campagne guides (cf. §5). |
| `fetch-pet-example.mjs` | (Obsolète : image d'exemple posée à la main dans `public/images/lost-pet-example.jpg`.) |
| `batch-fill-city-images.ts`, `regen-city-image.ts` | Anciennes images Pexels. |
| `generate-sitemap.ts` | Obsolète (sitemaps dynamiques, cf. §10). |
| autres (`backfill-slugs`, `seed-hotspots`, `populateStaticContent`) | one-shots historiques. |

---

## 10. SEO

- **Sitemaps** : `public/sitemap.xml` (index) → `/sitemap-cities.xml` (toutes les villes, cache 24 h, **lastmod réel** pour les villes à guide publié) + `/sitemap-reports.xml` (signalements publics, lastmod, cache 1 h).
- **ISR** : villes 24 h, signalements 1 h, État 24 h. `getSupabaseAdmin({ fresh:false })` obligatoire dans les pages ISR (un fetch no-store rend la page dynamique).
- **robots.txt** : tout autorisé sauf admin/api ; `OAI-SearchBot`, `PerplexityBot`, `ClaudeBot` explicitement autorisés (ChatGPT Search…).
- **JSON-LD** : BreadcrumbList (villes), FAQPage (guides), Service/Offer (page assistance), WebApplication (poster).
- **Stratégie** : remplacer le gabarit générique des 31k pages par des guides documentés (campagne en cours, objectif 6000), pages signalements = longue traîne, page canonique pour l'intention commerciale. KPI hebdo : pages indexées GSC / impressions / dépôts / TC.

---

## 11. Variables d'environnement

| Variable | Rôle |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Supabase. |
| `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` | Stripe. |
| `ZOHO_USER`, `ZOHO_PASS` | SMTP/IMAP Zoho (support@). |
| `MAILGUN_SIGNING_KEY` | Signature du webhook entrant. |
| `MAIL_API_KEY`, `MAIL_ALLOWED_ORIGINS`, `MAIL_RATE_LIMIT_PER_HOUR` | Route `/api/send-mail`. |
| `ANTHROPIC_API_KEY` (+ `ANTHROPIC_MODEL`, `CASE_CHAT_MODEL`, `CITY_GUIDE_MODEL`) | Claude. |
| `SERPER_API_KEY` | Recherches Google (auto top-up activé). |
| `GEMINI_API_KEY` (+ `GEMINI_IMAGE_MODEL`) | Images de villes. |
| `CRON_SECRET` | Protège les crons. |
| `MATCH_DIGEST_TO`, `MATCH_MIN_CONTRIB`, `MATCH_PREMIUM_CONTRIB`, `MATCH_BATCH`, `MATCH_MAX_JUDGE` | Veille. |
| `ADMIN_USER`, `ADMIN_PASS` | Basic Auth admin. |
| `NEXT_PUBLIC_SITE_URL` | `https://reportlost.org` (⚠️ jamais localhost en prod — protégé par code). |
| `PEXELS_API_KEY`, `GOOGLE_VISION_API_KEY`, `PAYMENT_API_KEY`, `NEXT_PUBLIC_GA_ID` | Divers. |

---

## 12. Pannes connues et leçons apprises

- **Mails qui n'arrivent plus** → tester `/api/test-mail-direct?to=...` (chemin exact de save-report). Ne jamais réintroduire de fetch HTTP interne ni de fire & forget SMTP.
- **Page ville « ancienne » après publication** → cache ISR ; la publication revalide désormais ; un déploiement purge tout.
- **Moulinette infinie sur une page ville** → Overpass (carte commissariats) : plafonné à 5 s/miroir.
- **404 sur une ville** → noms à ponctuation ou suffixe recensement : résolution fuzzy en place.
- **Tests du formulaire** : changer email OU titre OU jour (empreinte journalière) ; le rid localStorage expire en 24 h.
- **Doublons support@** → une notification par dossier (à la capture de l'email).
- **`NEXT_PUBLIC_SITE_URL=127.0.0.1` copié en prod** → cassait les mails ; ignoré par code désormais.
- **Suppression de fichiers de guides** : `DELETE FROM city_guides WHERE verified = false;` remet les villes en file de génération.
