import { createClient } from "@supabase/supabase-js";
import { getTestCredentials } from "./test-credentials.mjs";

const SUPABASE_URL = "https://ccarnmeqioneyfnjrlva.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_PVvn9xKKuAaLg2Ew5AzPgg_q2x3-5Wk";
const FUNCTIONS_BASE_URL = `${SUPABASE_URL}/functions/v1`;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const CREDENTIALS = {
  userA: getTestCredentials("A"),
  userB: getTestCredentials("B"),
};

async function main() {
  console.log("Logging in...");
  const { data: authA, error: errA } = await supabase.auth.signInWithPassword(CREDENTIALS.userA);
  if (errA) throw errA;
  const { data: authB, error: errB } = await supabase.auth.signInWithPassword(CREDENTIALS.userB);
  if (errB) throw errB;

  console.log("User A:", authA.user.id);
  console.log("User B:", authB.user.id);

  // 1. チーム作成
  const resCreate = await fetch(`${FUNCTIONS_BASE_URL}/teams`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${authA.session.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: "開発チームA",
      description: "新機能開発を担当するチームです",
    }),
  });

  const team = await resCreate.json();
  console.log("Created Team:", team);

  if (!team.id) {
    console.error("Team creation failed:", team);
    return;
  }

  // 2. メンバー追加 (User B を追加)
  const resAdd = await fetch(`${FUNCTIONS_BASE_URL}/teams/${team.id}/members`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${authA.session.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      user_id: authB.user.id,
      role: "メンバー",
    }),
  });

  const memberResult = await resAdd.json();
  console.log("Added Member:", memberResult);

  console.log("\n=========================================");
  console.log(`Team created successfully! ID: ${team.id}`);
  console.log(`URL: http://localhost:3000/teams/${team.id}`);
  console.log("=========================================\n");
}

main().catch(console.error);
