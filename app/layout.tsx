import type { Metadata } from "next";
import AppSidebarLayout from "@/components/AppSidebarLayout";
import "./globals.css";

export const metadata: Metadata = {
  title: "My Profile",
  description: "プロフィール管理画面",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>
        <AppSidebarLayout>{children}</AppSidebarLayout>
      </body>
    </html>
  );
}
