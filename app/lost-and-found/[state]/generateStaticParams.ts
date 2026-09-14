export const allStates = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
  'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY',
  // District de Columbia et Porto Rico : des guides y sont publiés, leur page
  // d'État doit donc exister, sinon les villes concernées pointent vers un 404.
  'DC','PR',
];

export function generateStaticParams() {
  return allStates.map(abbr => ({ state: abbr.toLowerCase() }));
}