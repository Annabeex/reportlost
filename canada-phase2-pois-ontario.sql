-- ============================================================
-- CANADA — phase 2 : organismes des 10 villes de l'Ontario (ca_city_pois)
-- À lancer dans le SQL editor de Supabase. Idempotent (relançable).
--
-- Chaque ligne vient d'une page officielle ouverte le 26/10/2026 (source_urls).
-- Échantillon revérifié à la main : TTC, Pearson, police d'Ottawa, police de
-- Windsor, LTC, police de Hamilton — tous conformes.
-- Champ NULL = non trouvé sur une source officielle. Ne rien compléter à la main.
-- confidence 'medium' = page officielle incomplète ou contradictoire (voir notes).
-- Les opérateurs régionaux (GO, UP Express, VIA, Pearson, Billy Bishop) sont
-- rattachés à toronto ; les guides des autres villes y renvoient.
-- ============================================================

-- 1) Colonnes de source et de procédure -------------------------------------
ALTER TABLE ca_city_pois ADD COLUMN IF NOT EXISTS name_fr     text;
ALTER TABLE ca_city_pois ADD COLUMN IF NOT EXISTS address     text;
ALTER TABLE ca_city_pois ADD COLUMN IF NOT EXISTS phone       text;
ALTER TABLE ca_city_pois ADD COLUMN IF NOT EXISTS email       text;
ALTER TABLE ca_city_pois ADD COLUMN IF NOT EXISTS hours       text;
ALTER TABLE ca_city_pois ADD COLUMN IF NOT EXISTS procedure   text;   -- anglais, tel qu'écrit par l'organisme
ALTER TABLE ca_city_pois ADD COLUMN IF NOT EXISTS retention   text;
ALTER TABLE ca_city_pois ADD COLUMN IF NOT EXISTS source_urls text[];
ALTER TABLE ca_city_pois ADD COLUMN IF NOT EXISTS confidence  text;   -- 'high' | 'medium'
ALTER TABLE ca_city_pois ADD COLUMN IF NOT EXISTS notes       text;
ALTER TABLE ca_city_pois ADD COLUMN IF NOT EXISTS verified_at date;

CREATE UNIQUE INDEX IF NOT EXISTS ux_ca_city_pois_org
  ON ca_city_pois (province_id, city_ascii, kind, name);

-- 2) Données -----------------------------------------------------------------
INSERT INTO ca_city_pois
  (province_id, city_ascii, kind, name, name_fr, url, address, phone, email, hours, procedure, retention, source_urls, confidence, notes, verified_at)
VALUES

-- ========================= TORONTO =========================
('ON','toronto','police',$$Toronto Police Service$$,NULL,
 $$https://www.tps.ca/services/online-reporting/lost-property-or-identification-resources/$$,
 $$40 College Street, Toronto, ON M5G 2J3$$, $$416-808-2222 (non-emergency; *8-7-7 from a mobile)$$, NULL, NULL,
 $$TPS takes lost property reports by phone only, for items with an externally visible serial number worth more than $500, or where there is a public interest in recording the loss (e.g. medication). These reports are not investigated; they are kept so owners can be reunited with property if it is recovered. TTC losses go to the TTC Lost Articles Office; lost cellphones to the service provider; Canadian passports and SIN cards to Service Canada; Ontario licences, health cards, plates and accessible parking permits to ServiceOntario. Foreign passports are reported on the non-emergency line.$$,
 NULL,
 ARRAY['https://www.tps.ca/services/online-reporting/lost-property-or-identification-resources/','https://www.tps.ca/contact/'],
 'medium', $$No official TPS page explains how the public hands in FOUND property or where it is held. Property & Video Evidence Management: 416-808-3750 (stores property seized by officers; no public reclaim steps published). 16 divisions, each listed on tps.ca/contact.$$, '2026-10-26'),

('ON','toronto','transit',$$Toronto Transit Commission (TTC) – Lost Articles Office$$,NULL,
 $$https://www.ttc.ca/customer-service/lost-articles$$,
 $$Bay subway station$$, $$416-393-4100 (weekdays 12 p.m. to 5 p.m., except statutory holidays)$$, NULL,
 $$Open to the public 8 a.m. to 4:45 p.m., Monday to Friday, except statutory holidays$$,
 $$Items found on TTC property are delivered to the Lost Articles Office at Bay station at 2 p.m. each weekday. To look for an item, phone the office or go in person; staff can search the database.$$,
 $$Most items 30 days (since January 1, 2025); bicycles 15 days; Canadian passports sent immediately to Passport Canada; international passports held 10 days, then sent to the consulate or embassy. Unclaimed items are sold at auction.$$,
 ARRAY['https://www.ttc.ca/customer-service/lost-articles','https://www.ttc.ca/customer-service/contact-us'],
 'high', $$TTC contact page announces a move of the Lost Articles Office to 1900 Yonge Street in 2026 (no month). Re-check the location before publishing.$$, '2026-10-26'),

('ON','toronto','transit',$$GO Transit (Metrolinx) Lost and Found$$,NULL,
 $$https://www.gotransit.com/en/lost-and-found$$,
 $$Counter 6, York Concourse, Union Station, 35 York Street, Toronto$$, $$416-202-1600$$, NULL,
 $$Monday to Friday 10 a.m. to 6 p.m.; Saturday and Sunday 10 a.m. to 5:30 p.m.; closed statutory holidays$$,
 $$Report the item with GO's online form. Items found on GO trains, buses and at stations go to the Union Station Lost and Found office, usually within ten business days. To claim, bring ID and proof of ownership. A designated person can claim for you, or a prepaid courier pickup can be arranged.$$,
 $$30 calendar days; unclaimed items are donated$$,
 ARRAY['https://gotransit.com/en/lost-and-found','https://www.metrolinx.com/en/discover/how-to-find-lost-items-through-metrolinx-s-lost-and-found-office'],
 'high', $$Serves all GTA and Golden Horseshoe cities (Mississauga, Brampton, Hamilton, Oshawa, Barrie, Kitchener).$$, '2026-10-26'),

