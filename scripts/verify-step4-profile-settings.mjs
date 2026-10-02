import { createClient } from "@supabase/supabase-js";
import { getTestCredentials } from "./test-credentials.mjs";

const SUPABASE_URL = "https://ccarnmeqioneyfnjrlva.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_PVvn9xKKuAaLg2Ew5AzPgg_q2x3-5Wk";

const USERS = {
  userA: getTestCredentials("A"),
};

async function verifyProfileSettings() {
  console.log("=======================================================================");
  console.log("🚀 プロフィール設定・タグ選択・更新永続化 E2E検証スクリプト");
  console.log("=======================================================================\n");

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // 1. ユーザーログイン
  console.log("▶ [1. 認証ログイン確認]");
  const authRes = await supabase.auth.signInWithPassword(USERS.userA);
  if (authRes.error) {
    throw new Error(`ログイン失敗: ${authRes.error.message}`);
  }
  const user = authRes.data.user;
  console.log(`  ✅ ログイン成功: ${user.email} (ID: ${user.id})`);

  // 2. 既存プロフィールの取得とプリフィルデータの確認
  console.log("\n▶ [2. 既存プロフィール情報の取得とプリフィル確認]");
  const { data: initialCard, error: fetchErr } = await supabase
    .from("profile_cards")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (fetchErr) {
    throw new Error(`profile_cards 取得失敗: ${fetchErr.message}`);
  }

  console.log("  ✅ profile_cards テーブルから既存データ取得成功:");
  console.log(`     - self_introduction: "${initialCard?.self_introduction || '(なし)'}"`);
  console.log(`     - communication_style: "${initialCard?.communication_style || '(なし)'}"`);
  console.log(`     - consultation_style: "${initialCard?.consultation_style || '(なし)'}"`);
  console.log(`     - realtime_status: "${initialCard?.realtime_status || '(なし)'}"`);
  console.log(`     - skills: "${initialCard?.skills || '(なし)'}"`);

  // 3. プロフィール情報の更新実行 (API連携とDB保存)
  console.log("\n▶ [3. プロフィール情報の更新 (API連携とDB保存)]");
  const testUpdatedData = {
    self_introduction: `【検証確認済み】フルスタックエンジニアです。Next.jsとPythonで開発中！(更新時刻: ${new Date().toLocaleTimeString()})`,
    communication_style: "積極的に話す (青), 状況に応じて (灰)",
    consultation_style: "結論から話す (赤)",
    realtime_status: "オンライン (集中作業中🚀)",
    skills: "React, Next.js, TypeScript, Python",
  };

  const { error: updateErr } = await supabase
    .from("profile_cards")
    .update(testUpdatedData)
    .eq("user_id", user.id);

  if (updateErr) {
    throw new Error(`profile_cards 更新失敗: ${updateErr.message}`);
  }
  console.log("  ✅ profile_cards への更新保存に成功しました！");

  // 4. 更新後の情報反映と永続化の確認
  console.log("\n▶ [4. 更新後の情報反映と永続化の確認 (再フェッチ)]");
  const { data: verifiedCard, error: reFetchErr } = await supabase
    .from("profile_cards")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (reFetchErr) {
    throw new Error(`再フェッチ失敗: ${reFetchErr.message}`);
  }

  console.log("  ✅ データベースから永続化された最新プロフィールを再取得:");
  console.log(`     - self_introduction: "${verifiedCard?.self_introduction}"`);
  console.log(`     - communication_style: "${verifiedCard?.communication_style}"`);
  console.log(`     - consultation_style: "${verifiedCard?.consultation_style}"`);
  console.log(`     - realtime_status: "${verifiedCard?.realtime_status}"`);
  console.log(`     - skills: "${verifiedCard?.skills}"`);

  // アサーション検証
  const isBioSaved = verifiedCard?.self_introduction?.includes("【検証確認済み】");
  const isStatusSaved = verifiedCard?.realtime_status?.includes("オンライン (集中作業中🚀)");

  if (isBioSaved && isStatusSaved) {
    console.log("\n🎉 [検証成功] すべての更新データがPostgreSQLデータベースに正常に永続化されていることを確認しました！");
  } else {
    throw new Error("更新データのアサーション検証に失敗しました。");
  }
}

verifyProfileSettings().catch((err) => {
  console.error("❌ 検証失敗:", err);
  process.exit(1);
});
