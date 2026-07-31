import type { Metadata } from 'next'
import { Plus_Jakarta_Sans, Fraunces, Geist_Mono } from 'next/font/google'
import { QueryProvider } from '@/components/providers/query-provider'
import './globals.css'

const body = Plus_Jakarta_Sans({
  variable: '--font-body',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

const display = Fraunces({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['500', '600', '700'],
})

const mono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: {
    default: 'Afriex Creators: Sell digital products. Get paid anywhere.',
    template: '%s · Afriex Creators',
  },
  description:
    'The marketplace where creators everywhere sell ebooks, courses, templates, and more. Buyers pay with Paystack, Flutterwave, or Afriex Checkout. Creators withdraw straight to their bank via Afriex.',
  openGraph: {
    title: 'Afriex Creators',
    description: 'Sell digital products and get paid anywhere.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${body.variable} ${display.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-bg font-sans text-fg">
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  )
}
