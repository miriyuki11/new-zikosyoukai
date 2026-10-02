import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://ccarnmeqioneyfnjrlva.supabase.co";
const supabaseAnonKey = "sb_publishable_PVvn9xKKuAaLg2Ew5AzPgg_q2x3-5Wk";

async function main() {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data: teams, error: teamsError } = await supabase.from('teams').select('*').limit(5);
  console.log('teams error:', teamsError);
  console.log('teams:', teams);

  const { data: members, error: membersError } = await supabase.from('team_members').select('*').limit(5);
  console.log('team_members error:', membersError);
  console.log('team_members:', members);
}

main().catch(console.error);
