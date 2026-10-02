'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { UserRound } from 'lucide-react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import PrivateNote, { PrivateNoteItem } from '@/src/components/PrivateNote/PrivateNote';
import { getPrivateNotes, createPrivateNote } from '@/utils/privateNotes';

// タグの型定義（分類・色属性含む）
export interface Tag {
  id: string;
  name: string;
  category?: string;
  category_name?: string;
  color?: string; // 例: 'blue', 'green', 'indigo' などTailwind CSSの色名
  color_hex?: string | null;
}

// チーム情報の型定義
export interface TeamInfo {
  id: string;
  name: string;
  description?: string | null;
  owner_id?: string;
  created_at?: string;
}

// プロフィールデータの型定義
export interface Profile {
  id?: string;
  user_id?: string;
  name?: string;
  username?: string;
  full_name?: string | null;
  bio?: string;
  self_introduction?: string | null;
  skills?: string[] | string | null;
  communication_style?: string | null;
  communicationStyle?: string;
  consultation_style?: string | null;
  consultationStyle?: string;
  status?: string | null;
  realtime_status?: string | null;
  realtimeStatus?: string;
  tags?: Tag[];
  team_id?: string | null;
  teamId?: string | null;
  team?: TeamInfo | null;
  avatar_url?: string | null;
  avatarUrl?: string | null;
  email?: string;
  role?: string;
}

export interface ProfileCardProps {
  targetUserId?: string; // 表示対象のユーザーID
  userId?: string; // 互換用 (targetUserIdと同じ)
  teamId?: string | null; // 対象ユーザーが所属するチームID (オプション)
  profile?: Profile; // 事前データまたはフォールバック
  profileId?: string;
  profileName?: string;
  email?: string;
  role?: string;
  avatarUrl?: string | null;
}

type ProfileCardQueryResult = {
  id: string;
  user_id: string;
  self_introduction: string | null;
  skills: string[] | string | null;
  communication_style: string | null;
  consultation_style: string | null;
  realtime_status: string | null;
  team_id: string | null;
  profile_card_tags: unknown;
  teams: unknown;
};

function getFirstRecord(value: unknown): Record<string, unknown> | null {
  const record = Array.isArray(value) ? value[0] : value;
  return typeof record === 'object' && record !== null
    ? (record as Record<string, unknown>)
    : null;
}

// Tailwind CSSの安全なカラーマッピングテーブル (JIT対応)
const tagColorMap: Record<string, { bg: string; text: string; border: string }> = {
  blue: { bg: 'bg-blue-100 dark:bg-blue-900/40', text: 'text-blue-800 dark:text-blue-300', border: 'border-blue-300 dark:border-blue-700' },
  green: { bg: 'bg-green-100 dark:bg-green-900/40', text: 'text-green-800 dark:text-green-300', border: 'border-green-300 dark:border-green-700' },
  red: { bg: 'bg-red-100 dark:bg-red-900/40', text: 'text-red-800 dark:text-red-300', border: 'border-red-300 dark:border-red-700' },
  yellow: { bg: 'bg-yellow-100 dark:bg-yellow-900/40', text: 'text-yellow-800 dark:text-yellow-300', border: 'border-yellow-300 dark:border-yellow-700' },
  purple: { bg: 'bg-purple-100 dark:bg-purple-900/40', text: 'text-purple-800 dark:text-purple-300', border: 'border-purple-300 dark:border-purple-700' },
  pink: { bg: 'bg-pink-100 dark:bg-pink-900/40', text: 'text-pink-800 dark:text-pink-300', border: 'border-pink-300 dark:border-pink-700' },
  indigo: { bg: 'bg-indigo-100 dark:bg-indigo-900/40', text: 'text-indigo-800 dark:text-indigo-300', border: 'border-indigo-300 dark:border-indigo-700' },
  gray: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-800 dark:text-gray-300', border: 'border-gray-300 dark:border-gray-600' },
};

const isValidUuid = (id?: string | null): boolean => {
  if (!id) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
};

