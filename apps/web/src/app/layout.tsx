import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'SchoolRide LK — Trustworthy School Transportation for Sri Lankan Families',
  description:
    'Connect with verified school van drivers across Colombo, Kandy, Galle, Gampaha and all Sri Lankan districts. Real-time GPS ride tracking, verified documents, and child safety.',
  keywords: [
    'school van sri lanka',
    'school ride lk',
    'colombo school transport',
    'verified school van driver',
    'child ride tracking sri lanka',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col font-sans bg-background text-foreground antialiased">
        <AuthProvider>
          <Navbar />
          <main className="flex-1 flex flex-col">{children}</main>
          <Footer />
          <Toaster richColors position="bottom-right" />
        </AuthProvider>
      </body>
    </html>
  );
}
