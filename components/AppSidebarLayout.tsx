'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserPlus } from 'lucide-react';
import { SlackConnectButton } from '@/src/components/integrations/SlackConnectButton';

export default function AppSidebarLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const isAuthRoute = /^\/(login|auth|callback|verify-email|test-auth)(\/|$)/.test(pathname);
  const isPublicProfileRoute =
    /^\/profile\/[^/]+$/.test(pathname) &&
    !['/profile/settings', '/profile/edit'].includes(pathname);

  if (isAuthRoute || isPublicProfileRoute) {
    return children;
  }

  return (
    <div className="app-frame">
      <aside className="sidebar app-frame-sidebar" aria-label="ワークスペース情報">
        <Link href="/" className="workspace-title" title="ホームへ戻る">
          <div>
            <strong>My Profile</strong>
            <div className="workspace-subtitle">ワークスペース</div>
          </div>
        </Link>

        <div className="side-section-title">プロフィール</div>
        <Link href="/profile/settings" className="side-item">
          <UserPlus aria-hidden="true" className="h-4 w-4 shrink-0" />
          マイプロフィールを作成
        </Link>

        <div className="side-section-title">連携</div>
        <div className="app-sidebar-slack">
          <SlackConnectButton className="w-full justify-start px-2.5 text-white/90 hover:bg-white/10 hover:text-white" />
        </div>
      </aside>
      <div className="app-frame-main">{children}</div>
    </div>
  );
}