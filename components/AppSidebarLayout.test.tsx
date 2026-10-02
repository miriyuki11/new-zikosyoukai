import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AppSidebarLayout from './AppSidebarLayout';

const navigationMocks = vi.hoisted(() => ({
  usePathname: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  usePathname: navigationMocks.usePathname,
}));

describe('AppSidebarLayout', () => {
  beforeEach(() => {
    navigationMocks.usePathname.mockReturnValue('/profile/settings');
  });

  it('プロフィール作成リンク以外のサイドバー項目から遷移できない', () => {
    const { container } = render(
      <AppSidebarLayout>
        <main>設定画面</main>
      </AppSidebarLayout>
    );

    expect(screen.getByRole('complementary', { name: 'ワークスペース情報' })).toBeDefined();
    expect(screen.getByText('設定画面')).toBeDefined();
    const homeLink = screen.getByRole('link', { name: /My Profile/ });
    expect(homeLink.getAttribute('href')).toBe('/');
    const createProfileLink = screen.getByRole('link', { name: /マイプロフィールを作成/i });
    expect(createProfileLink.getAttribute('href')).toBe('/profile/settings');
    expect(screen.getByRole('button', { name: /Slackと連携する/i })).toBeDefined();
    expect(container.querySelectorAll('a, button')).toHaveLength(3);
    expect(screen.queryByText('マイプロフィール')).toBeNull();
  });

  it('ログイン画面では共通サイドバーを表示しない', () => {
    navigationMocks.usePathname.mockReturnValue('/login');

    render(
      <AppSidebarLayout>
        <main>ログイン</main>
      </AppSidebarLayout>
    );

    expect(screen.queryByRole('complementary')).toBeNull();
    expect(screen.getByText('ログイン')).toBeDefined();
  });
});