-- demo-police.sql — organisation de démonstration pour la prospection des
-- commissariats. UNE seule org générique, réutilisable pour tous les envois :
-- on ne crée jamais une page au nom d'un vrai commissariat (usurpation, et
-- désastreux s'ils la trouvent avant de lire le mail).
--
-- Page publique : https://reportlost.org/at/demo-police
-- Le slug commence par « demo- » : ListPage.tsx la met en noindex.
-- Relançable sans risque (les objets sont recréés à neuf à chaque passage).

-- ── 1. L'organisation ───────────────────────────────────────────────────────
insert into organizations (
  slug, name, type, city, state_id, verified, plan, public_listing,
  public_intro, public_hours, public_location,
  deadline_tracking, public_show_date, public_show_place
) values (
  'demo-police',
  'Demo Police Department',
  'police',
  'Demo City',
  null,
  true,            -- sans verified = true, la page publique renvoie une 404
  'free',
  true,
  'Demonstration page. The items below are made up — nothing here is a real found-property record. This is what the public sees; the office sees the same list with descriptions, photos and legal holding deadlines.',
  E'Mon–Fri 8:00 am – 5:00 pm\nClosed weekends and holidays',
  E'Front desk, 100 Main Street\nAsk for the property room',
  true, true, true
)
on conflict (slug) do update set
  name              = excluded.name,
  type              = excluded.type,
  city              = excluded.city,
  verified          = excluded.verified,
  public_listing    = excluded.public_listing,
  public_intro      = excluded.public_intro,
  public_hours      = excluded.public_hours,
  public_location   = excluded.public_location,
  deadline_tracking = excluded.deadline_tracking,
  public_show_date  = excluded.public_show_date,
  public_show_place = excluded.public_show_place;

-- ── 2. L'inventaire ────────────────────────────────────────────────────────
-- Table neuve à chaque passage : une démo qui accumule les doublons ne vend rien.
delete from found_items
 where org_id = (select id from organizations where slug = 'demo-police');
delete from org_intakes
 where org_id = (select id from organizations where slug = 'demo-police');
delete from org_lost_reports
 where org_id = (select id from organizations where slug = 'demo-police');
delete from org_item_events
 where org_id = (select id from organizations where slug = 'demo-police');
update organizations set ref_seq = 0 where slug = 'demo-police';

do $$
declare
  v_org  uuid;
  v_arr  text;      -- littéral neutre : labels/logos/objects sont NOT NULL et
  v_type text;      -- peuvent être text[] ou jsonb selon l'historique de la base
  v_ref  integer;
  r      record;
