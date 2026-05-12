import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Knowsy — AI Trivia About The People Who Know You Best',
  description:
    'Knowsy turns your friends’ answers into a personalized trivia game for the bachelorette, birthday, or any night that deserves one. AI-built, played live.',
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
