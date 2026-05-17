import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-4">
      <div className="text-center">
        <p className="text-6xl mb-6">🔗</p>
        <h1 className="text-2xl font-bold mb-2">Room Not Found</h1>
        <p className="text-gray-400 mb-8 max-w-xs mx-auto">
          This room may have expired or the link is invalid. Rooms last 24 hours.
        </p>
        <Link
          href="/"
          className="bg-white text-gray-950 font-semibold px-6 py-3 rounded-xl hover:bg-gray-100 transition"
        >
          Create a New Room
        </Link>
      </div>
    </main>
  )
}