import React from 'react';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TeamsPage from './page';

describe('TeamsPage Component (Step 1)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('タイトル、説明文、Headless UIの作成ボタンが表示される', () => {
    render(<TeamsPage />);

    expect(screen.getByRole('heading', { level: 1, name: 'チーム管理' })).toBeInTheDocument();
    expect(
      screen.getByText('ここではチームの作成、編集、メンバー管理を行います。')
    ).toBeInTheDocument();

    const createButton = screen.getByRole('button', { name: '新しいチームを作成' });
    expect(createButton).toBeInTheDocument();
  });

  it('「新しいチームを作成」ボタンをクリックするとコンソールにログが出力される', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    render(<TeamsPage />);

    const createButton = screen.getByRole('button', { name: '新しいチームを作成' });
    fireEvent.click(createButton);

    expect(consoleSpy).toHaveBeenCalledWith('チーム作成ボタンがクリックされました');
    consoleSpy.mockRestore();
  });
});
