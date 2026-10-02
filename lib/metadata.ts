// lib/metadata.ts
import type { Metadata } from 'next';
import { DEFAULT_OGP } from '@/app/config/ogp';

export type OgpType =
  | 'website'
  | 'article'
  | 'book'
  | 'profile'
  | 'music.song'
  | 'music.album'
  | 'music.playlist'
  | 'music.radio_station'
  | 'video.movie'
  | 'video.episode'
  | 'video.tv_show'
  | 'video.other';

/**
 * OGPメタデータを生成するためのオプションインターフェース。
 */
export interface GenerateOgpMetadataOptions {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: OgpType;
}

/**
 * 共通のOGPメタデータオブジェクトを生成するヘルパー関数。
 * 提供された情報に基づいてメタデータを構築し、不足している場合はデフォルト値を使用します。
 * @param options OGPメタデータに含める情報
 * @returns Next.jsのMetadata型に準拠したオブジェクト
 */
export function generateOgpMetadata(options?: GenerateOgpMetadataOptions): Metadata {
  const {
    title = DEFAULT_OGP.title,
    description = DEFAULT_OGP.description,
    image = DEFAULT_OGP.image,
    url = DEFAULT_OGP.url,
    type = DEFAULT_OGP.type as OgpType,
  } = options || {};

  // OGP画像とURLは絶対パスである必要があります。
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://your-app.com';
  const absoluteImageUrl = image.startsWith('http')
    ? image
    : `${baseUrl}${image.startsWith('/') ? '' : '/'}${image}`;
  const absoluteUrl = url.startsWith('http')
    ? url
    : `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: absoluteUrl,
      siteName: DEFAULT_OGP.siteName,
      images: [
        {
          url: absoluteImageUrl,
          width: 1200, // 推奨サイズ
          height: 630, // 推奨サイズ
          alt: title,
        },
      ],
      locale: DEFAULT_OGP.locale,
      type,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [absoluteImageUrl],
    },
    alternates: {
      canonical: absoluteUrl,
    },
  };
}
