// components/teams/TeamMemberManagementSection.tsx
'use client';

import React from 'react';
import Link from 'next/link';

interface TeamMemberManagementSectionProps {
  teamId: string;
}

export default function TeamMemberManagementSection({ teamId }: TeamMemberManagementSectionProps) {
  void teamId;

  return (
    <div className="space-y-6">
      {/* メンバー検索と追加のUI */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <input
          type="text"
          placeholder="メンバーをユーザー名またはメールアドレスで検索..."
          className="flex-grow p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
        />
        <button
          type="button"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 w-full sm:w-auto font-medium transition cursor-pointer"
        >
          メンバー追加
        </button>
      </div>

      {/* メンバーリストのプレースホルダー */}
      <div className="mt-6 border border-gray-200 rounded-md p-4 bg-gray-50 min-h-[150px]">
        <h3 className="text-lg font-medium text-gray-700 mb-3">現在のメンバー</h3>
        {/* ダミーのメンバーリストアイテム */}
        <ul className="space-y-3">
          <li className="flex items-center justify-between p-2 bg-white rounded-md shadow-sm">
            <div className="flex items-center space-x-3">
              <span className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-sm font-semibold text-gray-600">
                JD
              </span>
              <div>
                <p className="font-medium text-gray-900">John Doe</p>
                <Link
                  href="/profile/edit"
                  className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                  title="クリックしてプロフィールカードを作成・編集"
                >
                  john.doe@example.com
                </Link>
              </div>
            </div>
            {/* 削除ボタンのプレースホルダー */}
            <button
              type="button"
              className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-50 cursor-pointer"
              aria-label="メンバーを削除"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm6 0a1 1 0 11-2 0v6a1 1 0 112 0V8z" clipRule="evenodd" />
              </svg>
            </button>
          </li>
          <li className="flex items-center justify-between p-2 bg-white rounded-md shadow-sm">
            <div className="flex items-center space-x-3">
              <span className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-sm font-semibold text-gray-600">
                JA
              </span>
              <div>
                <p className="font-medium text-gray-900">Jane Smith</p>
                <Link
                  href="/profile/edit"
                  className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                  title="クリックしてプロフィールカードを作成・編集"
                >
                  jane.smith@example.com
                </Link>
              </div>
            </div>
            <button
              type="button"
              className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-50 cursor-pointer"
              aria-label="メンバーを削除"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm6 0a1 1 0 11-2 0v6a1 1 0 112 0V8z" clipRule="evenodd" />
              </svg>
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
}
