import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProfileSettingsForm from './ProfileSettingsForm';
import { MOCK_PROFILE_DATA } from '@/src/components/profile/ProfileSettingsForm';

const supabaseMocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  from: vi.fn(),
  cardSelect: vi.fn(),
  cardEq: vi.fn(),
  cardOrder: vi.fn(),
  cardLimit: vi.fn(),
  cardInsert: vi.fn(),
  cardLookup: vi.fn(),
  update: vi.fn(),
  eq: vi.fn(),
}));

vi.mock('@/utils/supabase/client', () => ({
  createClient: () => ({
    auth: { getUser: supabaseMocks.getUser },
    from: supabaseMocks.from,
  }),
}));

describe('ProfileSettingsForm (Step 3 - タグ選択UIと統合)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    supabaseMocks.getUser.mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
      error: null,
    });
    supabaseMocks.cardSelect.mockReturnValue({ eq: supabaseMocks.cardEq });
    supabaseMocks.cardEq.mockReturnValue({ order: supabaseMocks.cardOrder });
    supabaseMocks.cardOrder.mockReturnValue({ limit: supabaseMocks.cardLimit });
    supabaseMocks.cardLimit.mockResolvedValue({ data: [{ id: 'card-id' }], error: null });
    supabaseMocks.cardInsert.mockResolvedValue({ error: null });
    supabaseMocks.update.mockReturnValue({ eq: supabaseMocks.eq });
    supabaseMocks.eq.mockResolvedValue({ error: null });
    supabaseMocks.from.mockReturnValue({
      select: supabaseMocks.cardSelect,
      update: supabaseMocks.update,
      insert: supabaseMocks.cardInsert,
    });
    vi.spyOn(window, 'alert').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('プロフィール項目と必要なタグセクションが表示される', () => {
    render(<ProfileSettingsForm />);

    expect(screen.getByLabelText(/自己紹介文/i)).toBeDefined();
    expect(screen.getByLabelText('名前')).toBeDefined();
    expect(screen.getByLabelText(/Slackでプロフィールを公開する/i)).toBeDefined();
    expect(screen.getByText('コミュニケーションスタイル')).toBeDefined();
    expect(screen.getByText(/働き方・仕事のスタイル/i)).toBeDefined();
    expect(screen.getByText(/趣味タグ/i)).toBeDefined();
    expect(screen.queryByLabelText(/リアルタイムステータス/i)).toBeNull();
    expect(screen.queryByText(/相談スタイル/i)).toBeNull();
    expect(screen.queryByText(/技術タグ/i)).toBeNull();
    expect(screen.queryByText(/プリセットから選択/i)).toBeNull();
  });

  it('MOCK_PROFILE_DATAの初期値（テキストおよびタグ）がプリフィルされる', () => {
    render(<ProfileSettingsForm />);

    const bioTextarea = screen.getByLabelText(/自己紹介文/i) as HTMLTextAreaElement;

    expect(bioTextarea.value).toBe(MOCK_PROFILE_DATA.bio);

    // MOCK_PROFILE_DATAで選択されているタグにチェックマークが表示される
    expect(screen.getByRole('button', { name: /✓ 積極的に話す/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /✓ ゲーム/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /✓ ゲーム/i }).className).toContain('bg-green-500');
    expect(screen.getByRole('button', { name: /\+ リモート中心/i }).className).toContain('bg-blue-50');
    expect(screen.getAllByRole('button', { name: /\+ その他/i })).toHaveLength(3);
    const categoryLabels = screen
      .getAllByText(/働き方・仕事のスタイル|趣味タグ/)
      .map((element) => element.textContent ?? '');
    expect(categoryLabels[0].startsWith('働き方・仕事のスタイル')).toBe(true);
    expect(categoryLabels[1].startsWith('趣味タグ')).toBe(true);
    expect(
      screen.queryByRole('textbox', { name: '趣味タグのカスタムタグ' })
    ).toBeNull();
    expect(
      screen.queryByRole('textbox', { name: '働き方・仕事のスタイルのカスタムタグ' })
    ).toBeNull();
  });

  it('趣味でその他を選ぶと緑色の独自タグを追加できる', async () => {
    const user = userEvent.setup();
    render(<ProfileSettingsForm />);

    await user.click(screen.getAllByRole('button', { name: /\+ その他/i })[2]);
    const customTagInput = screen.getByRole('textbox', { name: '趣味タグのカスタムタグ' });
    await user.type(customTagInput, '写真');
    await user.click(screen.getByRole('button', { name: '趣味タグにタグを追加' }));

    expect(screen.getByRole('button', { name: /✓ 写真/i }).className).toContain('bg-green-500');
  });

  it('働き方でその他を選ぶと独自タグの追加欄が表示される', async () => {
    const user = userEvent.setup();
    render(<ProfileSettingsForm />);

    await user.click(screen.getAllByRole('button', { name: /\+ その他/i })[1]);
    const customTagInput = screen.getByRole('textbox', {
      name: '働き方・仕事のスタイルのカスタムタグ',
    });
    await user.type(customTagInput, 'フレックスタイム');
    await user.click(
      screen.getByRole('button', { name: '働き方・仕事のスタイルにタグを追加' })
    );

    expect(screen.getByRole('button', { name: /✓ フレックスタイム/i })).toBeDefined();
  });

  it('その他を選ぶとコミュニケーション用の独自タグを追加できる', async () => {
    const user = userEvent.setup();
    render(<ProfileSettingsForm />);

    await user.click(screen.getAllByRole('button', { name: /\+ その他/i })[0]);
    const customTagInput = screen.getByRole('textbox', {
      name: 'コミュニケーションスタイルのカスタムタグ',
    });
    await user.type(customTagInput, 'チャットで相談');
    await user.click(
      screen.getByRole('button', {
        name: 'コミュニケーションスタイルにタグを追加',
      })
    );

    expect(screen.getByRole('button', { name: /✓ チャットで相談/i })).toBeDefined();
  });

  it('保存済みのカンマ区切りタグと表示名を選択状態に戻し、空欄を維持する', () => {
    render(
      <ProfileSettingsForm
        initialProfile={{
          id: 'profile-id',
          full_name: '佐藤 花子',
          slug: 'sato-hanako',
          is_public: true,
          introduction: '',
          realtime_status: '',
          communication_style: 'proactive, hybrid',
          consultation_style: 'direct',
          hobby_tags: ['ゲーム'],
        }}
      />
    );

    expect((screen.getByLabelText(/自己紹介文/i) as HTMLTextAreaElement).value).toBe('');
    const fullNameInput = screen.getByLabelText('名前') as HTMLInputElement;
    expect(fullNameInput.value).toBe('佐藤 花子');
    expect(fullNameInput.closest('.relative.group')).not.toBeNull();
    expect((screen.getByLabelText('公開URL') as HTMLInputElement).value).toBe('sato-hanako');
    expect((screen.getByLabelText(/Slackでプロフィールを公開する/i) as HTMLInputElement).checked).toBe(true);
    expect(screen.getByRole('button', { name: /✓ 積極的に話す/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /✓ 状況に応じて/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /✓ ゲーム/i })).toBeDefined();
  });

  it('保存済みの空タグ配列をモックの選択値で埋めない', () => {
    render(
      <ProfileSettingsForm
        initialProfile={{
          id: 'profile-id',
          communication_style: '',
          hobby_tags: [],
        }}
      />
    );

    expect(screen.getByRole('button', { name: /\+ 積極的に話す/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /\+ ゲーム/i })).toBeDefined();
  });

  it('初期状態では保存ボタンが無効化(disabled)されており、変更を加えると有効化される', async () => {
    const user = userEvent.setup();
    render(<ProfileSettingsForm />);

    const submitButton = screen.getByRole('button', { name: /プロフィールを保存/i }) as HTMLButtonElement;
    // 初期状態は変更がないため disabled
    expect(submitButton.disabled).toBe(true);

    // 未選択のタグをクリックして変更を加える
    const remoteWorkButton = screen.getByRole('button', { name: /\+ リモート中心/i });
    await user.click(remoteWorkButton);

    // フォームがダーティ(isDirty)になり、ボタンが活性化される
    await waitFor(() => {
      expect(submitButton.disabled).toBe(false);
    });
  });

  it('フォームを変更して送信した場合、"フォームデータ:" と共にデータが出力されアラートが表示される', async () => {
    const user = userEvent.setup();
    render(<ProfileSettingsForm />);

    const fullNameInput = screen.getByLabelText('名前');
    await user.type(fullNameInput, '佐藤 花子');
    await user.click(screen.getByLabelText(/Slackでプロフィールを公開する/i));
    await user.type(screen.getByLabelText('公開URL'), 'sato-hanako');
    await user.click(screen.getByRole('button', { name: /\+ リモート中心/i }));

    const submitButton = screen.getByRole('button', { name: /プロフィールを保存/i }) as HTMLButtonElement;
    await waitFor(() => {
      expect(submitButton.disabled).toBe(false);
    });

    await user.click(submitButton);

    await waitFor(() => {
      expect(console.log).toHaveBeenCalledWith(
        'フォームデータ:',
        expect.objectContaining({
          fullName: '佐藤 花子',
        })
      );
      expect(screen.getByText('プロフィールが正常に更新されました！')).toBeDefined();
      expect(window.alert).toHaveBeenCalledWith(
        'プロフィール設定を保存しました！'
      );
      expect(supabaseMocks.from).toHaveBeenCalledWith('profile_cards');
      expect(supabaseMocks.update).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'test-user-id',
          full_name: '佐藤 花子',
          work_style_tags: ['remote'],
          hobby_tags: MOCK_PROFILE_DATA.hobbyTags,
          slug: 'sato-hanako',
          is_public: true,
          public_fields: ['full_name', 'avatar_url', 'self_introduction', 'communication_style'],
        })
      );
      expect(supabaseMocks.update).toHaveBeenCalledWith(
        expect.objectContaining({
          self_introduction: MOCK_PROFILE_DATA.bio,
          full_name: '佐藤 花子',
        })
      );
      expect(supabaseMocks.from).not.toHaveBeenCalledWith('profiles');
    });
  });

  it('profile_cardsの列が未適用ならmigration案内を表示する', async () => {
    const user = userEvent.setup();
    supabaseMocks.eq.mockResolvedValueOnce({
      data: null,
      error: {
        message: "Could not find the 'avatar_url' column of 'profile_cards' in the schema cache",
      },
    });
    render(<ProfileSettingsForm />);

    await user.type(screen.getByLabelText('名前'), '佐藤 花子');
    await user.click(screen.getByRole('button', { name: /プロフィールを保存/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/Supabaseのプロフィール用DB migrationが未適用です/)
      ).toBeDefined();
    });
  });

  it('公開カードがない場合は新規作成し、Slack共有URLを表示する', async () => {
    const user = userEvent.setup();
    supabaseMocks.cardLimit.mockResolvedValue({ data: [], error: null });
    render(<ProfileSettingsForm />);

    await user.click(screen.getByLabelText(/Slackでプロフィールを公開する/i));
    await user.type(screen.getByLabelText('公開URL'), 'new-profile');
    await user.click(screen.getByRole('button', { name: /プロフィールを保存/i }));

    await waitFor(() => {
      expect(supabaseMocks.cardInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'test-user-id',
          slug: 'new-profile',
          is_public: true,
          public_fields: ['full_name', 'avatar_url', 'self_introduction', 'communication_style'],
        })
      );
      expect(screen.getByRole('status').textContent).toContain(
        `${window.location.origin}/profile/new-profile`
      );
    });
  });
});
