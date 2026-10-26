# Canada — architecture retenue

Décision du 26 octobre 2026. Remplace le plan de juillet 2026 (`/en-ca/`, `/fr-ca/`),
abandonné. Brief complet : projet Claude « Reportlost.org canada + Australie »,
`brief-international-canada.md`.

---

## 1. Un seul domaine, un sous-dossier par pays

- `reportlost.org/ca/` : hérite directement de l'autorité du domaine.
- Pas de sous-domaine, pas de `.ca`. Le registre `.ca` (CIRA) exige une présence
  au Canada, donc cette option est écartée de toute façon.
- **Les États-Unis restent à la racine, sans migration.** Le schéma est
  volontairement asymétrique : US à la racine, `/ca/` pour le Canada, `/au/` plus tard.
- Un seul préfixe `/ca/` pour les deux langues permet d'avoir **une seule
  propriété Search Console « Canada »**, celle qui sert à mesurer la porte de la phase 4.

## 2. Plan d'URL (pas de slash final, comme le reste du site)

```
/ca                              hub Canada, anglais
/ca/fr                           hub Canada, français
/ca/<province>                   ex. /ca/on
/ca/<province>/<city>            ex. /ca/on/toronto
/ca/fr/<province>                ex. /ca/fr/qc
/ca/fr/<province>/<ville>        ex. /ca/fr/qc/montreal
/ca/category/<category>          catégories, anglais
/ca/fr/categorie/<categorie>     catégories, français
/ca/found/<province>             « I found something », par PROVINCE (voir §4)
/ca/fr/trouve/<province>         « J'ai trouvé un objet », par PROVINCE
/lost/<slug>                     signalements : restent globaux
```

- Le slug de ville est identique en EN et en FR (`montreal`). Les accents vont
  dans le contenu, pas dans l'URL. Le slug passe par `toCaSlug()` (lib/canada/canadaData.ts).
- `/en-ca` et `/en-ca/*` sont redirigés en 301 vers `/ca` (ancien brouillon jamais indexé).
- Croisement ville × catégorie : pas avant la phase 5.

## 3. hreflang et canonique

- Toujours via `caBilingualAlternates()` (lib/canada/canadaData.ts) : canonique
  auto-référente, paires `en-CA` / `fr-CA` réciproques, `x-default` = version anglaise.
- Une page sans jumelle n'a **pas** de hreflang.
- Le groupe canadien ne déclare pas de hreflang vers les pages US, et la page
  d'accueil US n'est pas modifiée.
- Limite connue : `<html lang="en">` est fixé dans app/layout.tsx. Les pages
  françaises posent `lang="fr-CA"` sur leur conteneur. Google détecte la langue
  à partir du contenu et du hreflang, pas de l'attribut `lang`.
- **À traiter avant la phase 3** : la Navbar et le Footer sont en anglais sur
  les pages `/ca/fr`.

## 4. Branche « trouvé » : par province, pas par ville (proposé, à confirmer)

En Ontario, une page « trouvé » par ville reprendrait les contacts du guide de
la ville (police, transport), ce qui donnerait des quasi-doublons. Le cadre légal,
lui, dépend de la province. Donc :

- chaque guide de ville contient une section « Found something? » ;
- une page « trouvé » par province porte le cadre légal (`/ca/found/on`,
  `/ca/fr/trouve/qc`, cette dernière autour de l'art. 942 C.c.Q.) ;
- des pages par ville seulement si la Search Console montre des requêtes
  « found… » sur les guides.

## 5. Données : le Canada est isolé du corpus US

| Table | Rôle |
|---|---|
| `ca_cities` | villes CA (+ `city_fr`, `region`) |
| `ca_city_pois` | organismes par ville (police, transport, aéroport…) |
| `ca_city_guides` | guides CA, **un par ville et par langue**, clé `(province_id, city_ascii, lang)` |
| `lost_items.country` | `US` par défaut, `CA` pour un signalement canadien |

**Ne jamais insérer un guide canadien dans `city_guides`.** `sitemap-cities.xml`
déclarerait alors `/lost-and-found/on/toronto` (404) dans le sitemap US. Les
lecteurs US de `city_guides` (sitemap, pages ville/État, comtés, admin, scripts
d'audit) ne filtrent pas par pays.

`ca_city_guides` interdit par contrainte les espaces parasites et les majuscules
dans `province_id` / `city_ascii`.

Migration : `canada-phase1.sql` (à lancer avant le déploiement).

## 6. Sitemap

- `sitemap-ca.xml` : vide en phase 1. Ensuite, il ne contient QUE les guides
  publiés de `ca_city_guides`, avec leurs `xhtml:link` hreflang.
- Déclaré dans `public/sitemap.xml`.

## 7. Règle d'indexation (proposée)

Pas de seuil de population au Canada : **une ville n'est indexable que si son
guide est publié.**

## 8. État des phases

- [x] Phase 1 : architecture, migration, routage `/ca` + `/ca/fr` (2 pages de test noindex), sitemap vide
- [ ] Phase 1 : charger `ca_cities` depuis Statistique Canada
- [ ] Porte : pages US vérifiées intactes après le déploiement
- [ ] Phase 2 : Ontario, 10 villes
