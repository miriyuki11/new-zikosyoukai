import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { generateMetadata } from './page';

const profileMocks = vi.hoisted(() => ({
  getPublicProfileBySlug: vi.fn(),
}));

vi.mock('@/lib/profiles', () => ({
  getPublicProfileBySlug: profileMocks.getPublicProfileBySlug,
}));

describe('PublicProfilePage metadata', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('NEXT_PUBLIC_BASE_URL', 'https://sapo.example');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('公開slugのプロフィール情報をSlack OGP metadataにする', async () => {
    profileMocks.getPublicProfileBySlug.mockResolvedValue({
      slug: 'sato-hanako',
      full_name: '佐藤 花子',
      avatar_url: 'https://cdn.example/avatar.png',
      self_introduction: 'フロントエンドエンジニアです。',
      skills: null,
      communication_style: 'チャット中心',
      consultation_style: null,
      free_description: null,
      realtime_status: null,
    });

    const metadata = await generateMetadata({
      params: Promise.resolve({ id: 'sato-hanako' }),
    });

    expect(profileMocks.getPublicProfileBySlug).toHaveBeenCalledWith('sato-hanako');
    expect(metadata.title).toBe('佐藤 花子 | プロフィール');
    expect(metadata.openGraph).toMatchObject({
      siteName: 'My Profile',
      url: 'https://sapo.example/profile/sato-hanako',
      description: 'フロントエンドエンジニアです。',
      images: [{ url: 'https://cdn.example/avatar.png' }],
    });
  });

  it('非公開slugには個人情報を含むmetadataを返さない', async () => {
    profileMocks.getPublicProfileBySlug.mockResolvedValue(null);

    const metadata = await generateMetadata({
      params: Promise.resolve({ id: 'private-profile' }),
    });

    expect(metadata.title).toBe('公開プロフィールが見つかりません');
    expect(metadata.openGraph?.description).toBe(
      'このプロフィールは公開されていないか、存在しません。'
    );
  });
});