export const ProfileCard: React.FC<ProfileCardProps> = ({
  targetUserId: propTargetUserId,
  userId: propUserId,
  profileId: propProfileId,
  teamId: propTeamId,
  profile: initialProfile,
  profileName,
  avatarUrl: propAvatarUrl,
}) => {
  const effectiveUserId =
    propTargetUserId ||
    propUserId ||
    propProfileId ||
    initialProfile?.user_id ||
    initialProfile?.id ||
    '';

  // プロフィールステート
  const [profile, setProfile] = useState<Profile | null>(initialProfile || null);
  const [loadingProfile, setLoadingProfile] = useState<boolean>(!initialProfile && Boolean(effectiveUserId));
  const [profileError, setProfileError] = useState<string | null>(null);

  // 閲覧者ステート
  const [viewerUserId, setViewerUserId] = useState<string | null>(null);

  // 個人メモとチーム情報ステート (ステップ4)
  const [privateNote, setPrivateNote] = useState<PrivateNoteItem | null>(null);
  const [teamInfo, setTeamInfo] = useState<TeamInfo | null>(null);
  const [loadingAdditionalData, setLoadingAdditionalData] = useState<boolean>(true);
  const [errorAdditionalData, setErrorAdditionalData] = useState<string | null>(null);

  // 個人メモ新規作成フォーム用ステート
  const [isCreatingNote, setIsCreatingNote] = useState<boolean>(false);
  const [newNoteContent, setNewNoteContent] = useState<string>('');
  const [isSavingNewNote, setIsSavingNewNote] = useState<boolean>(false);

  // 1. 閲覧者の認証セッション取得
  useEffect(() => {
    let isMounted = true;
    const checkViewer = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (isMounted) {
          setViewerUserId(session?.user?.id || null);
        }
      } catch (err) {
        console.warn('Failed to get current user session:', err);
      }
    };
    checkViewer();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (isMounted) {
        const currentId = session?.user?.id || null;
        setViewerUserId(currentId);
        if (event === 'SIGNED_OUT' || !currentId) {
          setPrivateNote(null);
        }
      }
    });

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  // 2. プロフィール基本データ取得 (ステップ3)
  const fetchProfileData = useCallback(async () => {
    if (!effectiveUserId) {
      setLoadingProfile(false);
      return;
    }

    setLoadingProfile(true);
    setProfileError(null);

    try {
      let fetchedProfile: Profile | null = null;

      // 1. Edge Function 'profiles' の呼び出しを試みる
      try {
        const edgeUrl =
          process.env.NEXT_PUBLIC_SUPABASE_EDGE_FUNCTIONS_URL ||
          process.env.NEXT_PUBLIC_SUPABASE_EDGE_FUNCTIONS_BASE_URL ||
          (process.env.NEXT_PUBLIC_SUPABASE_URL ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1` : '');

        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (edgeUrl && token) {
          const res = await fetch(`${edgeUrl}/profiles?target_user_id=${effectiveUserId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          if (res.ok) {
            const json = await res.json();
            if (json?.profile) {
              fetchedProfile = json.profile;
            }
          }
        }
      } catch (edgeErr) {
        console.warn('Profile Edge Function failed, fallback to direct query:', edgeErr);
      }

      // 2. フォールバック: profile_cards テーブル直接クエリ (有効なUUIDの場合のみクエリ)
      if (!fetchedProfile && isValidUuid(effectiveUserId)) {
        try {
          const fromCards = supabase.from?.('profile_cards');
          if (fromCards?.select) {
            const { data: card, error: dbError } = await fromCards
              .select(`
                id,
                user_id,
                self_introduction,
                skills,
                communication_style,
                consultation_style,
                free_description,
                realtime_status,
                team_id,
                teams:team_id (
                  id,
                  name,
                  description
                ),
                profile_card_tags (
                  profile_tag_id,
                  profile_tags (
                    id,
                    name,
                    color_hex,
                    category_id,
                    tag_categories (
                      id,
                      name,
                      description
                    )
                  )
                )
              `)
              .eq('user_id', effectiveUserId)
              .maybeSingle();

            if (dbError) {
              const fromProfiles = supabase.from?.('profiles');
              if (fromProfiles?.select) {
                const { data: pData } = await fromProfiles
                  .select('*')
                  .eq('id', effectiveUserId)
                  .maybeSingle();

                if (pData) {
                  fetchedProfile = {
                    id: pData.id,
                    user_id: pData.id,
                    bio: pData.self_introduction || pData.bio,
                    skills: pData.skills,
                    communication_style: pData.communication_style,
                    consultation_style: pData.consultation_style,
                    realtime_status: pData.realtime_status || pData.status,
                    team_id: pData.team_id,
                  };
                }
              }
            } else if (card) {
              const profileCard = card as ProfileCardQueryResult;
              // タグ整形
              const rawTags = Array.isArray(profileCard.profile_card_tags)
                ? profileCard.profile_card_tags
                : [];
              const tags: Tag[] = [];
              for (const item of rawTags) {
                const tag = getFirstRecord(getFirstRecord(item)?.profile_tags);
                if (!tag) continue;
                const category = getFirstRecord(tag.tag_categories);
                const colorHex = typeof tag.color_hex === 'string' ? tag.color_hex : null;
                const categoryName = typeof category?.name === 'string' ? category.name : '一般';
                tags.push({
                  id: tag.id == null ? '' : String(tag.id),
                  name: typeof tag.name === 'string' ? tag.name : '',
                  color_hex: colorHex,
                  color: colorHex || 'blue',
                  category: categoryName,
                  category_name: typeof category?.name === 'string' ? category.name : undefined,
                });
              }

              const relatedTeam = getFirstRecord(profileCard.teams);
              const teamObj: TeamInfo | null =
                relatedTeam && typeof relatedTeam.id === 'string' && typeof relatedTeam.name === 'string'
                  ? {
                      id: relatedTeam.id,
                      name: relatedTeam.name,
                      description: typeof relatedTeam.description === 'string' ? relatedTeam.description : null,
                      owner_id: typeof relatedTeam.owner_id === 'string' ? relatedTeam.owner_id : undefined,
                      created_at: typeof relatedTeam.created_at === 'string' ? relatedTeam.created_at : undefined,
                    }
                  : null;

              fetchedProfile = {
                id: profileCard.id,
                user_id: profileCard.user_id,
                bio: profileCard.self_introduction ?? undefined,
                self_introduction: profileCard.self_introduction,
                skills: profileCard.skills,
                communication_style: profileCard.communication_style,
                consultation_style: profileCard.consultation_style,
                realtime_status: profileCard.realtime_status,
                team_id: profileCard.team_id,
                team: teamObj,
                tags,
              };
            }
          }
        } catch (dbErr) {
          console.warn('Direct DB fetch for profile_cards failed:', dbErr);
        }
      }

      if (fetchedProfile) {
        setProfile(fetchedProfile);
      } else if (profileName || initialProfile) {
        setProfile({
          id: effectiveUserId,
          user_id: effectiveUserId,
          name: profileName || initialProfile?.name || 'メンバー',
          bio: initialProfile?.bio || '',
          skills: initialProfile?.skills || [],
          communicationStyle: initialProfile?.communicationStyle,
          consultationStyle: initialProfile?.consultationStyle,
          realtimeStatus: initialProfile?.realtimeStatus,
          tags: initialProfile?.tags || [],
          team_id: propTeamId || initialProfile?.team_id || null,
        });
      } else if (!initialProfile) {
        // プロフィールが見つからない場合
        setProfile(null);
      }
    } catch (err: unknown) {
      console.error('Error fetching profile:', err instanceof Error ? err.message : err);
      if (profileName || initialProfile) {
        setProfile({
          id: effectiveUserId,
          user_id: effectiveUserId,
          name: profileName || initialProfile?.name || 'メンバー',
          bio: initialProfile?.bio || '',
          skills: initialProfile?.skills || [],
          tags: initialProfile?.tags || [],
        });
      } else {
        setProfileError('プロフィールの取得中にエラーが発生しました。');
      }
    } finally {
      setLoadingProfile(false);
    }
  }, [effectiveUserId, initialProfile, profileName, propTeamId]);

  useEffect(() => {
    void Promise.resolve().then(fetchProfileData);
  }, [fetchProfileData]);

  // 3. 個人メモ & チーム情報の追加データ取得 (ステップ4)
  const effectiveTeamId = propTeamId ?? profile?.team_id ?? profile?.teamId;

  const fetchAdditionalData = useCallback(async () => {
    if (!effectiveUserId) {
      setLoadingAdditionalData(false);
      return;
    }

    setLoadingAdditionalData(true);
    setErrorAdditionalData(null);

    const edgeFunctionsBaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_EDGE_FUNCTIONS_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_EDGE_FUNCTIONS_BASE_URL ||
      (process.env.NEXT_PUBLIC_SUPABASE_URL ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1` : '');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      // ---------------------------------------------------------
      // 1. 個人メモの取得
      // ---------------------------------------------------------
      if (viewerUserId) {
        let noteItem: PrivateNoteItem | null = null;

        // 1-0. supabase.functions.invoke を試みる (テスト互換およびSupabase SDK連携)
        try {
          const invokeRes = await supabase.functions.invoke(
            `private-notes?profile_user_id=${effectiveUserId}`,
            { method: 'GET' }
          );
          if (invokeRes?.data && !invokeRes.error) {
            const list = Array.isArray(invokeRes.data)
              ? invokeRes.data
              : Array.isArray(invokeRes.data?.notes)
              ? invokeRes.data.notes
              : [invokeRes.data];
            const first = list[0];
            if (first && (first.content || first.note_content)) {
              noteItem = {
                id: first.id,
                content: first.content || first.note_content || '',
                note_content: first.note_content || first.content || '',
                target_user_id: first.target_user_id || effectiveUserId,
                created_at: first.created_at,
                updated_at: first.updated_at,
              };
            }
          }
        } catch (invErr) {
          console.warn('supabase.functions.invoke failed, trying fetch fallback:', invErr);
        }

        // 1-1. フォールバック: fetch で直接 Edge Function を呼び出し
        if (!noteItem && edgeFunctionsBaseUrl && accessToken) {
          try {
            const privateNoteApiUrl = `${edgeFunctionsBaseUrl}/private-notes?target_user_id=${effectiveUserId}`;
            const response = await fetch(privateNoteApiUrl, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
              },
            });

            if (response.ok) {
              const data = await response.json();
              const noteData = Array.isArray(data) ? data[0] : (data?.notes ? data.notes[0] : data);
              if (noteData && (noteData.content || noteData.note_content)) {
                noteItem = {
                  id: noteData.id,
                  content: noteData.content || noteData.note_content || '',
                  note_content: noteData.note_content || noteData.content || '',
                  target_user_id: noteData.target_user_id || effectiveUserId,
                  created_at: noteData.created_at,
                  updated_at: noteData.updated_at,
                };
              }
            }
          } catch (funcErr) {
            console.warn('Edge Function private-notes failed, trying direct helper:', funcErr);
          }
        }

        // 1-2. フォールバック: utils/privateNotes (有効なUUIDの場合のみDBクエリ)
        if (!noteItem && isValidUuid(effectiveUserId)) {
          const notes = await getPrivateNotes(effectiveUserId);
          if (notes && notes.length > 0) {
            const n = notes[0];
            noteItem = {
              id: n.id,
              content: n.note_content,
              note_content: n.note_content,
              target_user_id: n.target_user_id,
              created_at: n.created_at,
              updated_at: n.updated_at,
            };
          }
        }

        setPrivateNote(noteItem);
      } else {
        setPrivateNote(null);
      }

      // ---------------------------------------------------------
      // 2. チーム情報の取得 (teamIdが存在する場合)
      // ---------------------------------------------------------
      if (effectiveTeamId) {
        let teamData: TeamInfo | null = null;

        // 2-1. Edge Function 'teams' を試みる
        if (edgeFunctionsBaseUrl && accessToken) {
          try {
            const teamApiUrl = `${edgeFunctionsBaseUrl}/teams/${effectiveTeamId}`;
            const response = await fetch(teamApiUrl, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
              },
            });

            if (response.ok) {
              const resJson = await response.json();
              if (resJson && resJson.id) {
                teamData = resJson;
              }
            }
          } catch (funcErr) {
            console.warn('Edge Function teams failed, trying direct query:', funcErr);
          }
        }

        // 2-2. フォールバック: teams テーブル直接クエリ (有効なUUIDの場合のみクエリ)
        if (!teamData && isValidUuid(effectiveTeamId)) {
          const { data: teamRow, error: teamDbError } = await supabase
            .from('teams')
            .select('*')
            .eq('id', effectiveTeamId)
            .maybeSingle();

          if (!teamDbError && teamRow) {
            teamData = teamRow as TeamInfo;
          }
        }

        setTeamInfo(teamData);
      } else {
        setTeamInfo(null);
      }
    } catch (err: unknown) {
      console.error('Error fetching additional profile data:', err);
      setErrorAdditionalData(
        err instanceof Error ? err.message : '追加データの取得に失敗しました。'
      );
    } finally {
      setLoadingAdditionalData(false);
    }
  }, [effectiveUserId, viewerUserId, effectiveTeamId]);

  useEffect(() => {
    void Promise.resolve().then(fetchAdditionalData);
  }, [fetchAdditionalData]);

  // 個人メモ新規保存処理
  const handleCreateNewNote = async () => {
    const trimmed = newNoteContent.trim();
    if (!trimmed) {
      alert('メモの内容を入力してください。');
      return;
    }

    setIsSavingNewNote(true);
    try {
      let created: PrivateNoteItem | null = null;

      // 1. Edge Function
      try {
        const response = await supabase.functions.invoke('private-notes', {
          method: 'POST',
          body: {
            content: trimmed,
            note_content: trimmed,
            target_user_id: effectiveUserId,
          },
        });
        if (response?.data && !response.error) {
          const res = response.data?.note || response.data;
          created = {
            id: res.id,
            content: res.content || res.note_content || trimmed,
            note_content: res.note_content || res.content || trimmed,
            target_user_id: res.target_user_id || effectiveUserId,
            created_at: res.created_at,
            updated_at: res.updated_at,
          };
        }
      } catch (e) {
        console.warn('Edge function note create failed, fallback to helper:', e);
      }

      // 2. フォールバック
      if (!created) {
        if (isValidUuid(effectiveUserId)) {
          const dbNote = await createPrivateNote({
            target_user_id: effectiveUserId,
            note_content: trimmed,
          });
          if (dbNote) {
            created = {
              id: dbNote.id,
              content: dbNote.note_content,
              note_content: dbNote.note_content,
              target_user_id: dbNote.target_user_id,
              created_at: dbNote.created_at,
              updated_at: dbNote.updated_at,
            };
          }
        } else {
          // モックIDなどの場合はローカルオブジェクトとして生成
          created = {
            id: `temp-${Date.now()}`,
            content: trimmed,
            note_content: trimmed,
            target_user_id: effectiveUserId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
        }
      }

      if (created) {
        setPrivateNote(created);
        setNewNoteContent('');
        setIsCreatingNote(false);
      } else {
        throw new Error('メモの作成に失敗しました。');
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'メモの保存中にエラーが発生しました。');
    } finally {
      setIsSavingNewNote(false);
    }
  };

  // タグの色スタイル取得ヘルパー
  const getTagStyle = (tag: Tag) => {
    const colorKey = (tag.color || '').toLowerCase().replace(/[^a-z]/g, '');
    const mapped = tagColorMap[colorKey] || tagColorMap['blue'];

    // もしhexコードが直接指定されている場合
    if (tag.color_hex && tag.color_hex.startsWith('#')) {
      return {
        className: 'px-3 py-1 rounded-full text-xs font-medium border shadow-xs',
        style: {
          backgroundColor: `${tag.color_hex}15`,
          color: tag.color_hex,
          borderColor: `${tag.color_hex}40`,
        },
      };
    }

    return {
      className: `px-3 py-1 rounded-full text-xs font-medium border shadow-xs ${mapped.bg} ${mapped.text} ${mapped.border}`,
      style: {},
    };
  };

  // スキル配列の正規化
  const skillsList: string[] = Array.isArray(profile?.skills)
    ? profile.skills
    : typeof profile?.skills === 'string'
    ? profile.skills.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  const displayName = profile?.name || profile?.full_name || profileName || profile?.username || (effectiveUserId ? `User (${effectiveUserId.slice(0, 8)})` : 'メンバー');
  const displayBio = profile?.bio || profile?.self_introduction || '自己紹介はまだ登録されていません。';
  const displayCommStyle = profile?.communication_style || profile?.communicationStyle;
  const displayConsultStyle = profile?.consultation_style || profile?.consultationStyle;
  const displayStatus = profile?.realtime_status || profile?.realtimeStatus || profile?.status || '作業中💻';
  const displayAvatar = profile?.avatar_url || profile?.avatarUrl || propAvatarUrl;

  // ローディング中 (プロフィール本体)
  if (loadingProfile) {
    return (
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-8 max-w-lg mx-auto border border-gray-200 dark:border-gray-700 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent mb-3"></div>
        <p className="text-gray-600 dark:text-gray-300 text-sm">プロフィールを読み込み中...</p>
      </div>
    );
  }

  // エラー時
  if (profileError) {
    return (
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6 max-w-lg mx-auto border border-red-200 text-center">
        <p className="text-red-500 font-medium">{profileError}</p>
      </div>
    );
  }

  // プロフィールが存在しない場合
  if (!profile && !initialProfile && effectiveUserId) {
    return (
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-8 max-w-lg mx-auto border border-gray-200 dark:border-gray-700 text-center">
        <p className="text-gray-600 dark:text-gray-400">プロフィールが見つかりません。</p>
        <p className="text-xs text-gray-400 mt-2 font-mono">User ID: {effectiveUserId}</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6 md:p-8 max-w-lg mx-auto border border-gray-200 dark:border-gray-700 transition-all">
      {/* ユーザーヘッダー */}
      <div className="flex items-center space-x-4 mb-6 border-b border-gray-100 dark:border-gray-700 pb-5">
        {displayAvatar ? (
          <Image
            src={displayAvatar}
            alt={displayName}
            width={64}
            height={64}
            unoptimized
            className="w-16 h-16 rounded-full object-cover border-2 border-indigo-100 shadow-sm"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center shadow-sm">
            <UserRound aria-label="名無しのプロフィールアイコン" className="h-9 w-9" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">{displayName}</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{displayStatus}</span>
          </div>
        </div>
      </div>

      <div className="space-y-5">
        {/* 自己紹介 (bio) */}
        <div>
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">自己紹介</h3>
          <p className="text-gray-800 dark:text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">{displayBio}</p>
        </div>

        {/* 分類・色属性付きタグ (ステップ3) */}
        {profile?.tags && profile.tags.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">タグ</h3>
            <div className="flex flex-wrap gap-2">
              {profile.tags.map((tag) => {
                const styleObj = getTagStyle(tag);
                return (
                  <span
                    key={tag.id}
                    className={styleObj.className}
                    style={styleObj.style}
                  >
                    {tag.name}
                    {tag.category && (
                      <span className="opacity-75 text-[10px] ml-1">({tag.category})</span>
                    )}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* 得意な技術 (skills) */}
        {skillsList.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">得意な技術</h3>
            <div className="flex flex-wrap gap-1.5">
              {skillsList.map((skill, index) => (
                <span
                  key={index}
                  className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs px-2.5 py-1 rounded-md font-medium border border-blue-100 dark:border-blue-800/50"
                >
                  #{skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* コミュニケーションスタンス & 相談スタイル */}
        {(displayCommStyle || displayConsultStyle) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-900/40 p-3.5 rounded-lg border border-gray-100 dark:border-gray-800 text-xs">
            {displayCommStyle && (
              <div>
                <span className="font-semibold text-gray-600 dark:text-gray-400 block mb-0.5">連絡スタイル:</span>
                <p className="text-gray-800 dark:text-gray-200">{displayCommStyle}</p>
              </div>
            )}
            {displayConsultStyle && (
              <div>
                <span className="font-semibold text-gray-600 dark:text-gray-400 block mb-0.5">相談スタイル:</span>
                <p className="text-gray-800 dark:text-gray-200">{displayConsultStyle}</p>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* ステップ4: 追加データ（個人メモ & チーム情報）セクション */}
        {/* ========================================================= */}
        {loadingAdditionalData && (
          <div className="text-center py-4 text-xs text-gray-500 border-t border-gray-100 dark:border-gray-700 mt-4">
            <span className="inline-block animate-pulse">Loading additional profile data...</span>
          </div>
        )}

        {errorAdditionalData && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 px-3.5 py-2.5 rounded-lg text-xs mt-4">
            <strong className="font-bold">Error!</strong> {errorAdditionalData}
          </div>
        )}

        {!loadingAdditionalData && !errorAdditionalData && (
          <>
            {/* 個人メモセクション (Your Private Note) */}
            <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-bold text-gray-800 dark:text-gray-200">
                  Your Private Note
                </h3>
                {viewerUserId && !privateNote && !isCreatingNote && (
                  <button
                    type="button"
                    onClick={() => setIsCreatingNote(true)}
                    className="text-xs px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors cursor-pointer font-medium"
                  >
                    ＋ メモを追加
                  </button>
                )}
              </div>

              {!viewerUserId ? (
                <p className="text-xs text-gray-400 italic">
                  個人メモを閲覧・作成するにはログインが必要です。
                </p>
              ) : privateNote ? (
                <PrivateNote
                  note={privateNote}
                  onDeleteSuccess={() => setPrivateNote(null)}
                  onUpdateSuccess={(updated) => setPrivateNote(updated)}
                />
              ) : isCreatingNote ? (
                <div className="p-3.5 border border-blue-200 dark:border-blue-800 rounded-lg bg-blue-50/40 dark:bg-blue-900/10">
                  <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    自分専用の非公開メモを作成
                  </h4>
                  <textarea
                    className="w-full p-2 text-xs border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-y"
                    rows={3}
                    placeholder="このメンバーに関するメモを入力してください（他者には非公開）..."
                    value={newNoteContent}
                    onChange={(e) => {
                      if (e.target.value.length <= 1000) {
                        setNewNoteContent(e.target.value);
                      }
                    }}
                    maxLength={1000}
                    disabled={isSavingNewNote}
                  />
                  <div className="flex justify-between items-center text-[11px] text-gray-400 mt-1">
                    <span>{newNoteContent.length}/1000文字</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsCreatingNote(false);
                          setNewNoteContent('');
                        }}
                        className="px-2.5 py-1 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded cursor-pointer"
                        disabled={isSavingNewNote}
                      >
                        キャンセル
                      </button>
                      <button
                        type="button"
                        onClick={handleCreateNewNote}
                        disabled={isSavingNewNote || !newNoteContent.trim()}
                        className="px-3 py-1 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
                      >
                        {isSavingNewNote ? '保存中...' : '保存'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-xs italic">
                  No private note for this user yet.
                </p>
              )}
            </div>

            {/* チーム情報セクション (Team Information) */}
            <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
              <h3 className="text-base font-bold text-gray-800 dark:text-gray-200 mb-3">
                Team Information
              </h3>
              {teamInfo ? (
                <div className="flex items-center space-x-3.5 bg-gray-50 dark:bg-gray-900/40 p-4 rounded-xl border border-gray-100 dark:border-gray-700/60 shadow-xs">
                  <div className="flex-shrink-0 w-11 h-11 bg-gradient-to-tr from-indigo-600 to-indigo-400 rounded-xl flex items-center justify-center text-white font-extrabold text-lg shadow-sm">
                    {teamInfo.name ? teamInfo.name.charAt(0).toUpperCase() : 'T'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-gray-900 dark:text-gray-100 text-sm leading-snug">
                      {teamInfo.name}
                    </p>
                    {teamInfo.description ? (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                        {teamInfo.description}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-400 italic mt-0.5">説明文なし</p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-xs italic">
                  This user is not associated with any team.
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ProfileCard;
