import React from "react"
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import { OrganizationProvider } from '@/lib/context/organization'
import { AppShell } from '@/components/app-shell'
import { Toaster } from '@/components/ui/toaster'
import './globals.css'

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Ronak Jewellers | ERP Management System',
  description: 'Complete ERP solution for Ronak Jewellers - Inventory, Sales, Purchase & Accounting for Jewelry Business',
  generator: 'v0.app',
  keywords: ['jewelry', 'ERP', 'inventory', 'sales', 'Ronak Jewellers', 'gold', 'silver', 'diamond'],
  authors: [{ name: 'Ronak Jewellers' }],
  creator: 'Ronak Jewellers',
  publisher: 'Ronak Jewellers',
  applicationName: 'Ronak Jewellers ERP',
  
  // Open Graph tags for social media
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://ronakjewellers.com',
    siteName: 'Ronak Jewellers ERP',
    title: 'Ronak Jewellers | Premium Jewelry & ERP Management',
    description: 'Complete ERP solution for Ronak Jewellers - Managing premium jewelry inventory, sales, and customer relationships',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Ronak Jewellers - Premium Jewelry Store',
      },
    ],
  },
  
  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    site: '@ronakjewellers',
    creator: '@ronakjewellers',
    title: 'Ronak Jewellers | Premium Jewelry Store',
    description: 'Complete ERP solution for premium jewelry business management',
    images: ['/twitter-image.jpg'],
  },
  
  // Custom icons and favicon
  icons: {
    icon: [
      {
        url: '/favicon-16x16.png',
        sizes: '16x16',
        type: 'image/png',
      },
      {
        url: '/favicon-32x32.png',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        url: '/favicon-96x96.png',
        sizes: '96x96',
        type: 'image/png',
      },
    ],
    apple: [
      {
        url: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
    shortcut: '/favicon.ico',
  },
  
  // Manifest for PWA
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#d4af37' }, // Gold color for light mode
    { media: '(prefers-color-scheme: dark)', color: '#1a1a1a' },  // Dark theme
  ],
  colorScheme: 'light dark',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <OrganizationProvider>
            <AppShell>
              {children}
            </AppShell>
          </OrganizationProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
