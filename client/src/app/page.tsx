import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900">Afriex Creator Payout</h1>
        <p className="mt-3 text-lg text-gray-600">
          Sell digital products and get paid across Africa
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Link
            href="/store"
            className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            Browse Store
          </Link>
          <Link
            href="/login"
            className="rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Creator Login
          </Link>
        </div>
      </div>
    </div>
  )
}
