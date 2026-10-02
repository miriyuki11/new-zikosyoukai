import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://ccarnmeqioneyfnjrlva.supabase.co";
const supabaseAnonKey = "sb_publishable_PVvn9xKKuAaLg2Ew5AzPgg_q2x3-5Wk";

async function main() {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // 既存のチームがあるかチェック
  const { data: existingTeams } = await supabase.from('teams').select('*');
  if (existingTeams && existingTeams.length > 0) {
    console.log('Existing teams:', existingTeams);
  }

  // 1. UUIDでテストチームを作成
  const teamId = '11111111-2222-3333-4444-555555555555';
  const ownerId = 'e4de6b1c-0a38-4241-af5d-3b6650fb3053';

  const { data: teamData, error: teamError } = await supabase
    .from('teams')
    .upsert({
      id: teamId,
      name: '開発チームA',
      description: '新機能開発を担当するチームです',
      owner_id: ownerId,
    })
    .select();

  console.log('Team upsert result:', { teamData, teamError });

  // 2. team_members を登録
  const members = [
    {
      team_id: teamId,
      user_id: ownerId,
      role: 'リーダー',
    },
    {
      team_id: teamId,
      user_id: 'e4de6b1c-0a38-4241-af5d-3b6650fb3054', // サンプルID
      role: 'メンバー',
    },
  ];

  for (const m of members) {
    const { data: memData, error: memError } = await supabase
      .from('team_members')
      .upsert(m)
      .select();
    console.log('Member upsert result:', { memData, memError });
  }
}

main().catch(console.error);
