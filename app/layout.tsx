import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Knowsy — Personalized Bachelorette Trivia',
  description:
    'Custom trivia about the bride — written by her crew. Knowsy turns your bridesmaids’ inside jokes and stories into a played-live game for the bachelorette.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
