# Canada launch — structure d'URL (prêt « à froid »)

But : préparer le lancement Canada **sans casser le SEO US existant** et sans acheter de ccTLD
(reportlost.ca est interdit sans présence canadienne). Un seul domaine, `reportlost.org`,
avec le Canada en sous-répertoires de locale. Australie plus tard, même patron.

---

## 1. Principe : 2 axes, pas 1

- **Langue** = axe du haut → préfixe de locale : `/en-ca/`, `/fr-ca/` (plus tard `/en-au/`, `/en-gb/`).
- **Géo** = en dessous → province sur 2 lettres (ON, QC, BC…), puis ville.

⚠️ On n'utilise **pas** `/qc` comme un frère de `/ca`. Le Québec est une province, pas une langue.
Le français est une locale (`fr-ca`) qui couvre QC **et** les francophones hors-Québec.

Les codes de locale sont en BCP-47 (`en-ca`, `fr-ca`) → ils se mappent 1:1 sur les balises `hreflang`.

---

## 2. Schéma d'URL retenu

| Marché | Motif d'URL | Exemple |
|---|---|---|
| **US (existant — NE PAS TOUCHER)** | `/lost-and-found/{state}/{city}` | `/lost-and-found/ny/new-york` |
| **Canada — anglais** | `/en-ca/lost-and-found/{province}/{city}` | `/en-ca/lost-and-found/on/toronto` |
| **Canada — français** | `/fr-ca/lost-and-found/{province}/{ville}` | `/fr-ca/lost-and-found/qc/montreal` |
| Catégories CA (EN) | `/en-ca/lost-and-found/category/{category}` | `/en-ca/lost-and-found/category/wallet` |
| Catégories CA (FR) | `/fr-ca/lost-and-found/category/{categorie}` | `/fr-ca/lost-and-found/category/portefeuille` |

Redirections 301 de confort :
- `/ca`  → `/en-ca`
- `/ca/*` → `/en-ca/*`
- (défensif) `reportlost.com/*` → `reportlost.org/*`

Le **US reste à la racine, sans préfixe** = c'est le `x-default` / `en-us`. On ne rétro-préfixe
jamais des URLs déjà indexées : on perdrait le référencement acquis pour rien.

---

## 3. Arborescence Next.js à créer

On garde des **dossiers statiques** `en-ca/` et `fr-ca/` (surtout PAS un `[locale]` dynamique à la
racine de `app/`, qui capterait `/lost`, `/case`, etc. — piège classique du app-router).

```
app/
  lost-and-found/                      # US — inchangé
    [state]/[city]/page.tsx

  en-ca/
    lost-and-found/
      [province]/
        [city]/page.tsx
        generateStaticParams.ts
        generateMetadata.ts
      [province]/page.tsx
      category/[category]/page.tsx
  fr-ca/
    lost-and-found/
      [province]/
        [city]/page.tsx
        generateStaticParams.ts
        generateMetadata.ts
      [province]/page.tsx
      category/[category]/page.tsx
```

Anti-duplication de code : factorise la vraie page dans un composant partagé
`components/LostAndFoundCityPage.tsx` qui prend une prop `locale: 'en-ca' | 'fr-ca'` et
`country: 'CA'`. Les deux `page.tsx` (en-ca / fr-ca) ne font que l'importer avec la bonne locale.
Idem pour la logique de données US → paramétrer par pays plutôt que copier.

---

## 4. Provinces (ISO 3166-2:CA) — à ajouter

```ts
// app/en-ca/lost-and-found/[province]/generateStaticParams.ts
export const caProvinces = [
  'AB','BC','MB','NB','NL','NS','NT','NU','ON','PE','QC','SK','YT',
];
export function generateStaticParams() {
  return caProvinces.map(p => ({ province: p.toLowerCase() }));
}
```

Libellés pour l'affichage / le contenu :

