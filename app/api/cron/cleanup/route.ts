// src/app/api/cron/cleanup/route.ts
// Called by Vercel cron every hour
// Deletes expired rooms from Cloudinary + Supabase

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'
import cloudinary from '@/app/lib/cloudinary'

export async function GET(req: NextRequest) {
  // Security check — only allow Vercel cron or our secret token
  // Prevents random people from hitting this endpoint manually
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Find all rooms that have expired but not yet cleaned up
  const { data: expiredRooms, error: fetchError } = await supabase
    .from('rooms')
    .select('id')
    .lt('expires_at', new Date().toISOString()) // expires_at < now
    .eq('is_expired', false)                    // not yet cleaned

  if (fetchError) {
    console.error('Failed to fetch expired rooms:', fetchError.message)
    return NextResponse.json({ error: 'DB fetch failed' }, { status: 500 })
  }

  if (!expiredRooms || expiredRooms.length === 0) {
    return NextResponse.json({ success: true, cleaned: 0 })
  }

  let cleaned = 0

  for (const room of expiredRooms) {
    try {
      // Delete entire Cloudinary folder for this room
      // This removes all images inside rooms/{roomId}/
      await cloudinary.api.delete_resources_by_prefix(`rooms/${room.id}/`)
      await cloudinary.api.delete_folder(`rooms/${room.id}`)

      // Mark room as expired in Supabase
      // photos auto-delete via ON DELETE CASCADE
      await supabase
        .from('rooms')
        .delete()
        .eq('id', room.id)

      cleaned++
      console.log(`Cleaned room: ${room.id}`)
    } catch (err) {
      // Log but don't stop — clean other rooms even if one fails
      console.error(`Failed to clean room ${room.id}:`, err)
    }
  }

  return NextResponse.json({
    success: true,
    cleaned,
    total: expiredRooms.length,
  })
}