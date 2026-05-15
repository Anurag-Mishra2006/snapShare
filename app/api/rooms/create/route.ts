// src/app/api/rooms/create/route.ts
// Creates a new room in Supabase and returns the room ID

import { NextResponse } from 'next/server'
import { nanoid } from 'nanoid'
import { supabase } from '@/app/lib/supabase'

export async function POST() {
  // Generate a short unique room ID — e.g. "x7k2p9"
  // 8 chars gives us ~281 trillion combinations — more than enough
  const roomId = nanoid(8)

  // Room expires exactly 24 hours from now
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

  const { error } = await supabase.from('rooms').insert({
    id: roomId,
    expires_at: expiresAt,
    is_expired: false,
  })

  if (error) {
    console.error('Failed to create room:', error.message)
    return NextResponse.json(
      { success: false, error: 'Failed to create room' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, roomId })
}