| Code | Anglais | Français |
|---|---|---|
| AB | Alberta | Alberta |
| BC | British Columbia | Colombie-Britannique |
| MB | Manitoba | Manitoba |
| NB | New Brunswick | Nouveau-Brunswick |
| NL | Newfoundland and Labrador | Terre-Neuve-et-Labrador |
| NS | Nova Scotia | Nouvelle-Écosse |
| NT | Northwest Territories | Territoires du Nord-Ouest |
| NU | Nunavut | Nunavut |
| ON | Ontario | Ontario |
| PE | Prince Edward Island | Île-du-Prince-Édouard |
| QC | Quebec | Québec |
| SK | Saskatchewan | Saskatchewan |
| YT | Yukon | Yukon |

**Ordre de priorité SEO** (ne pas tout attaquer d'un coup) : ON, QC, BC, AB couvrent ~86 % de
la population. Seed les 13 dans la base « à froid », mais concentre le contenu/veille sur ces 4.

Villes de tête à seeder en premier :
- **ON** : Toronto, Ottawa, Mississauga, Hamilton, London, Brampton
- **QC** : Montréal, Québec, Laval, Gatineau, Longueuil
- **BC** : Vancouver, Victoria, Surrey, Burnaby
- **AB** : Calgary, Edmonton

---

## 5. hreflang + canonical (obligatoire pour le bilingue)

Sur **chaque** page canadienne, déclarer le cluster de langue. Exemple pour Montréal :

```html
<link rel="alternate" hreflang="en-ca" href="https://reportlost.org/en-ca/lost-and-found/qc/montreal" />
<link rel="alternate" hreflang="fr-ca" href="https://reportlost.org/fr-ca/lost-and-found/qc/montreal" />
<link rel="alternate" hreflang="x-default" href="https://reportlost.org/en-ca/lost-and-found/qc/montreal" />
<link rel="canonical" href="https://reportlost.org/fr-ca/lost-and-found/qc/montreal" />
```

Règles :
- `canonical` = l'URL de la page elle-même (self-canonical), jamais l'autre langue.
- Toute page anglaise pointe sa jumelle française et vice-versa. Pas de jumelle = pas de hreflang.
- `x-default` du cluster canadien = la version **en-ca**.
- Le slug de ville reste identique EN/FR (`montreal`) pour simplifier l'appariement ; les
  accents restent dans le **contenu**, pas dans l'URL.

À gérer dans `generateMetadata.ts` (Next.js `alternates.languages`).

---

## 6. Sitemap & robots

- Sitemaps séparés par locale : `/sitemap-en-ca.xml`, `/sitemap-fr-ca.xml` (garder `/sitemap.xml` US).
- Index de sitemaps qui les référence tous les trois.
- Chaque entrée de sitemap peut aussi porter ses `xhtml:link` hreflang (recommandé Google).
- `robots.txt` : autoriser `/en-ca/` et `/fr-ca/`, garder l'admin bloqué.

---

## 7. Checklist « prêt à froid » (à faire maintenant, lancer plus tard)

- [ ] Acheter **reportlost.com** en redirection 301 défensive vers `.org` (ne PAS acheter .ca / .com.au).
- [ ] Sourcer la base villes CA au **même format** que la base US actuelle (province, ville, slug, pop.).
- [ ] Ajouter `caProvinces` + libellés EN/FR (tableau §4).
- [ ] Créer les dossiers `app/en-ca/` et `app/fr-ca/` (routes fantômes, `noindex` tant que le contenu n'est pas prêt).
- [ ] Factoriser la page ville en composant partagé paramétré par `locale` / `country`.
- [ ] Générer les guides EN pour ON/BC/AB (réutilise les prompts US mot pour mot).
- [ ] Générer les guides FR pour QC (atout : savoir-faire francophone du partenaire).
- [ ] Câbler hreflang + canonical + sitemaps par locale.
- [ ] Garder tout en `noindex` jusqu'au signal de lancement.

**Signal de déclenchement** (rappel stratégie) : n'ouvre l'indexation Canada que quand le US a
validé la mécanique — ex. « 3 mois consécutifs de croissance des payants ». D'ici là, le Canada
dort, prêt, sans diviser ton attention.
