import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'Tiga Kerajaan vs Monster - TikTok Live Auto Battler',
  description: 'Game interaktif auto-battler perebutan wilayah untuk live streaming TikTok. Pertarungan 3 Kerajaan vs Monster berbasis chat, like, gift, dan kontrol Game Master.',
  openGraph: {
    title: 'Tiga Kerajaan vs Monster - TikTok Live Auto Battler',
    description: 'Game interaktif auto-battler perebutan wilayah untuk live streaming TikTok. Pertarungan 3 Kerajaan vs Monster berbasis chat, like, gift, dan kontrol Game Master.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tiga Kerajaan vs Monster - TikTok Live Auto Battler',
    description: 'Game interaktif auto-battler perebutan wilayah untuk live streaming TikTok. Pertarungan 3 Kerajaan vs Monster berbasis chat, like, gift, dan kontrol Game Master.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
