import type { Metadata } from 'next';
import '../globals.css';
import { DirectionalToaster } from '@/components/layout/DirectionalToaster';
import { KdsHtmlLang } from '@/components/kds/KdsHtmlLang';

export const metadata: Metadata = {
  title: 'Hadi POS Store App',
  description: 'Mobile access for Hadi POS',
};

export default function ServerStandaloneLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <body className="h-full bg-slate-50">
        <KdsHtmlLang />
        <DirectionalToaster />
        {children}
      </body>
    </html>
  );
}
