import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SellerCFO | Financial Dashboard for E-commerce/DTC',
  description:
    'Real-time financial dashboard for e-commerce and DTC businesses. Industry-specific KPIs, automated reporting, and integrations with QuickBooks, Stripe, and more.',
  keywords: 'e-commerce/dtc financial dashboard, SellerCFO, sellercfo, CFO dashboard, e-commerce/dtc accounting, financial reporting, KPI tracking',
  openGraph: {
    title: 'SellerCFO | Financial Dashboard for E-commerce/DTC',
    description: 'Real-time financial visibility for e-commerce/dtc businesses. 14-day free trial.',
    url: 'https://sellercfo.vercel.app',
    siteName: 'SellerCFO',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SellerCFO | Financial Dashboard for E-commerce/DTC',
    description: 'Real-time financial visibility for e-commerce/dtc businesses.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <style>{`:root { --accent-color: #8b5cf6; }`}</style>
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
