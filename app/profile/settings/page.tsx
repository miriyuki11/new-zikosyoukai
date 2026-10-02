import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft, UserCircle2 } from 'lucide-react';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { Profile } from '@/types/profile';
import ProfileSettingsForm from './ProfileSettingsForm';

export default async function ProfileSettingsPage() {
  const supabase = await createServerSupabaseClient();

  // 認証済みユーザーの取得
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // ユーザーが認証されていない場合はログインページへリダイレクト
    redirect('/login');
    return null;
  }

  const { data: profileData } = await supabase
    .from('profile_cards')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // フォームの defaultValues として使用できる形式にデータを整形
  const defaultValues: Profile = {
    id: profileData?.id || user.id,
    user_id: user.id,
    full_name: profileData?.full_name || '',
    slug: profileData?.slug || '',
    is_public: profileData?.is_public || false,
    public_fields: profileData?.public_fields || [],
    introduction:
      profileData?.introduction ||
      profileData?.self_introduction ||
      profileData?.bio ||
      '',
    communication_style: profileData?.communication_style || '',
    consultation_style: profileData?.consultation_style || '',
    work_style_tags: profileData?.work_style_tags || [],
    tech_tags:
      profileData?.tech_tags ||
      (Array.isArray(profileData?.skills)
        ? profileData.skills
        : typeof profileData?.skills === 'string'
        ? profileData.skills.split(',').map((s: string) => s.trim()).filter(Boolean)
        : []),
    hobby_tags: profileData?.hobby_tags || [],
    realtime_status: profileData?.realtime_status || '',
    created_at: profileData?.created_at || '',
    updated_at: profileData?.updated_at || '',
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-indigo-50/30 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* ナビゲーション */}
        <div className="mb-6">
          <Link
            href="/profile"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            プロフィール画面に戻る
          </Link>
        </div>

        {/* メインカード */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          {/* ヘッダー */}
          <div className="px-6 py-8 sm:px-8 border-b border-slate-100 bg-gradient-to-r from-indigo-50/50 via-white to-transparent">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
                <UserCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-800">
                  プロフィール設定
                </h1>
                <p className="text-sm text-slate-500 mt-0.5">
                  あなたの基本情報やリアルタイムの活動ステータスを設定します
                </p>
              </div>
            </div>
          </div>

          {/* クライアントフォーム */}
          <ProfileSettingsForm initialProfile={defaultValues} />
        </div>
      </div>
    </main>
  );
}
