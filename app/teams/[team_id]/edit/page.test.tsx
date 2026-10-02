import React from 'react';
import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TeamEditPage from './page';
import TeamEditForm from '@/components/teams/TeamEditForm';
import TeamMemberManagementSection from '@/components/teams/TeamMemberManagementSection';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  notFound: vi.fn(),
}));

vi.mock('@/utils/supabase/client', () => ({
  createClient: vi.fn(),
}));

describe('TeamEditPage & Components (Step 3 & 4 - チーム情報編集・メンバー管理UI)', () => {
  const mockPush = vi.fn();
  const mockInvoke = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
    } as unknown as ReturnType<typeof useRouter>);
    vi.mocked(createClient).mockReturnValue({
      functions: {
        invoke: mockInvoke,
      },
      from: vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      }),
    } as unknown as ReturnType<typeof createClient>);
  });

  describe('TeamEditForm (Step 3)', () => {
    const mockTeam = {
      id: 'team-123',
      name: '開発チームA',
      description: '新機能開発を担当するチームです',
    };

    it('チーム名と説明が初期値としてフォームに表示される', () => {
      render(<TeamEditForm initialTeamData={mockTeam} />);

      expect(screen.getByLabelText(/チーム名/)).toHaveValue('開発チームA');
      expect(screen.getByLabelText(/説明/)).toHaveValue('新機能開発を担当するチームです');
      expect(screen.getByRole('button', { name: 'チーム情報を更新' })).toBeInTheDocument();
    });

    it('フォーム送信時にPUT APIが呼ばれ、詳細ページへリダイレクトされる', async () => {
      const user = userEvent.setup();
      mockInvoke.mockResolvedValueOnce({
        data: { success: true },
        error: null,
      });

      render(<TeamEditForm initialTeamData={mockTeam} />);

      const nameInput = screen.getByLabelText(/チーム名/);
      await user.clear(nameInput);
      await user.type(nameInput, '開発チームB');

      await user.click(screen.getByRole('button', { name: 'チーム情報を更新' }));

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith('teams/team-123', {
          method: 'PUT',
          body: {
            name: '開発チームB',
            description: '新機能開発を担当するチームです',
          },
        });
        expect(mockPush).toHaveBeenCalledWith('/teams/team-123');
      });
    });
  });

  describe('TeamMemberManagementSection (Step 4)', () => {
    it('メンバー検索入力、メンバー追加ボタン、ダミーメンバー一覧、削除ボタンが表示される', () => {
      render(<TeamMemberManagementSection teamId="team-123" />);

      // 検索入力と追加ボタン
      expect(
        screen.getByPlaceholderText('メンバーをユーザー名またはメールアドレスで検索...')
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'メンバー追加' })).toBeInTheDocument();

      // 現在のメンバー
      expect(screen.getByText('現在のメンバー')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('jane.smith@example.com')).toBeInTheDocument();

      // 削除ボタン
      const deleteButtons = screen.getAllByRole('button', { name: 'メンバーを削除' });
      expect(deleteButtons.length).toBe(2);
    });
  });

  describe('TeamEditPage Server Component', () => {
    it('チーム編集ページ全体にチーム情報とメンバー管理の両セクションが表示される', async () => {
      const page = await TeamEditPage({
        params: Promise.resolve({ team_id: 'team-123' }),
      });
      render(page);

      expect(screen.getByRole('heading', { level: 1, name: /チーム編集: 開発チームA/ })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2, name: 'チーム情報' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2, name: 'メンバー管理' })).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });
});
