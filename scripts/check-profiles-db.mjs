import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://ccarnmeqioneyfnjrlva.supabase.co";
const supabaseAnonKey = "sb_publishable_PVvn9xKKuAaLg2Ew5AzPgg_q2x3-5Wk";

async function main() {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data, error } = await supabase.from('profile_cards').select('*').limit(5);
  console.log('Error:', error);
  console.log('profile_cards in DB:', data);
}

main().catch(console.error);
