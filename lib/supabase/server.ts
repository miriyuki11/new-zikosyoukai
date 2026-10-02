import { createClient } from '@supabase/supabase-js';

// 環境変数からSupabaseのURLとAnon Keyを取得
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and Anon Key are required environment variables.');
}

/**
 * サーバーサイド用Supabaseクライアントを生成する関数
 * RLSポリシーにより、公開プロフィールデータを匿名アクセス可能
 */
export const createServerSupabaseClient = () => {
  return createClient(supabaseUrl, supabaseAnonKey);
};
