import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeRegistry } from '@/theme/theme';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'GM Silver Admin',
  description: 'GM Silver B2B Platform — Admin Panel',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeRegistry>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#12121A',
                color: '#F0F0F0',
                border: '1px solid rgba(192,192,192,0.12)',
              },
            }}
          />
        </ThemeRegistry>
      </body>
    </html>
  );
}
