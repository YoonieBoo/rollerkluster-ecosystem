'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { AppProvider } from '@/lib/app-context';
import { AuthGate } from '@/components/auth-gate';
import { PushSubscriptionManager } from '@/components/push-subscription-manager';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <PushSubscriptionManager />
        <AuthGate>{children}</AuthGate>
      </AppProvider>
    </QueryClientProvider>
  );
}
