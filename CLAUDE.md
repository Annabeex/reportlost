# ReportLost.org — règles de travail

Ce fichier est lu automatiquement au début de chaque session. Il fixe la ligne
éditoriale et les critères de qualité du site. À relire avant toute proposition
de design, de texte ou de nouvelle page.

---

## 1. Registre : moderne, mais institutionnel

Le site est **très moderne dans sa forme** et **proche d'un site officiel dans
son ton**. On vend un service dont la valeur tient à son sérieux : un dépôt
auprès d'un service compétent, une attestation datée, une référence de dossier.
Tout ce qui sonne « boutique en ligne » détruit précisément cet actif.

**Interdit, sans exception :**

- l'urgence fabriquée — « the clock is ticking », « every minute counts »,
  « act now », « don't wait », « before it's too late » ;
- les arguments de vente empilés — « it takes 2 minutes », « it's free », « no
  account », « 100 % secure », trois bénéfices par écran ;
- les points d'exclamation, les félicitations (« Thanks! »), les superlatifs ;
- les promesses de résultat, les garanties de retrouver l'objet ;
- les statistiques non sourcées et les pourcentages inventés ;
- les murs de logos non légendés qui suggèrent des partenariats.

**Attendu à la place :**

- des phrases factuelles, vérifiables, au présent ;
- des références réelles : textes de loi cités, dates de dernière revue,
  numéros de dossier, montants exacts ;
- l'honnêteté sur ce que le service **ne fait pas** — c'est ce qui rend
  crédible ce qu'il fait ;
- un seul appel à l'action par écran, nommé par ce qu'il fait.

Le ton de référence : une administration bien conçue, pas une startup.

### Vocabulaire

- **Jamais « call » / « phone call »** pour décrire une action de ReportLost :
  tous les échanges se font par écrit. On écrit « contact ».
- Vocabulaire d'achat, pas de don : « payment », « purchase ». Jamais
  « contribution » côté client.
- Les stickers sont **à imprimer soi-même**, jamais expédiés.

---

## 2. Trois exigences permanentes

### Metrics — vert sur mobile ET bureau

Core Web Vitals au vert sur les deux profils. En pratique :

- rien qui se monte après le premier rendu sans hauteur réservée (CLS) ;
- pas de composant client lourd sur les pages à fort volume : les 31 000 pages
  villes ne doivent pas embarquer le formulaire complet ni Stripe ;
- images toujours avec `width`/`height` ou conteneur à hauteur fixe ;
- vérifier après chaque refonte d'un gabarit à fort volume.

### SEO et position des éléments

- Le contenu unique (règle légale de l'État, contacts locaux, signalements
  réels) est ce qui fait indexer les pages : il ne doit jamais être masqué ni
  déplacé hors écran.
- Chaque page doit avoir au moins un lien interne entrant suivable, un `<a href>`
  réel — pas une navigation en `router.push()`.
- Le point d'entrée de conversion est haut dans la page, et rattrapé plus bas
  sur les pages longues.
- Rien d'inventé dans les contenus générés : ni faux signalements, ni dates
  rafraîchies artificiellement.

### Cohérence avec les CGV

Toute promesse affichée quelque part doit exister à l'identique dans
`app/terms/page.tsx`. Les six livrables de l'Active search, la durée de veille,
la cadence des passages, le caractère non officiel de l'attestation : mêmes
mots, mêmes durées, mêmes montants. En cas de doute, les CGV font foi — et si
une page dit mieux, ce sont les CGV qu'il faut corriger, pas l'inverse.

---

## 3. Offres en vigueur

| Formule | Prix | Durée de veille | Portée |
|---|---|---|---|
| Free listing | 0 $ | — | Publication seule |
| Automatic search | 12 $ | 6 mois | Veille + attestation + stickers. **Proposée uniquement en rattrapage**, après le refus de l'Active search. Jamais en alternative à l'achat. |
| Active search | 25 $ | 12 mois | Les six livrables |
| Pet Priority | 25 $ | 12 mois | Active search appliquée aux animaux |

---

## 4. Méthode de travail

- **Montrer une maquette avant de pousser** dès qu'un rendu visuel change.
- Vérifier le fichier après une modification automatisée, pas seulement qu'il
  compile : du code dupliqué compile très bien.
- Ne jamais lancer de commande git via le pont d'accès aux fichiers (corruption
  d'index constatée). Les commandes git sont données à l'utilisatrice, une par
  ligne, sans commentaire en fin de ligne (zsh interactif ne traite pas `#`).
- Les migrations SQL sont livrées en fichier `.sql` à la racine et signalées
  comme à lancer **avant** le déploiement.
- `.env` et `.env.local` ne sont jamais versionnés.
