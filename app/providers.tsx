'use client';

import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/lib/hooks/use-auth';
import { QueueProvider } from '@/lib/context/queue-context';
import { LocationProvider } from '@/lib/context/location-context';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <AuthProvider>
        <LocationProvider>
          <QueueProvider>
            {children}
          </QueueProvider>
        </LocationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
