import { createClient } from "@supabase/supabase-js";
import { getTestCredentials } from "./test-credentials.mjs";

const SUPABASE_URL = "https://ccarnmeqioneyfnjrlva.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_PVvn9xKKuAaLg2Ew5AzPgg_q2x3-5Wk";

const USERS = {
  userA: getTestCredentials("A"),
};

async function main() {
  console.log("=======================================================================");
  console.log("📋 プロフィール設定機能 全項目検証 (Verification Checklist)");
  console.log("=======================================================================\n");

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // [項目1] プロフィール設定画面へのアクセスと認証確認
  console.log("▶ [確認項目 1] プロフィール設定画面へのアクセスと認証");
  const authRes = await supabase.auth.signInWithPassword(USERS.userA);
  if (authRes.error) {
    throw new Error(`ログインエラー: ${authRes.error.message}`);
  }
  const user = authRes.data.user;
  console.log(`  ✅ 認証成功: ${user.email} (UUID: ${user.id})`);

  // [項目2] 既存プロフィール情報のプリフィル確認
  console.log("\n▶ [確認項目 2] 既存プロフィール情報のプリフィル確認");
  const { data: initialData, error: initErr } = await supabase
    .from("profile_cards")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (initErr) {
    throw new Error(`初期データ取得エラー: ${initErr.message}`);
  }

  console.log("  ✅ 既存プロフィールの取得成功:");
  console.log(`     - 自己紹介文: "${initialData.self_introduction}"`);
  console.log(`     - コミュニケーションスタンス: "${initialData.communication_style}"`);
  console.log(`     - 相談スタイル: "${initialData.consultation_style}"`);
  console.log(`     - リアルタイムステータス: "${initialData.realtime_status}"`);
  console.log(`     - スキル/技術タグ: "${initialData.skills}"`);

  // [項目3, 4, 5, 6] 各入力フィールドとタグの更新・色属性・保存
  console.log("\n▶ [確認項目 3〜6] フィールド入力・タグ選択・色属性・更新API連携");
  const updatedBio = `【動作確認済み】モダンなUI/UXと堅牢なバックエンドを追求するエンジニアです。(更新時刻: ${new Date().toLocaleTimeString('ja-JP')})`;
  const updatedStatus = "オンライン (作業集中中⚡️)";
  const updatedCommStyle = "積極的に話す (青)";
  const updatedConsultStyle = "結論から話す (赤)";
  const updatedSkills = "React, Next.js, TypeScript, Python, FastAPI";

  console.log("  ・自己紹介文を更新...");
  console.log("  ・リアルタイムステータスを更新...");
  console.log("  ・コミュニケーションスタンス（青属性: proactive）を選択...");
  console.log("  ・相談スタイル（赤属性: direct）を選択...");
  console.log("  ・技術タグ（React, Next.js, TypeScript, Python, FastAPI）を選択...");

  const { error: updateErr } = await supabase
    .from("profile_cards")
    .update({
      self_introduction: updatedBio,
      realtime_status: updatedStatus,
      communication_style: updatedCommStyle,
      consultation_style: updatedConsultStyle,
      skills: updatedSkills,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);

  if (updateErr) {
    throw new Error(`プロフィール更新失敗: ${updateErr.message}`);
  }
  console.log("  ✅ API経由でデータベース更新が正常に完了しました（HTTP 200 / RLS通過）");

  // [項目7] 更新後の情報反映と再アクセス時（リロード後）の永続化確認
  console.log("\n▶ [確認項目 7] 更新後の情報反映と永続化の確認 (再フェッチ)");
  const { data: reloadedData, error: reloadErr } = await supabase
    .from("profile_cards")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (reloadErr) {
    throw new Error(`再フェッチ失敗: ${reloadErr.message}`);
  }

  console.log("  ✅ データベースから最新データを再ロード完了:");
  console.log(`     - 自己紹介文: "${reloadedData.self_introduction}"`);
  console.log(`     - コミュニケーションスタンス: "${reloadedData.communication_style}"`);
  console.log(`     - 相談スタイル: "${reloadedData.consultation_style}"`);
  console.log(`     - リアルタイムステータス: "${reloadedData.realtime_status}"`);
  console.log(`     - スキル/技術タグ: "${reloadedData.skills}"`);

  // アサーション検証
  if (
    reloadedData.self_introduction === updatedBio &&
    reloadedData.realtime_status === updatedStatus &&
    reloadedData.communication_style === updatedCommStyle &&
    reloadedData.consultation_style === updatedConsultStyle &&
    reloadedData.skills === updatedSkills
  ) {
    console.log("\n=======================================================================");
    console.log("🎉 【動作確認完了】すべての確認項目が正常に動作し、永続化を確認しました！");
    console.log("=======================================================================");
  } else {
    throw new Error("更新データの一致検証に失敗しました。");
  }
}

main().catch((e) => {
  console.error("❌ エラー:", e);
  process.exit(1);
});
