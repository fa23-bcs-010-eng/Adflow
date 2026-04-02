import type { Metadata } from 'next';
import './globals.css';
import Providers from '@/components/Providers';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Adflow_pro – Sponsored Listing Marketplace',
  description: 'Discover and post sponsored ads across categories, cities, and more.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="app-shell min-h-screen text-gray-100 antialiased" suppressHydrationWarning>
        <Providers>
          <Navbar />
          <main className="min-h-screen pt-2">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
