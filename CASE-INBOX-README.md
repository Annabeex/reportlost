# Dossiers : conversations groupées + assistant IA (case-inbox)

Chaque signalement a désormais une **page dossier** dans l'admin : tous les échanges email
(clients, établissements lost & found) groupés au même endroit, un **chat Claude** qui connaît
tout le contexte, et un composeur avec **validation manuelle avant envoi**.

## Ce qui a été ajouté

- `case-inbox-supabase.sql` — table `case_messages` (migration à exécuter).
- `app/api/admin/case-data/route.ts` — contexte complet d'un dossier (signalement + messages + veille).
- `app/api/admin/case-send/route.ts` — envoi SMTP Zoho avec `Reply-To: 12345@scan.reportlost.org`.
- `app/api/admin/case-chat/route.ts` — chat Claude avec le contexte du dossier.
- `app/admin/case/[id]/page.tsx` — page dossier (timeline + chat + composeur).
- `app/api/inbound-email/route.ts` — modifié : chaque mail entrant est archivé dans `case_messages`.
- `app/admin/page.tsx` — modifié : bouton « 🗂️ Dossier » sur chaque signalement.

## Installation (2 étapes)

1. **Base** : exécute `case-inbox-supabase.sql` dans le SQL editor de Supabase.
2. **Déploie** (`git push`). Aucune nouvelle variable d'environnement obligatoire
   (réutilise `ZOHO_*`, `ANTHROPIC_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).
   Optionnel : `CASE_CHAT_MODEL` pour un modèle plus costaud que celui de la veille
   (défaut : `ANTHROPIC_MODEL` ou `claude-haiku-4-5`).

## Comment ça marche

### Groupage des conversations
- Tout mail envoyé depuis la page dossier part avec `Reply-To: <public_id>@scan.reportlost.org`.
  Quand le destinataire répond, la réponse passe par le webhook Mailgun existant
  (`/api/inbound-email`) qui la rattache automatiquement au bon dossier.
- Les mails spontanés (envoyés directement à support@ ou à un alias non tracké) sont rattachés
  par l'adresse email de l'expéditeur si elle correspond à un signalement.
- L'archivage est **non bloquant** : le relais QR existant continue de fonctionner même si
  l'archivage échoue.

### L'assistant du dossier
Le chat reçoit en contexte : le signalement complet, l'historique des échanges (60 derniers),
et les pistes yes/maybe de la veille automatique. Tu discutes en français ; il rédige les
brouillons d'emails en anglais (règle modifiable dans le `SYSTEM` de `case-chat/route.ts`).
Quand il propose un mail, il l'encadre avec `SUBJECT:` + `<<<EMAIL … EMAIL>>>` → le bouton
« ✉️ Utiliser cette réponse » remplit le composeur. Tu relis, modifies, puis « Valider &
envoyer ». **Rien ne part sans ton clic.**

## Utilisation

Admin → liste des signalements → bouton « 🗂️ Dossier » (ou `/admin/case/<id>` directement).

Exemples de consignes au chat : « résume le dossier », « réponds au client, il demande où on
en est », « prépare un mail pour le lost & found de l'aéroport JFK », « plus chaleureux et
propose un geste commercial », « traduis en espagnol ».

## Archivage des mails support@ (FreeScout / Zoho)

Les mails envoyés/reçus via support@ (hors adresses trackées) sont capturés via
**archive@scan.reportlost.org** :

- Le webhook traite tout mail reçu sur cette adresse en archivage pur (aucun relais) et le
  rattache au dossier en cherchant l'ID dans le sujet puis le corps — formats reconnus :
  `#12345`, `case 12345`, `dossier #12345`, `ID: 12345`. À défaut, rattachement par
  l'adresse du correspondant (client connu).
- **Convention à adopter : mets toujours `#12345` dans le SUJET** des mails aux
  établissements → les réponses (« Re: … ») sont rattachées automatiquement.

Configuration :

1. **Mailgun** : vérifier que la route scan.reportlost.org attrape aussi `archive@`
   (une route catch-all `.*@scan.reportlost.org` suffit).
2. **FreeScout** (mailbox clients) : réglages de la mailbox → champ **Auto Bcc** →
   `archive@scan.reportlost.org` → chaque réponse envoyée depuis FreeScout est archivée.
3. **Zoho** (optionnel, pour les mails entrants sur support@) : Paramètres → Transfert →
   ajouter `archive@scan.reportlost.org` en conservant une copie. Le mail de vérification
   Zoho arrivera au webhook : le lien de confirmation est visible dans les **logs Vercel**
   (ligne `[archive] non rattaché`).

## Limites connues / suites possibles

- Un correspondant inconnu qui écrit sans ID dans le sujet/corps n'est pas rattaché
  (visible dans les logs Vercel, ligne `[archive] non rattaché`).
- Pas encore de notes internes ni de statuts de dossier (ouvert/résolu) — facile à ajouter
  dans `case_messages` / `lost_items` si besoin.
- Le chat n'est pas persisté : chaque visite de la page repart de zéro (le contexte, lui,
  est toujours complet). Persistance possible via une table `case_chat` si utile.

## Vérification à faire au premier déploiement

1. `npm run dev` en local → `/admin/case/<un id existant>` doit charger.
2. Envoyer un mail de test depuis un dossier → vérifier la réception + la ligne dans
   `case_messages` (direction `out`).
3. Répondre à ce mail → vérifier qu'une ligne `in` apparaît et que la timeline l'affiche.
