'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@headlessui/react';

export default function TeamsPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">チーム管理</h1>
      <p className="text-gray-700 mb-4">ここではチームの作成、編集、メンバー管理を行います。</p>

      {/* Headless UI Buttonのプレースホルダー */}
      <Link href="/dashboard/teams/create">
        <Button
          className="rounded-md bg-primary py-2 px-4 text-sm font-medium text-white hover:bg-primary-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 cursor-pointer transition-colors"
          onClick={() => console.log('チーム作成ボタンがクリックされました')}
        >
          新しいチームを作成
        </Button>
      </Link>
      {/* 今後のステップでチーム作成・管理コンポーネントがここに追加されます */}
    </div>
  );
}
