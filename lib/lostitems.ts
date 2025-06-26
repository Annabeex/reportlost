export function exampleReports(cityData: any) {
  const {
    city,
    state_name,
    parks,
    stations,
    airports,
    tourism_sites,
    malls
  } = cityData;

  // Fonction de parsing sécurisée pour JSON ou tableau déjà parsé
  const safeParse = (json: any) => {
    try {
      if (!json) return [];
      return Array.isArray(json) ? json : JSON.parse(json);
    } catch {
      return [];
    }
  };

  // Liste de 20 objets avec variantes/synonymes
  const lostItems = [
    ['Black leather purse', 'Brown handbag', 'Small shoulder bag'],
    ['iPhone 13', 'Samsung Galaxy S22', 'Android phone'],
    ['Set of house keys', 'Car key fob', 'Bunch of keys'],
    ['Pair of sunglasses', 'Reading glasses', 'Eyeglasses'],
    ['Wallet with ID', 'Leather wallet', 'Card holder'],
    ['Backpack with books', 'Schoolbag', 'Navy blue backpack'],
    ['Gold bracelet', 'Silver necklace', 'Earring'],
    ['Laptop in gray case', 'MacBook Pro', 'Tablet device'],
    ['Baby stroller', 'Foldable stroller', 'Jogging stroller'],
    ['Passport and travel documents', 'Boarding pass', 'Plane ticket'],
    ['AirPods case', 'Wireless earbuds', 'Bluetooth headphones'],
    ['Library book', 'Textbook', 'Children’s book'],
    ['Medical bag', 'Insulin pouch', 'Medicine container'],
    ['Sketchbook', 'Notebook', 'Moleskine journal'],
    ['Camera', 'DSLR with lens', 'Polaroid camera'],
    ['Scarf and gloves', 'Wool hat', 'Beanie'],
    ['Shopping bag', 'Paper bag with clothes', 'Gift bag'],
    ['Umbrella', 'Compact umbrella', 'Transparent umbrella'],
    ['Toy dinosaur', 'Plush rabbit', 'Action figure'],
    ['Lunch box', 'Thermos', 'Bento box']
  ];

  // Fusionne tous les lieux existants (filtrés)
  const allPlaces = [
    ...safeParse(parks || []),
    ...safeParse(stations || []),
    ...safeParse(airports || []),
    ...safeParse(tourism_sites || []),
    ...safeParse(malls || [])
  ]
    .filter(place => place && place.name)
    .map(place => place.name);

  const today = new Date();
  const output: string[] = [];

  for (let i = 0; i < 3 && i < allPlaces.length; i++) {
    const itemVariants = lostItems[Math.floor(Math.random() * lostItems.length)];
    const item = itemVariants[Math.floor(Math.random() * itemVariants.length)];
    const place = allPlaces[Math.floor(Math.random() * allPlaces.length)];

    const daysAgo = Math.floor(Math.random() * 6) + 1;
    const date = new Date(today);
    date.setDate(today.getDate() - daysAgo);

    const formattedDate = date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric'
    });

    output.push(`📍 ${item} lost near ${place}, ${formattedDate}.`);
  }

  return output;
}