('ON','toronto','transit',$$UP Express (Metrolinx) Lost & Found$$,NULL,
 $$https://services.upexpress.com/CustomerSupport/LostFound$$,
 NULL, $$1-844-GET-ON-UP$$, NULL, NULL,
 $$Fill in the online lost item form. UP Express contacts you only if a match is found, usually within 24 hours. Found items can take up to 72 hours to reach the Union Station office. Items lost in the Pearson Terminal Link station or in Terminals 1 and 3 are handled by Toronto Pearson's Lost and Found.$$,
 NULL,
 ARRAY['https://services.upexpress.com/CustomerSupport/LostFound','https://www.upexpress.com/en/customer-services'],
 'medium', $$No office address, hours, retention or ID requirements published.$$, '2026-10-26'),

('ON','toronto','transit',$$VIA Rail Canada – Toronto Union Station$$,NULL,
 $$https://www.viarail.ca/en/explore-our-destinations/stations/ontario/toronto$$,
 $$Union Station, 65 Front Street West, Toronto, ON M5J 1E6$$, $$(416) 956-7675 (lost items, Toronto station); 1 888 842-7245 (VIA Lost and Found, national)$$, NULL, NULL,
 $$An item left on board should be reported on arrival at the station's baggage or ticket counter; station staff help locate it. Baggage lost or stolen in a station can be reported to VIA's Lost and Found by phone or at the ticket counter.$$,
 NULL,
 ARRAY['https://www.viarail.ca/en/explore-our-destinations/stations/ontario/toronto','https://www.viarail.ca/en/plan/faq/baggage/what-should-passengers-do-if-they-forget-a-personal-item-on-the-train'],
 'high', $$No retention period stated.$$, '2026-10-26'),

