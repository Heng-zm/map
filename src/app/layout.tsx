import type { Metadata, Viewport } from 'next';
import { Inter, Noto_Sans_Khmer } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";

// Configure Inter (Latin)
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

// Configure Noto Sans Khmer (for Cambodia map labels)
const notoSansKhmer = Noto_Sans_Khmer({
  subsets: ['khmer'],
  variable: '--font-khmer',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Map Explorer',
  description: 'Interactive map application created with Next.js and Mapbox.',
  // manifest: '/manifest.json', // <-- Commented out to fix Cloud CORS error
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Map Explorer',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#09090b',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link href="https://api.mapbox.com/mapbox-gl-js/v3.5.1/mapbox-gl.css" rel="stylesheet" />
        <link
          rel="stylesheet"
          href="https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-directions/v4.3.0/mapbox-gl-directions.css"
          type="text/css"
        />
      </head>
      <body 
        className={`${inter.variable} ${notoSansKhmer.variable} font-sans antialiased bg-zinc-950 text-zinc-50`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}