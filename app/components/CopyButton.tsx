'use client'

import { useState } from 'react'

interface Props {
  url: string
}

export default function CopyButton({ url }: Props) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="w-full bg-white text-gray-950 font-semibold py-3 rounded-xl hover:bg-gray-100 active:scale-95 transition-all duration-150 text-sm"
    >
      {copied ? '✓ Copied!' : 'Copy Link'}
    </button>
  )
}