'use client';

import React, { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { useForm, Controller, SubmitHandler, useWatch } from 'react-hook-form';
import {
  ProfileFormInput,
  COMMUNICATION_STANCE_OPTIONS,
  WORK_STYLE_OPTIONS,
  HOBBY_TAG_OPTIONS,
  Profile,
} from '@/types/profile';
import TagSelector from '@/components/ui/TagSelector';
import { createClient } from '@/utils/supabase/client';
import {
  Sparkles,
  UserCircle2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Camera,
  Upload,
  X,
} from 'lucide-react';

const subscribeToLocation = () => () => {};
const getClientOrigin = () => window.location.origin;
const getServerOrigin = () => process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, '') ?? '';

// 仮のプロフィールデータ
export const MOCK_PROFILE_DATA: ProfileFormInput = {
  avatarUrl: '',
  fullName: '',
  publicSlug: '',
  isPublic: false,
  bio: 'こんにちは！フロントエンド開発が好きです。新しい技術を学ぶことに意欲的です。',
  communicationStances: ['proactive', 'hybrid'],
  workStyleTags: [],
  hobbyTags: ['gaming', 'reading'],
};

const normalizeTagValues = (
  value: string[] | string | null | undefined,
  options: { id: string; label: string }[]
): string[] => {
  const values = (Array.isArray(value) ? value : value?.split(',') ?? [])
    .flatMap((item) => item.split(','))
    .map((item) => item.trim())
    .filter(Boolean);

  return values.map((item) =>
    options.find(
      (option) =>
        option.id === item || option.label.toLocaleLowerCase() === item.toLocaleLowerCase()
    )?.id ?? item
  );
};

export interface ProfileSettingsFormProps {
  initialProfile?: Profile;
}

function getInitialValues(initialProfile?: Profile): ProfileFormInput {
  if (!initialProfile) {
    return MOCK_PROFILE_DATA;
  }

  const communicationValues =
    initialProfile.communicationStances ?? initialProfile.communication_style;
  const workStyleValues = initialProfile.workStyleTags ?? initialProfile.work_style_tags;
  const hobbyValues = initialProfile.hobbyTags ?? initialProfile.hobby_tags;

  return {
    avatarUrl: initialProfile.avatar_url ?? initialProfile.avatarUrl ?? '',
    fullName: initialProfile.full_name ?? initialProfile.fullName ?? initialProfile.name ?? '',
    publicSlug: initialProfile.slug ?? '',
    isPublic: initialProfile.is_public ?? false,
    bio: initialProfile.introduction ?? initialProfile.bio ?? '',
    communicationStances:
      communicationValues == null
        ? []
        : normalizeTagValues(communicationValues, COMMUNICATION_STANCE_OPTIONS),
    workStyleTags:
      workStyleValues == null ? [] : normalizeTagValues(workStyleValues, WORK_STYLE_OPTIONS),
    hobbyTags:
      hobbyValues == null ? [] : normalizeTagValues(hobbyValues, HOBBY_TAG_OPTIONS),
  };
}

