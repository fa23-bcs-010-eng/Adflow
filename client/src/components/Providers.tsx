'use client';

import { AuthProvider } from '@/lib/auth';
import { Toaster } from 'react-hot-toast';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--surface-bg-2)',
            color: 'var(--page-text-strong)',
            border: '1px solid var(--surface-border)',
          },
        }}
      />
      {children}
    </AuthProvider>
  );
}
