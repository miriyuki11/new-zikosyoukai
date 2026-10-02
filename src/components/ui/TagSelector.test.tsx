import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import TagSelector from './TagSelector';
import { Tag } from '@/types/profile';

describe('TagSelector Component', () => {
  const mockOptions: Tag[] = [
    { id: 'react', label: 'React', color: 'blue' },
    { id: 'python', label: 'Python', color: 'green' },
    { id: 'aws', label: 'AWS', color: 'red' },
    { id: 'hybrid', label: 'ハイブリッド', color: 'gray' },
  ];

  it('ラベルとすべての選択肢タグがレンダリングされる', () => {
    const handleChange = vi.fn();
    render(
      <TagSelector
        label="技術スタック"
        options={mockOptions}
        selectedTagIds={['react']}
        onChange={handleChange}
      />
    );

    expect(screen.getByText(/技術スタック/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /React/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Python/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /AWS/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /ハイブリッド/i })).toBeDefined();
  });

  it('未選択タグをクリックすると選択状態になり、onChangeが呼ばれる', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(
      <TagSelector
        label="技術スタック"
        options={mockOptions}
        selectedTagIds={['react']}
        onChange={handleChange}
      />
    );

    const pythonButton = screen.getByRole('button', { name: /Python/i });
    await user.click(pythonButton);

    expect(handleChange).toHaveBeenCalledWith(['react', 'python']);
  });

  it('選択済みタグをクリックすると選択解除され、onChangeが呼ばれる', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(
      <TagSelector
        label="技術スタック"
        options={mockOptions}
        selectedTagIds={['react', 'python']}
        onChange={handleChange}
      />
    );

    const reactButton = screen.getByRole('button', { name: /React/i });
    await user.click(reactButton);

    expect(handleChange).toHaveBeenCalledWith(['python']);
  });

  it('maxSelectionに達した場合、新しい選択はブロックされ警告文が表示される', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(
      <TagSelector
        label="技術スタック"
        options={mockOptions}
        selectedTagIds={['react', 'python']}
        onChange={handleChange}
        maxSelection={2}
      />
    );

    expect(screen.getByText('これ以上タグは選択できません。')).toBeDefined();

    const awsButton = screen.getByRole('button', { name: /AWS/i });
    await user.click(awsButton);

    // 2個の上限に達しているため onChange は呼ばれない
    expect(handleChange).not.toHaveBeenCalled();
  });

  it('その他を選んでカスタムタグを追加し、既存のカスタムタグを再表示する', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    const options: Tag[] = [...mockOptions, { id: 'other', label: 'その他', color: 'red' }];

    const { rerender } = render(
      <TagSelector
        label="コミュニケーションスタイル"
        options={options}
        selectedTagIds={['other']}
        onChange={handleChange}
        allowCustomTags
        customTagTriggerId="other"
        customTagColor="red"
      />
    );

    await user.type(
      screen.getByRole('textbox', { name: 'コミュニケーションスタイルのカスタムタグ' }),
      'レビューは先に共有'
    );
    await user.click(
      screen.getByRole('button', { name: 'コミュニケーションスタイルにタグを追加' })
    );
    expect(handleChange).toHaveBeenCalledWith(['other', 'レビューは先に共有']);

    rerender(
      <TagSelector
        label="コミュニケーションスタイル"
        options={options}
        selectedTagIds={['other', 'レビューは先に共有']}
        onChange={handleChange}
        allowCustomTags
        customTagTriggerId="other"
        customTagColor="red"
      />
    );

    expect(screen.getByRole('button', { name: /✓ レビューは先に共有/i })).toBeDefined();
  });
});
