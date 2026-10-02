import { cache } from 'react';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { UserRound } from 'lucide-react';
import { getPublicProfileBySlug, type PublicProfileCard } from '@/lib/profiles';
import { generateOgpMetadata } from '@/lib/metadata';

type Props = {
  params: Promise<{ id: string }>;
};

const getPublishedProfile = cache((slug: string) => getPublicProfileBySlug(slug));

async function getSiteUrl(): Promise<string> {
  const configuredUrl = process.env.NEXT_PUBLIC_BASE_URL;
  if (configuredUrl) return configuredUrl.replace(/\/$/, '');

  const requestHeaders = await headers();
  const host = requestHeaders.get('x-forwarded-host') ?? requestHeaders.get('host');
  if (!host) return 'https://your-app.com';

  const protocol =
    requestHeaders.get('x-forwarded-proto') ??
    (process.env.NODE_ENV === 'development' ? 'http' : 'https');
  return `${protocol}://${host}`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id: slug } = await params;
  const profile = await getPublishedProfile(slug);
  const siteUrl = await getSiteUrl();
  const profileUrl = `${siteUrl}/profile/${encodeURIComponent(slug)}`;
  const defaultImage = `${siteUrl}/images/default-profile-ogp.jpg`;

  if (!profile) {
    return generateOgpMetadata({
      title: '公開プロフィールが見つかりません',
      description: 'このプロフィールは公開されていないか、存在しません。',
      image: defaultImage,
      url: profileUrl,
    });
  }

  const name = profile.full_name?.trim() || profile.slug;
  const avatarUrl = profile.avatar_url?.match(/^https?:\/\//i)
    ? profile.avatar_url
    : defaultImage;

  return generateOgpMetadata({
    title: `${name} | プロフィール`,
    description:
      profile.self_introduction?.trim() || `${name}さんの公開プロフィールです。`,
    image: avatarUrl,
    url: `${siteUrl}/profile/${encodeURIComponent(profile.slug)}`,
    type: 'profile',
  });
}

const PROFILE_FIELDS: Array<[keyof PublicProfileCard, string]> = [
  ['self_introduction', '自己紹介'],
  ['skills', 'スキル・得意分野'],
  ['communication_style', 'コミュニケーションスタイル'],
  ['consultation_style', '相談スタイル'],
  ['free_description', '自由記述'],
  ['realtime_status', 'ステータス'],
];

export default async function PublicProfilePage({ params }: Props) {
  const { id: slug } = await params;
  const profile = await getPublishedProfile(slug);
  if (!profile) notFound();

  const name = profile.full_name?.trim() || profile.slug;
  const visibleFields = PROFILE_FIELDS.filter(([field]) => {
    const value = profile[field];
    return typeof value === 'string' && value.trim().length > 0;
  });

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-12">
      <header className="flex items-center gap-4 border-b border-slate-200 pb-6">
        {profile.avatar_url?.startsWith('http') ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatar_url}
            alt=""
            className="h-16 w-16 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-500">
            <UserRound aria-hidden="true" className="h-9 w-9" />
          </div>
        )}
        <div>
          <p className="text-sm text-slate-500">公開プロフィール</p>
          <h1 className="text-2xl font-bold text-slate-900">{name}</h1>
        </div>
      </header>

      {visibleFields.length === 0 ? (
        <p className="text-slate-600">公開されているプロフィール項目はありません。</p>
      ) : (
        <dl className="flex flex-col gap-5">
          {visibleFields.map(([field, label]) => (
            <div key={field} className="border-b border-slate-100 pb-4">
              <dt className="mb-1 text-sm font-semibold text-slate-500">{label}</dt>
              <dd className="whitespace-pre-wrap text-slate-900">{profile[field]}</dd>
            </div>
          ))}
        </dl>
      )}
    </main>
  );
}