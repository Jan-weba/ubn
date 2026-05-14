// frontend/src/app/layout.tsx - Root Layout

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { Toaster } from 'react-hot-toast';
import I18nProvider from '@/components/providers/I18nProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'E-Vuze Pharmacy - Healthcare at Your Fingertips',
  description: 'Order medications online from verified pharmacies in Rwanda',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
    <body className={inter.className}>
      <I18nProvider>
        <AuthProvider>
          <CartProvider>
            {children}
              <Toaster position="top-right" />
          </CartProvider>
        </AuthProvider>
      </I18nProvider>
    </body>
  </html>
);
}