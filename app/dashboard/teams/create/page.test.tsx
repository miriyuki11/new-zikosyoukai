import React from 'react';
import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CreateTeamPage from './page';
import { createClient } from '@/utils/supabase/client';

vi.mock('@/utils/supabase/client', () => ({
  createClient: vi.fn(),
}));

describe('CreateTeamPage Component (Step 2 - チーム作成UI)', () => {
  const mockInvoke = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createClient).mockReturnValue({
      functions: {
        invoke: mockInvoke,
      },
    } as unknown as ReturnType<typeof createClient>);
  });

  it('フォーム要素（見出し、チーム名、説明、作成ボタン）が正しくレンダリングされる', () => {
    render(<CreateTeamPage />);

    expect(screen.getByRole('heading', { level: 1, name: '新しいチームを作成' })).toBeInTheDocument();
    expect(screen.getByLabelText(/チーム名/)).toBeInTheDocument();
    expect(screen.getByLabelText(/チーム説明/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'チームを作成' })).toBeInTheDocument();
  });

  it('チーム名が空の場合、バリデーションエラーが表示される', async () => {
    const user = userEvent.setup();
    render(<CreateTeamPage />);

    const submitButton = screen.getByRole('button', { name: 'チームを作成' });
    await user.click(submitButton);

    expect(screen.getByText('チーム名は必須です。')).toBeInTheDocument();
    expect(mockInvoke).not.toHaveBeenCalled();
  });

  it('チーム作成に成功した場合、APIが呼ばれ成功メッセージが表示される', async () => {
    const user = userEvent.setup();
    mockInvoke.mockResolvedValueOnce({
      data: { id: 'team-new-123', name: '開発チーム' },
      error: null,
    });

    render(<CreateTeamPage />);

    const nameInput = screen.getByLabelText(/チーム名/);
    const descInput = screen.getByLabelText(/チーム説明/);
    const submitButton = screen.getByRole('button', { name: 'チームを作成' });

    await user.type(nameInput, '開発チーム');
    await user.type(descInput, 'プロジェクトXの開発を担当');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('teams', {
        method: 'POST',
        body: {
          name: '開発チーム',
          description: 'プロジェクトXの開発を担当',
        },
      });
      expect(screen.getByText('チームが正常に作成されました！')).toBeInTheDocument();
    });

    expect(nameInput).toHaveValue('');
    expect(descInput).toHaveValue('');
  });

  it('APIエラー時にエラーメッセージが表示される', async () => {
    const user = userEvent.setup();
    mockInvoke.mockResolvedValueOnce({
      data: null,
      error: { message: '認証エラー' },
    });

    render(<CreateTeamPage />);

    await user.type(screen.getByLabelText(/チーム名/), 'テストチーム');
    await user.click(screen.getByRole('button', { name: 'チームを作成' }));

    await waitFor(() => {
      expect(screen.getByText('チーム作成に失敗しました: 認証エラー')).toBeInTheDocument();
    });
  });
});
