import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Providers from '@/components/Providers';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AiModeWidget from '@/components/AiModeWidget';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Adflow_pro – Sponsored Listing Marketplace',
  description: 'Discover and post sponsored ads across categories, cities, and more.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="app-shell min-h-screen text-gray-100 font-sans antialiased" suppressHydrationWarning>
        <Providers>
          <Navbar />
          <main className="min-h-screen pt-2">{children}</main>
          <Footer />
          <AiModeWidget />
        </Providers>
      </body>
    </html>
  );
}