export const ProfileSettingsForm: React.FC<ProfileSettingsFormProps> = ({ initialProfile }) => {
  const supabase = createClient();

  // ローディング状態とメッセージ表示のためのステート
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const publicSiteOrigin = useSyncExternalStore(
    subscribeToLocation,
    getClientOrigin,
    getServerOrigin
  );

  const initialValues = useMemo(() => getInitialValues(initialProfile), [initialProfile]);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileFormInput>({
    defaultValues: initialValues,
  });
  const isPublicProfile = useWatch({ control, name: 'isPublic' });

  // プロフィール情報の取得・プリフィル
  useEffect(() => {
    reset(initialValues);
  }, [reset, initialValues]);

  // ステップ4: onSubmit ハンドラとAPI連携
  const onSubmit: SubmitHandler<ProfileFormInput> = async (formData) => {
    const slug = formData.publicSlug.trim().toLowerCase();
    if (formData.isPublic && !/^[a-z0-9_-]{3,64}$/.test(slug)) {
      setMessage({
        type: 'error',
        text: '公開URLは半角小文字英数字・ハイフン・アンダースコアで3〜64文字にしてください。',
      });
      return;
    }

    setLoading(true);
    setMessage(null);
    console.log('フォームデータ:', formData);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('ログインしていません。プロフィールを更新するにはログインしてください。');
      }

      const cardData = {
        full_name: formData.fullName.trim() || null,
        avatar_url: formData.avatarUrl || null,
        self_introduction: formData.bio,
        communication_style: formData.communicationStances.join(', '),
        work_style_tags: formData.workStyleTags,
        hobby_tags: formData.hobbyTags,
        user_id: user.id,
        slug: slug || null,
        is_public: formData.isPublic,
        public_fields: formData.isPublic
          ? [
              'full_name',
              'avatar_url',
              'self_introduction',
              'communication_style',
              ...(formData.workStyleTags.length > 0 ? ['work_style_tags'] : []),
              ...(formData.hobbyTags.length > 0 ? ['hobby_tags'] : []),
            ]
          : [],
      };

      const { data: existingCards, error: cardLookupError } = await supabase
        .from('profile_cards')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (cardLookupError) {
        throw new Error(cardLookupError.message);
      }

      const existingCardId = existingCards?.[0]?.id;
      const { error: cardSaveError } = existingCardId
        ? await supabase.from('profile_cards').update(cardData).eq('id', existingCardId)
        : await supabase.from('profile_cards').insert(cardData);

      if (cardSaveError) {
        if (/schema cache|column .* does not exist/i.test(cardSaveError.message)) {
          throw new Error(
            'Supabaseのプロフィール用DB migrationが未適用です。supabase db pushを実行してから再度保存してください。'
          );
        }
        throw new Error(cardSaveError.message);
      }

      setMessage({ type: 'success', text: 'プロフィールが正常に更新されました！' });
      // 成功通知アラート（テスト互換用）
      alert('プロフィール設定を保存しました！');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('プロフィールの更新に失敗しました:', error);
      setMessage({
        type: 'error',
        text: `プロフィールの更新に失敗しました: ${errorMessage}`,
      });
      alert('プロフィールの更新に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  const isFormDisabled = loading || isSubmitting;

  return (
    <div className="max-w-4xl mx-auto p-6 sm:p-8 bg-white shadow-xl shadow-slate-200/50 rounded-2xl border border-slate-100">
      {/* フィードバックメッセージ表示UI */}
      {message && (
        <div
          className={`p-4 mb-6 rounded-xl flex items-center gap-3 text-sm font-medium shadow-xs transition-all ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        {/* 1. 【最初】アイコンや写真の挿入・設定セクション */}
        <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200/80">
          <div className="flex items-center justify-between mb-3">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <Camera className="w-4 h-4 text-indigo-500" />
              アイコン・写真
            </label>
            <span className="text-xs text-slate-500">画像をアップロードまたはURLを入力</span>
          </div>

          <Controller
            name="avatarUrl"
            control={control}
            render={({ field }) => {
              const currentAvatar = field.value || '';
              return (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                    {/* アバタープレビュー */}
                    <div className="relative group shrink-0">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 border-slate-200 shadow-md bg-slate-100 flex items-center justify-center text-slate-400">
                        {currentAvatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={currentAvatar}
                            alt="プロフィールアイコンプレビュー"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <UserCircle2 className="w-16 h-16 text-slate-400" />
                        )}
                      </div>
                      {currentAvatar && (
                        <button
                          type="button"
                          onClick={() => field.onChange('')}
                          title="写真を削除"
                          className="absolute -top-1 -right-1 bg-rose-500 hover:bg-rose-600 text-white rounded-full p-1 shadow-sm transition-transform active:scale-90 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <label
                        htmlFor="fullName"
                        className="mt-3 block text-left text-xs font-semibold text-slate-600"
                      >
                        名前
                      </label>
                      <Controller
                        name="fullName"
                        control={control}
                        render={({ field }) => (
                          <input
                            id="fullName"
                            {...field}
                            type="text"
                            maxLength={80}
                            disabled={isFormDisabled}
                            placeholder="名前を入力"
                            className="mt-1 w-40 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200 disabled:bg-slate-50"
                          />
                        )}
                      />
                    </div>

                    {/* アップロードと入力コントロール */}
                    <div className="flex-1 space-y-3 w-full">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* ファイル選択ボタン */}
                        <label className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-xl text-xs font-semibold text-slate-700 hover:text-indigo-600 cursor-pointer shadow-xs transition-all">
                          <Upload className="w-3.5 h-3.5 text-indigo-500" />
                          <span>写真・画像を挿入</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={isFormDisabled}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              if (!file.type.startsWith('image/')) {
                                alert('画像ファイルを選択してください');
                                return;
                              }
                              const reader = new FileReader();
                              reader.onload = (ev) => {
                                const res = ev.target?.result as string;
                                field.onChange(res);
                              };
                              reader.readAsDataURL(file);
                            }}
                          />
                        </label>

                        {currentAvatar && (
                          <button
                            type="button"
                            onClick={() => field.onChange('')}
                            disabled={isFormDisabled}
                            className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                          >
                            削除
                          </button>
                        )}
                      </div>

                      {/* 画像URL直接入力 */}
                      <div>
                        <input
                          type="url"
                          placeholder="または画像のURLを入力 (https://...)"
                          value={currentAvatar.startsWith('data:') ? '' : currentAvatar}
                          onChange={(e) => field.onChange(e.target.value)}
                          disabled={isFormDisabled}
                          className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white"
                        />
                      </div>

                    </div>
                  </div>
                </div>
              );
            }}
          />
        </div>

        {/* 2. 【続いて】コミュニケーションスタイル・スタンス (赤色タグ) */}
        <div className="pt-2">
          <Controller
            name="communicationStances"
            control={control}
            rules={{
              required: 'コミュニケーションスタイルは必須です',
              validate: (val) => (val && val.length >= 1) || '少なくとも1つ選択してください',
            }}
            render={({ field }) => (
              <TagSelector
                label="コミュニケーションスタイル"
                options={COMMUNICATION_STANCE_OPTIONS}
                selectedTagIds={field.value || []}
                onChange={field.onChange}
                maxSelection={8}
                allowCustomTags
                customTagTriggerId="other"
                customTagColor="red"
                customTagPlaceholder="その他のスタイルを入力"
              />
            )}
          />
          {errors.communicationStances && (
            <p className="mt-1 text-sm text-rose-600 font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-600 inline-block" />
              {errors.communicationStances.message}
            </p>
          )}
        </div>

        <div className="pt-2">
          <Controller
            name="workStyleTags"
            control={control}
            render={({ field }) => (
              <TagSelector
                label="働き方・仕事のスタイル"
                options={WORK_STYLE_OPTIONS}
                selectedTagIds={field.value || []}
                onChange={field.onChange}
                maxSelection={8}
                allowCustomTags
                customTagTriggerId="other"
                customTagColor="blue"
                customTagPlaceholder="仕事のスタイルを追加"
              />
            )}
          />
        </div>

        <div className="pt-2">
          <Controller
            name="hobbyTags"
            control={control}
            render={({ field }) => (
              <TagSelector
                label="趣味タグ"
                options={HOBBY_TAG_OPTIONS}
                selectedTagIds={field.value || []}
                onChange={field.onChange}
                maxSelection={8}
                allowCustomTags
                customTagTriggerId="other"
                customTagColor="green"
                customTagPlaceholder="趣味のタグを追加"
              />
            )}
          />
          {errors.hobbyTags && (
            <p className="mt-1 text-sm text-rose-600 font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-600 inline-block" />
              {errors.hobbyTags.message}
            </p>
          )}
        </div>

        {/* 3. 自己紹介文 */}
        <div>
          <label htmlFor="bio" className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-1">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            自己紹介文
          </label>
          <Controller
            name="bio"
            control={control}
            rules={{ maxLength: { value: 500, message: '500文字以内で入力してください' } }}
            render={({ field }) => (
              <textarea
                id="bio"
                {...field}
                rows={4}
                disabled={isFormDisabled}
                className="mt-1 block w-full rounded-xl border border-slate-200 p-3.5 text-sm transition-all focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shadow-xs hover:border-slate-300 placeholder:text-slate-400 disabled:bg-slate-50"
                placeholder="あなたの自己紹介や興味関心などを入力してください。"
              />
            )}
          />
          {errors.bio && (
            <p className="mt-1.5 text-sm text-rose-600 font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-600 inline-block" />
              {errors.bio.message}
            </p>
          )}
        </div>

        <div className="space-y-3 border-t border-slate-200 pt-5">
          <Controller
            name="isPublic"
            control={control}
            render={({ field }) => (
              <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={field.onChange}
                  disabled={isFormDisabled}
                  className="h-4 w-4 accent-emerald-600"
                />
                Slackでプロフィールを公開する
              </label>
            )}
          />
          <p className="text-sm text-slate-500">
            公開すると、名前・アイコン・自己紹介・コミュニケーションスタイルがリンクプレビューに表示されます。
          </p>
          {isPublicProfile && (
            <Controller
              name="publicSlug"
              control={control}
              render={({ field }) => (
                <div className="max-w-lg">
                  <label htmlFor="publicSlug" className="mb-1 block text-sm font-medium text-slate-700">
                    公開URL
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="shrink-0 text-sm text-slate-500">/profile/</span>
                    <input
                      id="publicSlug"
                      {...field}
                      maxLength={64}
                      disabled={isFormDisabled}
                      placeholder="例: taro-yamada"
                      className="min-w-0 flex-1 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200 disabled:bg-slate-50"
                    />
                  </div>
                  {field.value && /^[a-z0-9_-]{3,64}$/i.test(field.value.trim()) && (
                    <p className="mt-2 break-all text-sm text-emerald-700" role="status">
                      Slack共有URL:{' '}
                      <a
                        href={`${publicSiteOrigin}/profile/${encodeURIComponent(field.value.trim().toLowerCase())}`}
                        target="_blank"
                        rel="noreferrer"
                        className="underline underline-offset-2"
                      >
                        {publicSiteOrigin}/profile/{encodeURIComponent(field.value.trim().toLowerCase())}
                      </a>
                    </p>
                  )}
                </div>
              )}
            />
          )}
        </div>

        {/* 保存ボタン */}
        <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="submit"
            className="inline-flex items-center gap-2 py-2.5 px-6 border border-transparent shadow-md shadow-indigo-200 hover:shadow-lg text-sm font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
            disabled={isFormDisabled || !isDirty}
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? '更新中...' : 'プロフィールを保存'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfileSettingsForm;
