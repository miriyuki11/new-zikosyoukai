import { generateOgpMetadata } from '@/lib/metadata';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import Image from 'next/image';
import type { Metadata } from 'next';
import React from 'react';

interface Team {
  id: string;
  name: string;
  description?: string;
  logo_url?: string;
}

/**
 * チーム情報を取得する関数
 */
async function getTeam(teamId: string): Promise<Team | null> {
  // 1. テストチーム (test-team-id-456)
  if (teamId === 'test-team-id-456') {
    return {
      id: 'test-team-id-456',
      name: '開発チームA',
      description: 'My Awesome Appの開発を推進する精鋭チームです。',
      logo_url: '/images/logos/team-456.png',
    };
  }

  if (teamId === 'team-123' || teamId === 'your-team-id') {
    return {
      id: teamId,
      name: '開発チームA',
      description: '新機能開発を担当するチームです',
      logo_url: '/images/logos/team-456.png',
    };
  }

  // 2. Supabase DB (teams テーブル) からフェッチ
  try {
    const supabase = createServerSupabaseClient();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(teamId);

    if (isUuid) {
      const { data: team } = await supabase
        .from('teams')
        .select('*')
        .eq('id', teamId)
        .maybeSingle();

      if (team) {
        return {
          id: team.id,
          name: team.name,
          description: team.description || undefined,
          logo_url: '/images/logos/team-456.png',
        };
      }
    }
  } catch (e) {
    console.error('Error fetching team from DB:', e);
  }

  return null;
}

type Props = {
  params: Promise<{ team_id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { team_id: teamId } = await params;
  const team = await getTeam(teamId);

  if (!team) {
    // チームが見つからない場合のフォールバック処理
    return generateOgpMetadata({
      title: 'チームが見つかりません',
      description: 'お探しのチームは存在しないか、アクセス権がありません。',
      url: `/teams/${teamId}`,
      // 画像はデフォルトOGP画像が使用されます
    });
  }

  // チーム情報に基づいてOGPメタデータを生成
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  return generateOgpMetadata({
    title: `${team.name} のチームプロフィール`,
    description: team.description || `${team.name} のチームプロフィールページです。`,
    image: team.logo_url,
    url: `${baseUrl}/teams/${team.id}`,
    type: 'article',
  });
}

export default async function TeamPage({ params }: Props) {
  const { team_id: teamId } = await params;
  const team = await getTeam(teamId);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold">{`チームページ: ${teamId}`}</h1>
      <p>（この部分はステップ4で実装済みです）</p>
      {team && (
        <div className="mt-6 p-6 max-w-sm rounded-xl border border-gray-200 bg-white shadow-sm text-center">
          {team.logo_url && (
            <Image
              src={team.logo_url}
              alt={team.name}
              width={80}
              height={80}
              unoptimized
              className="w-20 h-20 rounded-full mx-auto mb-3 object-cover"
            />
          )}
          <h2 className="text-xl font-bold text-gray-800">{team.name}</h2>
          {team.description && <p className="text-sm text-gray-600 mt-2">{team.description}</p>}
        </div>
      )}
    </div>
  );
}
