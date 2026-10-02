import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProfileSettingsPage from './page';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase-server';

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

vi.mock('@/lib/supabase-server', () => ({
  createServerSupabaseClient: vi.fn(),
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      }),
    },
    from: vi.fn().mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      }),
    }),
  },
}));

describe('ProfileSettingsPage Server Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('未ログイン時は /login にリダイレクトされる', async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      },
    } as never);

    await ProfileSettingsPage();

    expect(redirect).toHaveBeenCalledWith('/login');
  });

  it('認証済みユーザーの場合、プロフィールを取得してフォームを描画する', async () => {
    const mockUser = { id: 'test-user-id' };
    const mockProfileData = {
      id: 'profile-id',
      user_id: 'test-user-id',
      introduction: 'サーバーから取得した自己紹介',
      communication_style: 'テキスト優先',
      consultation_style: 'Slackにて',
      realtime_status: 'オンライン',
      work_style_tags: ['remote'],
      tech_tags: ['React', 'Next.js'],
      hobby_tags: ['散歩'],
    };

    const maybeSingleMock = vi.fn().mockResolvedValue({ data: mockProfileData, error: null });
    const limitMock = vi.fn().mockReturnValue({ maybeSingle: maybeSingleMock });
    const orderMock = vi.fn().mockReturnValue({ limit: limitMock });
    const eqMock = vi.fn().mockReturnValue({ maybeSingle: maybeSingleMock, order: orderMock });
    const selectMock = vi.fn().mockReturnValue({ eq: eqMock });
    const fromMock = vi.fn().mockReturnValue({ select: selectMock });

    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
      },
      from: fromMock,
    } as never);

    const PageJsx = await ProfileSettingsPage();
    render(PageJsx);

    const introTextarea = screen.getByLabelText(/自己紹介文/i) as HTMLTextAreaElement;

    expect(introTextarea.value).toBe('サーバーから取得した自己紹介');
    expect(screen.getAllByRole('heading', { name: 'プロフィール設定' })).toHaveLength(1);
    expect(screen.getByRole('button', { name: /✓ リモート中心/i })).toBeDefined();
    expect(screen.getByText('コミュニケーションスタイル')).toBeDefined();
    expect(screen.queryByLabelText(/リアルタイムステータス/i)).toBeNull();
    expect(screen.queryByText(/相談スタイル/i)).toBeNull();
    expect(screen.queryByText(/技術タグ/i)).toBeNull();
    expect(fromMock).toHaveBeenCalledTimes(1);
  });
});
