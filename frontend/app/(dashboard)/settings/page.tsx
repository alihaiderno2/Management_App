'use client';

import { useAuthStore } from '@/store/auth-store';
import { Avatar } from '@/app/componenets/ui/Avatar';
import Link from 'next/link';

export default function SettingsPage() {
  const user = useAuthStore((state) => state.user);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-[#1B1D1F] mb-6">Settings</h1>

      <div className="rounded-2xl p-6 mb-4" style={{ backgroundColor: '#FFFFFF' }}>
        <div className="flex items-center gap-4">
          <Avatar name={user?.name ?? '' } size = 'lg' userId={user?.id}  />
          <div>
            <p className="text-lg font-bold text-[#1B1D1F]">{user?.name}</p>
            <p className="text-sm text-[#9A9CA3]">{user?.email}</p>
          </div>
        </div>
      </div>

      <Link href="/settings/two-factor" className="block rounded-2xl p-6 hover:bg-[#F5F5F4] transition-colors" style={{ backgroundColor: '#FFFFFF' }}>
        <p className="text-sm font-medium text-[#1B1D1F]">Two-factor authentication</p>
        <p className="text-xs text-[#9A9CA3] mt-1">Add an extra layer of security to your account.</p>
      </Link>
    </div>
  );
}