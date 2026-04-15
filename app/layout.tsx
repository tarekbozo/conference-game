import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Conference Millionaire',
  description: 'Who Wants to Be a Millionaire – Conference Edition',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#020218] text-white antialiased">
        {children}
      </body>
    </html>
  );
}
