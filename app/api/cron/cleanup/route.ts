import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'
import cloudinary from '@/app/lib/cloudinary'
import { callAI } from '@/app/lib/ai'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()

  // Phase 1 — rooms expired but not yet cleaned (is_expired = false)
  // Generate recap, delete photos + Cloudinary, mark expired
  const { data: freshlyExpired } = await supabase
    .from('rooms')
    .select('id, title')
    .lt('expires_at', now.toISOString())
    .eq('is_expired', false)

  let cleaned = 0

  for (const room of freshlyExpired ?? []) {
    try {
      // Fetch stats before deleting
      const { data: photos } = await supabase
        .from('photos')
        .select('cloudinary_url')
        .eq('room_id', room.id)

      const { data: clusters } = await supabase
        .from('clusters')
        .select('name')
        .eq('room_id', room.id)

      const photoCount = photos?.length ?? 0
      const clusterNames = clusters
        ?.map(c => c.name)
        .filter(Boolean)
        .join(', ') ?? ''

      // Generate recap — text only, very cheap on quota
      let recap = null
      try {
        const result = await callAI({
          systemPrompt: `You are writing a warm, nostalgic recap for a temporary photo-sharing experience that just ended.

Respond ONLY with valid JSON.
Format: { "recap": "text here" }

Rules:
- Maximum 2 sentences
- Under 35 words total
- Warm, celebratory, nostalgic tone
- Include 1-2 fitting emojis
- Sound human and natural
- Never mention "room", "app", "platform", or "photos"
- Write like recalling a shared memory with friends
- Avoid generic phrases like "great memories" or "good times"`,

          userText: `Title: "${room.title ?? 'Shared Moments'}"
Photo count: ${photoCount}
People/groups: ${clusterNames || 'none'}

Write the recap.`
        })
        recap = result.recap
      } catch {
        recap = `${photoCount} photos shared in this room. What a great time! 📸`
      }

      // Delete Cloudinary assets
      try {
        await cloudinary.api.delete_resources_by_prefix(`rooms/${room.id}/`)
        await cloudinary.api.delete_folder(`rooms/${room.id}`)
      } catch {
        // Cloudinary folder may already be empty — continue
      }

      // Delete photos from Supabase
      await supabase.from('photos').delete().eq('room_id', room.id)
      await supabase.from('clusters').delete().eq('room_id', room.id)

      // Mark room expired + save recap (keep room row for 48hrs)
      await supabase
        .from('rooms')
        .update({
          is_expired: true,
          recap,
        })
        .eq('id', room.id)

      cleaned++
      console.log(`Cleaned room: ${room.id} — recap saved`)

    } catch (err: any) {
      console.error(`Failed to clean room ${room.id}:`, err.message)
    }
  }

  // Phase 2 — rooms expired 48hrs+ ago → fully delete room row
  const cutoff = new Date(now.getTime() - 48 * 60 * 60 * 1000)
  const { data: staleRooms } = await supabase
    .from('rooms')
    .select('id')
    .eq('is_expired', true)
    .lt('expires_at', cutoff.toISOString())

  let purged = 0
  for (const room of staleRooms ?? []) {
    await supabase.from('rooms').delete().eq('id', room.id)
    purged++
  }

  return NextResponse.json({
    success: true,
    cleaned,
    purged,
    total: (freshlyExpired?.length ?? 0),
  })
}