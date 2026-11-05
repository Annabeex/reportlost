-- ============================================================
-- CANADA : guides de 10 villes de l'Ontario (ca_city_guides), statut BROUILLON.
-- Pages : https://reportlost.org/ca/on/<ville> (noindex tant que status = 'draft').
-- Chaque fait vient des pages officielles listées dans "sources" (relevées le 2026-11-05).
-- Idempotent : relancer le fichier remplace le contenu des brouillons, sans toucher au statut.
-- ============================================================

INSERT INTO ca_city_guides (province_id, city_ascii, lang, guide, status, verified)
VALUES
('ON', 'ottawa', 'en', $json${
 "province": "ON",
 "citySlug": "ottawa",
 "lang": "en",
 "cityName": "Ottawa",
 "metaTitle": "Lost and Found in Ottawa: OC Transpo, YOW Airport and Police",
 "metaDescription": "Where lost items go in Ottawa: OC Transpo at St-Laurent Station, Ottawa Police property unit, YOW airport, VIA Rail and the Ottawa Humane Society.",
 "h1": "Lost and found in Ottawa",
 "lede": "In Ottawa, a lost item stays with the organisation that runs the place where it was left or turned in: OC Transpo, VIA Rail, the airport, a venue or the police. This page lists who holds what, for how long, and how to ask.",
 "lastReviewed": "2026-11-05",
 "map": {
  "mode": "places",
  "heading": "Where lost items are held in Ottawa",
  "places": [
   {
    "name": "OC Transpo Lost and Found, St-Laurent Station",
    "address": "St-Laurent Station, St. Laurent Boulevard at the Queensway, Ottawa",
    "lat": 45.4206,
    "lng": -75.6381
   },
   {
    "name": "Ottawa Police Service, Evidence Control Unit",
    "address": "2799 Swansea Crescent, by appointment only",
    "lat": 45.3791,
    "lng": -75.6174
   }
  ],
  "note": "OC Transpo's Lost and Found is on the main floor of St-Laurent Station, just inside the doors facing the mall; the Ottawa Police Evidence Control Unit releases property by appointment only."
 },
 "cardsHeading": "Who holds lost items in Ottawa",
 "cards": [
  {
   "kind": "transit",
   "title": "OC Transpo Lost and Found (St-Laurent Centre)",
   "where": "Main floor of St-Laurent Station, just inside the doors facing the mall",
   "body": [
    "For items found on the OC Transpo system. Report the item with the online Lost and Found portal: give your contact details, the item category, and where and when you lost it, such as the bus number or station platform. You receive a confirmation email with an inquiry ID, and staff email you if a matching item comes in. If nothing matches after three days, an automatic email asks for more details. Without internet access, call 613-560-5000, option 6.",
    "Pick up the item in person with valid photo ID. Someone else can collect it if you first reply through the portal with their full name; they bring their own valid photo ID. Open Monday to Friday, 8:30 a.m. to 4 p.m., closed weekends and statutory holidays.",
    "The Lost and Found, previously run at Heartwood House, is now at St-Laurent Station. It does not keep hazardous items, drugs, alcohol, large sums of money or personal identification; school and workplace IDs are returned to the institution named on them. Items lost in a Para Transpo taxi are reported with a separate taxi lost and found form."
   ],
   "hold": "21 days, then unclaimed items are donated to Heartwood House for its unclaimed items sale.",
   "contacts": [
    {
     "label": "Phone (Lost and Found, option 6)",
     "value": "613-560-5000",
     "href": "tel:+16135605000"
    }
   ],
   "links": [
    {
     "label": "OC Transpo lost and found →",
     "href": "https://octranspo.com/lostandfound"
    }
   ]
  },
  {
   "kind": "transit",
   "title": "VIA Rail Canada, Ottawa station",
   "where": "200 Tremblay Road",
   "body": [
    "If you leave an item on a VIA train, report it on arrival at the station's baggage or ticket counter; station staff help locate it. Baggage lost or stolen in a station can be reported to VIA's Lost and Found by phone or at the ticket counter.",
    "The Ottawa station ticket counter is open Monday to Saturday, 4:15 a.m. to 7:15 p.m., and Sunday, 7 a.m. to 7:15 p.m."
   ],
   "contacts": [
    {
     "label": "Lost items, Ottawa station",
     "value": "613-907-8328",
     "href": "tel:+16139078328"
    },
    {
     "label": "VIA Lost and Found",
     "value": "1 888 842-7245",
     "href": "tel:+18888427245"
    }
   ],
   "links": [
    {
     "label": "VIA Rail Ottawa station →",
     "href": "https://viarail.ca/en/explore-our-destinations/stations/ontario/ottawa"
    }
   ]
  },
  {
   "kind": "airport",
   "title": "Ottawa International Airport (YOW)",
   "body": [
    "The Ottawa International Airport Authority asks you to contact PARS 2000 for an item lost on airport property. Items left on an airplane, and lost, damaged or delayed luggage, are handled by your airline.",
    "For an item left in a taxi on the way to the airport, contact that taxi company. For a taxi taken from the airport, contact Coventry Connections."
   ],
   "contacts": [
    {
     "label": "Coventry Connections (taxis from the airport)",
     "value": "613-523-1234",
     "href": "tel:+16135231234"
    }
   ],
   "links": [
    {
     "label": "YOW contact page →",
     "href": "https://www.yow.ca/contactus"
    }
   ]
  },
  {
   "kind": "police",
   "title": "Ottawa Police Service, Evidence Control Unit",
   "where": "2799 Swansea Crescent, by appointment only (closed to walk-ins)",
   "body": [
    "To report found property, call the Police Reporting Unit at 613-236-1222, ext. 7300. Lost property can be reported online, free of charge, only if it has a visible serial number or a distinct marking such as a custom engraving. Lost cellphones, licence plates, bank cards and government-issued ID cannot be reported online: for cellphones contact your service provider, for bank cards your financial institution, and for ID the issuing service.",
    "For a missing bicycle or another lost article, contact Property Services. Only the legal owner may collect property, by appointment booked in advance, between 8 a.m. and 2 p.m., Monday to Friday. Have your Ottawa Police file number ready, and bring proof of ownership and one piece of ID showing your name and date of birth. Items held as evidence in a criminal case may not be released."
   ],
   "hold": "Items with no known owner 90 days; found bicycles 30 days. Unclaimed items may be sold, through Rideau Auctions or GC Surplus, or disposed of, depending on condition.",
   "contacts": [
    {
     "label": "Property Services (appointments), ext. 5238",
     "value": "613-236-1222 ext. 5238",
     "href": "tel:+16132361222"
    },
    {
     "label": "Property Services email",
     "value": "propertyservices@ottawapolice.ca",
     "href": "mailto:propertyservices@ottawapolice.ca"
    },
    {
     "label": "Police Reporting Unit (found property), ext. 7300",
     "value": "613-236-1222 ext. 7300",
     "href": "tel:+16132361222"
    }
   ],
   "links": [
    {
     "label": "Ottawa Police property →",
     "href": "https://www.ottawapolice.ca/en/sections-and-units/operations-and-support/property/"
    }
   ]
  },
  {
   "kind": "animal",
   "title": "City of Ottawa By-law Services (lost and found pets)",
   "body": [
    "To report a lost pet, file a lost pet request online or call 3-1-1, with a description, the City registration tag number and the microchip number if there is one. The City also suggests visiting the Ottawa Humane Society shelter with a colour photo of your pet and checking local veterinary clinics.",
    "If you find a pet wearing a City of Ottawa tag, call 3-1-1: By-law Services checks the registration database to find the owner. A found pet without a City tag is taken to the Ottawa Humane Society, where staff scan it for a microchip."
   ],
   "contacts": [
    {
     "label": "City of Ottawa",
     "value": "3-1-1"
    }
   ],
   "links": [
    {
     "label": "City of Ottawa lost and found pets →",
     "href": "https://ottawa.ca/en/living-ottawa/animals-and-pets/lost-and-found-pets"
    }
   ]
  },
  {
   "kind": "animal",
   "title": "Ottawa Humane Society, Municipal Animal Shelter",
   "where": "245 West Hunt Club Road, Ottawa, ON K2E 1A6",
   "body": [
    "Owners submit an online Lost Pet Report with a detailed description and, if possible, a photo, and check the Society's lost and found pet pictures, updated hourly. Finders submit an online Found Pet Report or contact the Society, and bring the pet to the shelter if the owner cannot be found; an appointment is recommended, but walk-ins are accepted.",
    "No appointment is needed to claim a pet. Bring valid ID showing your current address, proof of ownership such as an adoption certificate, a recent veterinary bill or a City licence, and payment of release fees by cash, credit or debit. Intake and Lost and Found hours: Monday to Friday, 9 a.m. to 8 p.m.; Saturday, 10 a.m. to 5 p.m.; Sunday, 11 a.m. to 4 p.m.; closed statutory holidays."
   ],
   "hold": "Strays are held three full days, not counting the day of entry or statutory holidays. After that, the Ottawa Humane Society becomes the legal owner.",
   "contacts": [
    {
     "label": "Intake / Lost and Found, ext. 223",
     "value": "613-725-3166 ext. 223",
     "href": "tel:+16137253166"
    },
    {
     "label": "Email",
     "value": "intake@ottawahumane.ca",
     "href": "mailto:intake@ottawahumane.ca"
    }
   ],
   "links": [
    {
     "label": "Ottawa Humane Society lost and found →",
     "href": "https://www.ottawahumane.ca/get-help/lost-and-found"
    }
   ]
  },
  {
   "kind": "other",
   "title": "Carleton University Lost and Found",
   "where": "Campus Card, 407 Nideyinan (main location), 1125 Colonel By Drive",
   "body": [
    "Items found on campus are turned in at Campus Card, Teraanga Commons Reception Services, the Athletics Welcome Centre in Alumni Hall, or the Library Services Desk in MacOdrum Library, and most are logged in a central portal. Owners of identifiable items are contacted at their Carleton email address.",
    "Items are claimed during each location's regular hours, and staff may ask for ID. Passports are turned over to Passport Canada immediately, and government-issued ID is returned to the issuing agency after 30 days. For abandoned property found on campus, call the Campus Safety Services non-emergency line."
   ],
   "hold": "Unidentifiable items 30 days, then donated or resold; in residence, 14 days from May to August.",
   "contacts": [
    {
     "label": "Campus Card email",
     "value": "campuscard@carleton.ca",
     "href": "mailto:campuscard@carleton.ca"
    },
    {
     "label": "Campus Safety Services (non-emergency)",
     "value": "613-520-3612",
     "href": "tel:+16135203612"
    }
   ],
   "links": [
    {
     "label": "Carleton lost and found →",
     "href": "https://carleton.ca/lostandfound/"
    }
   ]
  }
 ],
 "found": {
  "heading": "Found something in Ottawa?",
  "body": [
   "Hand the item to the organisation that runs the place where you found it. On OC Transpo, give it to any bus operator or Special Constable, or bring it to the St-Laurent Lost and Found Centre or the Rideau Customer Service Centre. For other found property, the Ottawa Police Service asks you to call its Police Reporting Unit at 613-236-1222, ext. 7300. A found pet wearing a City of Ottawa tag is reported to 3-1-1; a pet without a City tag goes to the Ottawa Humane Society. On Carleton's campus, items go to Campus Card or another designated location.",
   "If you find a Canadian passport, the Government of Canada asks you to return it to a passport office, a Service Canada Centre, or a police or RCMP station, with a short letter saying how, when and where you found it. A found Ontario health card can be brought to any ServiceOntario location or police station, or dropped in any Canada Post mailbox.",
   "Under Ontario's Community Safety and Policing Act, 2019 (s. 258), police may sell unclaimed property they hold, other than money and firearms, once it has been held for at least one month for a bicycle or three months for most other items. The Act does not give finders a right to claim items handed to the police."
  ]
 },
 "optionsHeading": "Reporting a loss with ReportLost",
 "options": [
  "Free listing: your report is published as a searchable public listing.",
  "Automatic search, CA$17 once: six months of public-web monitoring with potential matches reviewed before notification, a dated ReportLost certificate, an anonymous email address linked to your report, and printable QR stickers linked to it.",
  "Team-assisted search, CA$35 once: everything in the CA$17 option, with 12 months of monitoring, manual research by a team member, direct contact with relevant services and venues, submission of your report to appropriate lost-property services, and a notice shared with relevant local groups under their posting rules.",
  "Recovery is never guaranteed. Each organisation listed above applies its own procedure and decides whether it accepts a report filed by a third party."
 ],
 "faq": [
  {
   "q": "Where is OC Transpo's lost and found?",
   "a": "OC Transpo's Lost and Found, previously run at Heartwood House, is now on the main floor of St-Laurent Station, just inside the doors facing the mall. It is open Monday to Friday, 8:30 a.m. to 4 p.m. Report your item first with the online portal; staff email you if a match comes in, and you pick it up with valid photo ID."
  },
  {
   "q": "How long does OC Transpo keep lost items?",
   "a": "Items are kept for 21 days, then donated to Heartwood House for its unclaimed items sale. The office does not keep personal identification, large sums of money or hazardous items, and school or workplace IDs are returned to the institution named on them."
  },
  {
   "q": "Can I report a lost phone to the Ottawa Police?",
   "a": "Not online. The Ottawa Police Service's online system does not accept lost cellphones and asks you to contact your service provider. Lost property can be reported online only if it has a visible serial number or a distinct marking such as a custom engraving. For help, call the Police Reporting Unit at 613-236-1222, ext. 7300."
  },
  {
   "q": "I lost something at Ottawa airport. Who do I contact?",
   "a": "For an item lost on airport property, the Airport Authority directs you to PARS 2000. For an item left on the plane, or lost or delayed luggage, contact your airline. For an item left in a taxi from the airport, contact Coventry Connections at 613-523-1234."
  },
  {
   "q": "Is ReportLost an official lost and found service?",
   "a": "No. ReportLost is an independent service. It is not affiliated with OC Transpo, VIA Rail, the Ottawa International Airport Authority, the Ottawa Police Service, the City of Ottawa, the Ottawa Humane Society or Carleton University, and it does not replace their procedures. Recovery is never guaranteed."
  }
 ],
 "sources": [
  {
   "label": "OC Transpo, Lost and Found",
   "href": "https://octranspo.com/lostandfound"
  },
  {
   "label": "OC Transpo, Lost and Found (customer service)",
   "href": "https://octranspo.com/en/our-services/customer-service/lost-found"
  },
  {
   "label": "OC Transpo, Lost & Found: new location, new online tool starting Dec. 2",
   "href": "https://octranspo.com/en/news/article/lost-found-new-location-new-online-tool-starting-dec-2"
  },
  {
   "label": "OC Transpo, OC Explained: Lost and Found",
   "href": "https://www.octranspo.com/en/news/article/oc-explained-lost-and-found"
  },
  {
   "label": "VIA Rail, Ottawa station",
   "href": "https://viarail.ca/en/explore-our-destinations/stations/ontario/ottawa"
  },
  {
   "label": "VIA Rail, Forgotten personal item on the train",
   "href": "https://www.viarail.ca/en/plan/faq/baggage/what-should-passengers-do-if-they-forget-a-personal-item-on-the-train"
  },
  {
   "label": "VIA Rail, Baggage lost or stolen at the station",
   "href": "https://www.viarail.ca/en/plan/faq/baggage/what-should-passengers-do-if-their-baggage-is-lost-or-stolen-at-the-station"
  },
  {
   "label": "Ottawa International Airport Authority, Contact us",
   "href": "https://www.yow.ca/contactus"
  },
  {
   "label": "Ottawa Police Service, Property (Evidence Control Unit)",
   "href": "https://www.ottawapolice.ca/en/sections-and-units/operations-and-support/property/"
  },
  {
   "label": "Ottawa Police Service, File a report",
   "href": "https://www.ottawapolice.ca/en/reports-and-services/file-a-report/"
  },
  {
   "label": "City of Ottawa, Lost and found pets",
   "href": "https://ottawa.ca/en/living-ottawa/animals-and-pets/lost-and-found-pets"
  },
  {
   "label": "Ottawa Humane Society, Lost and found",
   "href": "https://www.ottawahumane.ca/get-help/lost-and-found"
  },
  {
   "label": "Carleton University, Lost and Found",
   "href": "https://carleton.ca/lostandfound/"
  },
  {
   "label": "Carleton University, Lost and Found Guidelines",
   "href": "https://carleton.ca/lostandfound/lost-and-found-guidelines/"
  },
  {
   "label": "Wikipedia, St-Laurent station (Ottawa) (map coordinates)",
   "href": "https://en.wikipedia.org/wiki/St-Laurent_station_(Ottawa)"
  },
  {
   "label": "Government of Canada, Found passports",
   "href": "https://www.canada.ca/en/immigration-refugees-citizenship/services/canadian-passports/lost-stolen-inaccessible-damaged-found.html"
  },
  {
   "label": "Ontario, Health card (found card)",
   "href": "https://www.ontario.ca/page/replace-cancel-or-change-information-your-health-card"
  },
  {
   "label": "Community Safety and Policing Act, 2019, s. 258",
   "href": "https://www.ontario.ca/laws/statute/19c01"
  }
 ],
 "disclaimer": "ReportLost is independent and is not affiliated with any organisation listed on this page. Contacts and procedures are taken from each organisation's official website and may change; check with the organisation before going to an office."
}$json$::jsonb, 'draft', false),
('ON', 'mississauga', 'en', $json${
 "province": "ON",
 "citySlug": "mississauga",
 "lang": "en",
 "cityName": "Mississauga",
 "metaTitle": "Lost and Found in Mississauga: MiWay, Pearson and Peel Police",
 "metaDescription": "Where lost items end up in Mississauga: MiWay at City Centre Transit Terminal, GO Transit, Pearson Terminal 1, Peel Police and Animal Services.",
 "h1": "Lost and found in Mississauga",
 "lede": "In Mississauga, a lost item stays with the organisation that runs the place where it was left or turned in: MiWay, GO Transit, Toronto Pearson, a library, a campus or the police. This page lists who holds what, for how long, and how to ask.",
 "lastReviewed": "2026-11-05",
 "map": {
  "mode": "places",
  "heading": "Where lost items are held in Mississauga",
  "places": [
   {
    "name": "MiWay Lost and Found, Information Booth",
    "address": "City Centre Transit Terminal, 200 Rathburn Road West, Mississauga, ON",
    "lat": 43.5939,
    "lng": -79.6466
   },
   {
    "name": "Toronto Pearson Lost and Found Office",
    "address": "Terminal 1, before security, between doors R and S",
    "lat": 43.6809,
    "lng": -79.6113
   }
  ],
  "note": "MiWay keeps items for a maximum of seven days, so call 905-615-4636 before going to the City Centre Transit Terminal. Items found on GO trains and at GO stations are held at Union Station in Toronto."
 },
 "cardsHeading": "Who holds lost items in Mississauga",
 "cards": [
  {
   "kind": "transit",
   "title": "MiWay Lost and Found (City of Mississauga)",
   "where": "Information Booth, City Centre Transit Terminal, 200 Rathburn Road West",
   "body": [
    "For items left on MiWay buses. Call first to confirm whether MiWay has your item. Items must be picked up in person at the Information Booth: bring photo ID and be ready to describe the item clearly. There is no public access to the transit garages.",
    "The Information Booth is open weekdays from 8 a.m. to 7 p.m. and weekends from 9:30 a.m. to 5 p.m. It is closed on holidays, except Boxing Day (9:30 a.m. to 5 p.m.). Hours are subject to change without notice."
   ],
   "hold": "A maximum of seven days.",
   "contacts": [
    {
     "label": "Lost and found (weekdays 7 a.m. to 7 p.m.; weekends and holidays 9:30 a.m. to 5 p.m.)",
     "value": "905-615-4636",
     "href": "tel:+19056154636"
    }
   ],
   "links": [
    {
     "label": "Contact MiWay →",
     "href": "https://www.mississauga.ca/miway-transit/contact-miway"
    }
   ]
  },
  {
   "kind": "transit",
   "title": "GO Transit Lost and Found (Metrolinx)",
   "where": "Counter 6, York Concourse, Union Station, 35 York Street, Toronto",
   "body": [
    "For items left on GO trains, GO buses, or at GO stations, including the stations in Mississauga. Report the item with GO's online form. Found items are brought to the Union Station office in Toronto and can take up to ten business days to get there.",
    "To claim an item, bring ID and proof of ownership, such as the phone number of a lost phone. You can name someone to claim it for you, or arrange a prepaid courier pickup.",
    "Open Monday to Friday, 10 a.m. to 6 p.m., and Saturday and Sunday, 10 a.m. to 5:30 p.m. Closed on statutory holidays."
   ],
   "hold": "30 calendar days, then unclaimed items are donated.",
   "contacts": [
    {
     "label": "Phone",
     "value": "416-202-1600",
     "href": "tel:+14162021600"
    }
   ],
   "links": [
    {
     "label": "GO Transit lost and found →",
     "href": "https://www.gotransit.com/en/lost-and-found"
    }
   ]
  },
  {
   "kind": "airport",
   "title": "Toronto Pearson International Airport, Lost and Found Office",
   "where": "Terminal 1, Ground Level, before security, between doors R and S (6301 Silver Dart Drive, Mississauga)",
   "body": [
    "Toronto Pearson is located in Mississauga. Its Lost and Found Office handles items lost in the terminals or parking garages. Filing a report, online or at the office, is free, and you receive a confirmation email with a report number. The office checks its inventory for 30 days and emails you the result. The airport warns of scam sites that charge a fee to file a report.",
    "If an item matches, you can collect it at the Terminal 1 office with valid government photo ID, send an authorised friend or family member, or arrange and pay for shipping. Open Monday to Friday, 10 a.m. to 6 p.m.; closed Saturday and Sunday.",
    "Items left on board an aircraft, including checked luggage, are claimed from the airline. The office does not hold passports, NEXUS cards, perishables, neck pillows, food and drink containers, or items lost on public transit."
   ],
   "hold": "All found items are kept 30 days from the date they are turned in.",
   "links": [
    {
     "label": "Pearson lost and found →",
     "href": "https://www.torontopearson.com/en/while-you-are-here/toronto-airport-services/lost-and-found-office"
    }
   ]
  },
  {
   "kind": "police",
   "title": "Peel Regional Police",
   "body": [
    "Peel Regional Police accepts online lost property reports for losses under $10,000, and only where the item has a serial number, engraving or identifiable markings, such as a cellphone, a laptop, a driver's licence or a health card. These reports are not actively investigated; they are kept for records purposes so the item can be returned if it is found.",
    "Keys, money, clothing, eyeglasses, licence plates, Canadian or foreign passports, credit, bank, membership and rewards cards, and parking permits are not accepted online. If your loss does not meet the online criteria, visit an Operational Division or Community Station, or call the non-emergency line. Property lost at Toronto Pearson is reported to the airport's Lost and Found.",
    "An online report needs a valid email address and phone number, and is typically reviewed within 21 business days. If you find property you reported lost, you can update or cancel the report online with your report number."
   ],
   "contacts": [
    {
     "label": "Non-emergency line (press 1)",
     "value": "905-453-3311",
     "href": "tel:+19054533311"
    },
    {
     "label": "Online report inquiries (put your temporary report number in the subject line)",
     "value": "OCRB-Team@peelpolice.ca",
     "href": "mailto:OCRB-Team@peelpolice.ca"
    }
   ],
   "links": [
    {
     "label": "Peel Regional Police online reporting →",
     "href": "https://peelpolice.ca/en/report-it/online-reporting.aspx"
    }
   ]
  },
  {
   "kind": "animal",
   "title": "Mississauga Animal Services (City of Mississauga)",
   "where": "Animal Services Shelter, 735 Central Parkway West, open Monday to Saturday, 10 a.m. to 6 p.m.",
   "body": [
    "If you lost a pet, check the City's online list of found pets, then call the shelter team to be reunited with your pet.",
    "If you find an animal, call the same number or bring it to the shelter in person during opening hours."
   ],
   "contacts": [
    {
     "label": "Lost and found pets",
     "value": "905-896-5864 ext. 3",
     "href": "tel:+19058965864"
    },
    {
     "label": "Email",
     "value": "mypet.info@mississauga.ca",
     "href": "mailto:mypet.info@mississauga.ca"
    }
   ],
   "links": [
    {
     "label": "City of Mississauga missing pets →",
     "href": "https://www.mississauga.ca/services-and-programs/animals-and-pets/missing-pets/"
    }
   ]
  },
  {
   "kind": "other",
   "title": "Mississauga Library",
   "body": [
    "Items left at a Mississauga Library location are claimed at the location where you believe you lost them. Describe the item accurately, with the date you left it; depending on the item, staff may ask for more information or matching identification.",
    "Government-issued ID, such as a driver's licence or health card, is turned in to Peel Regional Police if the owner cannot be found. Passports are forwarded to Peel Regional Police immediately."
   ],
   "hold": "Clothing, glasses, shoes, personal books, general keys and documents left in copiers: 14 days. Jewellery, watches, money, car keys, sports equipment, gift cards and cameras: 30 days. Phones, tablets and laptops: 90 days. Perishables are disposed of immediately; unclaimed items are donated to charity, discarded, shredded or erased depending on the item.",
   "links": [
    {
     "label": "Mississauga Library lost property guideline →",
     "href": "https://www.mississauga.ca/wp-content/uploads/sites/4/2023/05/Mississauga-Library-Lost-Property-Guideline-Rev.pdf"
    }
   ]
  },
  {
   "kind": "university",
   "title": "University of Toronto Mississauga (UTM) Service Desk",
   "where": "UTM Service Desk, CCT Atrium",
   "body": [
    "Report lost or found items on the UTM campus to the Service Desk, with your UTORid and a detailed description of the location. To claim an item, describe it in detail and bring valid ID.",
    "Items left on UTM shuttle buses are placed by drivers in a locked bin inside the Instructional Centre and retrieved by the Service Desk. The Service Desk is open weekdays from 8 a.m. to 8 p.m. and weekends from 9 a.m. to 5 p.m."
   ],
   "links": [
    {
     "label": "UTM lost and found →",
     "href": "https://www.utm.utoronto.ca/iits/utm-service-desk-resources/lost-found"
    }
   ]
  },
  {
   "kind": "university",
   "title": "Sheridan College Campus Safety, Hazel McCallion Campus",
   "where": "4180 Duke of York Boulevard, Mississauga",
   "body": [
    "Sheridan's Campus Safety collects and stores items found on campus or nearby grounds, and records items reported lost, missing or suspected stolen. Ask in person at a Campus Safety Office or by phone; Campus Safety may take your contact details to reach you if the item turns up.",
    "To claim an item, bring valid photo ID: a Sheridan onecard or government-issued ID. Some items may be held as evidence in a pending investigation."
   ],
   "hold": "Up to one year, depending on the item's value.",
   "contacts": [
    {
     "label": "Campus Safety",
     "value": "905-815-4044",
     "href": "tel:+19058154044"
    }
   ],
   "links": [
    {
     "label": "Sheridan lost and found →",
     "href": "https://www.sheridancollege.ca/student-life/campus-services/safety/lost-found"
    }
   ]
  }
 ],
 "found": {
  "heading": "Found something in Mississauga?",
  "body": [
   "Hand the item to the organisation that runs the place where you found it. MiWay's lost and found is at the Information Booth of the City Centre Transit Terminal; items found on GO trains and at GO stations go to GO Transit's office at Union Station in Toronto; items found in Pearson's terminals go to the airport's Lost and Found Office in Terminal 1. On the UTM campus, report found items to the UTM Service Desk; at Sheridan, Campus Safety stores items found on campus. If you find an animal, call Mississauga Animal Services at 905-896-5864 ext. 3 or bring it to the shelter at 735 Central Parkway West.",
   "If you find a Canadian passport, the Government of Canada asks you to return it to a passport office, a Service Canada Centre, or a police or RCMP station, with a short letter saying how, when and where you found it. A found Ontario health card can be brought to any ServiceOntario location or police station, or dropped in any Canada Post mailbox.",
   "Under Ontario's Community Safety and Policing Act, 2019 (s. 258), police may sell unclaimed property they hold, other than money and firearms, once it has been held for at least one month for a bicycle or three months for most other items. The Act does not give finders a right to claim items handed to the police."
  ]
 },
 "optionsHeading": "Reporting a loss with ReportLost",
 "options": [
  "Free listing: your report is published as a searchable public listing.",
  "Automatic search, CA$17 once: six months of public-web monitoring with potential matches reviewed before notification, a dated ReportLost certificate, an anonymous email address linked to your report, and printable QR stickers linked to it.",
  "Team-assisted search, CA$35 once: everything in the CA$17 option, with 12 months of monitoring, manual research by a team member, direct contact with relevant services and venues, submission of your report to appropriate lost-property services, and a notice shared with relevant local groups under their posting rules.",
  "Recovery is never guaranteed. Each organisation listed above applies its own procedure and decides whether it accepts a report filed by a third party."
 ],
 "faq": [
  {
   "q": "How long does MiWay keep lost items?",
   "a": "MiWay keeps items in its lost and found for a maximum of seven days. Call 905-615-4636 to check whether your item has been turned in, then pick it up in person at the Information Booth at the City Centre Transit Terminal, 200 Rathburn Road West, with photo ID and a clear description of the item."
  },
  {
   "q": "Can I report a lost phone to Peel Regional Police?",
   "a": "Yes, online, if the loss is under $10,000 and the phone has a serial number, engraving or identifiable markings. Peel Regional Police does not actively investigate lost property reports; it keeps them on record so the item can be returned if it is found. Online reports are typically reviewed within 21 business days."
  },
  {
   "q": "I lost something at Pearson airport. Who do I contact?",
   "a": "Toronto Pearson is in Mississauga, and Peel Regional Police directs property lost there to the airport's Lost and Found Office. File a free report online or at the office in Terminal 1, before security, between doors R and S; found items are kept for 30 days. For an item left on the plane or a lost checked bag, contact your airline."
  },
  {
   "q": "My pet is missing in Mississauga. What should I do?",
   "a": "Check the City of Mississauga's online list of found pets, then call the Animal Services shelter team at 905-896-5864 ext. 3. The shelter is at 735 Central Parkway West and is open Monday to Saturday, 10 a.m. to 6 p.m."
  },
  {
   "q": "Is ReportLost an official lost and found service?",
   "a": "No. ReportLost is an independent service. It is not affiliated with MiWay, Metrolinx, Toronto Pearson, Peel Regional Police or the City of Mississauga, and it does not replace their procedures. Recovery is never guaranteed."
  }
 ],
 "sources": [
  {
   "label": "City of Mississauga, Contact MiWay",
   "href": "https://www.mississauga.ca/miway-transit/contact-miway"
  },
  {
   "label": "City of Mississauga, City Centre Transit Terminal",
   "href": "https://www.mississauga.ca/miway-transit/locations/city-centre-transit-terminal/"
  },
  {
   "label": "GO Transit, Lost and found",
   "href": "https://www.gotransit.com/en/lost-and-found"
  },
  {
   "label": "Toronto Pearson, Lost and Found Office",
   "href": "https://www.torontopearson.com/en/while-you-are-here/toronto-airport-services/lost-and-found-office"
  },
  {
   "label": "Toronto Pearson, Contact us",
   "href": "https://www.torontopearson.com/en/contact-us"
  },
  {
   "label": "Peel Regional Police, File a police report online",
   "href": "https://peelpolice.ca/en/report-it/online-reporting.aspx"
  },
  {
   "label": "City of Mississauga, Missing pets",
   "href": "https://www.mississauga.ca/services-and-programs/animals-and-pets/missing-pets/"
  },
  {
   "label": "City of Mississauga, Animal Services shelter",
   "href": "https://www.mississauga.ca/services-and-programs/animals-and-pets/animal-services-shelter/"
  },
  {
   "label": "Mississauga Library, Lost property guideline (revised May 4, 2023)",
   "href": "https://www.mississauga.ca/wp-content/uploads/sites/4/2023/05/Mississauga-Library-Lost-Property-Guideline-Rev.pdf"
  },
  {
   "label": "University of Toronto Mississauga, Lost & Found",
   "href": "https://www.utm.utoronto.ca/iits/utm-service-desk-resources/lost-found"
  },
  {
   "label": "University of Toronto Mississauga, Shuttle bus lost & found",
   "href": "https://www.utm.utoronto.ca/shuttle/lost-found"
  },
  {
   "label": "Sheridan College, Lost and found",
   "href": "https://www.sheridancollege.ca/student-life/campus-services/safety/lost-found"
  },
  {
   "label": "Government of Canada, Found passports",
   "href": "https://www.canada.ca/en/immigration-refugees-citizenship/services/canadian-passports/lost-stolen-inaccessible-damaged-found.html"
  },
  {
   "label": "Ontario, Health card (found card)",
   "href": "https://www.ontario.ca/page/replace-cancel-or-change-information-your-health-card"
  },
  {
   "label": "Community Safety and Policing Act, 2019, s. 258",
   "href": "https://www.ontario.ca/laws/statute/19c01"
  }
 ],
 "disclaimer": "ReportLost is independent and is not affiliated with any organisation listed on this page. Contacts and procedures are taken from each organisation's official website and may change; check with the organisation before going to an office."
}$json$::jsonb, 'draft', false),
('ON', 'brampton', 'en', $json${
 "province": "ON",
 "citySlug": "brampton",
 "lang": "en",
 "cityName": "Brampton",
 "metaTitle": "Lost and Found in Brampton: Brampton Transit, GO and Peel Police",
 "metaDescription": "Where lost items go in Brampton: Brampton Transit at 185 Clark Blvd, GO Transit at Union Station, Peel Police reports, Animal Services and Sheridan.",
 "h1": "Lost and found in Brampton",
 "lede": "In Brampton, a lost item stays with the organisation that runs the place where it was left or turned in: Brampton Transit, GO Transit, a campus or the airport. This page lists who holds what, for how long, and how to ask.",
 "lastReviewed": "2026-11-05",
 "map": {
  "mode": "places",
  "heading": "Where lost items are held in Brampton",
  "places": [
   {
    "name": "Brampton Transit Lost and Found",
    "address": "Clark facility, 185 Clark Boulevard",
    "lat": 43.7058,
    "lng": -79.7244
   },
   {
    "name": "GO Transit Lost and Found, Union Station",
    "address": "Counter 6, York Concourse, Union Station, 35 York Street, Toronto",
    "lat": 43.6444,
    "lng": -79.3803
   }
  ],
  "note": "Items left on GO trains or at Brampton's GO stations are held at Union Station in Toronto; Brampton Transit items are picked up at the Clark facility, 185 Clark Boulevard."
 },
 "cardsHeading": "Who holds lost items in Brampton",
 "cards": [
  {
   "kind": "transit",
   "title": "Brampton Transit Lost and Found (including Züm)",
   "where": "Clark facility, 185 Clark Boulevard, west of Dixie Road",
   "body": [
    "For items left on Brampton Transit buses, including Züm, Brampton Transit's bus rapid transit service. Items found on Brampton Transit vehicles are logged when they are turned in.",
    "Report the item with the online form on Brampton Transit's lost and found page, giving its colour, material, size, model number and any other identifying details. Brampton Transit notifies you if the item is found.",
    "Found items are picked up at the Clark office, 185 Clark Boulevard, with identification. The Clark facility is open Monday to Friday, 8:30 a.m. to 4:30 p.m."
   ],
   "hold": "Items found on Brampton Transit vehicles are kept for 14 days.",
   "contacts": [
    {
     "label": "Lost and found inquiries",
     "value": "905-874-2750 ext. 62732",
     "href": "tel:+19058742750"
    }
   ],
   "links": [
    {
     "label": "Brampton Transit lost and found →",
     "href": "https://brampton.ca/EN/residents/transit/Contact-Us/Pages/Lost-and-Found.aspx"
    }
   ]
  },
  {
   "kind": "transit",
   "title": "GO Transit Lost and Found (Metrolinx)",
   "where": "Counter 6, York Concourse, Union Station, 35 York Street, Toronto",
   "body": [
    "For items left on GO trains, GO buses, or at GO stations, including the three GO train stations on the Toronto-Kitchener corridor that serve Brampton: Bramalea, Brampton and Mount Pleasant. Report the item with GO's online form. Found items are brought to the Union Station office in Toronto, usually within ten business days.",
    "To claim an item, bring government-issued ID and proof of ownership, such as the phone number of a lost phone. You can name someone to claim it for you, or arrange a prepaid courier pickup.",
    "Open Monday to Friday, 10 a.m. to 6 p.m., and Saturday and Sunday, 10 a.m. to 5:30 p.m. Closed on statutory holidays."
   ],
   "hold": "30 calendar days, then unclaimed items are donated.",
   "contacts": [
    {
     "label": "Phone",
     "value": "416-202-1600",
     "href": "tel:+14162021600"
    }
   ],
   "links": [
    {
     "label": "GO Transit lost and found →",
     "href": "https://www.gotransit.com/en/lost-and-found"
    }
   ]
  },
  {
   "kind": "police",
   "title": "Peel Regional Police",
   "body": [
    "Peel Regional Police accepts online lost property reports for items worth under $10,000 only when the item has a serial number, engraving or identifiable markings, such as a cell phone or laptop. Government ID such as a driver's licence, health card or SIN card can also be reported online. These reports are not actively investigated; they are kept on record in case the item is found and can be returned to its owner.",
    "Lost keys, money, clothing, eyeglasses, passports, licence plates, parking permits, and credit, bank, membership or rewards cards cannot be reported online. You are responsible for cancelling lost cards with the issuing institution. Reports that cannot be filed online are made in person at a Peel division or community station, or through the non-emergency line."
   ],
   "contacts": [
    {
     "label": "Non-emergency line (press 1)",
     "value": "905-453-3311",
     "href": "tel:+19054533311"
    },
    {
     "label": "TTY, 24/7",
     "value": "905-451-1196",
     "href": "tel:+19054511196"
    }
   ],
   "links": [
    {
     "label": "Peel Regional Police online reporting →",
     "href": "https://www.peelpolice.ca/reporting-records/report-a-crime-or-incident/file-a-police-report-online/"
    }
   ]
  },
  {
   "kind": "airport",
   "title": "Toronto Pearson International Airport",
   "body": [
    "Pearson is in Mississauga. Peel Regional Police directs property lost at the airport to Toronto Pearson's Lost and Found Office, in Terminal 1, which takes reports online and keeps found items for 30 days; items left on a plane are claimed from the airline."
   ],
   "links": [
    {
     "label": "Pearson lost and found →",
     "href": "https://www.torontopearson.com/en/while-you-are-here/toronto-airport-services/lost-and-found-office"
    }
   ]
  },
  {
   "kind": "animal",
   "title": "Brampton Animal Services (City of Brampton)",
   "where": "Animal shelter, 475 Chrysler Drive. Open to the public Monday to Saturday, 9 a.m. to 5 p.m.; closed Sundays and holidays",
   "body": [
    "If your pet is missing, contact Brampton Animal Services to file a detailed missing pet report, and drop off or email a photo. Check the Brampton Animal Services Found Pets page on Facebook for strays in its care, confirm your pet's microchip contact details with the microchip company, and check shelters in neighbouring municipalities.",
    "If you find a pet, contact Brampton Animal Services to file a found pet report, and take the pet to the shelter or a local vet to be scanned for a microchip. Contact Animal Services right away for a sick, injured or aggressive animal. For a found pet without a tag, the City asks you to call 311."
   ],
   "hold": "Stray animals turned in to the Brampton Animal Shelter are held for seven days. Provincial statutes require 72 hours.",
   "contacts": [
    {
     "label": "Phone",
     "value": "905-458-5800",
     "href": "tel:+19054585800"
    },
    {
     "label": "Email",
     "value": "animal.services@brampton.ca",
     "href": "mailto:animal.services@brampton.ca"
    }
   ],
   "links": [
    {
     "label": "Brampton Animal Services lost and found →",
     "href": "https://www.brampton.ca/EN/residents/Animal-Services/Pages/Lost-and-Found.aspx"
    }
   ]
  },
  {
   "kind": "university",
   "title": "Sheridan College Campus Safety (Davis Campus)",
   "where": "Davis Campus, 7899 McLaughlin Road",
   "body": [
    "Campus Safety collects and stores items found in Sheridan's buildings and on the surrounding grounds. Ask in person at a Campus Safety Office, by phone, or through the Sheridan ALERT app; Campus Safety may take your contact details so it can reach you if the item turns up.",
    "To claim an item, bring valid photo ID: a Sheridan onecard or government-issued ID."
   ],
   "hold": "Up to one year, depending on the item's value.",
   "contacts": [
    {
     "label": "Campus Safety",
     "value": "905-815-4044",
     "href": "tel:+19058154044"
    }
   ],
   "links": [
    {
     "label": "Sheridan lost and found →",
     "href": "https://www.sheridancollege.ca/student-life/campus-services/safety/lost-found"
    }
   ]
  }
 ],
 "found": {
  "heading": "Found something in Brampton?",
  "body": [
   "Hand the item to the organisation that runs the place where you found it. Brampton Transit logs items found on its buses and keeps them at the Clark facility, 185 Clark Boulevard; items found on GO trains, GO buses or at GO stations go to GO Transit's office at Union Station in Toronto; items found on Sheridan's campus grounds are collected by Campus Safety. If you find a pet, file a found pet report with Brampton Animal Services at 905-458-5800 and have the pet scanned for a microchip at the shelter or a local vet.",
   "If you find a Canadian passport, the Government of Canada asks you to return it to a passport office, a Service Canada Centre, or a police or RCMP station, with a short letter saying how, when and where you found it. A found Ontario health card can be brought to any ServiceOntario location or police station, or dropped in any Canada Post mailbox.",
   "Under Ontario's Community Safety and Policing Act, 2019 (s. 258), police may sell unclaimed property they hold, other than money and firearms, once it has been held for at least one month for a bicycle or three months for most other items. The Act does not give finders a right to claim items handed to the police."
  ]
 },
 "optionsHeading": "Reporting a loss with ReportLost",
 "options": [
  "Free listing: your report is published as a searchable public listing.",
  "Automatic search, CA$17 once: six months of public-web monitoring with potential matches reviewed before notification, a dated ReportLost certificate, an anonymous email address linked to your report, and printable QR stickers linked to it.",
  "Team-assisted search, CA$35 once: everything in the CA$17 option, with 12 months of monitoring, manual research by a team member, direct contact with relevant services and venues, submission of your report to appropriate lost-property services, and a notice shared with relevant local groups under their posting rules.",
  "Recovery is never guaranteed. Each organisation listed above applies its own procedure and decides whether it accepts a report filed by a third party."
 ],
 "faq": [
  {
   "q": "How long does Brampton Transit keep lost items?",
   "a": "Items found on Brampton Transit vehicles, including Züm buses, are logged and kept for 14 days. Report the item with the online form or by phone at 905-874-2750 ext. 62732; Brampton Transit notifies you if it is found. Pickup is at the Clark office, 185 Clark Boulevard, with identification."
  },
  {
   "q": "I left something on a GO train at a Brampton station. Where is it?",
   "a": "Items found on GO trains, buses and at GO stations, including Bramalea, Brampton and Mount Pleasant, are brought to GO Transit's Lost and Found at Union Station in Toronto (Counter 6, York Concourse), usually within ten business days. They are kept for 30 calendar days. Report the item with GO's online form, or phone 416-202-1600."
  },
  {
   "q": "Can I report a lost phone to Peel Regional Police?",
   "a": "Yes. Peel Regional Police accepts online lost property reports for cell phones, laptops and other items worth under $10,000 that have a serial number, engraving or identifiable markings. These reports are not actively investigated; they are kept on record in case the item is found. Keys, money, passports and bank or credit cards cannot be reported online."
  },
  {
   "q": "How long does Brampton Animal Services hold a stray pet?",
   "a": "Stray animals turned in to the Brampton Animal Shelter, 475 Chrysler Drive, are held for seven days, longer than the 72 hours required by provincial statutes. The shelter is open to the public for stray reclaims Monday to Saturday, 9 a.m. to 5 p.m. Call 905-458-5800 to file a missing pet report."
  },
  {
   "q": "Is ReportLost an official lost and found service?",
   "a": "No. ReportLost is an independent service. It is not affiliated with Brampton Transit, Metrolinx, Peel Regional Police, Toronto Pearson, Sheridan College or the City of Brampton, and it does not replace their procedures. Recovery is never guaranteed."
  }
 ],
 "sources": [
  {
   "label": "City of Brampton, Brampton Transit Lost and Found",
   "href": "https://brampton.ca/EN/residents/transit/Contact-Us/Pages/Lost-and-Found.aspx"
  },
  {
   "label": "City of Brampton, Brampton Transit Terminals and Facilities",
   "href": "https://www.brampton.ca/EN/residents/transit/Contact-Us/Pages/Terminals-and-Facilities.aspx"
  },
  {
   "label": "City of Brampton, Züm: Brampton's Bus Rapid Transit Service",
   "href": "https://www.brampton.ca/EN/residents/transit/zum/Pages/About.aspx"
  },
  {
   "label": "City of Brampton, Local Transportation",
   "href": "https://www.brampton.ca/EN/Arts-Culture-Tourism/Experience-Brampton/Plan-Your-Stay/Pages/Local-Transportation.aspx"
  },
  {
   "label": "GO Transit, Lost and found",
   "href": "https://www.gotransit.com/en/lost-and-found"
  },
  {
   "label": "Peel Regional Police, File a police report online",
   "href": "https://www.peelpolice.ca/reporting-records/report-a-crime-or-incident/file-a-police-report-online/"
  },
  {
   "label": "Peel Regional Police, Contact us",
   "href": "https://www.peelpolice.ca/contact-us/"
  },
  {
   "label": "Toronto Pearson, Lost and Found Office",
   "href": "https://www.torontopearson.com/en/while-you-are-here/toronto-airport-services/lost-and-found-office"
  },
  {
   "label": "City of Brampton, Animal Services Lost and Found",
   "href": "https://www.brampton.ca/EN/residents/Animal-Services/Pages/Lost-and-Found.aspx"
  },
  {
   "label": "City of Brampton, Animal Services FAQs",
   "href": "https://www.brampton.ca/EN/residents/Animal-Services/pages/faqs.aspx"
  },
  {
   "label": "City of Brampton, Animal Services Hours of Operation",
   "href": "https://www.brampton.ca/EN/residents/Animal-Services/pages/Hours-of-Operation.aspx"
  },
  {
   "label": "Sheridan College, Lost and Found",
   "href": "https://www.sheridancollege.ca/student-life/campus-services/safety/lost-found"
  },
  {
   "label": "Government of Canada, Found passports",
   "href": "https://www.canada.ca/en/immigration-refugees-citizenship/services/canadian-passports/lost-stolen-inaccessible-damaged-found.html"
  },
  {
   "label": "Ontario, Health card (found card)",
   "href": "https://www.ontario.ca/page/replace-cancel-or-change-information-your-health-card"
  },
  {
   "label": "Community Safety and Policing Act, 2019, s. 258",
   "href": "https://www.ontario.ca/laws/statute/19c01"
  }
 ],
 "disclaimer": "ReportLost is independent and is not affiliated with any organisation listed on this page. Contacts and procedures are taken from each organisation's official website and may change; check with the organisation before going to an office."
}$json$::jsonb, 'draft', false),
('ON', 'hamilton', 'en', $json${
 "province": "ON",
 "citySlug": "hamilton",
 "lang": "en",
 "cityName": "Hamilton",
 "metaTitle": "Lost and Found in Hamilton: HSR, Police, Airport and GO Transit",
 "metaDescription": "Where lost items end up in Hamilton: HSR buses, Hamilton Police Property and Evidence, the airport Operations Centre, GO Transit, McMaster and pets.",
 "h1": "Lost and found in Hamilton",
 "lede": "In Hamilton, a lost item stays with the organisation that runs the place where it was left or turned in: the HSR, Hamilton Police, the airport, GO Transit, McMaster University or a venue. This page lists who holds what, for how long, and how to ask.",
 "lastReviewed": "2026-11-05",
 "map": {
  "mode": "places",
  "heading": "Where lost items are held in Hamilton",
  "places": [
   {
    "name": "Hamilton Police Service, Property and Evidence Branch",
    "address": "Central Police Station, 155 King William Street (call ahead)",
    "lat": 43.2562,
    "lng": -79.8626
   },
   {
    "name": "GO Transit Lost and Found, Union Station",
    "address": "Counter 6, York Concourse, Union Station, 35 York Street, Toronto",
    "lat": 43.6444,
    "lng": -79.3803
   }
  ],
  "note": "Items left on GO trains, buses or at GO stations in Hamilton are collected in Toronto, at Union Station. Hamilton Police property is viewed or released by calling ahead to the Property and Evidence Branch at Central Police Station, 155 King William Street."
 },
 "cardsHeading": "Who holds lost items in Hamilton",
 "cards": [
  {
   "kind": "transit",
   "title": "Hamilton Street Railway (HSR) Customer Service",
   "body": [
    "To locate an item lost on an HSR bus, call HSR Customer Service. The line is available weekdays from 8 a.m. to 4 p.m. and closed on holidays. If the line is busy or you are calling outside business hours, you can leave a voicemail or send an email."
   ],
   "contacts": [
    {
     "label": "Phone",
     "value": "905-528-4200",
     "href": "tel:+19055284200"
    },
    {
     "label": "Email",
     "value": "hsrserve@hamilton.ca",
     "href": "mailto:hsrserve@hamilton.ca"
    }
   ],
   "links": [
    {
     "label": "HSR customer service →",
     "href": "https://www.hamilton.ca/home-neighbourhood/hsr/riding-hsr/hsr-customer-service"
    }
   ]
  },
  {
   "kind": "police",
   "title": "Hamilton Police Service, Property and Evidence Branch",
   "where": "Central Police Station, 155 King William Street",
   "body": [
    "Hamilton Police asks owners to file a Lost or Stolen Property report, which makes it easier to match recovered items to their owners, even months or years later. When an owner is identified, a letter is sent and the owner has 30 days to claim the property.",
    "The Property and Evidence Branch is open 8 a.m. to 4 p.m., Monday to Friday. Call before going in to view property or arrange its release. Property is released only to the legal owner or an authorised designate, with two pieces of ID, one showing your name, date of birth and photo. A designate needs a document giving them authority to act for you; parents or legal guardians can pick up property for minor children without one.",
    "Property held as evidence may not be released. Unclaimed items may be auctioned online through a third-party provider, destroyed, or, for jewellery and cash only, returned to the finder. If you see your item in an auction, the police ask you to notify them."
   ],
   "hold": "Found property 90 days; bicycles 30 days.",
   "contacts": [
    {
     "label": "Property and Evidence, general inquiries",
     "value": "905-546-4734",
     "href": "tel:+19055464734"
    },
    {
     "label": "Non-emergency line",
     "value": "905-546-4925",
     "href": "tel:+19055464925"
    }
   ],
   "links": [
    {
     "label": "Hamilton Police, collect my property →",
     "href": "https://hamiltonpolice.on.ca/how-to/collect-my-property"
    }
   ]
  },
  {
   "kind": "airport",
   "title": "John C. Munro Hamilton International Airport, Operations Centre",
   "where": "Terminal, to the left of the check-in counters, west end; 9300 Airport Road, Mount Hope",
   "body": [
    "Items found in the terminal are turned in to Airport Security at the Operations Centre. To report or recover a lost item, call the Operations Centre or visit it. The Operations Centre is open 24 hours a day, 7 days a week.",
    "For items left on board an aircraft, or for lost luggage, contact the airline you travelled with."
   ],
   "contacts": [
    {
     "label": "Operations Centre",
     "value": "905-679-1999",
     "href": "tel:+19056791999"
    }
   ],
   "links": [
    {
     "label": "Hamilton airport services and assistance →",
     "href": "https://flyhamilton.ca/services-assistance/"
    }
   ]
  },
  {
   "kind": "transit",
   "title": "GO Transit Lost and Found (Metrolinx)",
   "where": "Counter 6, York Concourse, Union Station, 35 York Street, Toronto",
   "body": [
    "For items left on GO trains, GO buses, or at GO stations, including those in Hamilton. Report the item with GO's online form. Found items are brought to the Union Station office in Toronto, usually within ten business days.",
    "To claim an item, bring government-issued ID and proof of ownership, such as the phone number of a lost phone. You can name someone to claim it for you, or arrange a prepaid courier pickup.",
    "Open Monday to Friday, 10 a.m. to 6 p.m., and Saturday and Sunday, 10 a.m. to 5:30 p.m. Closed on statutory holidays."
   ],
   "hold": "30 calendar days.",
   "contacts": [
    {
     "label": "Phone",
     "value": "416-202-1600",
     "href": "tel:+14162021600"
    }
   ],
   "links": [
    {
     "label": "GO Transit lost and found →",
     "href": "https://www.gotransit.com/en/lost-and-found"
    }
   ]
  },
  {
   "kind": "animal",
   "title": "Hamilton Animal Services (City of Hamilton)",
   "where": "Shelter, 247 Dartnall Road. Visiting hours: Monday to Friday, 8:30 a.m. to 4:30 p.m.; Saturday and Sunday, 10 a.m. to 2 p.m.; closed on holidays",
   "body": [
    "The City publishes a Found Pets page listing animals in its care. Found animals are checked for identification, and staff try to contact the owner when there is ID. If your pet wears a City of Hamilton dog tag, visit the shelter to see if it is there.",
    "To reclaim a pet, bring identification with your name and current address, and a leash or carrier. Impound and boarding fees are due at pickup, along with any veterinary bills at cost, and a dog licence if the dog does not have a current one.",
    "If you see a stray dog or have picked one up, call Animal Services."
   ],
   "hold": "Found animals are held 5 days, including the day they arrive at the shelter.",
   "contacts": [
    {
     "label": "Animal Services",
     "value": "905-574-3433",
     "href": "tel:+19055743433"
    }
   ],
   "links": [
    {
     "label": "City of Hamilton found pets →",
     "href": "https://services.hamilton.ca/home-neighbourhood/animals-pets/lost-found-or-surrender/found-pets"
    }
   ]
  },
  {
   "kind": "university",
   "title": "McMaster University, Campus Safety Services Lost and Found",
   "where": "Room 201, E.T. Clarke Centre, 1280 Main Street West",
   "body": [
    "Campus Safety Services runs lost and found for the McMaster campus. File a lost report online with as much detail as possible, and check back after a few days, since items can take time to arrive through campus mail. Items with a name, student number or phone number are logged and staff try to contact the owner by phone or email.",
    "Lunchboxes and water bottles are not kept. If you think an item was stolen, report it to security@mcmaster.ca."
   ],
   "hold": "Items are kept in a secure location for 30 days.",
   "contacts": [
    {
     "label": "Lost and Found",
     "value": "905-525-9140, ext. 24281",
     "href": "tel:+19055259140"
    },
    {
     "label": "Email",
     "value": "seclost@mcmaster.ca",
     "href": "mailto:seclost@mcmaster.ca"
    }
   ],
   "links": [
    {
     "label": "McMaster lost and found →",
     "href": "https://css.mcmaster.ca/lost-and-found/"
    }
   ]
  }
 ],
 "found": {
  "heading": "Found something in Hamilton?",
  "body": [
   "Hand the item to the organisation that runs the place where you found it. Items found in the airport terminal can be turned in to Airport Security at the Operations Centre, to the left of the check-in counters. On the McMaster campus, put the item in a Lost and Found dropbox (Student Centre, E.T. Clarke Centre, MDCL lobby, the Joan Buddle Service Desk in DBAC, or The HUB main lobby), or bring large items to the E.T. Clarke Centre; McMaster asks finders not to contact the owner themselves. If you see a stray dog or have picked one up, call Hamilton Animal Services at 905-574-3433.",
   "If you find a Canadian passport, the Government of Canada asks you to return it to a passport office, a Service Canada Centre, or a police or RCMP station, with a short letter saying how, when and where you found it. A found Ontario health card can be brought to any ServiceOntario location or police station, or dropped in any Canada Post mailbox.",
   "Under Ontario's Community Safety and Policing Act, 2019 (s. 258), police may sell unclaimed property they hold, other than money and firearms, once it has been held for at least one month for a bicycle or three months for most other items. The Act does not give finders a right to claim items handed to the police."
  ]
 },
 "optionsHeading": "Reporting a loss with ReportLost",
 "options": [
  "Free listing: your report is published as a searchable public listing.",
  "Automatic search, CA$17 once: six months of public-web monitoring with potential matches reviewed before notification, a dated ReportLost certificate, an anonymous email address linked to your report, and printable QR stickers linked to it.",
  "Team-assisted search, CA$35 once: everything in the CA$17 option, with 12 months of monitoring, manual research by a team member, direct contact with relevant services and venues, submission of your report to appropriate lost-property services, and a notice shared with relevant local groups under their posting rules.",
  "Recovery is never guaranteed. Each organisation listed above applies its own procedure and decides whether it accepts a report filed by a third party."
 ],
 "faq": [
  {
   "q": "How long do Hamilton Police keep found property?",
   "a": "Found property is held for 90 days, and bicycles for 30 days. When the owner is identified, a letter is sent and the owner has 30 days to claim it. Unclaimed items may be auctioned, destroyed, or, for jewellery and cash only, returned to the finder."
  },
  {
   "q": "What do I need to collect my property from Hamilton Police?",
   "a": "Call the Property and Evidence Branch at 905-546-4734 before going to Central Police Station, 155 King William Street. Bring two pieces of ID, one showing your name, date of birth and photo. Someone else can collect it for you with a document giving them authority to act on your behalf."
  },
  {
   "q": "I lost something at Hamilton airport. Who do I contact?",
   "a": "For an item lost in the terminal, call the Operations Centre at 905-679-1999 or visit it, to the left of the check-in counters. The Operations Centre is open 24 hours a day. For an item left on the plane, or for lost luggage, contact your airline."
  },
  {
   "q": "My pet is missing in Hamilton. How long does Animal Services keep strays?",
   "a": "Hamilton Animal Services holds found animals for 5 days, including the day they arrive. Check the City's Found Pets page and visit the shelter at 247 Dartnall Road during visiting hours. To reclaim your pet, bring ID with your name and current address, and be ready to pay impound and boarding fees."
  },
  {
   "q": "Is ReportLost an official lost and found service?",
   "a": "No. ReportLost is an independent service. It is not affiliated with the HSR, the Hamilton Police Service, John C. Munro Hamilton International Airport, Metrolinx, McMaster University or the City of Hamilton, and it does not replace their procedures. Recovery is never guaranteed."
  }
 ],
 "sources": [
  {
   "label": "City of Hamilton, HSR Customer Service",
   "href": "https://www.hamilton.ca/home-neighbourhood/hsr/riding-hsr/hsr-customer-service"
  },
  {
   "label": "Hamilton Police Service, Collect my property",
   "href": "https://hamiltonpolice.on.ca/how-to/collect-my-property"
  },
  {
   "label": "Hamilton Police Service, Non-emergencies",
   "href": "https://hamiltonpolice.on.ca/how-to/report-crime/non-emergencies"
  },
  {
   "label": "John C. Munro Hamilton International Airport, Services and assistance",
   "href": "https://flyhamilton.ca/services-assistance/"
  },
  {
   "label": "John C. Munro Hamilton International Airport, FAQ",
   "href": "https://flyhamilton.ca/faq/"
  },
  {
   "label": "GO Transit, Lost and found",
   "href": "https://www.gotransit.com/en/lost-and-found"
  },
  {
   "label": "City of Hamilton, Found pets",
   "href": "https://services.hamilton.ca/home-neighbourhood/animals-pets/lost-found-or-surrender/found-pets"
  },
  {
   "label": "City of Hamilton, Stray animals",
   "href": "https://services.hamilton.ca/home-neighbourhood/animals-pets/lost-found-or-surrender/stray-animals"
  },
  {
   "label": "McMaster University Campus Safety Services, Lost and found",
   "href": "https://css.mcmaster.ca/lost-and-found/"
  },
  {
   "label": "Government of Canada, Found passports",
   "href": "https://www.canada.ca/en/immigration-refugees-citizenship/services/canadian-passports/lost-stolen-inaccessible-damaged-found.html"
  },
  {
   "label": "Ontario, Health card (found card)",
   "href": "https://www.ontario.ca/page/replace-cancel-or-change-information-your-health-card"
  },
  {
   "label": "Community Safety and Policing Act, 2019, s. 258",
   "href": "https://www.ontario.ca/laws/statute/19c01"
  }
 ],
 "disclaimer": "ReportLost is independent and is not affiliated with any organisation listed on this page. Contacts and procedures are taken from each organisation's official website and may change; check with the organisation before going to an office."
}$json$::jsonb, 'draft', false),
('ON', 'london', 'en', $json${
 "province": "ON",
 "citySlug": "london",
 "lang": "en",
 "cityName": "London",
 "metaTitle": "Lost and Found in London, Ontario: LTC, Airport, VIA and Police",
 "metaDescription": "Where lost items end up in London, Ontario: LTC Main Office on Highbury Avenue, London International Airport, London Police, VIA Rail and animal services.",
 "h1": "Lost and found in London, Ontario",
 "lede": "In London, Ontario, a lost item stays with the organisation that runs the place where it was left or turned in: London Transit, the airport, VIA Rail, Western University or the police. This page lists who holds what, for how long, and how to ask.",
 "lastReviewed": "2026-11-05",
 "map": {
  "mode": "places",
  "heading": "Where lost items are held in London",
  "places": [
   {
    "name": "London Transit Commission (LTC) Lost and Found",
    "address": "Main Office, 450 Highbury Avenue North",
    "lat": 42.9878,
    "lng": -81.1993
   },
   {
    "name": "London Police Service Headquarters",
    "address": "601 Dundas Street, London, ON N6B 1X1",
    "lat": 42.9887,
    "lng": -81.2318
   },
   {
    "name": "VIA Rail London station",
    "address": "205 York Street, London, ON N6A 1B1",
    "lat": 42.9819,
    "lng": -81.2464
   }
  ],
  "note": "London Police returns property by appointment only: call or email the Firearms and Property Unit before going to headquarters."
 },
 "cardsHeading": "Who holds lost items in London",
 "cards": [
  {
   "kind": "transit",
   "title": "London Transit Commission (LTC) Lost and Found",
   "where": "Main Office, 450 Highbury Avenue North",
   "body": [
    "For items left on LTC buses or at LTC property. LTC keeps only items of value: cash, gift cards, purses, wallets, cameras, jewellery including watches, electronics such as phones, laptops and tablets, medical equipment including eyeglasses, and medication. When an item carries ID, such as a wallet or medication, staff try to contact the owner.",
    "Items are claimed at the Main Office, from the next business day after 10 a.m., during Customer Service hours. Items are not moved to another office at a customer's request.",
    "Credit and debit cards, SIN cards, health cards and driver's licences go to LTC's Treasury Department. Western University, Fanshawe College and SOGS passes are sent to those schools."
   ],
   "hold": "Items of value 14 days, then donated to corporate charities. Bicycles one week, then given to London Police. Credit and debit cards, SIN cards, health cards and driver's licences 14 days, then destroyed.",
   "contacts": [
    {
     "label": "Customer Service (Monday to Friday 7 a.m. to 9 p.m.; weekends and holidays 8:30 a.m. to noon and 1 p.m. to 4:30 p.m.)",
     "value": "519-451-1347",
     "href": "tel:+15194511347"
    },
    {
     "label": "Email",
     "value": "ltc@londontransit.ca",
     "href": "mailto:ltc@londontransit.ca"
    }
   ],
   "links": [
    {
     "label": "LTC lost and found policy →",
     "href": "https://www.londontransit.ca/policies/lost-found-policy/"
    }
   ]
  },
  {
   "kind": "police",
   "title": "London Police Service",
   "where": "Headquarters, 601 Dundas Street (walk-in, 7 a.m. to 11:30 p.m., seven days a week)",
   "body": [
    "London Police accepts online reports for lost cellphones and wallets, for losses that happened in London. You receive a temporary tracking number right away, and an officer reviews the report within 24 hours; if it is accepted, you receive an official report number and a PDF copy. Lost property can also be reported through the non-emergency line.",
    "The Firearms and Property Unit returns property held by London Police by appointment. Call or email first to confirm that the item can be released, what ID or paperwork is needed, and a pickup time.",
    "London Police auctions unclaimed property twice a year through McKenzie's Associated Auctioneers, 1881 Scanlan Street."
   ],
   "contacts": [
    {
     "label": "Non-emergency line",
     "value": "519-661-5670",
     "href": "tel:+15196615670"
    },
    {
     "label": "Firearms and Property Unit",
     "value": "519-661-6501",
     "href": "tel:+15196616501"
    },
    {
     "label": "Firearms and Property Unit email",
     "value": "property@londonpolice.ca",
     "href": "mailto:property@londonpolice.ca"
    }
   ],
   "links": [
    {
     "label": "London Police online reporting →",
     "href": "https://www.londonpolice.ca/services/online-reporting/"
    },
    {
     "label": "Firearms and Property Unit →",
     "href": "https://www.londonpolice.ca/services/firearms-and-property-unit/"
    }
   ]
  },
  {
   "kind": "airport",
   "title": "London International Airport (YXU), Lost and Found",
   "where": "Customer Service Office, to the right of departures security screening, 10 Seabrook Way",
   "body": [
    "The airport's Lost and Found is run by the Customer Service Office, open daily from 5 a.m. to 8:30 p.m. You can contact it by phone, by email, or by mail at Attn: Lost and Found, London International Airport, 10 Seabrook Way, London, ON N5V 3B6.",
    "Items left on an aircraft are not held by the airport: contact your airline. For items left in a taxi or rental car, contact that company directly."
   ],
   "hold": "Found items are stored for 90 days, then disposed of or donated.",
   "contacts": [
    {
     "label": "Phone",
     "value": "519-452-4000",
     "href": "tel:+15194524000"
    },
    {
     "label": "Email",
     "value": "customerservice@flylondon.ca",
     "href": "mailto:customerservice@flylondon.ca"
    }
   ],
   "links": [
    {
     "label": "YXU lost and found →",
     "href": "https://flyyxu.ca/lost-found/"
    }
   ]
  },
  {
   "kind": "transit",
   "title": "VIA Rail Canada, London station",
   "where": "London station, 205 York Street",
   "body": [
    "If you leave an item on a VIA train, report it on arrival at the station's baggage or ticket counter; station staff help locate it. Baggage lost or stolen in a station can be reported to VIA's Lost and Found by phone or at the ticket counter.",
    "The London station ticket counter is open Monday to Saturday, 5:45 a.m. to 9:45 p.m., and Sunday, 6:45 a.m. to 9:45 p.m."
   ],
   "contacts": [
    {
     "label": "VIA Lost and Found",
     "value": "1 888 842-7245",
     "href": "tel:+18888427245"
    }
   ],
   "links": [
    {
     "label": "VIA Rail London station →",
     "href": "https://www.viarail.ca/en/explore-our-destinations/stations/ontario/london"
    }
   ]
  },
  {
   "kind": "animal",
   "title": "London Animal Care Centre (City of London Animal Care and Control)",
   "where": "121 Pine Valley Boulevard",
   "body": [
    "The City of London's animal care and control services are provided under contract by the London Animal Care Centre. Its shelter receives stray animals, mainly from Animal Services Officers and, when necessary, from the public. Animal control runs seven days a week, with a 24-hour emergency service.",
    "To report a lost pet, post a picture on London Lost Pets on the centre's website. Lost birds can be posted on Lost and Found Birds."
   ],
   "contacts": [
    {
     "label": "London Animal Care Centre",
     "value": "519-685-1330",
     "href": "tel:+15196851330"
    },
    {
     "label": "Email",
     "value": "info@accpets.ca",
     "href": "mailto:info@accpets.ca"
    },
    {
     "label": "City of London Animal Services",
     "value": "519-661-2489 ext. 7368",
     "href": "tel:+15196612489"
    }
   ],
   "links": [
    {
     "label": "City of London animal care and control →",
     "href": "https://london.ca/living-london/community-services/animal-pet-services/animal-care-control"
    }
   ]
  },
  {
   "kind": "other",
   "title": "Western University, Foot Patrol and Special Constable Service",
   "body": [
    "Lost and found property on campus is handled by Western Foot Patrol from September 1 to April 30, and by the Western Special Constable Service (WSCS) from May 1 to August 31. To report a loss, contact the service for the current season with a description of the item, where and when it was lost, any serial numbers or identifying marks, and your contact details.",
    "Property is released only when ownership can be reasonably confirmed. You may be asked to describe the item, show valid photo ID and provide proof of ownership."
   ],
   "hold": "Found property is normally held three months. Valuable unclaimed items may be included in Foot Patrol's annual property sale; items of little value may be discarded, and bank cards and some sensitive items may be securely destroyed.",
   "contacts": [
    {
     "label": "Foot Patrol (September 1 to April 30)",
     "value": "519-661-3650",
     "href": "tel:+15196613650"
    },
    {
     "label": "Special Constable Service (May 1 to August 31)",
     "value": "519-661-3300",
     "href": "tel:+15196613300"
    }
   ],
   "links": [
    {
     "label": "Western lost property →",
     "href": "https://www.uwo.ca/constable/get-help-now/lost-property.html"
    }
   ]
  }
 ],
 "found": {
  "heading": "Found something in London?",
  "body": [
   "Hand the item to the organisation that runs the place where you found it. Items found on LTC buses or property go to London Transit, which keeps items of value at its Main Office, 450 Highbury Avenue North; if the owner does not claim it, the passenger who turned it in may ask to claim it, but LTC employees cannot. Items found at London International Airport can be brought to the Customer Service Office, to the right of departures security screening. On Western University's campus, found property, including ONECards, government ID, bank cards, keys and medication, should be turned in promptly to Foot Patrol from September to April, or to the Special Constable Service from May to August.",
   "If you find a Canadian passport, the Government of Canada asks you to return it to a passport office, a Service Canada Centre, or a police or RCMP station, with a short letter saying how, when and where you found it. A found Ontario health card can be brought to any ServiceOntario location or police station, or dropped in any Canada Post mailbox.",
   "Under Ontario's Community Safety and Policing Act, 2019 (s. 258), police may sell unclaimed property they hold, other than money and firearms, once it has been held for at least one month for a bicycle or three months for most other items. The Act does not give finders a right to claim items handed to the police."
  ]
 },
 "optionsHeading": "Reporting a loss with ReportLost",
 "options": [
  "Free listing: your report is published as a searchable public listing.",
  "Automatic search, CA$17 once: six months of public-web monitoring with potential matches reviewed before notification, a dated ReportLost certificate, an anonymous email address linked to your report, and printable QR stickers linked to it.",
  "Team-assisted search, CA$35 once: everything in the CA$17 option, with 12 months of monitoring, manual research by a team member, direct contact with relevant services and venues, submission of your report to appropriate lost-property services, and a notice shared with relevant local groups under their posting rules.",
  "Recovery is never guaranteed. Each organisation listed above applies its own procedure and decides whether it accepts a report filed by a third party."
 ],
 "faq": [
  {
   "q": "How long does London Transit keep lost items?",
   "a": "LTC keeps only items of value, such as cash, wallets, phones, jewellery, eyeglasses and medication, and holds them for 14 days before donating them. Bicycles are held for one week, then given to London Police. Items are claimed at the Main Office, 450 Highbury Avenue North, from the next business day after 10 a.m."
  },
  {
   "q": "Can I report a lost phone or wallet to London Police?",
   "a": "Yes. The London Police Service accepts online reports for lost cellphones and wallets lost in London. You receive a tracking number right away and an officer reviews the report within 24 hours; if it is accepted, you receive an official report number and a PDF copy. Lost property can also be reported through the non-emergency line, 519-661-5670."
  },
  {
   "q": "I lost something at London International Airport. Who do I contact?",
   "a": "Contact the airport's Customer Service Office, to the right of departures security screening, at 519-452-4000 or customerservice@flylondon.ca. It is open daily from 5 a.m. to 8:30 p.m. and stores found items for 90 days. Items left on an aircraft are handled by the airline, and items left in a taxi or rental car by that company."
  },
  {
   "q": "My pet is lost in London. Who do I contact?",
   "a": "The City of London's animal care and control services are provided by the London Animal Care Centre, 121 Pine Valley Boulevard, under contract. You can post a picture of your pet on London Lost Pets on the centre's website, or call 519-685-1330. Lost birds can be posted on Lost and Found Birds."
  },
  {
   "q": "Is ReportLost an official lost and found service?",
   "a": "No. ReportLost is an independent service. It is not affiliated with the London Transit Commission, the London Police Service, London International Airport, VIA Rail, the London Animal Care Centre, Western University or the City of London, and it does not replace their procedures. Recovery is never guaranteed."
  }
 ],
 "sources": [
  {
   "label": "London Transit Commission, Lost & Found Policy",
   "href": "https://www.londontransit.ca/policies/lost-found-policy/"
  },
  {
   "label": "London Transit Commission, General Contact Information",
   "href": "https://www.londontransit.ca/?p=1588"
  },
  {
   "label": "London Police Service, Online Reporting",
   "href": "https://www.londonpolice.ca/services/online-reporting/"
  },
  {
   "label": "London Police Service, Make a Report",
   "href": "https://www.londonpolice.ca/services/make-a-report/"
  },
  {
   "label": "London Police Service, Firearms and Property Unit",
   "href": "https://www.londonpolice.ca/services/firearms-and-property-unit/"
  },
  {
   "label": "London Police Service, Auctions",
   "href": "https://www.londonpolice.ca/services/auctions/"
  },
  {
   "label": "London Police Service, Contact",
   "href": "https://www.londonpolice.ca/contact"
  },
  {
   "label": "London International Airport, Lost & Found",
   "href": "https://flyyxu.ca/lost-found/"
  },
  {
   "label": "VIA Rail, London station",
   "href": "https://www.viarail.ca/en/explore-our-destinations/stations/ontario/london"
  },
  {
   "label": "VIA Rail, Toronto Union Station (lost items procedure)",
   "href": "https://www.viarail.ca/en/explore-our-destinations/stations/ontario/toronto"
  },
  {
   "label": "City of London, Animal care and control",
   "href": "https://london.ca/living-london/community-services/animal-pet-services/animal-care-control"
  },
  {
   "label": "Western University, Lost Property",
   "href": "https://www.uwo.ca/constable/get-help-now/lost-property.html"
  },
  {
   "label": "Government of Canada, Found passports",
   "href": "https://www.canada.ca/en/immigration-refugees-citizenship/services/canadian-passports/lost-stolen-inaccessible-damaged-found.html"
  },
  {
   "label": "Ontario, Health card (found card)",
   "href": "https://www.ontario.ca/page/replace-cancel-or-change-information-your-health-card"
  },
  {
   "label": "Community Safety and Policing Act, 2019, s. 258",
   "href": "https://www.ontario.ca/laws/statute/19c01"
  }
 ],
 "disclaimer": "ReportLost is independent and is not affiliated with any organisation listed on this page. Contacts and procedures are taken from each organisation's official website and may change; check with the organisation before going to an office."
}$json$::jsonb, 'draft', false),
('ON', 'markham', 'en', $json${
 "province": "ON",
 "citySlug": "markham",
 "lang": "en",
 "cityName": "Markham",
 "metaTitle": "Lost and Found in Markham: YRT, GO Transit and York Police",
 "metaDescription": "Where lost items end up in Markham: YRT and Viva Lost and Found, GO Transit at Union Station, York Regional Police reports and Markham Animal Services.",
 "h1": "Lost and found in Markham",
 "lede": "In Markham, a lost item stays with the organisation that runs the place where it was left or turned in: York Region Transit, GO Transit, the TTC or the police. This page lists who holds what, for how long, and how to ask.",
 "lastReviewed": "2026-11-05",
 "map": {
  "mode": "places",
  "heading": "Transit lost and found offices serving Markham",
  "places": [
   {
    "name": "GO Transit Lost and Found, Union Station",
    "address": "Counter 6, York Concourse, Union Station, 35 York Street, Toronto",
    "lat": 43.6444,
    "lng": -79.3803
   },
   {
    "name": "TTC Lost Articles Office",
    "address": "Bay subway station, Toronto",
    "lat": 43.6703,
    "lng": -79.3903
   }
  ],
  "note": "YRT arranges pickup with you once a matching item is found, so its facilities are not shown here; call or use the online form first."
 },
 "cardsHeading": "Who holds lost items in Markham",
 "cards": [
  {
   "kind": "transit",
   "title": "York Region Transit (YRT and Viva) Lost and Found",
   "body": [
    "For items left on a YRT or Viva vehicle, at a stop or at a terminal such as Cornell Bus Terminal. Report the item with YRT's online Lost and Found form, or by phone. Have ready your name and phone number, the date, the route or pickup and drop-off locations, the time and direction of travel, and a description of the item. If no one answers, leave a voicemail with the same details.",
    "For a bus, use the form or call the number for your route. For a stop or terminal, use the form or call 1-866-668-3978 and press 4 (Monday to Friday, 7 a.m. to 7 p.m.; weekends and holidays, 8:30 a.m. to 4:30 p.m.). For an On-Request vehicle, call 1-888-762-2950 and press 2 (daily, 5 a.m. to midnight). For Mobility On-Request Paratransit, call 1-888-762-2950, press 1, then 1 again (Monday to Friday, 8 a.m. to 4 p.m.).",
    "YRT says it will contact you within two business days; if you hear nothing, call the main line. If your item is found, YRT arranges pickup with you. Drivers take found items to Lost and Found after their route ends and cannot return items directly. For a passport needed within 48 hours or medication needed right away, call 1-866-668-3978 and press 4.",
    "Under YRT's Lost and Found Policy, the owner shows government-issued identification and signs the Lost and Found tag when reclaiming an item in person. An owner who cannot attend can ask in writing for the item to be mailed, at the owner's expense and risk, to York Region Transit, Lost and Found, 55 Orlando Avenue, Richmond Hill, ON L4B 0B4."
   ],
   "hold": "30 days. Unclaimed wallets, IDs, medications and electronics are then sent to YRT Transit Enforcement. Other unclaimed items are donated, recycled, sold or disposed of.",
   "contacts": [
    {
     "label": "Lost and Found, stops and terminals (press 4)",
     "value": "1-866-668-3978",
     "href": "tel:+18666683978"
    },
    {
     "label": "On-Request and Mobility On-Request",
     "value": "1-888-762-2950",
     "href": "tel:+18887622950"
    }
   ],
   "links": [
    {
     "label": "YRT lost and found →",
     "href": "https://yrt.ca/LostAndFound"
    },
    {
     "label": "YRT online lost item form →",
     "href": "https://forms.yrt.ca/YRT-Lost-and-Found-Form"
    }
   ]
  },
  {
   "kind": "transit",
   "title": "GO Transit Lost and Found (Metrolinx)",
   "where": "Counter 6, York Concourse, Union Station, 35 York Street, Toronto",
   "body": [
    "Items left on GO trains or buses, or at GO stations on the Stouffville line such as Unionville, Centennial, Markham and Mount Joy, are brought to GO Transit's office at Union Station, usually within ten business days. YRT also refers items lost at the Finch and Highway 407 GO bus terminals to GO Transit.",
    "To claim an item, bring photo ID and proof of ownership, such as the phone number of a lost phone or a laptop's password. You can name someone to claim it for you, or arrange a prepaid courier pickup.",
    "Open Monday to Friday, 10 a.m. to 6 p.m., and Saturday and Sunday, 10 a.m. to 5:30 p.m. Closed on statutory holidays."
   ],
   "hold": "30 calendar days, then unclaimed items are donated.",
   "contacts": [
    {
     "label": "Phone",
     "value": "416-202-1600",
     "href": "tel:+14162021600"
    }
   ],
   "links": [
    {
     "label": "GO Transit lost and found →",
     "href": "https://www.gotransit.com/en/lost-and-found"
    }
   ]
  },
  {
   "kind": "transit",
   "title": "Toronto Transit Commission (TTC) Lost Articles Office",
   "where": "Bay subway station, Toronto",
   "body": [
    "YRT refers items lost at Don Mills and Sheppard West stations, where YRT buses connect with the subway, to the TTC. Items left on TTC vehicles or property go to the TTC Lost Articles Office.",
    "The office is open to the public from 8 a.m. to 4:45 p.m., Monday to Friday, except statutory holidays. Phone enquiries are taken on weekdays from 12 p.m. to 5 p.m."
   ],
   "hold": "Most items 30 days; bicycles 15 days. Canadian passports are sent immediately to Passport Canada; international passports are held 10 days, then sent to a consulate or embassy. Unclaimed items are sold at auction.",
   "contacts": [
    {
     "label": "Phone (weekdays, 12 p.m. to 5 p.m.)",
     "value": "416-393-4100",
     "href": "tel:+14163934100"
    }
   ],
   "links": [
    {
     "label": "TTC lost articles →",
     "href": "https://www.ttc.ca/customer-service/lost-articles"
    }
   ]
  },
  {
   "kind": "police",
   "title": "York Regional Police",
   "body": [
    "York Regional Police takes lost property reports online for property lost in York Region, when it was not stolen, there are no suspects, and no police response is needed. You need a valid email address, and the report must be filed by the owner or an authorised representative. A report creates a record that may help police identify and return the property if it is recovered.",
    "Before filing, check with people who may have been present. Lost passports, federal Canadian documents, vehicles and licence plates, and prescription drugs cannot be reported online; call police instead. York Regional Police also directs lost Canadian passports and SIN cards to Service Canada, and lost driver's licences, health cards, birth certificates, licence plates and accessible parking permits to ServiceOntario.",
    "Markham is served by #5 District, 8700 McCowan Road, open 24 hours a day. Recovered, unclaimed or seized property cleared for disposal is sold through Police Auctions Canada."
   ],
   "contacts": [
    {
     "label": "Non-emergency line",
     "value": "1-866-876-5423",
     "href": "tel:+18668765423"
    },
    {
     "label": "#5 District front desk",
     "value": "1-866-876-5423, ext. 7500"
    }
   ],
   "links": [
    {
     "label": "York Regional Police lost property report →",
     "href": "https://www.yrp.ca/en/online-reporting/Report-Lost-or-Stolen-Property.asp"
    }
   ]
  },
  {
   "kind": "animal",
   "title": "City of Markham Animal Services",
   "body": [
    "To report a lost pet, file a report with Animal Services by email or phone. Animal Services officers are available every day, including weekends and holidays; calls received outside operating hours are handled the following day.",
    "The Ontario SPCA shelters lost pets and cares for stray domestic animals for the City. The City's page links to an Ontario SPCA list of strays being held while their owners are sought.",
    "Dogs and cats in Markham need a City pet licence, even if they have a microchip. A licensed pet found by an Animal Care Officer gets a Free Ride Home. For an animal situation that poses an immediate danger to public safety, contact York Regional Police."
   ],
   "contacts": [
    {
     "label": "Animal Services",
     "value": "905-415-7531",
     "href": "tel:+19054157531"
    },
    {
     "label": "Email (lost pet reports)",
     "value": "customerservice@markham.ca",
     "href": "mailto:customerservice@markham.ca"
    }
   ],
   "links": [
    {
     "label": "City of Markham Animal Services →",
     "href": "https://www.markhammuseum.ca/permits-licences-taxes/animal-services"
    }
   ]
  }
 ],
 "found": {
  "heading": "Found something in Markham?",
  "body": [
   "Hand the item to the organisation that runs the place where you found it. On a YRT or Viva bus, give it to the driver or to YRT staff; items found at YRT stops, stations and terminals are turned in to YRT's Enforcement and Security Section at 55 Orlando Avenue, Richmond Hill, or to any YRT office, which tries to notify the owner. If you find a stray animal, the Ontario SPCA asks you to contact your municipality's animal control first: in Markham, that is City of Markham Animal Services at 905-415-7531.",
   "If you find a Canadian passport, the Government of Canada asks you to return it to a passport office, a Service Canada Centre, or a police or RCMP station, with a short letter saying how, when and where you found it. A found Ontario health card can be brought to any ServiceOntario location or police station, or dropped in any Canada Post mailbox.",
   "Under Ontario's Community Safety and Policing Act, 2019 (s. 258), police may sell unclaimed property they hold, other than money and firearms, once it has been held for at least one month for a bicycle or three months for most other items. The Act does not give finders a right to claim items handed to the police."
  ]
 },
 "optionsHeading": "Reporting a loss with ReportLost",
 "options": [
  "Free listing: your report is published as a searchable public listing.",
  "Automatic search, CA$17 once: six months of public-web monitoring with potential matches reviewed before notification, a dated ReportLost certificate, an anonymous email address linked to your report, and printable QR stickers linked to it.",
  "Team-assisted search, CA$35 once: everything in the CA$17 option, with 12 months of monitoring, manual research by a team member, direct contact with relevant services and venues, submission of your report to appropriate lost-property services, and a notice shared with relevant local groups under their posting rules.",
  "Recovery is never guaranteed. Each organisation listed above applies its own procedure and decides whether it accepts a report filed by a third party."
 ],
 "faq": [
  {
   "q": "I left something on a YRT or Viva bus. What should I do?",
   "a": "Report it with YRT's online Lost and Found form, or call the number for your route. For an item lost at a stop or terminal, you can also call 1-866-668-3978 and press 4. YRT says it will contact you within two business days and keeps found items for 30 days; if your item is found, YRT arranges pickup with you."
  },
  {
   "q": "Can I report lost property to York Regional Police online?",
   "a": "Yes, if the property was lost in York Region, was not stolen, there are no suspects and no police response is needed. You need a valid email address, and the report must come from the owner or an authorised representative. Lost passports, federal documents, licence plates and prescription drugs are reported by calling police instead, at 1-866-876-5423."
  },
  {
   "q": "I left something on a GO train at Unionville or Markham station. Where is it?",
   "a": "Items found on GO trains, buses and at GO stations are brought to GO Transit's Lost and Found at Union Station (Counter 6, York Concourse), usually within ten business days, and kept for 30 calendar days. Report the item with GO's online form, or phone 416-202-1600. To claim it, bring photo ID and proof of ownership."
  },
  {
   "q": "My pet is lost in Markham. Who do I contact?",
   "a": "File a lost pet report with City of Markham Animal Services by emailing customerservice@markham.ca or calling 905-415-7531. The Ontario SPCA shelters lost pets for the City, and the City's page links to its list of strays held while owners are sought. A licensed pet found by an Animal Care Officer gets a Free Ride Home."
  },
  {
   "q": "Is ReportLost an official lost and found service?",
   "a": "No. ReportLost is an independent service. It is not affiliated with York Region Transit, Metrolinx, the TTC, York Regional Police, the Ontario SPCA or the City of Markham, and it does not replace their procedures. Recovery is never guaranteed."
  }
 ],
 "sources": [
  {
   "label": "York Region Transit, Lost and Found",
   "href": "https://yrt.ca/LostAndFound"
  },
  {
   "label": "York Region Transit, Lost and Found Form",
   "href": "https://forms.yrt.ca/YRT-Lost-and-Found-Form"
  },
  {
   "label": "York Region Transit, Transit Lost and Found Policy (March 21, 2024)",
   "href": "https://www.yrt.ca/en/resourcesGeneral/Bike%20Auction/Transit-Lost-and-Found-Policy.pdf"
  },
  {
   "label": "York Region Transit, Facilities",
   "href": "https://www.yrt.ca/en/about-us/facilities.aspx"
  },
  {
   "label": "GO Transit, Lost and found",
   "href": "https://www.gotransit.com/en/lost-and-found"
  },
  {
   "label": "GO Transit, Stouffville line timetable (Table 71)",
   "href": "https://assets.metrolinx.com/image/upload/v1762887933/Documents/GO/full-schedules/FS22112025/TABLE71.pdf"
  },
  {
   "label": "TTC, Lost articles",
   "href": "https://www.ttc.ca/customer-service/lost-articles"
  },
  {
   "label": "York Regional Police, Report Lost Property",
   "href": "https://www.yrp.ca/en/online-reporting/Report-Lost-or-Stolen-Property.asp"
  },
  {
   "label": "York Regional Police, Online reporting",
   "href": "https://onlinereporting.yrp.ca/start-report.html"
  },
  {
   "label": "York Regional Police, Policing in #5 District",
   "href": "https://www.yrp.ca/node/319"
  },
  {
   "label": "York Regional Police, Police auctions",
   "href": "https://www.yrp.ca/en/services/Police-Auctions.asp"
  },
  {
   "label": "City of Markham, Animal Services",
   "href": "https://www.markhammuseum.ca/permits-licences-taxes/animal-services"
  },
  {
   "label": "City of Markham, Animal Services: services provided",
   "href": "https://www.markhammuseum.ca/permits-licences-taxes/animal-services/services-provided"
  },
  {
   "label": "City of Markham, Pet licence",
   "href": "https://www.markhammuseum.ca/about-city-markham/seniors-older-adults/seniors-resources-support/pet-licence"
  },
  {
   "label": "Ontario SPCA, York Region Animal Centre",
   "href": "https://ontariospca.ca/yorkregion/"
  },
  {
   "label": "Government of Canada, Found passports",
   "href": "https://www.canada.ca/en/immigration-refugees-citizenship/services/canadian-passports/lost-stolen-inaccessible-damaged-found.html"
  },
  {
   "label": "Ontario, Health card (found card)",
   "href": "https://www.ontario.ca/page/replace-cancel-or-change-information-your-health-card"
  },
  {
   "label": "Community Safety and Policing Act, 2019, s. 258",
   "href": "https://www.ontario.ca/laws/statute/19c01"
  }
 ],
 "disclaimer": "ReportLost is independent and is not affiliated with any organisation listed on this page. Contacts and procedures are taken from each organisation's official website and may change; check with the organisation before going to an office."
}$json$::jsonb, 'draft', false),
('ON', 'vaughan', 'en', $json${
 "province": "ON",
 "citySlug": "vaughan",
 "lang": "en",
 "cityName": "Vaughan",
 "metaTitle": "Lost and Found in Vaughan: YRT, TTC, GO Transit and York Police",
 "metaDescription": "Where lost items end up in Vaughan: YRT Lost and Found, TTC office at Bay station, GO Transit at Union Station, York Regional Police and City animal services.",
 "h1": "Lost and found in Vaughan",
 "lede": "In Vaughan, a lost item stays with the organisation that runs the place where it was left or turned in: York Region Transit, the TTC, GO Transit, a venue or the police. This page lists who holds what, for how long, and how to ask.",
 "lastReviewed": "2026-11-05",
 "map": {
  "mode": "places",
  "heading": "Transit lost and found offices serving Vaughan",
  "places": [
   {
    "name": "TTC Lost Articles Office",
    "address": "Bay subway station, 1240 Bay Street, Toronto",
    "lat": 43.6703,
    "lng": -79.3903
   },
   {
    "name": "GO Transit Lost and Found",
    "address": "Counter 6, York Concourse, Union Station, 35 York Street, Toronto",
    "lat": 43.6444,
    "lng": -79.3803
   }
  ],
  "note": "Both offices that return items at a public counter are in downtown Toronto; for an item found on YRT, YRT contacts you to arrange pickup."
 },
 "cardsHeading": "Who holds lost items in Vaughan",
 "cards": [
  {
   "kind": "transit",
   "title": "York Region Transit (YRT) Lost and Found",
   "body": [
    "For items left on YRT buses, including Viva routes, at bus stops and terminals, and in On-Request or Mobility On-Request Paratransit vehicles. Drivers bring found items to lost and found after completing their route.",
    "Report the item with YRT's online form or by phone. Have ready the date, the route or stop (or pickup and drop-off locations for On-Request), the time and direction of travel, and a description. YRT contacts you within two business days; if you have not heard back, call 1-866-668-3978, option 4. If your item is found, YRT works with you to arrange pickup.",
    "Under YRT's lost and found policy, items claimed in person require government-issued ID and a signature. On written request, an item can be mailed at the owner's expense and risk.",
    "For a lost passport when you travel within 48 hours, or medication you need right away, call 1-866-668-3978, option 4. Items lost at Finch or Highway 407 GO Bus Terminal are handled by GO Transit, and items lost at Don Mills or Sheppard West station by the TTC."
   ],
   "hold": "30 days. After that, wallets, ID with personal information, medications and electronics are sent to YRT Transit Enforcement; other unclaimed items are donated, recycled, sold or disposed of.",
   "contacts": [
    {
     "label": "Bus, stop or terminal (weekdays 7 a.m. to 7 p.m.; weekends and holidays 8:30 a.m. to 4:30 p.m.)",
     "value": "1-866-668-3978, option 4",
     "href": "tel:+18666683978"
    },
    {
     "label": "On-Request vehicle (daily, 5 a.m. to midnight)",
     "value": "1-888-762-2950, press 2",
     "href": "tel:+18887622950"
    },
    {
     "label": "Mobility On-Request Paratransit (weekdays 8 a.m. to 4 p.m.)",
     "value": "1-888-762-2950, press 1, then 1",
     "href": "tel:+18887622950"
    },
    {
     "label": "Local line",
     "value": "905-762-2100",
     "href": "tel:+19057622100"
    }
   ],
   "links": [
    {
     "label": "YRT lost and found →",
     "href": "https://yrt.ca/LostAndFound"
    }
   ]
  },
  {
   "kind": "transit",
   "title": "Toronto Transit Commission (TTC) Lost Articles Office",
   "where": "Bay subway station, Toronto",
   "body": [
    "For items left on TTC vehicles or property, including Line 1 subway stations in Vaughan such as Vaughan Metropolitan Centre. Items found by TTC staff or turned in by riders are sent to the Lost Articles Office at 2 p.m. each weekday.",
    "You can ask by phone or in person. The office is open to the public from 8 a.m. to 4:45 p.m., Monday to Friday, except statutory holidays."
   ],
   "hold": "Most items 30 days; bicycles 15 days. Canadian passports are sent immediately to Passport Canada; international passports are held 10 days, then sent to a consulate or embassy. Unclaimed items are sold at auction.",
   "contacts": [
    {
     "label": "Phone (weekdays, 12 p.m. to 5 p.m.)",
     "value": "416-393-4100",
     "href": "tel:+14163934100"
    }
   ],
   "links": [
    {
     "label": "TTC lost articles →",
     "href": "https://www.ttc.ca/en/customer-service/lost-articles"
    }
   ]
  },
  {
   "kind": "transit",
   "title": "GO Transit Lost and Found (Metrolinx)",
   "where": "Counter 6, York Concourse, Union Station, 35 York Street, Toronto",
   "body": [
    "Items left on GO trains and buses, or at GO stations in Vaughan such as Rutherford GO, are sent to GO Transit's Lost and Found office at Union Station, usually within ten business days. Report the item with GO's online form.",
    "To claim an item, bring ID and proof of ownership, such as the phone number of a lost phone. You can name someone to claim it for you, or arrange a prepaid courier pickup.",
    "Open Monday to Friday, 10 a.m. to 6 p.m., and Saturday and Sunday, 10 a.m. to 5:30 p.m. Closed on statutory holidays."
   ],
   "hold": "30 calendar days, then unclaimed items are donated.",
   "contacts": [
    {
     "label": "Phone",
     "value": "416-202-1600",
     "href": "tel:+14162021600"
    }
   ],
   "links": [
    {
     "label": "GO Transit lost and found →",
     "href": "https://www.gotransit.com/en/lost-and-found"
    }
   ]
  },
  {
   "kind": "police",
   "title": "York Regional Police, #4 District (Vaughan)",
   "where": "#4 District headquarters, 2700 Rutherford Road, open 24 hours a day",
   "body": [
    "York Regional Police takes online reports for property lost in York Region when there are no suspects or leads and no police attendance is needed. The report creates a record that may help police identify and return the property if it is recovered. If the property was stolen, or you know who took it, report it as a crime instead.",
    "Lost Ontario documents (birth certificates, driver's licences, health cards), licence plates and accessible parking permits are reported to ServiceOntario, and lost Canadian passports and SIN cards to Service Canada. If an Ontario document is lost or stolen in York Region, police ask you to complete the Lost or Stolen Official Document Form and bring it to your nearest police district. #4 District serves Vaughan."
   ],
   "contacts": [
    {
     "label": "Non-emergency line",
     "value": "1-866-876-5423",
     "href": "tel:+18668765423"
    }
   ],
   "links": [
    {
     "label": "York Regional Police lost property report →",
     "href": "https://www.yrp.ca/node/381"
    }
   ]
  },
  {
   "kind": "animal",
   "title": "Vaughan Animal Services (City of Vaughan)",
   "where": "70 Tigi Court, Vaughan",
   "body": [
    "Vaughan Animal Services picks up stray dogs and injured or sick animals, and works to reunite owners with lost pets. Stray pets it takes in are posted on 24Petconnect, which searches lost and found reports posted within the community and Ontario.",
    "For questions, contact the City of Vaughan contact centre by phone or email."
   ],
   "contacts": [
    {
     "label": "City of Vaughan contact centre",
     "value": "905-832-2281",
     "href": "tel:+19058322281"
    },
    {
     "label": "Toll-free",
     "value": "1-844-832-2112",
     "href": "tel:+18448322112"
    },
    {
     "label": "Email",
     "value": "service@vaughan.ca",
     "href": "mailto:service@vaughan.ca"
    }
   ],
   "links": [
    {
     "label": "City of Vaughan lost and found pets →",
     "href": "https://vaughan.ca/residential/animal-services/lost-or-found-animals"
    }
   ]
  },
  {
   "kind": "other",
   "title": "Vaughan Mills shopping centre",
   "where": "1 Bass Pro Mills Drive; Guest Services kiosk near H&M, between Entry 4 and 5",
   "body": [
    "For items lost or found during a visit to the mall, call the lost and found line. Found items are transferred to the mall's Security Office."
   ],
   "hold": "At least 30 days. Unclaimed items are donated wherever possible to charitable partners.",
   "contacts": [
    {
     "label": "Lost and found",
     "value": "905-879-2111",
     "href": "tel:+19058792111"
    }
   ],
   "links": [
    {
     "label": "Vaughan Mills services →",
     "href": "https://www.vaughanmills.com/services/"
    }
   ]
  }
 ],
 "found": {
  "heading": "Found something in Vaughan?",
  "body": [
   "Hand the item to the organisation that runs the place where you found it. On YRT, give it to the bus driver or to YRT staff on site; drivers take found items to lost and found after their route. Items turned in on the TTC are sent to the TTC Lost Articles Office at Bay station, and items found on GO trains, buses and at GO stations are sent to GO Transit's office at Union Station. At Vaughan Mills, call the mall's lost and found line at 905-879-2111.",
   "If you find a Canadian passport, the Government of Canada asks you to return it to a passport office, a Service Canada Centre, or a police or RCMP station, with a short letter saying how, when and where you found it. A found Ontario health card can be brought to any ServiceOntario location or police station, or dropped in any Canada Post mailbox.",
   "Under Ontario's Community Safety and Policing Act, 2019 (s. 258), police may sell unclaimed property they hold, other than money and firearms, once it has been held for at least one month for a bicycle or three months for most other items. The Act does not give finders a right to claim items handed to the police."
  ]
 },
 "optionsHeading": "Reporting a loss with ReportLost",
 "options": [
  "Free listing: your report is published as a searchable public listing.",
  "Automatic search, CA$17 once: six months of public-web monitoring with potential matches reviewed before notification, a dated ReportLost certificate, an anonymous email address linked to your report, and printable QR stickers linked to it.",
  "Team-assisted search, CA$35 once: everything in the CA$17 option, with 12 months of monitoring, manual research by a team member, direct contact with relevant services and venues, submission of your report to appropriate lost-property services, and a notice shared with relevant local groups under their posting rules.",
  "Recovery is never guaranteed. Each organisation listed above applies its own procedure and decides whether it accepts a report filed by a third party."
 ],
 "faq": [
  {
   "q": "How long does YRT keep lost items?",
   "a": "YRT stores items found on its buses, at stops and terminals, and in On-Request vehicles for 30 days. After that, wallets, ID with personal information, medications and electronics are sent to YRT Transit Enforcement. Report the item with YRT's online form or call 1-866-668-3978, option 4; YRT contacts you within two business days."
  },
  {
   "q": "I left something on the subway at Vaughan Metropolitan Centre. Where is it?",
   "a": "Items found on the TTC, including Line 1 in Vaughan, are sent to the TTC Lost Articles Office at Bay station in Toronto. Most items are held for 30 days and bicycles for 15 days. You can call 416-393-4100 on weekdays from 12 p.m. to 5 p.m., or visit the office from 8 a.m. to 4:45 p.m., Monday to Friday."
  },
  {
   "q": "Can I report lost property to York Regional Police?",
   "a": "Yes, online, for property lost in York Region when there are no suspects or leads and no police attendance is needed. The report is a record that may help police return the property if it is recovered. Lost Ontario documents go to ServiceOntario, and lost Canadian passports and SIN cards to Service Canada."
  },
  {
   "q": "My pet is lost in Vaughan. Where should I look?",
   "a": "Vaughan Animal Services, at 70 Tigi Court, posts the stray pets it takes in on 24Petconnect, which also searches lost and found reports posted in the community and across Ontario. For questions, contact the City of Vaughan contact centre at 905-832-2281 or service@vaughan.ca."
  },
  {
   "q": "Is ReportLost an official lost and found service?",
   "a": "No. ReportLost is an independent service. It is not affiliated with York Region Transit, the TTC, Metrolinx, York Regional Police, Vaughan Mills or the City of Vaughan, and it does not replace their procedures. Recovery is never guaranteed."
  }
 ],
 "sources": [
  {
   "label": "York Region Transit, Lost and Found",
   "href": "https://yrt.ca/LostAndFound"
  },
  {
   "label": "York Region Transit, Transit Lost and Found Policy (2024)",
   "href": "https://www.yrt.ca/en/resourcesGeneral/Bike%20Auction/Transit-Lost-and-Found-Policy.pdf"
  },
  {
   "label": "TTC, Lost articles",
   "href": "https://www.ttc.ca/en/customer-service/lost-articles"
  },
  {
   "label": "GO Transit, Lost and found",
   "href": "https://www.gotransit.com/en/lost-and-found"
  },
  {
   "label": "GO Transit, Rutherford GO station",
   "href": "https://www.gotransit.com/en/find-a-station/00028/routes-departures"
  },
  {
   "label": "York Regional Police, Report lost property",
   "href": "https://www.yrp.ca/node/381"
  },
  {
   "label": "York Regional Police, Policing in #4 District",
   "href": "https://www.yrp.ca/en/about/4-District-Vaughan.asp"
  },
  {
   "label": "York Regional Police, Locations",
   "href": "https://yrp.ca/en/about/locations.asp"
  },
  {
   "label": "City of Vaughan, Lost or found animals",
   "href": "https://vaughan.ca/residential/animal-services/lost-or-found-animals"
  },
  {
   "label": "City of Vaughan, Animal Services",
   "href": "https://www.vaughan.ca/animal"
  },
  {
   "label": "City of Vaughan, contact centre details (You asked, we answered)",
   "href": "https://vaughan.ca/news/you-asked-we-answered-46"
  },
  {
   "label": "York Region, Vaughan Animal Services drop-off location",
   "href": "https://york.ca/node/36211"
  },
  {
   "label": "Vaughan Mills, Services",
   "href": "https://www.vaughanmills.com/services/"
  },
  {
   "label": "Government of Canada, Found passports",
   "href": "https://www.canada.ca/en/immigration-refugees-citizenship/services/canadian-passports/lost-stolen-inaccessible-damaged-found.html"
  },
  {
   "label": "Ontario, Health card (found card)",
   "href": "https://www.ontario.ca/page/replace-cancel-or-change-information-your-health-card"
  },
  {
   "label": "Community Safety and Policing Act, 2019, s. 258",
   "href": "https://www.ontario.ca/laws/statute/19c01"
  }
 ],
 "disclaimer": "ReportLost is independent and is not affiliated with any organisation listed on this page. Contacts and procedures are taken from each organisation's official website and may change; check with the organisation before going to an office."
}$json$::jsonb, 'draft', false),
('ON', 'kitchener', 'en', $json${
 "province": "ON",
 "citySlug": "kitchener",
 "lang": "en",
 "cityName": "Kitchener",
 "metaTitle": "Lost and Found in Kitchener: GRT, ION, Waterloo Airport, Police",
 "metaDescription": "Where lost items end up in Kitchener: GRT and ION at 105 King St. E., Waterloo Airport, Waterloo Regional Police, GO Transit, VIA Rail and the Humane Society.",
 "h1": "Lost and found in Kitchener",
 "lede": "In Kitchener, a lost item stays with the organisation that runs the place where it was left or turned in: Grand River Transit, GO Transit, VIA Rail, the Region of Waterloo International Airport or the police. This page lists who holds what, for how long, and how to ask.",
 "lastReviewed": "2026-11-05",
 "map": {
  "mode": "places",
  "heading": "Where lost items are held in Kitchener",
  "places": [
   {
    "name": "Grand River Transit (GRT) Lost and Found",
    "address": "GRT Customer Service Centre, 105 King St. E.",
    "lat": 43.4485,
    "lng": -80.4874
   },
   {
    "name": "Region of Waterloo International Airport, Air Terminal Building",
    "address": "1-4881 Fountain Street North, Breslau, ON N0B 1M0",
    "lat": 43.4559,
    "lng": -80.3884
   }
  ],
  "note": "Items left on GRT buses and ION trains in Kitchener are held at the GRT Customer Service Centre, 105 King St. E.; GRT asks you to call 519-585-7555 before going to pick up an item."
 },
 "cardsHeading": "Who holds lost items in Kitchener",
 "cards": [
  {
   "kind": "transit",
   "title": "Grand River Transit (GRT) Lost and Found",
   "where": "GRT Customer Service Centre, 105 King St. E. (corner of King and Benton streets)",
   "body": [
    "For items left on GRT buses and ION trains. Items from Kitchener and Waterloo buses and from ION trains are held at the Customer Service Centre at 105 King St. E. ION items are brought in on Tuesdays and Fridays. Items from Cambridge buses go to the Ainslie Street Terminal, 35 Ainslie Street S., Cambridge; for routes running between Cambridge, Kitchener and Waterloo, the item may be at either location.",
    "Call 519-585-7555 to check whether your item has been turned in before going to pick it up. Bring identification and be ready to describe the item in detail; only the owner can claim it.",
    "The Customer Service Centre is open Monday to Friday, 8 a.m. to 6 p.m., and Saturday, 9:30 a.m. to 5 p.m. Closed Sundays and holidays."
   ],
   "hold": "Bikes and electronics 4 weeks, then donated. Miscellaneous items 1 to 2 weeks, then donated to a local charity. Government or legal documents 4 weeks, then mailed to the appropriate government office or legal department.",
   "contacts": [
    {
     "label": "GRT customer service (available 24/7)",
     "value": "519-585-7555",
     "href": "tel:+15195857555"
    }
   ],
   "links": [
    {
     "label": "GRT lost and found →",
     "href": "https://grt.ca/rider-information/lost-and-found/"
    }
   ]
  },
  {
   "kind": "police",
   "title": "Waterloo Regional Police Service",
   "body": [
    "Waterloo Regional Police defines lost property as items accidentally left behind somewhere or misplaced. A loss can be reported through the service's online reporting platform, available 24/7, or by calling the non-emergency line.",
    "A person who has found someone's lost property, reported it to police, and wishes to keep the items uses the online Finder Claim Form, with the occurrence number, where and when the items were found, and a description."
   ],
   "contacts": [
    {
     "label": "Non-emergency line",
     "value": "519-570-9777",
     "href": "tel:+15195709777"
    },
    {
     "label": "TTY",
     "value": "1-888-420-1777",
     "href": "tel:+18884201777"
    }
   ],
   "links": [
    {
     "label": "Waterloo Regional Police, who to call →",
     "href": "https://wrps.ca/contact-us/who-call"
    },
    {
     "label": "Finder Claim Form →",
     "href": "https://wrps.ca/form/finder-claim-form"
    }
   ]
  },
  {
   "kind": "airport",
   "title": "Region of Waterloo International Airport (YKF), Lost and Found",
   "where": "Information booth, main terminal, 1-4881 Fountain Street North, Breslau",
   "body": [
    "For items lost in the Main Air Terminal Building, the Domestic Arrivals Building or the parking lots. Ask at the Information booth in the main terminal or call the airport. Be prepared to show identification and to describe the item in detail when you pick it up.",
    "Lost or damaged luggage and items left on board an aircraft are the responsibility of each airline; contact the airline directly. Lost passports are turned over to the Canada Border Services Agency."
   ],
   "hold": "Items are stored in the Lost and Found office for 30 days, then donated or disposed of.",
   "contacts": [
    {
     "label": "Lost and Found",
     "value": "519-575-4781",
     "href": "tel:+15195754781"
    },
    {
     "label": "General inquiries",
     "value": "airport@regionofwaterloo.ca",
     "href": "mailto:airport@regionofwaterloo.ca"
    }
   ],
   "links": [
    {
     "label": "Waterloo Airport passenger services →",
     "href": "https://www.waterlooairport.ca/en/passengers/additional-services.aspx"
    }
   ]
  },
  {
   "kind": "transit",
   "title": "GO Transit Lost and Found (Metrolinx)",
   "where": "Counter 6, York Concourse, Union Station, 35 York Street, Toronto",
   "body": [
    "Items left on GO trains and buses, including on the Kitchener line, or at GO stations and terminals are sent to GO Transit's single Lost and Found office at Union Station in Toronto, usually within ten business days. Report the item with GO's online form.",
    "To claim an item, bring ID and proof of ownership, such as the phone number of a lost phone or the password of a laptop. You can name someone to claim it for you, or arrange a prepaid courier pickup.",
    "Open Monday to Friday, 10 a.m. to 6 p.m., and Saturday and Sunday, 10 a.m. to 5:30 p.m. Closed on statutory holidays."
   ],
   "hold": "30 calendar days, then unclaimed items are donated.",
   "contacts": [
    {
     "label": "Phone",
     "value": "416-202-1600",
     "href": "tel:+14162021600"
    }
   ],
   "links": [
    {
     "label": "GO Transit lost and found →",
     "href": "https://gotransit.com/en/lost-and-found"
    }
   ]
  },
  {
   "kind": "transit",
   "title": "VIA Rail Canada, Kitchener station",
   "where": "126 Weber St. West",
   "body": [
    "If you leave a personal item on a VIA train, report it on arrival at the station's baggage or ticket counter; staff help locate the item and start the recovery process. The Kitchener station is staffed; its ticket counter is open daily from 11:15 a.m. to 2:45 p.m. and from 4:15 p.m. to 7:45 p.m.",
    "Baggage lost in a station can be reported to VIA's Lost and Found department by phone or at the station ticket counter."
   ],
   "contacts": [
    {
     "label": "VIA Lost and Found",
     "value": "1 888 842-7245",
     "href": "tel:+18888427245"
    },
    {
     "label": "TTY",
     "value": "1 800 268-9503",
     "href": "tel:+18002689503"
    }
   ],
   "links": [
    {
     "label": "VIA Rail Kitchener station →",
     "href": "https://www.viarail.ca/en/explore-our-destinations/stations/ontario/kitchener"
    }
   ]
  },
  {
   "kind": "animal",
   "title": "Humane Society of Kitchener Waterloo & Stratford Perth",
   "where": "Kitchener Waterloo Animal Centre, 250 Riverbend Drive. Stray reclaims at reception: Monday to Friday, 9 a.m. to 6 p.m.; Saturday and Sunday, 10 a.m. to 4 p.m.",
   "body": [
    "The Humane Society provides municipal animal services for the City of Kitchener, handling stray and at-large dogs, and stray cats that are confined.",
    "If your pet is lost, file a lost pet report online (Waterloo Region form), check the Lost Pets in Our Care page, where animals appear for 5 days upon arrival, and call the centre for updates. To reclaim a pet, bring ID with your address and proof of ownership such as photos, vet records or licence documents. An impound fee applies, boarding fees may apply, and you may need to buy a licence tag.",
    "If you find a dog or small animal, file a found report by phone or online and keep the animal safe at home if you can; otherwise bring it in so it can be scanned for a microchip. A cat outside is not necessarily lost: if it seems healthy, the Humane Society asks you to leave it where it is, and to file a found report only for a confined cat.",
    "The centre is closed on statutory and civic holidays, and reception is closed from 9 a.m. to 1 p.m. on the last Wednesday of each month."
   ],
   "contacts": [
    {
     "label": "Phone",
     "value": "519-745-5615",
     "href": "tel:+15197455615"
    },
    {
     "label": "Email",
     "value": "infokw@kwsphumane.ca",
     "href": "mailto:infokw@kwsphumane.ca"
    }
   ],
   "links": [
    {
     "label": "Humane Society lost and found →",
     "href": "https://kwsphumane.ca/lost-and-found"
    }
   ]
  }
 ],
 "found": {
  "heading": "Found something in Kitchener?",
  "body": [
   "Hand the item to the organisation that runs the place where you found it. Items turned in on GRT buses and ION trains go to GRT's lost and found at 105 King St. E. (or the Ainslie Street Terminal for Cambridge buses); items found in the airport terminal buildings or parking lots are handled at the Information booth in the main terminal; items found on GO trains and buses or at GO stations go to GO Transit's office at Union Station in Toronto. For a found dog or small animal in Kitchener, call the Humane Society of Kitchener Waterloo & Stratford Perth at 519-745-5615 or file a found report online. If you reported found property to Waterloo Regional Police and wish to keep it, the police ask you to use its Finder Claim Form.",
   "If you find a Canadian passport, the Government of Canada asks you to return it to a passport office, a Service Canada Centre, or a police or RCMP station, with a short letter saying how, when and where you found it. A found Ontario health card can be brought to any ServiceOntario location or police station, or dropped in any Canada Post mailbox.",
   "Under Ontario's Community Safety and Policing Act, 2019 (s. 258), police may sell unclaimed property they hold, other than money and firearms, once it has been held for at least one month for a bicycle or three months for most other items. The Act does not give finders a right to claim items handed to the police."
  ]
 },
 "optionsHeading": "Reporting a loss with ReportLost",
 "options": [
  "Free listing: your report is published as a searchable public listing.",
  "Automatic search, CA$17 once: six months of public-web monitoring with potential matches reviewed before notification, a dated ReportLost certificate, an anonymous email address linked to your report, and printable QR stickers linked to it.",
  "Team-assisted search, CA$35 once: everything in the CA$17 option, with 12 months of monitoring, manual research by a team member, direct contact with relevant services and venues, submission of your report to appropriate lost-property services, and a notice shared with relevant local groups under their posting rules.",
  "Recovery is never guaranteed. Each organisation listed above applies its own procedure and decides whether it accepts a report filed by a third party."
 ],
 "faq": [
  {
   "q": "How long does GRT keep lost items?",
   "a": "Grand River Transit holds bikes and electronics for four weeks before donating them, and miscellaneous items for one to two weeks before donating them to a local charity. Government or legal documents are held for four weeks, then mailed to the appropriate government office or legal department. Call 519-585-7555 before going to pick up an item."
  },
  {
   "q": "I left something on the ION train. Where do I get it back?",
   "a": "Items found on ION trains are brought to the GRT Customer Service Centre at 105 King St. E., Kitchener, on Tuesdays and Fridays. The centre is open Monday to Friday, 8 a.m. to 6 p.m., and Saturday, 9:30 a.m. to 5 p.m. Bring identification and be ready to describe the item in detail."
  },
  {
   "q": "I lost something at the Region of Waterloo International Airport. Who do I contact?",
   "a": "For an item lost in the terminal buildings or parking lots, ask at the Information booth in the main terminal or call 519-575-4781. Found items are kept for 30 days, then donated or disposed of. For an item left on the plane or for lost luggage, contact your airline directly."
  },
  {
   "q": "My pet is missing in Kitchener. Where should I look?",
   "a": "The Humane Society of Kitchener Waterloo & Stratford Perth provides animal services for the City of Kitchener. File a lost pet report online, check its Lost Pets in Our Care page, and call 519-745-5615 for updates. To reclaim your pet, bring ID with your address and proof of ownership; an impound fee applies."
  },
  {
   "q": "Is ReportLost an official lost and found service?",
   "a": "No. ReportLost is an independent service. It is not affiliated with Grand River Transit, the Waterloo Regional Police Service, the Region of Waterloo International Airport, Metrolinx, VIA Rail or the Humane Society of Kitchener Waterloo & Stratford Perth, and it does not replace their procedures. Recovery is never guaranteed."
  }
 ],
 "sources": [
  {
   "label": "Grand River Transit, Lost and found",
   "href": "https://grt.ca/rider-information/lost-and-found/"
  },
  {
   "label": "Grand River Transit, Contact us",
   "href": "https://grt.ca/about-grt/contact-us/"
  },
  {
   "label": "Waterloo Regional Police Service, Who to call",
   "href": "https://wrps.ca/contact-us/who-call"
  },
  {
   "label": "Waterloo Regional Police Service, Finder Claim Form",
   "href": "https://wrps.ca/form/finder-claim-form"
  },
  {
   "label": "Region of Waterloo International Airport, Additional services (Lost and Found)",
   "href": "https://www.waterlooairport.ca/en/passengers/additional-services.aspx"
  },
  {
   "label": "Region of Waterloo International Airport, Contact us",
   "href": "https://www.waterlooairport.ca/about-ykf/contact-us/"
  },
  {
   "label": "GO Transit, Lost and found",
   "href": "https://gotransit.com/en/lost-and-found"
  },
  {
   "label": "VIA Rail, Kitchener station",
   "href": "https://www.viarail.ca/en/explore-our-destinations/stations/ontario/kitchener"
  },
  {
   "label": "VIA Rail, What should passengers do if they forget a personal item on the train",
   "href": "https://www.viarail.ca/en/plan/faq/baggage/what-should-passengers-do-if-they-forget-a-personal-item-on-the-train"
  },
  {
   "label": "VIA Rail, What should passengers do if their baggage is lost or stolen at the station",
   "href": "https://www.viarail.ca/en/plan/faq/baggage/what-should-passengers-do-if-their-baggage-is-lost-or-stolen-at-the-station"
  },
  {
   "label": "Humane Society of Kitchener Waterloo & Stratford Perth, Lost and found",
   "href": "https://kwsphumane.ca/lost-and-found"
  },
  {
   "label": "Humane Society of Kitchener Waterloo & Stratford Perth, Lost pets in our care",
   "href": "https://kwsphumane.ca/found-pets"
  },
  {
   "label": "Humane Society of Kitchener Waterloo & Stratford Perth, Lost a pet",
   "href": "https://kwsphumane.ca/lost-a-pet"
  },
  {
   "label": "Humane Society of Kitchener Waterloo & Stratford Perth, Found a pet",
   "href": "https://kwsphumane.ca/found-a-pet"
  },
  {
   "label": "Humane Society of Kitchener Waterloo & Stratford Perth, Municipal animal services",
   "href": "https://kwsphumane.ca/animal-control"
  },
  {
   "label": "Humane Society of Kitchener Waterloo & Stratford Perth, Contact, hours and locations",
   "href": "https://kwsphumane.ca/hours-and-locations"
  },
  {
   "label": "Government of Canada, Found passports",
   "href": "https://www.canada.ca/en/immigration-refugees-citizenship/services/canadian-passports/lost-stolen-inaccessible-damaged-found.html"
  },
  {
   "label": "Ontario, Health card (found card)",
   "href": "https://www.ontario.ca/page/replace-cancel-or-change-information-your-health-card"
  },
  {
   "label": "Community Safety and Policing Act, 2019, s. 258",
   "href": "https://www.ontario.ca/laws/statute/19c01"
  }
 ],
 "disclaimer": "ReportLost is independent and is not affiliated with any organisation listed on this page. Contacts and procedures are taken from each organisation's official website and may change; check with the organisation before going to an office."
}$json$::jsonb, 'draft', false),
('ON', 'windsor', 'en', $json${
 "province": "ON",
 "citySlug": "windsor",
 "lang": "en",
 "cityName": "Windsor",
 "metaTitle": "Lost and Found in Windsor, ON: Transit Windsor, YQG and Police",
 "metaDescription": "Lost items in Windsor, Ontario: Transit Windsor at the WITT, Windsor Police, YQG airport security, VIA Rail and the Windsor/Essex County Humane Society.",
 "h1": "Lost and found in Windsor",
 "lede": "In Windsor, Ontario, a lost item stays with the organisation that runs the place where it was left or turned in: Transit Windsor, Windsor International Airport, VIA Rail or the police. This page lists who holds what, for how long, and how to ask.",
 "lastReviewed": "2026-11-05",
 "map": {
  "mode": "places",
  "heading": "Where lost items are held in Windsor",
  "places": [
   {
    "name": "Transit Windsor, Windsor International Transit Terminal",
    "address": "300 Chatham Street West, Windsor, ON N9A 0A8",
    "lat": 42.3176,
    "lng": -83.0431
   },
   {
    "name": "Windsor International Airport (YQG)",
    "address": "Terminal building",
    "lat": 42.266,
    "lng": -82.9603
   }
  ],
  "note": "Transit Windsor arranges pickup of found items through its customer service, so call 519-944-4111 before going to the terminal."
 },
 "cardsHeading": "Who holds lost items in Windsor",
 "cards": [
  {
   "kind": "transit",
   "title": "Transit Windsor Lost and Found",
   "where": "Windsor International Transit Terminal (WITT), 300 Chatham Street West",
   "body": [
    "For items left on Transit Windsor buses or property, including the Tunnel route between the Windsor International Transit Terminal and downtown Detroit. To ask about a lost item, call Transit Windsor. If your item has been found, pickup is arranged with customer service.",
    "In-person service is at the Windsor International Transit Terminal, open 8 a.m. to 6 p.m., seven days a week, with reduced hours or closures on some holidays. For general information, you can also call 311."
   ],
   "hold": "Found items are stored for 14 days.",
   "contacts": [
    {
     "label": "Phone",
     "value": "519-944-4111",
     "href": "tel:+15199444111"
    }
   ],
   "links": [
    {
     "label": "Transit Windsor contact information →",
     "href": "https://citywindsor.ca/residents/transit-windsor/contact-information"
    }
   ]
  },
  {
   "kind": "police",
   "title": "Windsor Police Service",
   "body": [
    "Windsor Police accepts online reports of property lost in Windsor and Amherstburg, so items can be returned if they are recovered. Some losses are also reported elsewhere: accessible parking permits and provincial ID to ServiceOntario, passports, SIN cards and other federal ID to Service Canada, and bank cards to your financial institution.",
    "Found-property reports are accepted online only for government-issued identification or government property; an officer then arranges to retrieve the item. Police do not pick up everyday lost items, electronics, clothing, bags or tools. Found weapons, dangerous items, items related to a crime or large amounts of cash are reported on the non-emergency line."
   ],
   "contacts": [
    {
     "label": "Non-emergency line",
     "value": "519-258-6111",
     "href": "tel:+15192586111"
    }
   ],
   "links": [
    {
     "label": "Windsor Police lost or found property →",
     "href": "https://windsorpolice.ca/services/reporting/online/lost-found"
    }
   ]
  },
  {
   "kind": "airport",
   "title": "Windsor International Airport (YQG)",
   "where": "Airport Terminal Security Office, terminal concourse",
   "body": [
    "Lost and found inquiries are handled by the Airport Terminal Security Office in the terminal concourse. You can also contact Airport Security by phone or email.",
    "Items left on board an aircraft are the responsibility of the airline; contact the airline you travelled with."
   ],
   "contacts": [
    {
     "label": "Airport Security",
     "value": "+1 (519) 969-2430 ext. 0",
     "href": "tel:+15199692430"
    },
    {
     "label": "Email",
     "value": "soc@yqg.ca",
     "href": "mailto:soc@yqg.ca"
    }
   ],
   "links": [
    {
     "label": "YQG guest services →",
     "href": "https://flyyqg.ca/airport/guest-services/"
    }
   ]
  },
  {
   "kind": "transit",
   "title": "VIA Rail Canada, Windsor station",
   "where": "298 Walker Road",
   "body": [
    "If you leave an item on a VIA train, report it on arrival at the station; station staff help locate it. Baggage lost or stolen in a station can be reported to VIA's Lost and Found by phone or at the station ticket counter.",
    "The Windsor station ticket counter is open every day, 4:45 a.m. to 9:30 p.m."
   ],
   "contacts": [
    {
     "label": "VIA Lost and Found",
     "value": "1 888 842-7245",
     "href": "tel:+18888427245"
    }
   ],
   "links": [
    {
     "label": "VIA Rail Windsor station →",
     "href": "https://www.viarail.ca/en/explore-our-destinations/stations/ontario/windsor"
    }
   ]
  },
  {
   "kind": "animal",
   "title": "Windsor/Essex County Humane Society",
   "where": "1375 Provincial Road; lost and found and reclaims by appointment, 8 a.m. to 6 p.m. daily, closed on holidays",
   "body": [
    "The City of Windsor lists the Humane Society for lost and found pet services and for stray dogs found in the community. To report a lost dog, call or email a photo. Reclaims are by appointment: bring ID showing your address and proof of ownership, such as photos or vet records. A claim fee applies to a dog not wearing a current licence tag, plus $25 per day if the dog stays more than 24 hours; the claim fee for a cat is $25. The shelter also suggests checking the Lakeshore and Leamington/Kingsville pounds.",
    "If you find a dog, call or email the Humane Society; found dogs are urgent appointments and same-day drop-offs are available. A found dog in Windsor or Amherstburg can be picked up if you cannot care for it while the owner is sought."
   ],
   "hold": "Stray dogs are held three days before being assessed for adoption; the owner must reclaim within that period or loses all legal rights to the dog. Friendly stray cats are normally held three days.",
   "contacts": [
    {
     "label": "Shelter, lost and found",
     "value": "519-966-5751",
     "href": "tel:+15199665751"
    },
    {
     "label": "Lost and found pet photos",
     "value": "pound@windsorhumane.org",
     "href": "mailto:pound@windsorhumane.org"
    }
   ],
   "links": [
    {
     "label": "Humane Society lost and found →",
     "href": "https://windsorhumane.org/lost-and-found-main/"
    }
   ]
  }
 ],
 "found": {
  "heading": "Found something in Windsor?",
  "body": [
   "In Windsor, the place where you found an item usually decides who handles it. Transit Windsor's lost and found is reached at 519-944-4111, and lost and found at Windsor International Airport is handled by the Airport Terminal Security Office in the terminal concourse. Windsor Police Service accepts online found-property reports for Windsor and Amherstburg only for government-issued identification or government property, and an officer arranges to retrieve the item; it does not pick up everyday items, electronics, clothing, bags or tools. Found weapons, dangerous items, items related to a crime or large amounts of cash are reported on the police non-emergency line, 519-258-6111. A found dog can be reported to the Windsor/Essex County Humane Society at 519-966-5751 or pound@windsorhumane.org.",
   "If you find a Canadian passport, the Government of Canada asks you to return it to a passport office, a Service Canada Centre, or a police or RCMP station, with a short letter saying how, when and where you found it. A found Ontario health card can be brought to any ServiceOntario location or police station, or dropped in any Canada Post mailbox.",
   "Under Ontario's Community Safety and Policing Act, 2019 (s. 258), police may sell unclaimed property they hold, other than money and firearms, once it has been held for at least one month for a bicycle or three months for most other items. The Act does not give finders a right to claim items handed to the police."
  ]
 },
 "optionsHeading": "Reporting a loss with ReportLost",
 "options": [
  "Free listing: your report is published as a searchable public listing.",
  "Automatic search, CA$17 once: six months of public-web monitoring with potential matches reviewed before notification, a dated ReportLost certificate, an anonymous email address linked to your report, and printable QR stickers linked to it.",
  "Team-assisted search, CA$35 once: everything in the CA$17 option, with 12 months of monitoring, manual research by a team member, direct contact with relevant services and venues, submission of your report to appropriate lost-property services, and a notice shared with relevant local groups under their posting rules.",
  "Recovery is never guaranteed. Each organisation listed above applies its own procedure and decides whether it accepts a report filed by a third party."
 ],
 "faq": [
  {
   "q": "How long does Transit Windsor keep lost items?",
   "a": "Found items are stored for 14 days. Call Transit Windsor at 519-944-4111 to ask about an item; if it has been found, pickup is arranged with customer service. This also applies to the Tunnel route between the Windsor International Transit Terminal and downtown Detroit, which is a Transit Windsor route."
  },
  {
   "q": "Will Windsor Police pick up something I found?",
   "a": "Only government-issued identification or government property. You report it online, and an officer arranges to retrieve it. Windsor Police does not pick up everyday lost items, electronics, clothing, bags or tools. Found weapons, dangerous items, items related to a crime or large amounts of cash are reported on the non-emergency line, 519-258-6111."
  },
  {
   "q": "I lost something at Windsor International Airport. Who do I contact?",
   "a": "Ask at the Airport Terminal Security Office in the terminal concourse, or contact Airport Security at +1 (519) 969-2430 ext. 0 or soc@yqg.ca. For an item left on board an aircraft, contact the airline you travelled with."
  },
  {
   "q": "My dog is missing in Windsor. Where should I look?",
   "a": "Call the Windsor/Essex County Humane Society at 519-966-5751 or email a photo to pound@windsorhumane.org. Stray dogs are held three days, and the owner must reclaim within that period. Reclaims are by appointment, with ID showing your address and proof of ownership. The shelter also suggests checking the Lakeshore and Leamington/Kingsville pounds."
  },
  {
   "q": "Is ReportLost an official lost and found service?",
   "a": "No. ReportLost is an independent service. It is not affiliated with Transit Windsor, the Windsor Police Service, Windsor International Airport, VIA Rail, the Windsor/Essex County Humane Society or the City of Windsor, and it does not replace their procedures. Recovery is never guaranteed."
  }
 ],
 "sources": [
  {
   "label": "City of Windsor, Transit Windsor contact information",
   "href": "https://citywindsor.ca/residents/transit-windsor/contact-information"
  },
  {
   "label": "City of Windsor, Transit Windsor hours of operation",
   "href": "https://citywindsor.ca/residents/transit-windsor/Hours-of-Operation"
  },
  {
   "label": "City of Windsor, Transit Windsor Tunnel route map (effective September 1, 2024)",
   "href": "https://www.citywindsor.ca/documents/residents/transit-windsor/Tunnel%20Website%202024.pdf"
  },
  {
   "label": "Windsor Police Service, Lost or found property",
   "href": "https://windsorpolice.ca/services/reporting/online/lost-found"
  },
  {
   "label": "Windsor International Airport, FAQ",
   "href": "https://flyyqg.ca/faq"
  },
  {
   "label": "Windsor International Airport, Guest services",
   "href": "https://flyyqg.ca/airport/guest-services/"
  },
  {
   "label": "VIA Rail, Windsor train station",
   "href": "https://www.viarail.ca/en/explore-our-destinations/stations/ontario/windsor"
  },
  {
   "label": "VIA Rail, Forgotten personal item on the train",
   "href": "https://www.viarail.ca/en/plan/faq/baggage/what-should-passengers-do-if-they-forget-a-personal-item-on-the-train"
  },
  {
   "label": "VIA Rail, Baggage lost or stolen at the station",
   "href": "https://www.viarail.ca/en/plan/faq/baggage/what-should-passengers-do-if-their-baggage-is-lost-or-stolen-at-the-station"
  },
  {
   "label": "Windsor/Essex County Humane Society, Lost and found",
   "href": "https://windsorhumane.org/lost-and-found-main/"
  },
  {
   "label": "Windsor/Essex County Humane Society, I lost my dog",
   "href": "https://windsorhumane.org/i-lost-my-dog/"
  },
  {
   "label": "Windsor/Essex County Humane Society, I found a dog",
   "href": "https://windsorhumane.org/i-found-a-dog/"
  },
  {
   "label": "City of Windsor, Who to call and when: animal concerns in Windsor-Essex",
   "href": "https://citywindsor.ca/city-hall/licensing-and-registration/dog-licences/who-to-call-and-when-animal-concerns-in-windsor-essex"
  },
  {
   "label": "Government of Canada, Found passports",
   "href": "https://www.canada.ca/en/immigration-refugees-citizenship/services/canadian-passports/lost-stolen-inaccessible-damaged-found.html"
  },
  {
   "label": "Ontario, Health card (found card)",
   "href": "https://www.ontario.ca/page/replace-cancel-or-change-information-your-health-card"
  },
  {
   "label": "Community Safety and Policing Act, 2019, s. 258",
   "href": "https://www.ontario.ca/laws/statute/19c01"
  }
 ],
 "disclaimer": "ReportLost is independent and is not affiliated with any organisation listed on this page. Contacts and procedures are taken from each organisation's official website and may change; check with the organisation before going to an office."
}$json$::jsonb, 'draft', false),
('ON', 'oakville', 'en', $json${
 "province": "ON",
 "citySlug": "oakville",
 "lang": "en",
 "cityName": "Oakville",
 "metaTitle": "Lost and Found in Oakville: Oakville Transit, GO, Halton Police",
 "metaDescription": "Lost items in Oakville: Oakville Transit at 430 Wyecroft Road, GO Transit at Union Station, VIA Rail, Town facilities, Halton Police and HSOMH for pets.",
 "h1": "Lost and found in Oakville",
 "lede": "In Oakville, a lost item stays with the organisation that runs the place where it was left or turned in: Oakville Transit, GO Transit, VIA Rail, a Town of Oakville facility or the police. This page lists who holds what, for how long, and how to ask.",
 "lastReviewed": "2026-11-05",
 "map": {
  "mode": "places",
  "heading": "Where lost items are held in Oakville",
  "places": [
   {
    "name": "Oakville Transit Lost and Found",
    "address": "430 Wyecroft Road",
    "lat": 43.4392,
    "lng": -79.7039
   },
   {
    "name": "GO Transit Lost and Found, Union Station",
    "address": "Counter 6, York Concourse, Union Station, 35 York Street, Toronto",
    "lat": 43.6444,
    "lng": -79.3803
   }
  ],
  "note": "Items left on GO trains or at Oakville and Bronte GO stations are held at GO Transit's office in Toronto's Union Station; Oakville Transit items are picked up at its facility at 430 Wyecroft Road, Oakville."
 },
 "cardsHeading": "Who holds lost items in Oakville",
 "cards": [
  {
   "kind": "transit",
   "title": "Oakville Transit Lost and Found",
   "where": "Oakville Transit facility, 430 Wyecroft Road",
   "body": [
    "For items lost on Oakville Transit. To check whether your item has been found, call customer service and describe it clearly: colour, material, size, model number and any other identifying details. Found items are logged.",
    "Items are picked up at the Oakville Transit facility, Monday to Friday, 8:30 a.m. to 4:30 p.m. The service counter is closed from noon to 1 p.m., on weekends and on statutory holidays.",
    "Items lost at a GO station are handled by GO Transit's Lost and Found."
   ],
   "hold": "Three months. Lost food is thrown out at the end of each business day.",
   "contacts": [
    {
     "label": "Customer service (Monday to Friday, 8:30 a.m. to 4:30 p.m.)",
     "value": "905-815-2020",
     "href": "tel:+19058152020"
    },
    {
     "label": "Email",
     "value": "transit@oakville.ca",
     "href": "mailto:transit@oakville.ca"
    }
   ],
   "links": [
    {
     "label": "Oakville Transit lost and found →",
     "href": "https://www.oakvilletransit.ca/riding-with-us/lost-found/"
    }
   ]
  },
  {
   "kind": "transit",
   "title": "GO Transit Lost and Found (Metrolinx)",
   "where": "Counter 6, York Concourse, Union Station, 35 York Street, Toronto",
   "body": [
    "For items left on GO trains and GO buses, or at Oakville's GO stations, including Oakville and Bronte. Report the item with GO's online form. Found items are brought to the Union Station office, which can take up to ten business days.",
    "To claim an item, bring ID and proof of ownership, such as the phone number of a lost phone or the password of a laptop. You can name someone to claim it for you, or arrange a prepaid courier pickup.",
    "Open Monday to Friday, 10 a.m. to 6 p.m., and Saturday and Sunday, 10 a.m. to 5:30 p.m. Closed on statutory holidays."
   ],
   "hold": "30 calendar days, then unclaimed items are donated.",
   "contacts": [
    {
     "label": "Phone",
     "value": "416-202-1600",
     "href": "tel:+14162021600"
    }
   ],
   "links": [
    {
     "label": "GO Transit lost and found →",
     "href": "https://www.gotransit.com/en/lost-and-found"
    }
   ]
  },
  {
   "kind": "transit",
   "title": "VIA Rail Canada, Oakville station",
   "where": "200 Cross Avenue",
   "body": [
    "If you leave an item on a VIA train, report it on arrival at the station's baggage or ticket counter; station staff help locate it. Baggage lost or stolen in a station can be reported to VIA's Lost and Found by phone or at the ticket counter.",
    "Oakville station is staffed. Its ticket counter is open every day from 7 a.m. to 2:15 p.m. and from 4:30 p.m. to 9:30 p.m."
   ],
   "contacts": [
    {
     "label": "VIA Lost and Found",
     "value": "1 888 842-7245",
     "href": "tel:+18888427245"
    }
   ],
   "links": [
    {
     "label": "VIA Rail Oakville station →",
     "href": "https://www.viarail.ca/en/explore-our-destinations/stations/ontario/oakville"
    }
   ]
  },
  {
   "kind": "police",
   "title": "Halton Regional Police Service",
   "where": "2 District Oakville (20 Division), 95 Oak Walk Drive, open 8 a.m. to 10 p.m.",
   "body": [
    "Lost property can be reported online, by phone on the non-emergency line, or in person at a police station. An online report can be filed by the owner, by the finder of the property, or by an authorised representative, and needs a valid email address. You receive a temporary case number by email, and reports are reviewed within 2 to 4 business days.",
    "Call police instead of reporting online if the loss is worth more than $5,000, if it happened outside the Halton region, if it involves a firearm, or if it involves government-issued identification other than a driver's licence."
   ],
   "contacts": [
    {
     "label": "Non-emergency line",
     "value": "905-825-4777",
     "href": "tel:+19058254777"
    },
    {
     "label": "2 District Oakville",
     "value": "905-825-4777 ext. 2205"
    }
   ],
   "links": [
    {
     "label": "Halton Police online reporting →",
     "href": "https://www.haltonpolice.ca/reporting/report-a-crime/"
    }
   ]
  },
  {
   "kind": "animal",
   "title": "Humane Society of Oakville, Milton and Halton (HSOMH)",
   "where": "445 Cornwall Road. Office open Monday to Friday, 10 a.m. to 6 p.m.; Saturday, 9 a.m. to 5 p.m.; Sunday, 11 a.m. to 4 p.m.; closed on statutory holidays",
   "body": [
    "HSOMH is contracted by the Town of Oakville to provide municipal animal services, including picking up stray animals. If your pet is missing in Oakville, report it by phone, by email or with the online form. A Lost and Found team member follows up to complete a detailed report, keeps your pet's information on file and contacts you about potential matches.",
    "If you find a pet, call HSOMH or bring the animal to the shelter, where staff can scan it for a microchip and check it against lost reports.",
    "In Oakville, a dog must wear its Town identification tag at all times. Cats need no licence but must be identified by a microchip or a breakaway collar."
   ],
   "contacts": [
    {
     "label": "Lost and Found",
     "value": "905-845-1551 ext. 302"
    },
    {
     "label": "Email",
     "value": "lostandfound@hsomh.ca",
     "href": "mailto:lostandfound@hsomh.ca"
    },
    {
     "label": "Main line, including after-hours officers",
     "value": "905-845-1551",
     "href": "tel:+19058451551"
    }
   ],
   "links": [
    {
     "label": "HSOMH lost and found pets →",
     "href": "https://hsomh.ca/services/lost-and-found/"
    }
   ]
  },
  {
   "kind": "other",
   "title": "Town of Oakville facilities",
   "body": [
    "Items left at a Town facility, on Town property or in a Town vehicle are accepted as a courtesy under the Town's lost and found procedure. Items can be claimed at the location during its business hours. For a valuable item, you must describe it in detail, such as colour, material, size, brand or model number, and staff may ask for identification.",
    "Perishable items are disposed of right away. General items worth under $100, such as clothing, water bottles or sunglasses, go into a community lost and found bin where possible; bins are emptied monthly and the items are donated or destroyed. These items are not tracked, and the Town does not keep records of people looking for lost items."
   ],
   "hold": "Valuables over $100 (phones, wallets, bags, jewellery, Presto cards, bikes) and money: 90 days. Unclaimed valuables then go to a police station in Halton Region. Bank cards are shredded after 30 days; government-issued ID is sent to the issuing agency after 30 days; passports are sent to Passport Canada immediately.",
   "contacts": [
    {
     "label": "Town of Oakville",
     "value": "905-845-6601",
     "href": "tel:+19058456601"
    }
   ],
   "links": [
    {
     "label": "Town of Oakville lost and found procedure →",
     "href": "https://www.oakville.ca/town-hall/policies-procedures/public-notice-and-engagement-policy/lost-and-found-procedure/"
    }
   ]
  }
 ],
 "found": {
  "heading": "Found something in Oakville?",
  "body": [
   "Hand the item to the organisation that runs the place where you found it. Items found on GO trains and buses or at Oakville and Bronte GO stations go to GO Transit's Lost and Found at Union Station. Items left at a Town of Oakville facility are handled by staff under the Town's lost and found procedure; if money handed in by a member of the public is not claimed within 90 days, it goes back to the person who turned it in. Halton Regional Police's online reporting system accepts lost property reports from the finder of the property, and you can also call 905-825-4777 or visit a police station. If you find a pet, call the Humane Society of Oakville, Milton and Halton at 905-845-1551 or bring the animal to 445 Cornwall Road so staff can scan it for a microchip.",
   "If you find a Canadian passport, the Government of Canada asks you to return it to a passport office, a Service Canada Centre, or a police or RCMP station, with a short letter saying how, when and where you found it. A found Ontario health card can be brought to any ServiceOntario location or police station, or dropped in any Canada Post mailbox.",
   "Under Ontario's Community Safety and Policing Act, 2019 (s. 258), police may sell unclaimed property they hold, other than money and firearms, once it has been held for at least one month for a bicycle or three months for most other items. The Act does not give finders a right to claim items handed to the police."
  ]
 },
 "optionsHeading": "Reporting a loss with ReportLost",
 "options": [
  "Free listing: your report is published as a searchable public listing.",
  "Automatic search, CA$17 once: six months of public-web monitoring with potential matches reviewed before notification, a dated ReportLost certificate, an anonymous email address linked to your report, and printable QR stickers linked to it.",
  "Team-assisted search, CA$35 once: everything in the CA$17 option, with 12 months of monitoring, manual research by a team member, direct contact with relevant services and venues, submission of your report to appropriate lost-property services, and a notice shared with relevant local groups under their posting rules.",
  "Recovery is never guaranteed. Each organisation listed above applies its own procedure and decides whether it accepts a report filed by a third party."
 ],
 "faq": [
  {
   "q": "How long does Oakville Transit keep lost items?",
   "a": "Oakville Transit logs found items and keeps them for three months; lost food is thrown out at the end of each business day. Call 905-815-2020, Monday to Friday, 8:30 a.m. to 4:30 p.m., with a clear description of the item. Items are picked up at the Oakville Transit facility, 430 Wyecroft Road."
  },
  {
   "q": "I left something on a GO train or at Oakville GO station. Where is it?",
   "a": "Items found on GO trains, buses and at GO stations are brought to GO Transit's Lost and Found at Union Station in Toronto (Counter 6, York Concourse), which can take up to ten business days, and are kept for 30 calendar days. Report the item with GO's online form, or phone 416-202-1600. Oakville Transit also refers items lost at a GO station to this office."
  },
  {
   "q": "Can I report lost property to Halton police online?",
   "a": "Yes. Halton Regional Police accepts lost property reports through its online reporting system, which needs a valid email address and sends you a temporary case number; reports are reviewed within 2 to 4 business days. Call 905-825-4777 instead if the loss is worth more than $5,000, happened outside the Halton region, involves a firearm, or involves government-issued identification other than a driver's licence."
  },
  {
   "q": "My pet is missing in Oakville. Who do I contact?",
   "a": "The Humane Society of Oakville, Milton and Halton provides animal services for the Town of Oakville. Report a lost pet at 905-845-1551 ext. 302, by email at lostandfound@hsomh.ca, or with its online form; a team member follows up and contacts you about potential matches. The shelter is at 445 Cornwall Road."
  },
  {
   "q": "Is ReportLost an official lost and found service?",
   "a": "No. ReportLost is an independent service. It is not affiliated with Oakville Transit, GO Transit, Metrolinx, VIA Rail, Halton Regional Police Service, the Humane Society of Oakville, Milton and Halton or the Town of Oakville, and it does not replace their procedures. Recovery is never guaranteed."
  }
 ],
 "sources": [
  {
   "label": "Oakville Transit, Lost & Found",
   "href": "https://www.oakvilletransit.ca/riding-with-us/lost-found/"
  },
  {
   "label": "Oakville Transit, Contact us",
   "href": "https://www.oakvilletransit.ca/about-us/contact-us/"
  },
  {
   "label": "GO Transit, Lost and found",
   "href": "https://www.gotransit.com/en/lost-and-found"
  },
  {
   "label": "VIA Rail, Oakville station",
   "href": "https://www.viarail.ca/en/explore-our-destinations/stations/ontario/oakville"
  },
  {
   "label": "VIA Rail, Toronto Union Station",
   "href": "https://www.viarail.ca/en/explore-our-destinations/stations/ontario/toronto"
  },
  {
   "label": "Halton Regional Police Service, Report a Crime",
   "href": "https://www.haltonpolice.ca/reporting/report-a-crime/"
  },
  {
   "label": "Halton Regional Police Service, Report a Non-Emergency",
   "href": "https://www.haltonpolice.ca/reporting/report-a-non-emergency/"
  },
  {
   "label": "Halton Regional Police Service, Locations",
   "href": "https://www.haltonpolice.ca/about-us/locations/"
  },
  {
   "label": "Humane Society of Oakville, Milton and Halton, Lost & Found Pets",
   "href": "https://hsomh.ca/services/lost-and-found/"
  },
  {
   "label": "Humane Society of Oakville, Milton and Halton, Municipal Animal Services",
   "href": "https://hsomh.ca/services/animal-services/"
  },
  {
   "label": "Humane Society of Oakville, Milton and Halton, Contact us",
   "href": "https://hsomh.ca/contact/"
  },
  {
   "label": "Town of Oakville, Pet owner responsibilities",
   "href": "https://www.oakville.ca/home-environment/pets-wildlife/dogs-cats/"
  },
  {
   "label": "Town of Oakville, Lost and Found Procedure",
   "href": "https://www.oakville.ca/town-hall/policies-procedures/public-notice-and-engagement-policy/lost-and-found-procedure/"
  },
  {
   "label": "Wikipedia, Union Station (Toronto) (map coordinates)",
   "href": "https://en.wikipedia.org/wiki/Union_Station_(Toronto)"
  },
  {
   "label": "Government of Canada, Found passports",
   "href": "https://www.canada.ca/en/immigration-refugees-citizenship/services/canadian-passports/lost-stolen-inaccessible-damaged-found.html"
  },
  {
   "label": "Ontario, Health card (found card)",
   "href": "https://www.ontario.ca/page/replace-cancel-or-change-information-your-health-card"
  },
  {
   "label": "Community Safety and Policing Act, 2019, s. 258",
   "href": "https://www.ontario.ca/laws/statute/19c01"
  }
 ],
 "disclaimer": "ReportLost is independent and is not affiliated with any organisation listed on this page. Contacts and procedures are taken from each organisation's official website and may change; check with the organisation before going to an office."
}$json$::jsonb, 'draft', false)
ON CONFLICT (province_id, city_ascii, lang) DO UPDATE SET
  guide = EXCLUDED.guide,
  updated_at = now();

-- Contrôle
SELECT city_ascii, status,
       jsonb_array_length(guide->'cards') AS fiches,
       guide->'map'->>'mode' AS carte,
       jsonb_array_length(coalesce(guide->'map'->'places', '[]'::jsonb)) AS reperes
FROM ca_city_guides
WHERE province_id = 'ON' AND lang = 'en'
ORDER BY city_ascii;
