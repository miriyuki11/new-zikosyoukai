import { describe, expect, it, vi } from 'vitest';
import ProfileEditPage from './page';
import { redirect } from 'next/navigation';

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

describe('ProfileEditPage', () => {
  it('旧プロフィール編集URLをプロフィール設定へ転送する', () => {
    ProfileEditPage();

    expect(redirect).toHaveBeenCalledWith('/profile/settings');
  });
});