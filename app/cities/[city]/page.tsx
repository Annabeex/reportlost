import { createClient } from '@supabase/supabase-js';
import ReportForm from '../../../components/ReportForm';


const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Props {
  params: { city: string };
}

export default async function Page({ params }: Props) {
  const cityName = decodeURIComponent(params.city).replace(/-/g, ' ');
  const { data } = await supabase
    .from('us_cities')
    .select('*')
    .ilike('city', cityName);

  const cityData = data?.[0];

  return (
    <main className="p-6 max-w-3xl mx-auto">
      <h1>Lost and Found in {cityData?.city || 'City'}</h1>
      <ReportForm defaultCity={cityData?.city} />
    </main>
  );
}