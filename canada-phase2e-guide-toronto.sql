-- ============================================================
-- CANADA — phase 2 : guide de Toronto (ca_city_guides), statut BROUILLON.
-- Page : https://reportlost.org/ca/on/toronto (noindex tant que status = 'draft').
-- Chaque fait vient des pages officielles listées dans "sources".
-- Idempotent : relancer le fichier remplace le contenu du brouillon.
-- ============================================================

INSERT INTO ca_city_guides (province_id, city_ascii, lang, guide, status, verified)
VALUES ('ON', 'toronto', 'en', $json${
 "province": "ON",
 "citySlug": "toronto",
 "lang": "en",
 "cityName": "Toronto",
 "metaTitle": "Lost and Found in Toronto: TTC, GO Transit, Pearson and Police",
 "metaDescription": "Where lost items end up in Toronto: TTC Lost Articles Office at Bay station, GO Transit at Union Station, Pearson Terminal 1, Toronto Police and Animal Services.",
 "h1": "Lost and found in Toronto",
 "lede": "In Toronto, a lost item stays with the organisation that runs the place where it was left or turned in: the TTC, GO Transit, Pearson airport, a venue or the police. This page lists who holds what, for how long, and how to ask.",
 "lastReviewed": "2026-10-26",
 "cardsHeading": "Who holds lost items in Toronto",
 "cards": [
  {
   "kind": "transit",
   "title": "Toronto Transit Commission (TTC) Lost Articles Office",
   "where": "Bay subway station",
   "body": [
    "For items left on TTC vehicles or property. Items found by TTC staff or turned in by riders are sent to the Lost Articles Office at 2 p.m. each weekday, and recorded in a database.",
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
     "href": "https://www.ttc.ca/customer-service/lost-articles"
    }
   ]
  },
  {
   "kind": "transit",
   "title": "GO Transit Lost and Found (Metrolinx)",
   "where": "Counter 6, York Concourse, Union Station, 35 York Street",
   "body": [
    "For items left on GO trains, GO buses, or at GO stations and terminals. Report the item with GO's online form. Found items are brought to the Union Station office, usually within ten business days.",
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
   "kind": "transit",
   "title": "UP Express (Union Pearson Express)",
   "body": [
    "For items left on the UP Express train. Report the item with the online form; UP Express contacts you only if a matching item is found, usually within 24 hours. Found items can take up to 72 hours to reach the Union Station office.",
    "Items lost in Pearson's Terminal Link station or in Terminals 1 and 3 are handled by Toronto Pearson's Lost and Found Office."
   ],
   "contacts": [
    {
     "label": "Phone",
     "value": "1-844-GET-ON-UP"
    }
   ],
   "links": [
    {
     "label": "UP Express lost and found →",
     "href": "https://services.upexpress.com/CustomerSupport/LostFound"
    }
   ]
  },
  {
   "kind": "transit",
   "title": "VIA Rail Canada, Toronto Union Station",
   "where": "Union Station, 65 Front Street West",
   "body": [
    "If you leave an item on a VIA train, report it on arrival at the station's baggage or ticket counter; station staff help locate it. Baggage lost or stolen in a station can be reported to VIA's Lost and Found by phone or at the ticket counter."
   ],
   "contacts": [
    {
     "label": "Lost items, Toronto station",
     "value": "(416) 956-7675",
     "href": "tel:+14169567675"
    },
    {
     "label": "VIA Lost and Found",
     "value": "1 888 842-7245",
     "href": "tel:+18888427245"
    }
   ],
   "links": [
    {
     "label": "VIA Rail Toronto station →",
     "href": "https://www.viarail.ca/en/explore-our-destinations/stations/ontario/toronto"
    }
   ]
  },
  {
   "kind": "airport",
   "title": "Toronto Pearson International Airport, Lost and Found Office",
   "where": "Terminal 1, before security, between doors R and S",
   "body": [
    "For items lost in the terminals or parking garages. Filing an online report is free and you receive a confirmation email with a report number. The office checks its inventory for 30 days and emails you the result.",
    "If an item matches, you can collect it at the Terminal 1 office with government photo ID, send an authorised person, or arrange paid shipping. Open Monday to Friday, 10 a.m. to 6 p.m.",
    "Items left on board an aircraft, including checked luggage, are claimed from the airline. The office does not hold passports, NEXUS cards, perishables, or items lost on airplanes or on public transit."
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
   "kind": "airport",
   "title": "Billy Bishop Toronto City Airport",
   "body": [
    "Items lost in the terminal building or at security are reported to the airport's Lost and Found Department by phone or email. Items left on an aircraft, or lost luggage, are handled by the airline: Porter Airlines or Air Canada."
   ],
   "contacts": [
    {
     "label": "Phone",
     "value": "1 (844) 846-8266",
     "href": "tel:+18448468266"
    },
    {
     "label": "Email",
     "value": "BBTCA@blackandmcdonald.com",
     "href": "mailto:BBTCA@blackandmcdonald.com"
    }
   ],
   "links": [
    {
     "label": "Billy Bishop contact page →",
     "href": "https://www.billybishopairport.com/contact-us/"
    }
   ]
  },
  {
   "kind": "police",
   "title": "Toronto Police Service",
   "body": [
    "Toronto Police takes lost property reports by phone, and only for items with an externally visible serial number worth more than $500, or where there is a public interest in recording the loss, such as medication. These reports are kept on record so property can be returned if it is recovered; they are not investigated.",
    "Other losses go elsewhere: TTC items to the TTC Lost Articles Office, lost cellphones to your service provider, Canadian passports and SIN cards to Service Canada, and Ontario driver's licences, health cards, licence plates and accessible parking permits to ServiceOntario."
   ],
   "contacts": [
    {
     "label": "Non-emergency line",
     "value": "416-808-2222 (*8-7-7 from a mobile)",
     "href": "tel:+14168082222"
    }
   ],
   "links": [
    {
     "label": "Toronto Police lost property →",
     "href": "https://www.tps.ca/services/online-reporting/lost-property-or-identification-resources/"
    }
   ]
  },
  {
   "kind": "animal",
   "title": "Toronto Animal Services (City of Toronto)",
   "where": "Shelters by appointment, 10:30 a.m. to 6:30 p.m.: 146 The East Mall; 1300 Sheppard Avenue West; 821 Progress Avenue",
   "body": [
    "To report a lost pet, call 416-338-PAWS (7297) or 311 with a description, the pet's licence and microchip numbers, and a photo. You can search strays found in the last 14 days online, and check City shelters, veterinary clinics and Toronto Humane Society locations.",
    "If you find an animal, report it to 311 right away with the exact location and any licence tag details, even if you cannot safely catch it."
   ],
   "contacts": [
    {
     "label": "Lost and found pets",
     "value": "416-338-PAWS (7297) or 311",
     "href": "tel:+14163387297"
    }
   ],
   "links": [
    {
     "label": "City of Toronto lost and found pets →",
     "href": "https://www.toronto.ca/community-people/animals-pets/lost-found-pets/"
    }
   ]
  }
 ],
 "found": {
  "heading": "Found something in Toronto?",
  "body": [
   "Hand the item to the organisation that runs the place where you found it. Items turned in on the TTC are sent to the TTC Lost Articles Office; items found on GO trains and at GO stations go to GO Transit's office at Union Station; items found in Pearson's terminals go to the airport's Lost and Found Office.",
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
   "q": "How long does the TTC keep lost items?",
   "a": "Most items are held for 30 days at the TTC Lost Articles Office at Bay station, and bicycles for 15 days. Canadian passports are sent immediately to Passport Canada; international passports are held for 10 days before going to a consulate or embassy. Unclaimed items are sold at auction."
  },
  {
   "q": "Can I report a lost phone to Toronto Police?",
   "a": "No. Toronto Police does not take reports for lost cellphones and asks you to contact your service provider. It takes lost property reports by phone only for items with an externally visible serial number worth more than $500, or where recording the loss is in the public interest."
  },
  {
   "q": "I lost something at Pearson airport. Who do I contact?",
   "a": "For an item lost in a terminal or parking garage, file a report online with Toronto Pearson's Lost and Found Office, in Terminal 1 before security, between doors R and S. It keeps found items for 30 days. For an item left on the plane, contact your airline. Items left on the UP Express train are handled by UP Express."
  },
  {
   "q": "I left something on a GO train. Where is it?",
   "a": "Items found on GO trains, buses and at stations are brought to GO Transit's Lost and Found at Union Station (Counter 6, York Concourse), usually within ten business days, and kept for 30 calendar days. Report the item with GO's online form, or phone 416-202-1600."
  },
  {
   "q": "Is ReportLost an official lost and found service?",
   "a": "No. ReportLost is an independent service. It is not affiliated with the TTC, Metrolinx, Toronto Pearson, the Toronto Police Service or the City of Toronto, and it does not replace their procedures. Recovery is never guaranteed."
  }
 ],
 "sources": [
  {
   "label": "TTC, Lost articles",
   "href": "https://www.ttc.ca/customer-service/lost-articles"
  },
  {
   "label": "GO Transit, Lost and found",
   "href": "https://www.gotransit.com/en/lost-and-found"
  },
  {
   "label": "UP Express, Lost & found",
   "href": "https://services.upexpress.com/CustomerSupport/LostFound"
  },
  {
   "label": "VIA Rail, Toronto Union Station",
   "href": "https://www.viarail.ca/en/explore-our-destinations/stations/ontario/toronto"
  },
  {
   "label": "Toronto Pearson, Lost and Found Office",
   "href": "https://www.torontopearson.com/en/while-you-are-here/toronto-airport-services/lost-and-found-office"
  },
  {
   "label": "Billy Bishop Toronto City Airport, Contact us",
   "href": "https://www.billybishopairport.com/contact-us/"
  },
  {
   "label": "Toronto Police Service, Lost property or identification",
   "href": "https://www.tps.ca/services/online-reporting/lost-property-or-identification-resources/"
  },
  {
   "label": "City of Toronto, Lost and found pets",
   "href": "https://www.toronto.ca/community-people/animals-pets/lost-found-pets/"
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
SELECT province_id, city_ascii, lang, status,
       jsonb_array_length(guide->'cards') AS fiches,
       jsonb_array_length(guide->'faq')   AS questions,
       updated_at
FROM ca_city_guides
WHERE province_id = 'ON' AND city_ascii = 'toronto';
