// components/teams/TeamEditForm.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export interface TeamData {
  id: string;
  name: string;
  description: string | null;
}

export interface TeamEditFormProps {
  initialTeamData?: TeamData;
  team?: TeamData;
}

export default function TeamEditForm({ initialTeamData, team }: TeamEditFormProps) {
  const currentTeam = initialTeamData || team;
  const teamId = currentTeam?.id || '';

  const [name, setName] = useState(currentTeam?.name || '');
  const [description, setDescription] = useState(currentTeam?.description || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // 1. PUT /functions/teams/:team_id APIを呼び出す
      let isSuccess = false;
      try {
        const { error: updateError } = await supabase.functions.invoke(`teams/${teamId}`, {
          method: 'PUT',
          body: { name, description },
        });

        if (!updateError) {
          isSuccess = true;
        } else {
          console.warn('Edge Function PUT failed, trying fallback DB update:', updateError);
        }
      } catch (invokeErr) {
        console.warn('Edge Function invoke error, trying fallback DB update:', invokeErr);
      }

      // 2. Edge Function 未起動環境時のフォールバック: Supabase DB 直接更新
      if (!isSuccess) {
        const { error: dbError } = await supabase
          .from('teams')
          .update({ name, description })
          .eq('id', teamId);

        if (dbError) {
          throw new Error(dbError.message);
        }
      }

      // 更新成功後、チームプロフィールページへリダイレクト
      router.push(`/teams/${teamId}`);
    } catch (err: unknown) {
      console.error('Failed to update team:', err);
      const message = err instanceof Error ? err.message : 'チーム情報の更新に失敗しました。';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
      {error && (
        <div
          role="alert"
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
        >
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          チーム名
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={isLoading}
          className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
        />
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          説明
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          disabled={isLoading}
          className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
        />
      </div>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isLoading ? '更新中...' : 'チーム情報を更新'}
        </button>
        <button
          type="button"
          disabled={isLoading}
          onClick={() => router.push(`/teams/${teamId}`)}
          className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 cursor-pointer"
        >
          キャンセル
        </button>
      </div>
    </form>
  );
}
