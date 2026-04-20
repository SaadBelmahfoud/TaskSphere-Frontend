import type { Metadata } from 'next';
import { AuthProvider } from '@/context/AuthContext';
import QueryProvider from '@/providers/QueryProvider';
import { Toaster } from '@/components/ui/sonner';
import './globals.css';

export const metadata: Metadata = {
  title: 'TaskSphere',
  description: 'TaskSphere Frontend — Sprint 2 • shadcn/ui • TanStack Query • Sonner Toast',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>
        <QueryProvider>
          <AuthProvider>
            {children}
            <Toaster richColors closeButton position="bottom-right" />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
