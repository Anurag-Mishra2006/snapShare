// Generates a room title using Gemini after 3 photos are uploaded
// Only runs once — skips if title already exists

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'
import { callAI } from '@/app/lib/ai'

interface Props {
  params: Promise<{ roomId: string }>
}

export async function POST(req: NextRequest, { params }: Props) {
  const { roomId } = await params

  // Check if title already exists — don't overwrite
  const { data: room } = await supabase
    .from('rooms')
    .select('title')
    .eq('id', roomId)
    .single()

  if (room?.title) {
    return NextResponse.json({ success: true, title: room.title })
  }

  // Get first 3 photo URLs for context
  const { data: photos } = await supabase
    .from('photos')
    .select('cloudinary_url')
    .eq('room_id', roomId)
    .order('uploaded_at', { ascending: true })
    .limit(3)

  if (!photos || photos.length < 3) {
    return NextResponse.json({ success: false, error: 'Not enough photos' })
  }

  try {
    // Send all 3 photos — use first as primary image, mention others in text
    const result = await callAI({
      systemPrompt: `You are naming a shared photo room for an event or gathering.
Look at this photo and generate a short warm title for the whole room.
Respond ONLY with valid JSON — no markdown, no explanation.
Format: { "title": "room title here" }
Rules:
- Max 5 words
- Include 1 relevant emoji
- Be warm and specific if context is clear
- Examples: "Rahul's Birthday 🎂", "Beach Day 🏖️", "Family Reunion 👨‍👩‍👧"
- If unclear, use something like "Our Shared Moments 📸"`,
      userText: `Generate a title for this shared photo room. There are ${photos.length} photos so far.`,
      imageUrl: photos[0].cloudinary_url, // primary image for context
    })

    // Save title to rooms table
    await supabase
      .from('rooms')
      .update({ title: result.title })
      .eq('id', roomId)

    return NextResponse.json({ success: true, title: result.title })

  } catch (err: any) {
    console.error('Room title generation failed:', err.message)
    return NextResponse.json({ success: false, error: err.message })
  }
}