import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/components/auth-provider';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: "Karvonboshi — O'zbekiston uchun aqlli marshrut optimallashtirish",
  description: "AI asosidagi logistika platformasi: xavfsizlik, yo'l sifati, xarajat, haydovchi qulayligi va boshqa 7 faktor asosida O'zbekiston bo'ylab marshrutlarni optimallashtiradi.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uz">
      <body className={inter.className}>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
