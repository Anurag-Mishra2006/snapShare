'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Logo from '@/app/components/Logo'

export default function HomePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleCreateRoom() {
    setLoading(true)
    try {
      const res = await fetch('/api/rooms/create', { method: 'POST' })
      const data = await res.json()
      if (!data.success) {
        alert('Failed to create room. Try again.')
        return
      }
      router.push(`/room/${data.roomId}`)
    } catch (err) {
      alert('Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-4">

      {/* Logo */}
      <div className="mb-10 text-center">
        <div className="text-5xl mb-4">📸</div>
        <div className="flex justify-center mb-3">
          <Logo />
        </div>
        <p className="text-gray-400 text-lg max-w-sm mx-auto leading-relaxed">
          Create a room. Share the QR code. Everyone uploads instantly.
        </p>
      </div>

      {/* CTA */}
      <button
        onClick={handleCreateRoom}
        disabled={loading}
        className="w-full max-w-xs bg-white text-gray-950 font-bold text-lg py-4 rounded-2xl hover:bg-gray-100 active:scale-95 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-gray-400 border-t-gray-900 rounded-full animate-spin" />
            Creating Room...
          </span>
        ) : (
          '+ Create Room'
        )}
      </button>

      {/* How it works */}
      <div className="mt-16 grid grid-cols-3 gap-6 max-w-sm w-full text-center">
        {[
          { icon: '🔗', label: 'Create a room' },
          { icon: '📲', label: 'Share the QR' },
          { icon: '🖼️', label: 'Upload photos' },
        ].map((step, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <div className="text-2xl">{step.icon}</div>
            <p className="text-xs text-gray-500">{step.label}</p>
          </div>
        ))}
      </div>

      {/* Footer */}
      <p className="mt-16 text-xs text-gray-700">
        Rooms expire after 24 hours · No login required
      </p>

    </main>
  )
}