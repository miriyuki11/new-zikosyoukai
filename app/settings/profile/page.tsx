import ProfileSettingsForm from '@/src/components/profile/ProfileSettingsForm';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'プロフィール設定',
  description: 'あなたのプロフィール情報を設定・更新します。',
};

export default function SettingsProfilePage() {
  return (
    <div className="min-h-screen bg-slate-50/50 py-10 px-4 sm:px-6 lg:px-8">
      <ProfileSettingsForm />
    </div>
  );
}
