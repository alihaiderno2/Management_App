'use client';

import { useAuthStore } from '@/store/auth-store';

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-[#1B1D1F] mb-1">
        Welcome back{user?.name ? `, ${user.name}` : ''}
      </h1>
      <p className="text-sm text-[#6B6F76]">
        This is the Dashboard page.
      </p>
    </div>
  );
}
