'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams} from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { apiClient } from '@/lib/api-client'; // Assuming you fetch the user details here

function OAuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setSession = useAuthStore((state) => state.setSession);

  const accessToken = searchParams.get('accessToken');

  useEffect(() => {
    if (!accessToken) return;

    const completeLogin = async () => {
      try {
        // 1. Fetch user data using the new token
        const meResponse = await apiClient.get('/user/me', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        // 2. Set the Zustand session
        setSession(meResponse.data, accessToken);

        // 3. Safely read from sessionStorage (it is perfectly safe inside useEffect!)
        const savedRedirect = sessionStorage.getItem('oauth_redirect');
        sessionStorage.removeItem('oauth_redirect');

        // 4. Redirect them to where they belong!
        if (savedRedirect) {
          router.push(savedRedirect);
        } else {
          router.push('/dashboard');
        }
      } catch (err) {
        console.error('Failed to fetch user data', err);
        router.push('/login');
      }
    };

    completeLogin();
  }, [accessToken, router, setSession]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#14161A]">
      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-white"></div>
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#14161A]"></div>}>
      <OAuthCallbackContent />
    </Suspense>
  );
}