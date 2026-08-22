import type { Metadata } from 'next'
import { Bricolage_Grotesque, Schibsted_Grotesk } from 'next/font/google'
import { QueryProvider } from '@/components/providers/query-provider'
import './globals.css'

const body = Schibsted_Grotesk({
  variable: '--font-body',
  subsets: ['latin'],
  display: 'swap',
})

const display = Bricolage_Grotesque({
  variable: '--font-display',
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Afriex Creators — Find what you need. Sell what you know.',
    template: '%s · Afriex Creators',
  },
  description:
    'A marketplace for digital products',
  openGraph: {
    title: 'Afriex Creators',
    description:
      'Find what you need. Sell what you know.',
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
      className={`${body.variable} ${display.variable} h-full antialiased`}
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
