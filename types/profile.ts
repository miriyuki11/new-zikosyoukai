// types/profile.ts

/** タグの色属性 */
export type TagColor = 'red' | 'blue' | 'green' | 'gray';

/** タグの基本情報 */
export interface Tag {
  id: string;
  label: string;
  color: TagColor;
}

/** プロフィール設定フォームのデータ構造 (ステップ3) */
export interface ProfileFormInput {
  avatarUrl?: string; // アイコン・写真URL
  fullName: string; // 表示名
  publicSlug: string;
  isPublic: boolean;
  bio: string; // 自己紹介文
  communicationStances: string[]; // 選択されたコミュニケーションスタンスのID配列
  workStyleTags: string[];         // 選択された働き方タグのID配列
  hobbyTags: string[];            // 選択された趣味タグのID配列
}

// タグの候補データ（一時的にフロントエンドで定義）
export const COMMUNICATION_STANCE_OPTIONS: Tag[] = [
  // ユーザー要求の赤色タグ
  { id: 'speak_proactive', label: '自分から話すのが得意', color: 'red' },
  { id: 'speak_shy', label: '自分から話すのが苦手', color: 'red' },
  { id: 'one_on_one_good', label: '1対1が得意', color: 'red' },
  { id: 'one_on_one_bad', label: '1対1が苦手', color: 'red' },
  { id: 'group_good', label: '複数人が得意', color: 'red' },
  { id: 'group_bad', label: '複数人が苦手', color: 'red' },
  // 既存互換用（赤色で保持）
  { id: 'proactive', label: '積極的に話す', color: 'red' },
  { id: 'listening', label: '聞き役に回る', color: 'red' },
  { id: 'calm', label: '落ち着いて話す', color: 'red' },
  { id: 'hybrid', label: '状況に応じて', color: 'red' },
  { id: 'other', label: 'その他', color: 'red' },
];

export const CONSULTATION_STYLE_OPTIONS: Tag[] = [
  { id: 'direct', label: '結論から話す', color: 'red' },
  { id: 'detail', label: '詳細から話す', color: 'red' },
  { id: 'brainstorm', label: 'ブレスト歓迎', color: 'red' },
  { id: 'any', label: 'どちらでも', color: 'red' },
];

export const WORK_STYLE_OPTIONS: Tag[] = [
  { id: 'remote', label: 'リモート中心', color: 'blue' },
  { id: 'hybrid-work', label: '出社とリモート併用', color: 'blue' },
  { id: 'office', label: '出社中心', color: 'blue' },
  { id: 'async', label: '非同期で進める', color: 'blue' },
  { id: 'focus-time', label: '集中時間を大切にする', color: 'blue' },
  { id: 'pair-work', label: 'ペアで進める', color: 'blue' },
  { id: 'flexible-hours', label: '柔軟な勤務時間', color: 'blue' },
  { id: 'other', label: 'その他', color: 'blue' },
];

export const TECH_TAG_OPTIONS: Tag[] = [
  { id: 'react', label: 'React', color: 'blue' },
  { id: 'nextjs', label: 'Next.js', color: 'blue' },
  { id: 'typescript', label: 'TypeScript', color: 'blue' },
  { id: 'python', label: 'Python', color: 'blue' },
  { id: 'fastapi', label: 'FastAPI', color: 'blue' },
  { id: 'postgresql', label: 'PostgreSQL', color: 'blue' },
  { id: 'aws', label: 'AWS', color: 'blue' },
  { id: 'docker', label: 'Docker', color: 'blue' },
];

export const HOBBY_TAG_OPTIONS: Tag[] = [
  { id: 'gaming', label: 'ゲーム', color: 'green' },
  { id: 'reading', label: '読書', color: 'green' },
  { id: 'travel', label: '旅行', color: 'green' },
  { id: 'cooking', label: '料理', color: 'green' },
  { id: 'music', label: '音楽', color: 'green' },
  { id: 'sports', label: 'スポーツ', color: 'green' },
  { id: 'other', label: 'その他', color: 'green' },
];

// 既存の互換用型定義
export type Profile = {
  id: string;
  user_id?: string;
  name?: string;
  full_name?: string | null;
  fullName?: string;
  slug?: string | null;
  is_public?: boolean;
  public_fields?: string[] | null;
  avatar_url?: string | null;
  avatarUrl?: string;
  bio?: string;
  skills?: string[] | string;
  introduction?: string | null;
  communication_style?: string | null;
  communicationStyle?: string;
  communicationStances?: string[] | null;
  consultation_style?: string | null;
  consultationStyle?: string;
  consultationStyles?: string[] | null;
  work_style_tags?: string[] | null;
  workStyleTags?: string[] | null;
  tech_tags?: string[] | null;
  techTags?: string[] | null;
  hobby_tags?: string[] | null;
  hobbyTags?: string[] | null;
  realtime_status?: string | null;
  realtimeStatus?: string;
  created_at?: string;
  updated_at?: string;
};

export type ProfileFormValues = {
  introduction: string;
  communication_style: string;
  consultation_style: string;
  tech_tags: string[];
  hobby_tags: string[];
  realtime_status: string;
};

export const mockProfile: Profile = {
  id: "user-123",
  user_id: "user-123",
  name: "山田 太郎",
  bio: "こんにちは、山田太郎です。主にバックエンド開発とデータ分析を担当しています。新しい技術に挑戦するのが好きで、特にTypeScriptとPythonを使った開発に興味があります。お気軽にご連絡ください！",
  introduction: "こんにちは、山田太郎です。主にバックエンド開発とデータ分析を担当しています。新しい技術に挑戦するのが好きで、特にTypeScriptとPythonを使った開発に興味があります。お気軽にご連絡ください！",
  skills: ["TypeScript", "Python", "SQL", "Docker", "AWS", "Next.js"],
  tech_tags: ["TypeScript", "Python", "SQL", "Docker", "AWS", "Next.js"],
  hobby_tags: ["読書", "カフェ巡り", "個人開発"],
  communicationStyle: "テキストでの非同期コミュニケーションを基本としていますが、必要に応じてオンラインミーティングも歓迎です。簡潔で明確なやり取りを心がけています。",
  communication_style: "テキストでの非同期コミュニケーションを基本としていますが、必要に応じてオンラインミーティングも歓迎です。簡潔で明確なやり取りを心がけています。",
  consultationStyle: "ご相談の際は、まず現状と解決したい課題を具体的に教えていただけるとスムーズです。その後、技術的な実現可能性や最適なアプローチについて一緒に検討しましょう。",
  consultation_style: "ご相談の際は、まず現状と解決したい課題を具体的に教えていただけるとスムーズです。その後、技術的な実現可能性や最適なアプローチについて一緒に検討しましょう。",
  realtimeStatus: "オンライン (集中モード)",
  realtime_status: "オンライン (集中モード)",
};
