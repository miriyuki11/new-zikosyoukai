// app/dashboard/teams/create/page.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';

export default function CreateTeamPage() {
  const [teamName, setTeamName] = useState<string>('');
  const [teamDescription, setTeamDescription] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Supabaseクライアントインスタンスの取得
  const supabase = createClient();

  /**
   * フォーム送信時のハンドラ
   * チーム名と説明をSupabase Edge Functionに送信してチームを作成します。
   */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // ページの再読み込みを防ぐ
    setMessage(null); // 前のメッセージをクリア
    setIsLoading(true); // ロード状態を開始

    // 入力値のバリデーション
    if (!teamName.trim()) {
      setMessage({ type: 'error', text: 'チーム名は必須です。' });
      setIsLoading(false);
      return;
    }

    try {
      // 既存の POST /functions/teams APIを呼び出す
      const { data, error } = await supabase.functions.invoke('teams', {
        method: 'POST',
        body: {
          name: teamName.trim(),
          description: teamDescription.trim(),
        },
      });

      if (error) {
        console.error('チーム作成エラー:', error);
        setMessage({ type: 'error', text: `チーム作成に失敗しました: ${error.message}` });
      } else {
        console.log('チーム作成成功:', data);
        setMessage({ type: 'success', text: 'チームが正常に作成されました！' });
        // フォームをクリアして、ユーザーが続けて新しいチームを作成できるようにする
        setTeamName('');
        setTeamDescription('');
      }
    } catch (err: unknown) {
      console.error('ネットワークエラーまたは予期せぬエラー:', err);
      setMessage({ type: 'error', text: 'ネットワークエラーまたは予期せぬエラーが発生しました。' });
    } finally {
      setIsLoading(false); // ロード状態を終了
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">新しいチームを作成</h1>

      {/* メッセージ表示エリア */}
      {message && (
        <div
          role="alert"
          className={`p-3 mb-4 rounded-md ${
            message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* チーム作成フォーム */}
      <form onSubmit={handleSubmit} noValidate className="bg-white p-6 rounded-lg shadow-md">
        <div className="mb-4">
          <label htmlFor="teamName" className="block text-sm font-medium text-gray-700 mb-1">
            チーム名 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="teamName"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            required
            disabled={isLoading}
            placeholder="新しいチームの名前"
          />
        </div>

        <div className="mb-6">
          <label htmlFor="teamDescription" className="block text-sm font-medium text-gray-700 mb-1">
            チーム説明
          </label>
          <textarea
            id="teamDescription"
            rows={4}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            value={teamDescription}
            onChange={(e) => setTeamDescription(e.target.value)}
            disabled={isLoading}
            placeholder="チームの目的や概要を説明してください"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            disabled={isLoading}
          >
            {isLoading ? '作成中...' : 'チームを作成'}
          </button>
          <Link
            href="/teams"
            className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 text-center cursor-pointer transition"
          >
            キャンセル
          </Link>
        </div>
      </form>
    </div>
  );
}
