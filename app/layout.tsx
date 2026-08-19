import type { Metadata } from 'next';
import { Inter, Oswald } from 'next/font/google';
import { ThemeProvider } from '@/components/ThemeProvider';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const oswald = Oswald({
  subsets: ['latin'],
  variable: '--font-oswald',
  weight: ['500', '700'],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://vexilon-esport.fr';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'VEXILON ESPORT – Structure Esport Française | Yonne',
    template: '%s | VEXILON ESPORT',
  },
  description: "Vexilon Esport est une structure esport française basée dans l'Yonne. Événements gaming, équipes compétitives, inclusion et fair-play. Rejoignez notre communauté !",
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: siteUrl,
    siteName: 'Vexilon Esport',
    title: 'VEXILON ESPORT – Structure Esport Française | Yonne',
    description: "Vexilon Esport est une structure esport française basée dans l'Yonne. Événements gaming, équipes compétitives, inclusion et fair-play.",
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Vexilon Esport – Structure Esport Française',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VEXILON ESPORT – Structure Esport Française | Yonne',
    description: "Vexilon Esport est une structure esport française basée dans l'Yonne. Événements gaming, équipes compétitives, inclusion et fair-play.",
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/favicon.ico',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SportsOrganization',
  name: 'Vexilon Esport',
  url: siteUrl,
  logo: `${siteUrl}/logo.png`,
  description: "Structure esport française basée dans l'Yonne. Événements gaming, équipes compétitives, inclusion et fair-play.",
  sport: 'Esport',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Bussy-en-Othe',
    postalCode: '89400',
    addressCountry: 'FR',
  },
  contactPoint: {
    '@type': 'ContactPoint',
    email: 'contact@vexilon-esport.fr',
    contactType: 'customer support',
  },
  sameAs: [
    'https://www.twitch.tv/vexilonesport',
    'https://www.instagram.com/vexilon.esport',
    'https://www.youtube.com/@VexilonEsport',
    'https://x.com/VexilonEsport',
    'https://www.tiktok.com/@vexilon.esport',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        {/* Anti-flash: apply saved theme before first paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('vexilon_theme');document.documentElement.classList.toggle('dark',t!=='light');})()`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${inter.variable} ${oswald.variable} font-sans antialiased`}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
