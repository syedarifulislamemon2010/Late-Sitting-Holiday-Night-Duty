'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to home page. If not authenticated, AuthGuard will intercept
    // and show the login form itself.
    router.replace('/');
  }, [router]);

  return null;
}
