'use client'

import { useState, useEffect } from 'react'

interface Props {
  expiresAt: string
}

function getTimeLeft(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now()
  if (diff <= 0) return 'Expired'
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  return `${hours}h ${minutes}m`
}

export default function ExpiryCountdown({ expiresAt }: Props) {
  // Initialize with calculated value — no setState inside effect
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(expiresAt))

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft(expiresAt))
    }, 60000)

    return () => clearInterval(interval)
  }, [expiresAt])

  return (
    <div className="text-xs text-gray-600 bg-gray-900 px-3 py-1.5 rounded-full">
      ⏳ Expires in {timeLeft}
    </div>
  )
}