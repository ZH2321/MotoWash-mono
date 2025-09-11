'use client';

import { useEffect, useState } from 'react';
import { authAPI } from '@/lib/api';

declare global {
  interface Window {
    liff: any;
  }
}

interface LiffUser {
  userId: string;
  displayName: string;
  pictureUrl?: string;
}

export function useLiff() {
  const [isReady, setIsReady] = useState(false);
  const [user, setUser] = useState<LiffUser | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initLiff = async () => {
      try {
        // Load LIFF SDK if not already loaded
        if (!window.liff) {
          const script = document.createElement('script');
          script.src = 'https://static.line-scdn.net/liff/edge/2/sdk.js';
          script.onload = () => initLiff();
          document.head.appendChild(script);
          return;
        }

        const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
        if (!liffId) {
          throw new Error('LIFF ID not configured');
        }

        await window.liff.init({ liffId });

        if (!window.liff.isLoggedIn()) {
          window.liff.login();
          return;
        }

        // Get user profile
        const profile = await window.liff.getProfile();
        setUser({
          userId: profile.userId,
          displayName: profile.displayName,
          pictureUrl: profile.pictureUrl,
        });

        // Get ID Token and verify with backend
        const idToken = window.liff.getIDToken();
        if (idToken) {
          const response = await authAPI.verifyLiff(idToken);
          const { token } = response.data;
          
          // Store app JWT
          sessionStorage.setItem('liff_jwt', token);
        }

        setIsReady(true);
      } catch (err: any) {
        setError(err.message || 'Failed to initialize LIFF');
      }
    };

    // Only run in browser and on LIFF routes
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/liff')) {
      initLiff();
    }
  }, []);

  return { isReady, user, error };
}