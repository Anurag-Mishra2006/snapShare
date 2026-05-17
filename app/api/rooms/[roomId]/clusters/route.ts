// src/app/api/rooms/[roomId]/clusters/route.ts
// Saves clusters to Supabase after DBSCAN runs client-side
// Also deletes old clusters for this room before saving new ones
// (re-clustering after new uploads = fresh results)

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'

interface Props {
  params: Promise<{ roomId: string }>
}

export async function POST(req: NextRequest, { params }: Props) {
  const { roomId } = await params
  const { clusters } = await req.json()

  if (!clusters || !Array.isArray(clusters)) {
    return NextResponse.json(
      { success: false, error: 'Invalid clusters data' },
      { status: 400 }
    )
  }

  // Delete old clusters for this room — fresh start on every re-cluster
  await supabase.from('clusters').delete().eq('room_id', roomId)

  // Insert all new clusters
  const rows = clusters.map((c: any) => ({
    id: `${roomId}_${c.id}`,
    room_id: roomId,
    name: null,
    photo_ids: c.photoUrls,      // ← save URLs (not IDs)
    cover_photo_id: c.coverPhotoUrl,
    created_at: new Date().toISOString(),
  }))

  const { error } = await supabase.from('clusters').insert(rows)

  if (error) {
    console.error('Failed to save clusters:', error.message)
    return NextResponse.json(
      { success: false, error: 'Failed to save clusters' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, saved: rows.length })
}

// Fetch clusters for a room (used by cluster page)
export async function GET(req: NextRequest, { params }: Props) {
  const { roomId } = await params

  const { data, error } = await supabase
    .from('clusters')
    .select('*')
    .eq('room_id', roomId)
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, clusters: data })
}