begin
  select id into v_org from organizations where slug = 'demo-police';
  if v_org is null then raise exception 'organisation demo-police introuvable'; end if;

  select data_type into v_type from information_schema.columns
   where table_schema = 'public' and table_name = 'found_items' and column_name = 'labels';
  v_arr := case when v_type in ('jsonb', 'json') then '''[]''' else '''{}''' end;

  for r in
    select * from (values
      ('iPhone 13, black, blue silicone case',          'Phone',                 3,  'Main St & 3rd Ave — handed in by a passer-by', 'Property room · shelf B2'),
      ('Brown leather wallet, cards inside, no cash',    'Wallet',                5,  'Riverside Park, near the playground',          'Property room · safe'),
      ('Four keys on a red lanyard',                     'Keys',                  9,  'Center St bus stop',                           'Property room · drawer 1'),
      ('Gold-coloured bracelet, broken clasp',           'Jewelry',              14,  'Handed in at the front desk',                  'Property room · safe'),
      ('Black backpack, laptop charger inside',          'Backpack',             21,  'City Hall parking garage, level 2',            'Property room · shelf A4'),
      ('Prescription glasses, tortoiseshell frame',      'Glasses',              28,  'Public library entrance',                      'Property room · drawer 2'),
      ('Child''s blue scooter',                          'Bike / scooter gear',  40,  'Riverside Park bike path',                     'Garage · rack 3'),
      ('Samsung Galaxy, cracked screen',                 'Phone',                75,  'Traffic stop, Highway 17 southbound',          'Property room · shelf B1')
    ) as t(title, label, days_ago, place, storage)
  loop
    update organizations set ref_seq = ref_seq + 1
     where id = v_org
     returning ref_seq into v_ref;

    execute format(
      'insert into found_items (org_id, org_ref, title, description, date, city,
         dropoff_location, storage_location, status, legal_deadline,
         public_visible, public_label, labels, logos, objects, ocr_text)
       values (%L, %L, %L, %L, %L, %L, %L, %L, ''stored'', %L, true, %L, %s, %s, %s, '''')',
      v_org,
      'F-' || lpad(v_ref::text, 4, '0'),
      r.title,
      r.title,                                   -- description = titre pour la démo
      (current_date - r.days_ago)::date,
      'Demo City',
      r.place,
      r.storage,
      (current_date - r.days_ago + 90)::date,    -- 90 jours = DEFAULT_HOLDING_DAYS
      r.label,
      v_arr, v_arr, v_arr
    );
  end loop;
end $$;

-- Un objet en cours de réclamation : montre que la fiche reste listée pendant
-- la vérification de propriété, et que l'échéance de garde approche (15 jours).
update found_items
   set status = 'claim_pending'
 where org_id = (select id from organizations where slug = 'demo-police')
   and title  = 'Samsung Galaxy, cracked screen';

-- ── 3. Deux signalements « je garde l'objet » (parcours QR code) ────────────
-- C'est le cas que rien ne couvre aujourd'hui : l'objet est dans la rue, la
-- personne ne peut pas le déposer, et le commissariat n'a aucun canal.
insert into org_intakes (org_id, code, title, description, found_location, found_at,
                         finder_name, finder_email, held_by, status,
                         public_visible, public_label)
select o.id, v.code, v.title, v.descr, v.place, (current_date - v.days_ago)::date,
       v.finder, v.femail, 'finder', 'pending', true, v.label
  from organizations o,
       (values
         ('DM-7412', 'Woman''s wedding ring, engraved inside', 'Engraving kept out of the public listing — it is the proof of ownership.', 'Sidewalk, 200 block of Main St', 2, 'K. Alvarez', 'demo-finder1@example.com', 'Jewelry'),
         ('DM-7418', 'Car key fob, Honda',                      'Finder is keeping it until the owner is identified.',                      'Beach access 4 parking lot',      6, 'T. Nguyen',  'demo-finder2@example.com', 'Keys')
       ) as v(code, title, descr, place, days_ago, finder, femail, label)
 where o.slug = 'demo-police';

-- ── 3b. Déclarations de perte reçues par la page publique ───────────────────
-- C'est la colonne qui remplace les appels téléphoniques : la personne décrit
-- ce qu'elle a perdu, l'agent la lit quand il veut.
insert into org_lost_reports (org_id, code, title, description, lost_location, lost_at,
                              name, email, phone, status)
select o.id, v.code, v.title, v.descr, v.place, (current_date - v.days_ago)::date,
       v.name, v.email, v.phone, 'open'
  from organizations o,
       (values
         ('LR-3301', 'Black iPhone with a blue case',      'Blue silicone case, cracked screen protector, lock screen is a photo of a dog.', 'Somewhere between Main St and the bus stop', 3, 'M. Carter',  'demo-owner1@example.com', '(555) 010-2244'),
         ('LR-3307', 'Brown leather wallet',               'Driver''s licence and two bank cards inside, no cash. Small tear on the fold.',   'Riverside Park',                            5, 'J. Whitfield','demo-owner2@example.com', '(555) 010-8871'),
         ('LR-3312', 'Silver bracelet, engraved',          'Engraved with a date on the inside — I can give it if you need to check.',        'Not sure, possibly the library',            15, 'A. Reyes',   'demo-owner3@example.com', null)
       ) as v(code, title, descr, place, days_ago, name, email, phone)
 where o.slug = 'demo-police';

-- ── 3c. Journal légal de deux objets ───────────────────────────────────────
-- Le registre s'écrit tout seul. C'est cette ligne-là qu'on relit à quelqu'un
-- qui se manifeste six mois plus tard, et c'est l'argument décisif.
insert into org_item_events (org_id, item_id, type, note, actor_email, created_at)
select f.org_id, f.id::text, v.type, v.note, 'desk@demo-police.example', now() - (v.hours_ago || ' hours')::interval
  from found_items f
  join organizations o on o.id = f.org_id
       cross join (values
         ('created',        'Logged at the front desk', 1800),
         ('claim_received', 'Caller described a cracked screen and a dog lock screen — matches. Asked for proof of purchase.', 36),
         ('note',           'Proof received, handover scheduled.', 4)
       ) as v(type, note, hours_ago)
 where o.slug = 'demo-police'
   and f.title = 'Samsung Galaxy, cracked screen';

insert into org_item_events (org_id, item_id, type, note, actor_email, created_at)
select f.org_id, f.id::text, 'created', 'Handed in by a passer-by', 'desk@demo-police.example', now() - interval '72 hours'
  from found_items f
  join organizations o on o.id = f.org_id
 where o.slug = 'demo-police'
   and f.title = 'iPhone 13, black, blue silicone case';

-- ── 4. Vérification ────────────────────────────────────────────────────────
select o.slug, o.name, o.verified, o.public_listing, o.short_code, o.ref_seq,
       (select count(*) from found_items f where f.org_id = o.id)  as objets,
       (select count(*) from org_intakes i where i.org_id = o.id)  as signalements,
       (select count(*) from org_lost_reports l where l.org_id = o.id) as pertes_declarees,
       (select count(*) from org_item_events e where e.org_id = o.id)  as evenements
  from organizations o
 where o.slug = 'demo-police';
