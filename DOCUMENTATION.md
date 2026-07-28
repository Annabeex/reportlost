# 📘 ReportLost.org — Documentation technique

> **Comment maintenir ce document** : après chaque chantier, demander à l'assistant « mets à jour DOCUMENTATION.md avec ce qu'on vient de faire ». Dernière mise à jour : **28 juillet 2026**.

---

## Sommaire

1. [Vue d'ensemble](#1-vue-densemble)
2. [Pages publiques](#2-pages-publiques)
3. [Pages admin](#3-pages-admin)
4. [Portail établissements](#4-portail-établissements)
5. [Routes API](#5-routes-api)
6. [Automatisations](#6-automatisations)
7. [Circuit des emails](#7-circuit-des-emails)
8. [Base de données (Supabase)](#8-base-de-données-supabase)
9. [Prompts IA et règles éditoriales](#9-prompts-ia-et-règles-éditoriales)
10. [Scripts locaux](#10-scripts-locaux)
11. [SEO](#11-seo)
12. [Variables d'environnement](#12-variables-denvironnement)
13. [Pannes connues et leçons apprises](#13-pannes-connues-et-leçons-apprises)

---

## 1. Vue d'ensemble

**Stack** : Next.js 14 (App Router) sur Vercel · Supabase (base + storage + **auth du portail établissements**) · Stripe (paiements uniques, jamais d'abonnement) · Zoho Mail (`support@reportlost.org`) · Mailgun (entrants `*@scan.reportlost.org`) · FreeScout auto-hébergé (inbox.pas-bete.com) · Serper (recherches Google, **auto top-up à vérifier coché**) · Anthropic Claude · Gemini (images de villes) · sharp (compression images, dégradés PDF).

**Le produit** : signalement d'objet/animal perdu ; publication gratuite, accompagnement payant (12 $ Extended 6 mois / 25 $ Maximum 12 mois + stickers + vérification humaine / 30 $ Pet Priority 12 mois ; contribution libre ≥ 12 $ = Extended). Formulation client : « your report stays active, searching for a match » — jamais « plan » ni « monitors the web for months ». Nouveau volet B2B : portail gratuit de gestion d'objets trouvés pour établissements (cf. §4).

**Arborescence** : `app/` pages+API · `components/` · `lib/` · `scripts/` (node local) · `public/` · `*.sql` (migrations à exécuter dans Supabase) · `vercel.json` (crons).

---

## 2. Pages publiques

| Route | Rôle |
|---|---|
| `/` | Accueil. Catégories pondérées conversion (wallet, purse, ring, bracelet, phone, cat, dog en tête). |
| `/report` | Formulaire principal. Étapes : description → **lieu (pilote le transport : choisir Airplane/Train station/Subway… ouvre les détails ; lien discret taxi/Uber)** → contact (prénom/nom/email seulement) → What's next → offres → paiement → **écran post-paiement qui collecte téléphone/adresse/date de naissance (payés uniquement)**. Barre de progression, validations inline (plus d'alert()), scroll fiable aux transitions (jamais à l'arrivée sur la page), bouton photo custom. Entonnoir tracké (`form_view/step1_done/step2_done/contribution_view/completed_free`). |
| `/report-lost-pet` | Formulaire animaux (petMode, Pet Priority 30 $). La catégorie envoyée par le formulaire devient `primary_category`. |
| `/lost-item-recovery-assistance-usa` | Page canonique de l'offre (JSON-LD Service/Offer/FAQ). Mention « one-time payments, never a subscription ». |
| `/lost-pet-poster` | Générateur d'affiche gratuit (client-side). |
| `/lost-and-found/[state]` | **Hub État** : vignettes 6 villes populaires → **guide juridique de l'État** (si présent dans `lib/stateGuides.ts` : lois vérifiées, cartes ⚖️🕒🚔, CTA formulaire, FAQ accordéons + JSON-LD FAQPage, title/meta dédiés) → liste de toutes les villes couvertes (guides publiés, lien interne par guide). Revalidée à chaque publication de guide. |
| `/lost-and-found/[state]/[city]` | Page ville ISR 24 h. **Tout le contenu est rendu serveur** (ne JAMAIS repasser `CityLostFormBlock` en ssr:false). Commissariats chargés côté navigateur via `/api/police-stations` (cache permanent en base + CDN 7 j) : plus aucun appel externe au rendu. Signalements récents réels cliquables (`ilike city%` car le formulaire stocke « Tucson (AZ) »), complétés d'exemples pondérés conversion. Metas title/meta **écrasés à chaque publication** de guide. |
| `/lost-and-found/category/[category]` | Catégories, ISR 1 h (`fresh:false`). Cartes Lost : lien vers le post réel (plus de mailto) ; cartes Found : contact par email. |
| `/lost/[slug]` | Page publique d'un signalement (ISR 1 h). |
| `/case/[public_id]` | Compte rendu client, **noindex total**, accès par jeton `?t=` uniquement. Intro personnalisée (prénom + objet) + « Last updated » + bloc final « next update around J+14 » + rappel réponse par email. `?edit=1` = éditeur (Basic Auth). |
| `/o/[slug]` | (Phase 1b, à venir) page publique d'un établissement. |
| `/org/*` | Portail établissements (cf. §4). |
| `/en-ca` | Brouillon Canada (noindex, canonical self). |
| Pages dev (`/dashboardmodule`, `/dev-reportcontribution`, `/vision-tester`, `/scan-demo`, `/poster-preview`) | **Derrière Basic Auth** (middleware). |

`/terms` et `/privacy` sont alignés sur l'offre réelle : 3 formules chiffrées, durées 6/12 mois, paiement unique, police « where accepted », sous-traitants nommés, rétention 24 mois, ligne CCPA.

---

## 3. Pages admin

Basic Auth (middleware) sur `/admin/*`, `/api/admin/*`, `/api/case_followup/*`, pages dev.

| Route | Rôle |
|---|---|
| `/admin` | **Refonte 07/2026** : stats en 3 cartes (Activité : lost/found/payés/TC/gratuits · Production : guides/groupes FB/posters en totaux · Visites 7 j : organique/social/IA/direct) ; onglets Lost/Found + pastilles de filtre (💳 Payés, Gratuits, ✉️ Sans follow-up = payés sans compte rendu envoyé, 🚩 1ʳᵉ ville) + recherche ; **lignes compactes dépliables** (icône catégorie/photo, badges, gratuits estompés). Panneau déplié : infos + circonstances + **coordonnées client éditables** (tél, adresse, 🎂 date de naissance, 🔒 détail privé → `/api/admin/update-report`) + bloc Veille IA (statut, exclure/forcer, recherche en ligne) + actions réduites (Contribution, 🗑, 📸, Kit FB, View post, catégories). Bouton principal : 🗂️ Ouvrir le dossier. |
| `/admin/case/[id]` | Dossier : date de perte en double format (`2026-07-01 (1 July 2026)`), circonstances affichées, boutons **📋 Compte rendu** (édition), **👁 Vue client** (lien tokenisé exact), **🏷️ Stickers PDF**, **⏸/▶️ veille**. Assistant IA : notes lues en entier (5 000 car.), deux modèles de mail établissement (A public générique « Dear Sir or Madam » + demande de transfert ; B lieux fréquentés, chaleureux, valeur **sentimentale** sans jamais de valeur monétaire ni récompense, relais uniquement), mail initial = police+mairie d'office + ajouts attestés par le dossier + **les notes sont des consignes** (info manquante → demande polie au client). |
| `/admin/city-guides` | Générateur de guides ville (compteurs, tableau top 6000, vérification). |
| `/admin/group-kit` | Kit FB. Posts FOUND : 2 objets + 1 animal max (priorité wallet/bag/phone/keys), requêtes élargies + repli sur le mois, **encart de diagnostic** si aucun FOUND (clé absente / Serper muet = crédits / prompt). Lien ville garanti dans description et post épinglé (vérification + réparation auto). Variation réelle : tirages ton × ouverture × structure. |
| `/admin/poster/[id]` | Image sociale WANTED (cadre dégradé complet, plus de coin blanc). |

---

## 4. Portail établissements

**Phase 1a en production** (07/2026). Objectif : gestion gratuite des objets trouvés pour police, mairies, universités, hôtels… ; page publique et matching en phases 1b/2 ; gratuité police/mairies assumée (coût marginal ~centimes), monétisation ultérieure par fonctionnalités ajoutées (jamais retirées).

- **Auth** : Supabase Auth email+mot de passe (`lib/supabaseBrowser`, sessions persistantes — distinct de `lib/supabaseClient` persistSession:false des formulaires publics). Réglage Supabase requis : Site URL = `https://reportlost.org` + redirect `/org/login`.
- **Pages** : `/org/login` (connexion/inscription) → `/org/onboarding` (création de l'organisation, statut « à vérifier ») → `/org/dashboard` (4 compteurs, filtres statut, recherche, compte à rebours légal ambré < 7 j, changement de statut) → `/org/items/new` (enregistrement 30 s, photo, référence F-#### auto, **date limite légale calculée par État** via `lib/legalHolding.ts` dérivé des guides États : AZ 30 j, WA 60, CA/FL/NY 90, IL 180, défaut 90).
- **API** `/api/org/*` (me, create, items GET/POST, items/[id] PATCH) : session Bearer vérifiée (`lib/orgAuth.getOrgContext`) + appartenance à l'organisation ; service role côté serveur. Chaque transition de statut alimente `org_item_events` (registre d'audit).
- **À venir** : 1b page publique `/o/[slug]` + réclamation « I think it's mine » ; 1c onglet admin « Organisations » (validation manuelle avant page publique) ; phase 2 matching inventaire ↔ signalements perdus.

---

## 5. Routes API

### Cœur du produit
| Route | Rôle |
|---|---|
| `POST /api/save-report` | Enregistre/actualise. Empreinte journalière anti-doublon, reprise par `rid`. Accepte `category` (converti en `primary_category` — le formulaire pet envoie « pets »). Mail « brouillon » réécrit : objet « One last step to activate your search », sans le mot draft, sans mention du gratuit, « one-time payment, never a subscription », CTA « Activate my search ». |
| `POST /api/public/send-publication-email` | Mail post-dépôt **gratuit** (le vrai — l'ancien texte côté client est mort) : contraste honnête « a free listing waits / that's what an assisted search adds », SMTP direct (`sendMailDirect`), flag `mail_sent`. |
| `POST /api/stripe-webhook`, `create-payment-intent`, `inbound-email`, `send-mail` | Inchangés (cf. §7). |
| `GET /api/police-stations` | Commissariats Overpass **hors rendu** : cache permanent `us_cities.police_stations` (refresh 180 j) + CDN 7 j. |
| `POST /api/track` | Compteurs anonymes : poster_png/pdf, `visit_*` (organic/social/ai/direct/referral, via `components/VisitTracker`), `form_*` (entonnoir). |

### Dossiers (admin)
| Route | Rôle |
|---|---|
| `case-data` | Contexte complet (+ circonstances, case_token, private_detail, birth_date). |
| `case-chat` | Assistant (règles §9). |
| `case-places` | « Qui contacter » : publics d'abord (police, mairie) puis 1-2 lieux cités dans les **circonstances** (source prioritaire) + ville voisine. **Crée automatiquement les fiches `case_establishments`** (ENTITIES_JSON : nom, email, url, 📍 adresse, 📞 tél, rôle EN ANGLAIS) sans doublon. Deux brouillons de mail (A/B). Sauvegarde en note (sans le bloc machine). |
| `case-send`, `case-note`, `case-establishment`, `case-message-delete`, `update-report` | Envois, notes, établissements, suppression, **édition des coordonnées client** (allowlist stricte). |
| `list` | Liste admin + totaux (production guides/FB/posters, visites 7 j par provenance). |

### Guides ville (admin)
| Route | Rôle |
|---|---|
| `city-guide-generate` | 6 recherches Serper → **refus si zéro résultat** (garde anti-guides dégradés) → rédaction → photo Gemini une seule fois par ville (sautée si image IA existante) **compressée WebP 1200px q80** → publication + revalidation ville **et État** + **title/meta toujours écrasés**. |
| `city-guide` | Liste de travail : villes paginées **avec tri stable (population, id)** et carte des guides **paginée sans plafond 1000** (deux bugs coûteux, cf. §13). |

### Compte rendu
`GET/PUT /api/case_followup/[public_id]` (blocs + `case_followup_updated_at` à chaque sauvegarde) · `/notes` · **`/dossier`** (établissements + pistes veille filtrées yes/maybe + compteur total, pour le pré-remplissage).

### Portail org
Cf. §4. Divers : `/api/sticker-sheet` (**route canonique** de la planche, design « piste B » : bandeaux dégradés rendus par sharp, QR vert foncé `qrcode`, textes Helvetica natifs ; `/api/qr-sheet` = simple redirection) · `/api/banner` · `/api/poster/[id]` · `/api/og/*` · etc.

---

## 6. Automatisations

### Veille (crons Vercel)
- 7h UTC `/api/match-watch` : payés (+ forcés), cadence quotidienne (7 j) → hebdo (30 j) → mensuelle ; 180 j / 365 j (≥ 25 $). 2 requêtes Serper/passage (+2 si repli lieu), 5 candidats jugés max (Haiku). Coût ≈ 0,5 centime/passage, ~0,10-0,15 $/dossier à vie. **Chaque passage rafraîchit `case_followup_updated_at`** (le « Last updated » client vit tout seul).
- 8h30 UTC `/api/match-digest` : digest vers `veille@`.

### Guides ville
`node scripts/generate-city-guides-batch.mjs 500` — protections empilées : **verrou anti-parallèle** (`/tmp/reportlost-batch.lock`), **re-vérification ville par ville** avant génération (⏭️ si déjà publié), retry 529/429 (30/60/90 s), retry réseau, refus serveur si Serper muet. Un seul batch à la fois, `nohup … >> batch.log` conseillé. Reste ~4 500 villes ≈ 250 $ Anthropic + 35 $ Serper.

### Guides États
`node scripts/generate-state-guides.mjs` (5 par défaut, `--state=XX`) : Serper (4 requêtes juridiques) + **Sonnet** (`STATE_GUIDE_MODEL`), interdiction d'inventer un statut/délai/montant absent des résultats, motif « no statewide statute » sinon. Écrit `lib/stateGuidesGenerated.json` — **RELECTURE OBLIGATOIRE avant commit** (contenu juridique). Les 10 entrées écrites main dans `lib/stateGuides.ts` (CA NY WA FL TX AZ PA IL OH GA, sources en commentaire) ont toujours priorité.

### Compte rendu client
À l'ouverture de l'éditeur : modèle auto-inséré si vide, section établissements synchronisée avec les fiches du dossier (nom + notes 📍📞 rôle, **jamais d'email côté client, tout en anglais**), encart « AI Match Watch — Leads Reviewed » actualisé (pistes yes/maybe détaillées, rejets comptés seulement), visuel WANTED injecté dans la section Social (`IMAGE:/api/poster/{id}` — les blocs savent afficher des images). Ordre du modèle : Local notifications d'abord, Database searches ensuite (sans liste de bases exemple).

---

## 7. Circuit des emails

Inchangé dans sa mécanique (SMTP direct `lib/mailer`, Mailgun entrant, FreeScout, relais `item{id}@reportlost.org`, Reply-To tracké `{public_id}@scan`). Évolutions de contenu : les trois mails du tunnel (brouillon, publication gratuite, confirmation) parlent « activation », « search period », « one-time payment, never a subscription » ; l'email personnel du client n'est transmissible qu'aux **organismes publics** (police, mairie, animal control), les établissements privés reçoivent l'adresse relais.

⚠️ Règles intangibles : jamais de fetch HTTP interne pour un mail, jamais de fire & forget SMTP, toujours `await sendMailDirect`.

---

## 8. Base de données (Supabase)

| Table | Rôle / colonnes récentes |
|---|---|
| `lost_items` | + `case_token` (accès page client), `private_detail` (jamais publié), `birth_date` (dépôts police), `circumstances`, `case_followup_updated_at`. |
| `found_items` | Dépôts publics **et inventaire des établissements** : + `org_id`, `org_ref`, `storage_location`, `status` (stored/claim_pending/returned/disposed), `legal_deadline`, `returned_at`. ⚠️ `labels/logos/objects/ocr_text` NOT NULL (fournir vides). |
| `organizations`, `org_members`, `org_item_events` | Portail établissements (§4). |
| `us_cities` | + `police_stations` (jsonb, cache Overpass), `police_stations_at`, `fb_group_done_at`. |
| `city_guides` | Guides ville (1 500+ publiés). |
| `events` | poster_*, visit_*, form_*. |
| `case_messages`, `case_establishments`, `match_candidates` | Inchangés (fiches établissements désormais créées par « qui contacter »). |

Storage : `city-images` (WebP ~100 Ko depuis la conversion sharp ; script de conversion du stock exécuté, 2,9 Go → ~200 Mo) · `images` (photos formulaires + `org_items/`). Migrations récentes : `case-token.sql`, `private-detail-birthdate.sql`, `fb-group-done-at.sql`, `police-stations-cache.sql`, `followup-updated-at.sql`, `org-portal-supabase.sql`.

---

## 9. Prompts IA et règles éditoriales

Règles transverses (tous les prompts) : pas de tirets de ponctuation ; jamais « reunite … with … » ni « connect people with their belongings » ; jamais « plan » ni vocabulaire d'abonnement côté client (« search period », « one-time payment ») ; formulation veille = « your report stays active, keeps searching for a match » (jamais « monitors the web for months ») ; exemples d'objets orientés conversion (wallet, purse, ring, bracelet, phone, cat, dog en priorité, keys/laptop occasionnels).

| Où | Spécificités |
|---|---|
| `city-guide-generate` | « Similaires mais différentes », modèle NYC, réalité locale, liens officiels uniquement, refus sans résultats Serper. |
| `case-chat` | Deux modèles de mail A/B (§3), mail initial fidèle au dossier, notes = consignes actives, détail privé jamais dans un mail. |
| `case-places` | Publics d'abord puis lieux des circonstances, ENTITIES_JSON (rôle en anglais), email-first, rien d'inventé. |
| `group-kit` | 2 objets + 1 animal max, lien garanti (réparation auto), diagnostic visible, variation ton×ouverture×structure. |
| `generate-state-guides` (script, Sonnet) | Interdiction absolue d'inventer du juridique ; relecture humaine obligatoire. |

---

## 10. Scripts locaux

| Script | Usage |
|---|---|
| `generate-city-guides-batch.mjs` | Campagne guides (protections §6). |
| `generate-state-guides.mjs` | Guides États restants (relecture obligatoire). |
| `purge-free-photos.mjs` | Supprime les photos des signalements gratuits > 30 j (simulation par défaut, `--apply`). |
| `optimize-city-images.mjs` | Conversion WebP du bucket city-images (déjà exécuté). |
| `fix-guides-plan-wording.mjs` | Correction du vocabulaire « plan » dans les guides (déjà exécuté, 515 corrigés). |
| `refresh-city-seo.mjs` | Régénère title/meta des villes enrichies depuis leur guide. **Volontairement non exécuté** (choix : garder les anciennes metas, seules les futures publications écrasent). |

Convention : simulation par défaut, `--apply` pour agir ; les blocs ```sql``` vont dans le SQL editor Supabase, les ```bash``` dans le terminal.

---

## 11. SEO

- **Sitemaps pilotés par la qualité** : `sitemap.xml` (index) → `sitemap-static.xml` (pages fixes, catégories, 51 États) + `sitemap-cities.xml` (**uniquement villes à guide publié** + 5 historiques, lastmod réel) + `sitemap-reports.xml` (signalements < 12 mois avec description ≥ 80 car.). `public/sitemap-1.xml` (31k URLs périmées) supprimé — le retirer aussi de GSC s'il y est soumis.
- **Maillage** : hubs États (liste des villes couvertes + guides juridiques), villes voisines, breadcrumbs. À faire : nearby cities enrichies d'abord, hubs catégorie, lien ville → guide État.
- **Performance = indexation** : les pages ville rendaient un HTML vide (ssr:false) avec 15 s de TTFB (Overpass) → corrigé (contenu serveur, LCP ~1-2 s, CLS réservé). C'était une cause majeure du « Crawled, not indexed ».
- **Metas** : title/meta écrasés à chaque publication de guide (les valeurs héritées des 31k pages étaient génériques/tronquées).
- **État GSC (28/07)** : 798 pages indexées (589 début juillet), impressions en forte hausse, position ~11 ; validation « Crawled, not indexed » relancée après correctifs. KPI : indexées / impressions / CTR par page / dépôts / TC.
- **Guides États** : contenu juridique unique par État (FAQ JSON-LD), requêtes « found property law {state} ». Idée en réserve : page nationale comparant les 51 fenêtres de réclamation (aimant à liens).

---

## 12. Variables d'environnement

| Variable | Rôle |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Supabase (l'anon key sert aussi à l'auth du portail org). |
| `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` | Stripe. |
| `ZOHO_USER`, `ZOHO_PASS` (ou `SMTP_*`) | SMTP Zoho (support@). |
| `MAILGUN_SIGNING_KEY` | Webhook entrant. |
| `MAIL_API_KEY`, `MAIL_ALLOWED_ORIGINS`, `MAIL_RATE_LIMIT_PER_HOUR` | `/api/send-mail`. |
| `ANTHROPIC_API_KEY` (+ `ANTHROPIC_MODEL`, `CASE_CHAT_MODEL`, `CITY_GUIDE_MODEL`, `STATE_GUIDE_MODEL`) | Claude (guides États : Sonnet par défaut). |
| `SERPER_API_KEY` | Recherches Google. ⚠️ **Vérifier que l'auto top-up est réellement coché** sur serper.dev : une panne de crédits est silencieuse (veille aveugle, kits sans FOUND, guides dégradés). |
| `GEMINI_API_KEY` (+ `GEMINI_IMAGE_MODEL`) | Images de villes (1 image par ville, WebP). |
| `CRON_SECRET` | Crons. |
| `MATCH_DIGEST_TO`, `MATCH_MIN_CONTRIB`, `MATCH_PREMIUM_CONTRIB`, `MATCH_BATCH`, `MATCH_MAX_JUDGE` | Veille. |
| `ADMIN_USER`, `ADMIN_PASS` | Basic Auth admin (lus aussi par les scripts locaux). |
| `NEXT_PUBLIC_SITE_URL` | `https://reportlost.org` (jamais localhost en prod). |
| `PEXELS_API_KEY`, `GOOGLE_VISION_API_KEY`, `PAYMENT_API_KEY`, `NEXT_PUBLIC_GA_ID` | Divers. |

Réglage hors variables : Supabase Auth → URL Configuration → Site URL `https://reportlost.org` + redirect `/org/login` (portail établissements).

---

## 13. Pannes connues et leçons apprises

- **Plafond Supabase 1 000 lignes** : nous a piégés **deux fois** (pagination des villes, puis carte des guides → les batchs régénéraient en boucle ~500 villes déjà faites). Toute requête susceptible de dépasser 1 000 lignes DOIT être paginée avec un tri stable (`.order(...)` + `id`).
- **Crédits Serper épuisés en silence** : auto top-up jamais coché → veille aveugle, kits sans FOUND, et un batch de guides **dégradés générés sans données** (210 villes supprimées et refaites). Garde-fous en place : refus de génération sans résultats, diagnostic visible dans le kit. Les Activity logs serper.dev datent une panne à la seconde.
- **Batchs parallèles** : nohup rend la main immédiatement → doublons coûteux. Verrou + re-vérification en place ; un seul batch à la fois.
- **ssr:false sur un bloc qui contient toute la page** : HTML vide pour Google + CLS 0,9. Ne jamais désactiver le SSR d'un conteneur de contenu.
- **Deux routes pour un même besoin** (`qr-sheet`/`sticker-sheet`) : on a redessiné la mauvaise. Vérifier `grep` des liens avant de modifier une route.
- **Dates US** : l'admin affiche désormais les deux formats ; ne jamais mettre de date de naissance inventée dans un dépôt police (demander au client, une ligne dans le mail de suivi).
- **Le mot « draft »** dans un mail client = les gens cherchent une rubrique Brouillons. « Plan » = abonnement. Vocabulaire à surveiller à chaque nouveau texte.
- **Champ SQL NOT NULL hérité** (`found_items.labels` etc.) : fournir des valeurs vides quand on greffe un nouveau flux sur une table existante.
- Historique conservé : mails (fetch interne/fire&forget interdits), ISR (revalidation au publish, `fresh:false`), Overpass 5 s/miroir (désormais hors rendu), fuzzy villes à ponctuation, empreinte journalière des tests formulaire, `NEXT_PUBLIC_SITE_URL` jamais localhost.
