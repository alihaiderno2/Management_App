'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth-store';

function OAuthCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);
  
  const accessToken = searchParams.get('accessToken');

  useEffect(() => {
    if (!accessToken) {
      router.push('/login');
      return;
    }

    const hydrateSession = async () => {
      try {
        const meResponse = await apiClient.get('/user/me', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        setSession(meResponse.data, accessToken);
        router.push('/dashboard');
      } catch (error) {
        console.error('OAuth session hydration failed:', error);
        router.push('/login?error=oauth_failed');
      }
    };

    hydrateSession();
  }, [accessToken, router, setSession]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center font-sans" style={{ backgroundColor: '#14161A' }}>
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-white mb-4"></div>
        <p className="text-sm text-[#9A9CA3] tracking-wide">Authenticating securely...</p>
    </main>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#14161A]"></div>}>
      <OAuthCallbackContent />
    </Suspense>
  );
}