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

  // Liste pondérée : les objets à forte conversion (wallet, purse, ring,
  // bracelet, phone, cat, dog) apparaissent 3x plus souvent que les autres.
  const priorityItems = [
    ['Wallet with ID', 'Leather wallet', 'Card holder'],
    ['Black leather purse', 'Brown handbag', 'Small shoulder bag'],
    ['Gold ring', 'Diamond ring', 'Wedding band'],
    ['Gold bracelet', 'Silver bracelet', 'Charm bracelet'],
    ['iPhone 13', 'Samsung Galaxy S22', 'Android phone'],
    ['Orange tabby cat', 'Small black cat', 'Gray cat with collar'],
    ['Golden retriever dog', 'Small brown dog', 'Husky with blue collar'],
  ];
  const lostItems = [
    ...priorityItems,
    ...priorityItems,
    ...priorityItems,
    ['Set of house keys', 'Car key fob', 'Bunch of keys'],
    ['Pair of sunglasses', 'Reading glasses', 'Eyeglasses'],
    ['Backpack with books', 'Schoolbag', 'Navy blue backpack'],
    ['Silver necklace', 'Pearl earring', 'Pendant necklace'],
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

    output.push(` ${item} lost near ${place}, ${formattedDate}.`);
  }

  return output;
}

