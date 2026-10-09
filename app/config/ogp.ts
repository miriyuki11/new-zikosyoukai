// app/config/ogp.ts
// アプリケーションのベースURLは環境変数から取得します。
// .env.localファイルに NEXT_PUBLIC_BASE_URL=http://localhost:3000 のように設定してください。
// 本番環境ではデプロイプラットフォームで設定します。
export const DEFAULT_OGP = {
  title: 'My Awesome App',
  description: 'Welcome to My Profile – a place for your profile and private notes.',
  image: '/images/default-ogp.png', // publicディレクトリに配置するデフォルト画像へのパス
  url: process.env.NEXT_PUBLIC_BASE_URL || 'https://your-app.com', // アプリケーションのデフォルトURL
  siteName: 'My Profile',
  type: 'website' as const,
  locale: 'ja_JP', // 言語設定
};
