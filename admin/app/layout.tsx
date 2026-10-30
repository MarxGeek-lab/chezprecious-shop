import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/src/styles/globals.scss';
import Providers from '@/src/providers/Providers';
import AppShell from '@/src/components/layout/AppShell';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'MarketPlace Admin - Super Admin Dashboard',
  description: 'Dashboard d\'administration de la marketplace',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={inter.variable}>
        <Providers>
          <AppShell>
            {children}
          </AppShell>
        </Providers>
      </body>
    </html>
  );
}
