'use client';

import React from 'react';
import ProfileCard from '@/components/ProfileCard';
import { Profile } from '@/types/profile';

const mockProfile: Profile = {
  id: "user-123",
  name: "山田 太郎",
  bio: "こんにちは、山田太郎です。主にバックエンド開発とデータ分析を担当しています。新しい技術に挑戦するのが好きで、特にTypeScriptとPythonを使った開発に興味があります。お気軽にご連絡ください！",
  skills: ["TypeScript", "Python", "SQL", "Docker", "AWS", "Next.js"],
  communicationStyle: "テキストでの非同期コミュニケーションを基本としていますが、必要に応じてオンラインミーティングも歓迎です。簡潔で明確なやり取りを心がけています。",
  consultationStyle: "ご相談の際は、まず現状と解決したい課題を具体的に教えていただけるとスムーズです。その後、技術的な実現可能性や最適なアプローチについて一緒に検討しましょう。",
  realtimeStatus: "オンライン (集中モード)",
};

export default function TestProfileCardPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-24 bg-gray-100">
      <h1 className="text-4xl font-bold text-gray-800 mb-10">プロフィールカード表示テスト</h1>
      <ProfileCard profile={mockProfile} />
    </main>
  );
}
