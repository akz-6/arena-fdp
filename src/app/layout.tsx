import type { Metadata, Viewport } from 'next';
import { Fredoka, Nunito_Sans, Bangers } from 'next/font/google';
import './globals.css';
import { ToastProvider } from '@/components/ui/Toast';
import { ScreenShakeProvider } from '@/components/fx/utils/ScreenShake';
import { Header } from '@/components/layout/Header';
import { ServiceWorkerRegister } from '@/components/layout/ServiceWorkerRegister';

const fredoka = Fredoka({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-fredoka',
  display: 'swap',
});

const nunito = Nunito_Sans({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-nunito',
  display: 'swap',
});

const bangers = Bangers({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-bangers',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Arena FDP — A partida só acaba quando sobra um',
  description:
    'Plataforma para organizar partidas do jogo de cartas FDP com eliminação, vidas e muita diversão cartoon.',
  manifest: '/manifest.json',
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#FFFFFF',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${fredoka.variable} ${nunito.variable} ${bangers.variable}`}
    >
      <body className="min-h-screen bg-toon-pattern text-[#111111] flex flex-col items-center">
        <ScreenShakeProvider>
          <ToastProvider>
            <div className="w-full flex flex-col min-h-screen max-w-lg sm:border-x-2 sm:border-[#111111] bg-white shadow-[0_0_24px_rgba(0,0,0,0.06)]">
              <ServiceWorkerRegister />
              <Header />
              <main className="flex-1 flex flex-col p-4 sm:p-6">{children}</main>
              <footer className="py-4 text-center text-xs text-[#888888] font-bold border-t border-[#E5E5E5] bg-[#FDFDFD]">
                Arena FDP • v1.0.0
              </footer>
            </div>
          </ToastProvider>
        </ScreenShakeProvider>
      </body>
    </html>
  );
}