('ON','toronto','airport',$$Toronto Pearson International Airport – Lost and Found Office$$,NULL,
 $$https://www.torontopearson.com/en/while-you-are-here/toronto-airport-services/lost-and-found-office$$,
 $$Terminal 1, before security, between doors R and S$$, NULL, NULL,
 $$Monday to Friday 10 a.m. to 6 p.m.; closed weekends$$,
 $$Report items lost in the terminals or parking garages with the online form (free; confirmation email with a report number). The office checks its inventory for 30 days and emails the result. If an item matches, collect it at the Terminal 1 office with government photo ID, send an authorized person, or arrange paid shipping. Items lost on board an aircraft, including checked luggage, are claimed from the airline. Items left at a security checkpoint go to the airport's Lost and Found (CATSA).$$,
 $$All found items kept 30 days from the date they are turned in$$,
 ARRAY['https://www.torontopearson.com/en/while-you-are-here/toronto-airport-services/lost-and-found-office','https://www.catsa-acsta.gc.ca/en/claims'],
 'high', $$The office does not hold passports, NEXUS cards, perishables, neck pillows, items lost on airplanes or on public transit. No phone or email on Pearson's own site. Located in Mississauga; serves Mississauga and Brampton guides too.$$, '2026-10-26'),

('ON','toronto','airport',$$Billy Bishop Toronto City Airport – Lost and Found$$,NULL,
 $$https://www.billybishopairport.com/contact-us/$$,
 NULL, $$1 (844) 846-8266$$, $$BBTCA@blackandmcdonald.com$$, NULL,
 $$Items lost in the terminal building or at security are reported to the airport's Lost and Found Department by phone or email. Items left on an aircraft, or lost luggage, are handled by the airline (Porter Airlines or Air Canada).$$,
 NULL,
 ARRAY['https://www.billybishopairport.com/contact-us/','https://www.billybishopairport.com/faqs/'],
 'high', $$No office location, hours or retention period published.$$, '2026-10-26'),

('ON','toronto','animal',$$Toronto Animal Services (City of Toronto)$$,NULL,
 $$https://www.toronto.ca/community-people/animals-pets/lost-found-pets/$$,
 $$West Shelter, 146 The East Mall; North Shelter, 1300 Sheppard Avenue West; East Shelter, 821 Progress Avenue$$,
 $$416-338-PAWS (7297) or 311$$, NULL,
 $$Shelters open to the public by appointment only, 10:30 a.m. to 6:30 p.m.$$,
 $$Owners file a lost animal report at 416-338-7297 or 311 (description, licence and microchip numbers, photo), search strays found in the last 14 days online, and check City shelters, vet clinics and Toronto Humane Society locations. Finders report a found animal to 311 right away with the exact location and any licence tag details.$$,
 $$By-law minimum impound period: dogs 5 days, cats 3 days (Toronto Municipal Code Ch. 349). Redemption fees: cat $30 plus $10/day; dog $40 plus $20/day.$$,
 ARRAY['https://www.toronto.ca/community-people/animals-pets/lost-found-pets/','https://www.toronto.ca/community-people/animals-pets/animal-shelters/','https://www.toronto.ca/legdocs/municode/1184_349.pdf'],
 'high', $$Re-check Ch. 349 section numbers (§349-14, §349-21) before citing them.$$, '2026-10-26'),

-- ========================= MISSISSAUGA =========================
('ON','mississauga','police',$$Peel Regional Police$$,NULL,
 $$https://www.peelpolice.ca/reporting-records/report-a-crime-or-incident/file-a-police-report-online/$$,
 NULL, $$905-453-3311 (non-emergency, press 1)$$, NULL, NULL,
 $$Lost property under $10,000 can be reported online only for items with a serial number, engraving or other identifying marks (e.g. phones, laptops, driver's licence, health card). These reports are not investigated; they are kept on record in case the item turns up. Keys, money, clothing, eyeglasses, passports, licence plates, bank and membership cards and parking permits are not accepted online. Other reports are made in person at a Division or Community Station, or by phone.$$,
 NULL,
 ARRAY['https://www.peelpolice.ca/reporting-records/report-a-crime-or-incident/file-a-police-report-online/','https://www.peelpolice.ca/contact-us/'],
 'medium', $$No official Peel page on handing in found property, where it is held or for how long. Not at Headquarters (7150 Mississauga Rd).$$, '2026-10-26'),

('ON','mississauga','transit',$$MiWay Lost and Found (City of Mississauga)$$,NULL,
 $$https://www.mississauga.ca/miway-transit/contact-miway$$,
 $$Information Booth, City Centre Transit Terminal, 200 Rathburn Road West, Mississauga$$, $$905-615-4636$$, NULL,
 $$Information Booth: weekdays 8 a.m. to 7 p.m., weekends 9:30 a.m. to 5 p.m., closed holidays. Phone: weekdays 7 a.m. to 7 p.m., weekends and holidays 9:30 a.m. to 5 p.m.$$,
 $$Call first to check whether the item has been turned in. Claim in person at the Information Booth with photo ID and a clear description. The public cannot go to the transit garages.$$,
 $$Maximum of seven days$$,
 ARRAY['https://www.mississauga.ca/miway-transit/contact-miway'],
 'high', NULL, '2026-10-26'),

('ON','mississauga','animal',$$Mississauga Animal Services$$,NULL,
 $$https://www.mississauga.ca/services-and-programs/animals-and-pets/missing-pets/$$,
 $$735 Central Parkway West, Mississauga, ON L5C 1T8$$, $$905-896-5864 ext. 3$$, $$mypet.info@mississauga.ca$$,
 $$Monday to Saturday, 10 a.m. to 6 p.m.$$,
 $$Owners search the City's online list of found animals, then call the shelter to arrange the return. Finders call the same number or bring the animal to the shelter.$$,
 NULL,
 ARRAY['https://www.mississauga.ca/services-and-programs/animals-and-pets/missing-pets/','https://www.mississauga.ca/services-and-programs/animals-and-pets/animal-services-shelter/'],
 'high', $$Stray holding period and fees not published.$$, '2026-10-26'),

('ON','mississauga','university',$$University of Toronto Mississauga – UTM Service Desk Lost & Found$$,NULL,
 $$https://www.utm.utoronto.ca/iits/utm-service-desk-resources/lost-found$$,
 $$UTM Service Desk, CCT Atrium$$, NULL, NULL,
 $$Weekdays 8 a.m. to 8 p.m.; weekends 9 a.m. to 5 p.m.$$,
 $$Report lost or found items to the Service Desk with your UTORid and exact location. To claim, describe the item and bring valid ID. Items left on the UTM shuttle are handled by the Service Desk.$$,
 NULL,
 ARRAY['https://www.utm.utoronto.ca/iits/utm-service-desk-resources/lost-found','https://www.utm.utoronto.ca/shuttle/lost-found'],
 'high', NULL, '2026-10-26'),

('ON','mississauga','university',$$Sheridan College – Campus Safety (Hazel McCallion Campus)$$,NULL,
 $$https://media-www.sheridancollege.ca/student-life/campus-services/safety/lost-found$$,
 $$4180 Duke of York Boulevard, Mississauga, ON L5B 0G5$$, $$905-815-4044$$, NULL, NULL,
 $$Ask at a Campus Safety Office, by phone, or through the Sheridan ALERT! app. To claim, bring photo ID (Sheridan onecard or government ID).$$,
 $$Found items stored for up to one year$$,
 ARRAY['https://media-www.sheridancollege.ca/student-life/campus-services/safety/lost-found'],
 'medium', $$Only the media-www mirror of sheridancollege.ca could be read.$$, '2026-10-26'),

-- ========================= BRAMPTON =========================
('ON','brampton','police',$$Peel Regional Police$$,NULL,
 $$https://www.peelpolice.ca/reporting-records/report-a-crime-or-incident/file-a-police-report-online/$$,
 NULL, $$905-453-3311 (non-emergency, press 1)$$, NULL, NULL,
 $$Lost property under $10,000 can be reported online only for items with a serial number, engraving or other identifying marks. These reports are not investigated; they are kept on record in case the item turns up. Keys, money, clothing, eyeglasses, passports, plates, bank and membership cards and parking permits are not accepted online. Other reports are made in person at a Division or Community Station, or by phone.$$,
 NULL,
 ARRAY['https://www.peelpolice.ca/reporting-records/report-a-crime-or-incident/file-a-police-report-online/','https://www.peelpolice.ca/contact-us/'],
 'medium', $$No official Peel page on handing in found property, where it is held or for how long.$$, '2026-10-26'),

('ON','brampton','transit',$$Brampton Transit Lost and Found$$,NULL,
 $$https://brampton.ca/EN/residents/transit/Contact-Us/Pages/Lost-and-Found.aspx$$,
 $$Clark office, 185 Clark Boulevard, Brampton$$, $$905.874.2750 ext. 62732$$, NULL, NULL,
 $$Report the item with the online form on the page, or by phone, with as much detail as possible. Brampton Transit contacts the owner if the item is found. Pickup at 185 Clark Boulevard with identification.$$,
 $$14 days$$,
 ARRAY['https://brampton.ca/EN/residents/transit/Contact-Us/Pages/Lost-and-Found.aspx'],
 'high', $$No office hours published.$$, '2026-10-26'),

('ON','brampton','animal',$$Brampton Animal Services$$,NULL,
 $$https://www.brampton.ca/EN/residents/Animal-Services/pages/lost-and-found.aspx$$,
 $$475 Chrysler Drive, Brampton, ON L6S 6G3$$, $$905.458.5800 (311 after hours for urgent matters)$$, $$animal.services@brampton.ca$$,
 $$Monday to Saturday, 9 a.m. to 5 p.m.; closed Sundays and holidays$$,
 $$Owners file a missing pet report by phone or through the contact page and can drop off or email a photo; also check the BAS Found Pets Facebook page and the microchip registry. Finders report the found pet to Brampton Animal Services and have it scanned for a microchip at the shelter or a vet.$$,
 $$Strays turned in by the public are held seven days (provincial minimum: 72 hours)$$,
 ARRAY['https://www.brampton.ca/EN/residents/Animal-Services/pages/lost-and-found.aspx','https://www.brampton.ca/EN/residents/Animal-Services/pages/faqs.aspx'],
 'high', NULL, '2026-10-26'),

('ON','brampton','university',$$Sheridan College – Campus Safety (Davis Campus)$$,NULL,
 $$https://media-www.sheridancollege.ca/student-life/campus-services/safety/lost-found$$,
 $$7899 McLaughlin Road, Brampton, ON L6Y 5H9$$, $$905-815-4044$$, NULL, NULL,
 $$Ask at a Campus Safety Office, by phone, or through the Sheridan ALERT! app. To claim, bring photo ID (Sheridan onecard or government ID).$$,
 $$Found items stored for up to one year$$,
 ARRAY['https://media-www.sheridancollege.ca/student-life/campus-services/safety/lost-found'],
 'medium', $$Only the media-www mirror of sheridancollege.ca could be read.$$, '2026-10-26'),

-- ========================= OTTAWA =========================
('ON','ottawa','police',$$Ottawa Police Service – Evidence Control Unit$$,$$Service de police d'Ottawa – Unité du contrôle des pièces à conviction$$,
 $$https://www.ottawapolice.ca/en/sections-and-units/operations-and-support/property/$$,
 $$2799 Swansea Crescent (by appointment only; walk-in service closed)$$,
 $$613-236-1222 ext. 7300 (report found property); ext. 5238 (claim appointments)$$, $$propertyservices@ottawapolice.ca$$,
 $$Appointments between 8 a.m. and 2 p.m., Monday to Friday$$,
 $$To report found property, call the Police Reporting Unit (ext. 7300). Lost property can be reported online only if it has a visible serial number or distinct marking; lost cell phones, licence plates, bank cards and government ID cannot be reported online. To reclaim, the owner books an appointment by phone or email with the police file number, and brings proof of ownership and ID with name and date of birth.$$,
 $$Items without a known owner: 90 days; found bicycles: 30 days$$,
 ARRAY['https://www.ottawapolice.ca/en/sections-and-units/operations-and-support/property/','https://www.ottawapolice.ca/fr/sections-et-unites/operations-et-soutien/services-de-controle-des-pieces-a-conviction/'],
 'high', $$The French page gives a different extension (5488) for lost bicycles and other lost items.$$, '2026-10-26'),

('ON','ottawa','transit',$$OC Transpo Lost and Found$$,NULL,
 $$https://octranspo.com/lostandfound$$,
 $$St-Laurent Lost and Found Centre, main floor of St-Laurent Station$$, $$613-560-5000$$, NULL,
 $$Monday to Friday, 8:30 a.m. to 4 p.m.; closed weekends and statutory holidays$$,
 $$Owners submit an inquiry on the online Lost & Found portal (item, when and where lost, route or station) and are emailed if a match is found. Pickup at the St-Laurent centre with valid photo ID. Finders give items to any bus operator or Special Constable, or bring them to the St-Laurent centre or the Rideau Customer Service Centre.$$,
 $$21 days, then donated to Heartwood House$$,
 ARRAY['https://octranspo.com/lostandfound','https://octranspo.com/en/news/article/lost-found-new-location-new-online-tool-starting-dec-2'],
 'high', $$Covers buses and the O-Train.$$, '2026-10-26'),

('ON','ottawa','transit',$$VIA Rail Canada$$,NULL,
 $$https://www.viarail.ca/en/plan/faq/baggage/what-should-passengers-do-if-they-forget-a-personal-item-on-the-train$$,
 NULL, NULL, NULL, NULL,
 $$An item forgotten on a train should be reported in person at the station's baggage or ticket counter on arrival; station staff help locate it.$$,
 NULL,
 ARRAY['https://www.viarail.ca/en/plan/faq/baggage/what-should-passengers-do-if-they-forget-a-personal-item-on-the-train'],
 'medium', $$National procedure only; nothing specific to Ottawa station.$$, '2026-10-26'),

('ON','ottawa','airport',$$Ottawa International Airport (YOW)$$,NULL,
 $$https://yow.ca/en/corporate/airport-authority/contact-us$$,
 NULL, NULL, NULL, NULL,
 $$Items lost on airport property: contact PARS 2000 (pars2000.com). Items left on an aircraft: contact the airline. Items left in a taxi from the airport: Coventry Connections, 613-523-1234.$$,
 NULL,
 ARRAY['https://yow.ca/en/corporate/airport-authority/contact-us'],
 'medium', $$PARS 2000 details could not be verified.$$, '2026-10-26'),

('ON','ottawa','animal',$$City of Ottawa – By-law Services (lost and found pets)$$,NULL,
 $$https://ottawa.ca/en/living-ottawa/animals-and-pets/lost-and-found-pets$$,
 NULL, $$3-1-1$$, NULL, NULL,
 $$Owners file a lost pet report online, by calling 3-1-1, or with the Ottawa Humane Society. Finders of a pet wearing a City of Ottawa tag call 3-1-1 so By-law Services can find the owner. Pets without a City tag go to the Ottawa Humane Society.$$,
 NULL,
 ARRAY['https://ottawa.ca/en/living-ottawa/animals-and-pets/lost-and-found-pets'],
 'high', NULL, '2026-10-26'),

('ON','ottawa','animal',$$Ottawa Humane Society$$,NULL,
 $$https://www.ottawahumane.ca/get-help/lost-and-found/$$,
 $$245 West Hunt Club Rd., Ottawa, ON K2E 1A6$$, $$613-725-3166 ext. 223$$, $$intake@ottawahumane.ca$$,
 $$Intake / Lost and Found: Monday to Friday 9 a.m. to 8 p.m.; Saturday 10 a.m. to 5 p.m.; Sunday 11 a.m. to 4 p.m.; closed statutory holidays$$,
 $$Owners submit a Lost Pet Report with a description and photo and check the shelter's found-pet pages. To claim, bring ID with current address, proof of ownership and payment of release fees. Finders submit a Found Pet Report or contact the shelter, and bring the pet in if the owner is not found.$$,
 $$Strays held three full days (excluding day of entry and statutory holidays), after which the Society becomes the legal owner$$,
 ARRAY['https://www.ottawahumane.ca/get-help/lost-and-found'],
 'high', $$Release fee amounts not published.$$, '2026-10-26'),

('ON','ottawa','university',$$University of Ottawa – Lost and Found$$,NULL,
 $$https://www.uottawa.ca/campus-life/campus-sustainability/lost-found$$,
 $$Montpetit Hall, 125 University Private, Room 146$$, NULL, NULL, NULL,
 $$Owners describe the item on the online form and are contacted if it is found; reclaim with ID card during office hours. Finders use the 24/7 drop box at University Centre Room 02A. Valuables are handled by Protection Services.$$,
 $$Two months from cataloguing, then donated$$,
 ARRAY['https://www.uottawa.ca/campus-life/campus-sustainability/lost-found'],
 'medium', NULL, '2026-10-26'),

('ON','ottawa','university',$$Carleton University – Lost and Found$$,NULL,
 $$https://carleton.ca/lostandfound/$$,
 $$Campus Card, 407 Nideyinan (main location)$$, NULL, $$campuscard@carleton.ca$$, NULL,
 $$Found items are taken to a designated location and logged in a central portal; owners of identifiable items are contacted by Carleton email. Claims during each location's hours; ID may be requested.$$,
 $$30 days for unidentifiable items; government ID returned to the issuing agency after 30 days; passports sent to Passport Canada immediately$$,
 ARRAY['https://carleton.ca/lostandfound/','https://carleton.ca/lostandfound/lost-and-found-guidelines/'],
 'medium', NULL, '2026-10-26'),

-- ========================= HAMILTON =========================
('ON','hamilton','police',$$Hamilton Police Service – Property & Evidence Branch$$,NULL,
 $$https://hamiltonpolice.on.ca/how-to/collect-my-property$$,
 $$Central Police Station, 155 King William$$, $$905-546-4734$$, NULL,
 $$Appointments 8 a.m. to 4 p.m., Monday to Friday$$,
 $$Call to view property or arrange its release; a Lost or Stolen Property report should already be filed. Property is released only to the legal owner or an authorized designate, with two pieces of ID (one with name, date of birth and photo). When an owner is identified, a letter is sent and the owner has 30 days to claim.$$,
 $$Found property held 90 days (bicycles 30 days). Unclaimed items may be auctioned, destroyed, or, for jewellery and cash only, returned to the finder.$$,
 ARRAY['https://hamiltonpolice.on.ca/how-to/collect-my-property'],
 'high', $$No published procedure for the public handing in found property.$$, '2026-10-26'),

('ON','hamilton','transit',$$Hamilton Street Railway (HSR) – Customer Service$$,NULL,
 $$https://www.hamilton.ca/home-neighbourhood/hsr/riding-hsr/hsr-customer-service$$,
 NULL, $$905-528-4200$$, $$hsrserve@hamilton.ca$$,
 $$Weekdays 8 a.m. to 4 p.m., closed holidays$$,
 $$To locate a lost item, call HSR customer service; if busy or after hours, leave a voicemail or email.$$,
 NULL,
 ARRAY['https://www.hamilton.ca/home-neighbourhood/hsr/riding-hsr/hsr-customer-service'],
 'high', $$No pickup location or retention period published.$$, '2026-10-26'),

('ON','hamilton','airport',$$John C. Munro Hamilton International Airport – Operations Centre$$,NULL,
 $$https://flyhamilton.ca/airport-services/$$,
 NULL, $$905 679 1999$$, $$info@flyhamilton.ca$$, NULL,
 $$Report a lost item or claim found property through the Operations Centre (in the terminal: Departures entrance, left past check-in, wall phone across from the elevator, dial 2260). Items left on an aircraft or lost luggage: contact the airline.$$,
 NULL,
 ARRAY['https://flyhamilton.ca/airport-services/'],
 'high', NULL, '2026-10-26'),

('ON','hamilton','animal',$$Hamilton Animal Services$$,NULL,
 $$https://www.hamilton.ca/home-neighbourhood/animals-pets/lost-found-or-surrender/lost-and-found-pets$$,
 $$247 Dartnall Road, Hamilton, ON L8W 3V9$$, $$905-574-3433$$, NULL,
 $$Monday to Friday 8:30 a.m. to 4:30 p.m.; Saturday and Sunday 10 a.m. to 2 p.m.; closed holidays (no phone calls on weekends)$$,
 $$Owners check the online Found Pets listing, call on weekdays, or visit in person with ID and a photo of the pet. To claim, bring photo ID with current address, payment for impound and boarding fees, and a dog licence if needed.$$,
 $$Strays held a minimum of 5 days, up to 10 days (space permitting) for animals with traceable ID$$,
 ARRAY['https://www.hamilton.ca/home-neighbourhood/animals-pets/lost-found-or-surrender/lost-and-found-pets','https://services.hamilton.ca/home-neighbourhood/animals-pets/lost-found-or-surrender/found-pets'],
 'high', NULL, '2026-10-26'),

('ON','hamilton','university',$$McMaster University – Campus Safety Services Lost and Found$$,NULL,
 $$https://css.mcmaster.ca/lost-and-found/$$,
 $$E.T. Clarke Centre$$, $$905-525-9140 ext 24281$$, $$seclost@mcmaster.ca$$, NULL,
 $$Central lost and found for the campus. Owners file a lost report online. Finders use a Lost and Found dropbox (Student Centre, E.T. Clarke Centre, MDCL lobby, DBAC, The HUB) or bring large items to the E.T. Clarke Centre.$$,
 $$Items stored for 30 days$$,
 ARRAY['https://css.mcmaster.ca/lost-and-found/'],
 'high', NULL, '2026-10-26'),

-- ========================= LONDON =========================
('ON','london','police',$$London Police Service – Firearms and Property Unit$$,NULL,
 $$https://www.londonpolice.ca/services/firearms-and-property-unit/$$,
 $$601 Dundas Street, London, ON N6B 1X1$$, $$519-661-6501$$, $$property@londonpolice.ca$$, NULL,
 $$Property is returned by appointment: contact the unit first to confirm it can be released, what ID is needed, and a pickup time. Lost cell phones and wallets can be reported through LPS online reporting (Lost Property).$$,
 NULL,
 ARRAY['https://www.londonpolice.ca/services/firearms-and-property-unit/','https://www.londonpolice.ca/services/online-reporting/'],
 'medium', $$The unit page describes seized property; nothing on found property handed in by the public or retention.$$, '2026-10-26'),

('ON','london','transit',$$London Transit Commission (LTC)$$,NULL,
 $$https://www.londontransit.ca/policies/lost-found-policy/$$,
 $$Main Office, 450 Highbury Avenue North, London, ON N5W 5L2$$, $$519-451-1347$$, $$ltc@londontransit.ca$$,
 $$Items available the next business day after 10 a.m., during Customer Service hours$$,
 $$LTC keeps only items of value (cash, gift cards, purses, wallets, cameras, jewellery, electronics, medical equipment including eyeglasses, medication). Items are claimed at the Main Office. Credit and debit cards, SIN and health cards and driver's licences go to the Treasury Department.$$,
 $$Items of value held 14 days, then donated; bicycles held one week, then given to London Police Services$$,
 ARRAY['https://www.londontransit.ca/policies/lost-found-policy/'],
 'high', $$The page prints the number as '519-451-1347 314'; the 314 is probably an extension, unconfirmed.$$, '2026-10-26'),

('ON','london','airport',$$London International Airport – Customer Service Office$$,NULL,
 $$https://flyyxu.ca/lost-found/$$,
 $$10 Seabrook Way, London, ON N5V 3B6 (office to the right of departures security screening)$$, $$519-452-4000$$, $$customerservice@flylondon.ca$$,
 $$Daily 5 a.m. to 8:30 p.m.$$,
 $$Handles items found in the terminal, curbside and parking lots; contact by phone, email or mail. Items lost on aircraft, in taxis or rental cars: contact that company.$$,
 $$Found items stored 90 days, then disposed of or donated$$,
 ARRAY['https://flyyxu.ca/lost-found/'],
 'high', NULL, '2026-10-26'),

('ON','london','animal',$$London Animal Care Centre$$,NULL,
 $$https://www.accpets.ca/LostPet.aspx$$,
 $$121 Pine Valley Blvd, London, ON N6K 3T6$$, $$519-685-1330$$, $$info@accpets.ca$$,
 $$Monday to Friday 8 a.m. to 8 p.m.; Saturday 8 a.m. to 4 p.m.; Sunday 1 p.m. to 4 p.m.; closed statutory holidays$$,
 $$Owners create a lost report online, visit the centre to check animals in care, and browse the online listings. Finders call or file a found report online; with a current City of London tag number, the centre can provide the owner's phone number.$$,
 NULL,
 ARRAY['https://london.ca/living-london/community-services/animal-pet-services/animal-care-control','https://www.accpets.ca/LostPet.aspx','https://www.accpets.ca/FoundPet.aspx'],
 'high', $$Municipal animal services under contract to the City of London. Stray hold period not published.$$, '2026-10-26'),

('ON','london','university',$$Western University – Foot Patrol / Special Constable Service$$,NULL,
 $$https://www.uwo.ca/constable/get-help-now/lost-property.html$$,
 $$Sept–Apr: Foot Patrol, UCC room 57; May–Aug: Special Constable Service, LWH 1257$$, $$Foot Patrol 519-661-3650; Special Constable Service 519-661-3300$$, NULL, NULL,
 $$Contact the service for the current season with a description, where and when the item was lost and any serial numbers. Property is released when ownership can be reasonably confirmed, which may require photo ID. Lost valuables go to the Special Constable Service.$$,
 $$Found property normally held three months$$,
 ARRAY['https://www.uwo.ca/constable/get-help-now/lost-property.html','https://uwo.ca/campussafety/services.html'],
 'medium', NULL, '2026-10-26'),

-- ========================= KITCHENER =========================
('ON','kitchener','police',$$Waterloo Regional Police Service$$,NULL,
 $$https://wrps.ca/contact-us/who-call$$,
 NULL, $$519-570-9777$$, NULL, NULL,
 $$Lost property can be reported online or by phone. A finder who has already reported found property to police and wishes to keep it fills in the online Finder Claim Form (occurrence number, where and when found, description).$$,
 NULL,
 ARRAY['https://wrps.ca/contact-us/who-call','https://wrps.ca/form/finder-claim-form'],
 'medium', $$No official page on where found property is held, how owners reclaim it, or retention.$$, '2026-10-26'),

('ON','kitchener','transit',$$Grand River Transit (GRT)$$,NULL,
 $$https://www.grt.ca/rider-information/lost-and-found/$$,
 $$GRT Customer Service Centre, 105 King St. E., Kitchener$$, $$519-585-7555$$, NULL,
 $$Monday to Friday 8 a.m. to 6 p.m.; Saturday 9:30 a.m. to 5 p.m.; closed Sundays and holidays$$,
 $$Call first. Items from Kitchener or Waterloo buses and ION trains are held at 105 King St. E. (ION items arrive Tuesdays and Fridays); Cambridge items at Ainslie Street Terminal. Pick up with ID and a detailed description; only the owner may claim.$$,
 $$Bikes and electronics 4 weeks; miscellaneous items 1–2 weeks; government or legal documents 4 weeks, then mailed to the issuing office$$,
 ARRAY['https://www.grt.ca/rider-information/lost-and-found/','https://grt.ca/about-grt/contact-us/'],
 'high', NULL, '2026-10-26'),

('ON','kitchener','airport',$$Region of Waterloo International Airport$$,NULL,
 $$https://www.waterlooairport.ca/en/passengers/additional-services.aspx$$,
 $$1-4881 Fountain Street North, Breslau, ON N0B 1M0$$, $$519-575-4781$$, $$airport@regionofwaterloo.ca$$, NULL,
 $$Items lost in the terminals or parking lots: Information booth in the main terminal or by phone, with ID and a detailed description. Items left on an aircraft: the airline. Lost passports are handed to the Canada Border Services Agency.$$,
 $$30 days, then donated or disposed of$$,
 ARRAY['https://www.waterlooairport.ca/en/passengers/additional-services.aspx'],
 'high', NULL, '2026-10-26'),

('ON','kitchener','animal',$$Humane Society of Kitchener Waterloo & Stratford Perth$$,NULL,
 $$https://kwsphumane.ca/lost-and-found$$,
 $$250 Riverbend Drive, Kitchener, ON N2B 2E9$$, $$519-745-5615$$, $$infokw@kwsphumane.ca$$,
 $$Monday to Friday 9 a.m. to 6 p.m.; Saturday and Sunday 10 a.m. to 4 p.m.; closed holidays$$,
 $$Owners file a lost pet report, check the found pets page and call often. To reclaim, bring ID with address and proof of ownership; impound fees apply. Finders call or file an online found report and bring in dogs or small animals they cannot house; healthy cats should be left where they are.$$,
 NULL,
 ARRAY['https://kwsphumane.ca/lost-and-found','https://www.kwsphumane.ca/municipal-animal-services'],
 'high', $$Municipal animal services provider for the City of Kitchener. Hold period not published.$$, '2026-10-26'),

-- ========================= WINDSOR =========================
('ON','windsor','police',$$Windsor Police Service$$,NULL,
 $$https://windsorpolice.ca/services/reporting/online/lost-found$$,
 NULL, $$519-258-6111 (non-emergency)$$, NULL, NULL,
 $$Lost property in Windsor or Amherstburg can be reported online. Found-property reports are accepted only for government-issued ID or government property; an officer then arranges collection. Police do not pick up everyday lost items, electronics, clothing, bags or tools. Found weapons, dangerous items, crime-related items or large amounts of cash: call the non-emergency line.$$,
 NULL,
 ARRAY['https://windsorpolice.ca/services/reporting/online/lost-found'],
 'high', NULL, '2026-10-26'),

('ON','windsor','transit',$$Transit Windsor$$,NULL,
 $$https://www.citywindsor.ca/residents/transit-windsor/contact-information$$,
 $$Windsor International Transit Terminal, 300 Chatham Street West, Windsor, ON N9A 0A8$$, $$519-944-4111$$, NULL,
 $$Customer service: 8 a.m. to 6 p.m., seven days a week (reduced on some holidays)$$,
 $$Call to ask about a lost item; if found, customer service arranges pickup.$$,
 $$Found items stored 14 days$$,
 ARRAY['https://www.citywindsor.ca/residents/transit-windsor/contact-information'],
 'high', NULL, '2026-10-26'),

('ON','windsor','airport',$$Windsor International Airport$$,NULL,
 $$https://flyyqg.ca/faq$$,
 NULL, $$+1 (519) 969-2430 ext. 0$$, $$soc@yqg.ca$$, NULL,
 $$Ask at the Airport Terminal Security Office in the terminal concourse, or contact Airport Security by phone or email. Items left on an aircraft: the airline.$$,
 NULL,
 ARRAY['https://flyyqg.ca/faq'],
 'high', NULL, '2026-10-26'),

('ON','windsor','animal',$$Windsor/Essex County Humane Society$$,NULL,
 $$https://windsorhumane.org/i-lost-my-dog/$$,
 $$1375 Provincial Rd, Windsor, ON$$, $$519-966-5751 ext 110$$, $$pound@windsorhumane.org$$,
 $$Intake and reclaims by appointment, 8 a.m. to 6 p.m. daily; closed holidays$$,
 $$Owners report a lost pet by phone or by emailing a photo. Reclaims by appointment with ID showing address and proof of ownership (dogs: $75 claim fee without a current licence tag, plus $25/day after 24 hours; cats: $25). Finders call to book a drop-off or email a photo; the shelter will pick up a found dog in Windsor or Amherstburg if the finder cannot keep it.$$,
 $$Stray dogs and friendly stray cats held three days; after that the owner loses all legal rights to the animal$$,
 ARRAY['https://windsorhumane.org/i-lost-my-dog/','https://windsorhumane.org/i-found-a-dog/','https://www.citywindsor.ca/city-hall/licensing-and-registration/dog-licences/who-to-call-and-when-animal-concerns-in-windsor-essex'],
 'high', $$Animal control provider for Windsor and Amherstburg.$$, '2026-10-26'),

-- ========================= OSHAWA =========================
('ON','oshawa','police',$$Durham Regional Police Service$$,NULL,
 $$https://www.drps.ca/online-services/online-reporting-and-registries/report-a-crime/$$,
 $$Central East Division, 77 Centre Street, Oshawa, ON L1G 4B7$$, $$1-888-579-1520 (non-emergency, press 0)$$, NULL, NULL,
 $$Lost property can be reported online ('Property Lost'), for incidents in Durham Region worth up to $10,000. For lost or found property, do not call 9-1-1: call the non-emergency line or go to a local division in person.$$,
 NULL,
 ARRAY['https://www.drps.ca/online-services/online-reporting-and-registries/report-a-crime/','https://www.drps.ca/media/rcae4o1t/visitorprintable.pdf','https://www.drps.ca/about-us/operational-divisions/central-east-division/'],
 'medium', $$No official page on how found property is held, returned or for how long.$$, '2026-10-26'),

('ON','oshawa','transit',$$Durham Region Transit (DRT)$$,NULL,
 $$https://www.durhamregiontransit.com/travelling-with-us/lost-and-found/$$,
 $$Customer Service Centre, 110 Westney Road South, Ajax L1S 2C8$$, $$1-866-247-0055$$, NULL,
 $$Call Centre: Monday to Friday 7 a.m. to 6 p.m., weekends 8 a.m. to 4:30 p.m.$$,
 $$Call or use the online Customer Comment Form, with the bus number or departure time, route and time of loss. Items are collected at the Ajax Customer Service Centre by the owner only, with ID and a detailed description.$$,
 $$Unclaimed items donated after 30 days$$,
 ARRAY['https://www.durhamregiontransit.com/travelling-with-us/lost-and-found/'],
 'high', $$Pickup is in Ajax, not Oshawa.$$, '2026-10-26'),

('ON','oshawa','animal',$$Oshawa Animal Services$$,NULL,
 $$https://www.oshawa.ca/living-here/animal-services/lost-and-found-pets/$$,
 NULL, $$905-436-3311 (Service Oshawa)$$, $$service@oshawa.ca$$,
 $$Monday to Saturday 8:30 a.m. to 4:30 p.m.; closed Sundays and statutory holidays$$,
 $$Owners check the list of lost pets in the City's care, file a lost pet report online, or call Service Oshawa. Finders report a stray to Service Oshawa as soon as possible, with location, tag or collar details and a description.$$,
 NULL,
 ARRAY['https://www.oshawa.ca/living-here/animal-services/lost-and-found-pets/'],
 'high', $$Shelter address, hold period and fees not published.$$, '2026-10-26'),

-- ========================= BARRIE =========================
('ON','barrie','police',$$Barrie Police Service – Seized Property and Evidence Unit$$,NULL,
 $$https://www.barriepolice.ca/services/seized-property-evidence-unit/$$,
 $$110 Fairview Road, Barrie, ON L4N 8X8$$, $$705-725-7025 ext. 2979$$, NULL,
 $$Monday to Friday, 8 a.m. to 3 p.m.$$,
 $$Owners contact the unit to find out whether their property was turned in, call before coming to confirm it can be released and what to bring, and book an appointment with their occurrence number and photo ID.$$,
 $$Found property held 90 days while police try to notify the owner (bicycles 30 days); unclaimed property is then disposed of under the Community Safety and Policing Act, some sold through Police Auctions Canada$$,
 ARRAY['https://www.barriepolice.ca/services/seized-property-evidence-unit/'],
 'high', $$No published procedure for finders handing in property.$$, '2026-10-26'),

('ON','barrie','transit',$$Barrie Transit (City of Barrie)$$,NULL,
 $$https://www.barrie.ca/services-payments/transportation-parking/barrie-transit$$,
 $$Barrie Allandale Transit Terminal, 20 Essa Road, Barrie$$, $$705-726-4242 (Service Barrie)$$, $$ServiceBarrie@barrie.ca$$, NULL,
 $$Items found on buses are processed, then taken to the Lost and Found at the Allandale Transit Terminal (one to two business days). Contact Service Barrie before going to the terminal.$$,
 $$One week only$$,
 ARRAY['https://www.barrie.ca/services-payments/transportation-parking/barrie-transit'],
 'high', NULL, '2026-10-26'),

('ON','barrie','animal',$$City of Barrie Enforcement Services (animal control)$$,NULL,
 $$https://www.barrie.ca/services-payments/permits-licences-applications/pet-registration$$,
 NULL, $$705-739-4241$$, $$enforcement.services@barrie.ca$$, NULL,
 $$Animal control matters go to Enforcement Services. Anyone who finds a stray can call Animal Services so the pet can be identified and returned. Owners redeem an impounded dog or cat after paying the fees set by the City.$$,
 $$Impounded dogs and cats may be redeemed within three days, not counting Sundays and statutory holidays (Animal Control By-law 2010-035)$$,
 ARRAY['https://www.barrie.ca/government-news/contact-us/contact-service-barrie','https://www.barrie.ca/services-payments/permits-licences-applications/pet-registration','https://www.barrie.ca/Animal-Control-Bylaw.pdf'],
 'medium', $$By-law marked 'as amended'; re-check before citing the 3-day period.$$, '2026-10-26'),

('ON','barrie','animal',$$Ontario SPCA and Humane Society – Barrie and District Animal Centre$$,NULL,
 $$https://ontariospca.ca/barrie/$$,
 $$91 Patterson Rd., Barrie$$, NULL, NULL,
 $$Open seven days a week, 11 a.m. to 6 p.m.; closed to the public on statutory holidays$$,
 $$Finders of a stray contact the municipality's animal control first. The centre checks strays for a microchip and lists found animals online.$$,
 NULL,
 ARRAY['https://ontariospca.ca/barrie/','https://ontariospca.ca/what-we-do/community-support-services/lost-found-2/'],
 'medium', $$Current pound contract with the City not confirmed on the centre's page.$$, '2026-10-26'),

('ON','barrie','university',$$Georgian College – Campus Safety Services$$,NULL,
 $$https://www.georgiancollege.ca/about-georgian/campus-safety-services/$$,
 $$Security office, room E006, Barrie Campus$$, $$705.722.5100 (security non-emergency)$$, $$campussafetyservices@georgiancollege.ca$$, NULL,
 $$Owners give their details and a description at the security office; the item goes into the missing item database and they are notified if it is turned in. Finders bring items to the same office or call so a guard can collect them.$$,
 NULL,
 ARRAY['https://www.georgiancollege.ca/about-georgian/campus-safety-services/'],
 'high', NULL, '2026-10-26')

ON CONFLICT (province_id, city_ascii, kind, name) DO UPDATE SET
  name_fr = EXCLUDED.name_fr, url = EXCLUDED.url, address = EXCLUDED.address,
  phone = EXCLUDED.phone, email = EXCLUDED.email, hours = EXCLUDED.hours,
  procedure = EXCLUDED.procedure, retention = EXCLUDED.retention,
  source_urls = EXCLUDED.source_urls, confidence = EXCLUDED.confidence,
  notes = EXCLUDED.notes, verified_at = EXCLUDED.verified_at;

-- 3) Contrôle : nombre d'organismes par ville et par type ---------------------
SELECT city_ascii,
       count(*) FILTER (WHERE kind = 'police')     AS police,
       count(*) FILTER (WHERE kind = 'transit')    AS transport,
       count(*) FILTER (WHERE kind = 'airport')    AS aeroport,
       count(*) FILTER (WHERE kind = 'animal')     AS animaux,
       count(*) FILTER (WHERE kind = 'university') AS campus,
       count(*)                                    AS total,
       count(*) FILTER (WHERE confidence = 'high') AS fiabilite_haute
FROM ca_city_pois
WHERE province_id = 'ON'
GROUP BY city_ascii
ORDER BY total DESC;
