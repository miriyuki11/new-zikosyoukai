import React from 'react';
import Link from 'next/link';

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar_url?: string;
}

export interface TeamData {
  id: string;
  name: string;
  description: string;
  members: TeamMember[];
}

interface TeamProfileViewProps {
  team: TeamData | null;
  teamId: string;
}

export function TeamProfileView({ team, teamId }: TeamProfileViewProps) {
  if (!team) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white shadow-xl rounded-2xl p-8 max-w-md w-full text-center border border-gray-100">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400 text-2xl">
            👥
          </div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">チームが見つかりませんでした</h1>
          <p className="text-gray-500 text-sm mb-6">
            指定されたID (<code className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-700 font-mono text-xs">{teamId}</code>) のチームは存在しないか、閲覧権限がありません。
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition"
          >
            トップページへ戻る
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* チームヘッダーセクション */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 p-6 sm:p-10 backdrop-blur-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-500" />
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-6 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/50">
                  Team Profile
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  ID: {team.id}
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                {team.name}
              </h1>
            </div>
          </div>

          {/* チーム説明 */}
          <div className="prose prose-slate max-w-none">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">
              チーム概要・説明
            </h2>
            <p className="text-lg text-slate-700 leading-relaxed bg-slate-50/80 p-5 rounded-2xl border border-slate-100">
              {team.description || 'チームの説明はありません。'}
            </p>
          </div>
        </div>

        {/* メンバーリストセクション */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 p-6 sm:p-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">メンバーリスト</h2>
              <p className="text-sm text-slate-500 mt-1">
                チーム「{team.name}」に所属しているメンバーの一覧です。
              </p>
            </div>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-slate-100 text-slate-700">
              {team.members.length} 名
            </span>
          </div>

          {team.members.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center bg-slate-50/50">
              <p className="text-slate-500 text-sm">所属しているメンバーはいません。</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {team.members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50/60 hover:bg-white hover:border-indigo-100 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 text-white font-bold flex items-center justify-center shadow-sm text-sm">
                      {member.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 text-base">
                        {member.name}
                      </div>
                      <div className="text-xs text-slate-400 font-mono">
                        {member.id}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                      member.role === 'リーダー' || member.role === 'owner' || member.role === '管理者'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200/60'
                        : 'bg-indigo-50 text-indigo-700 border border-indigo-200/60'
                    }`}
                  >
                    {member.role === 'owner' ? 'リーダー' : member.role}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
