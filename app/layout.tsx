import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Habesha Dama - Traditionelles Äthiopisches Brettspiel online',
  description: 'Spiele Habesha Dama kostenlos online. Originale Regeln (S W - W - W), Echtzeit-Multiplayer, Räume für Freunde. Kein Download nötig! Jetzt gegen Freunde spielen.',
  keywords: 'Habesha Dama, Äthiopisches Dame, Dama online, Eritreisches Spiel, traditionelles Spiel, Multiplayer, Brettspiel, kostenlos, S W W W Regel',
  authors: [{ name: 'Habesha Dama Team' }],
  openGraph: {
    title: 'Habesha Dama - Das originale Habesha Dama online',
    description: 'Spiele das traditionelle Habesha Dama mit den echten Regeln. Kostenlos, einfach und direkt im Browser.',
    url: 'https://habesha-dama.com',
    siteName: 'Habesha Dama',
    images: [
      {
        url: 'https://habesha-dama.com/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Habesha Dama Spielbrett',
      },
    ],
    locale: 'de_DE',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Habesha Dama - Traditionelles Äthiopisches Brettspiel',
    description: 'Spiele Habesha Dama online mit Freunden. Originale Regeln, kostenlos, kein Download.',
    images: ['https://habesha-dama.com/twitter-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  alternates: {
    languages: {
      'de': 'https://habesha-dama.com/de',
      'en': 'https://habesha-dama.com/en',
    },
  },
  // 🔥 NEU: Icons für verschiedene Plattformen
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <html lang={locale}>
      <head>
        {/* 🔥 Icons werden jetzt über metadata verwaltet */}
      </head>
      <body className={inter.className}>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}