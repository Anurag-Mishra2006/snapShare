// Deletes a single photo from Cloudinary + Supabase

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'
import cloudinary from '@/app/lib/cloudinary'

interface Props {
  params: Promise<{ roomId: string; photoId: string }>
}

export async function DELETE(req: NextRequest, { params }: Props) {
  const { roomId, photoId } = await params

  // Fetch the photo to get cloudinary_public_id
  const { data: photo, error: fetchError } = await supabase
    .from('photos')
    .select('*')
    .eq('id', photoId)
    .eq('room_id', roomId) // ensure photo belongs to this room
    .single()

  if (fetchError || !photo) {
    return NextResponse.json(
      { success: false, error: 'Photo not found' },
      { status: 404 }
    )
  }

  // Delete from Cloudinary
  try {
    await cloudinary.uploader.destroy(photo.cloudinary_public_id)
  } catch (err) {
    console.error('Cloudinary delete failed:', err)
    // Continue anyway — still delete from DB
  }

  // Delete from Supabase
  const { error: deleteError } = await supabase
    .from('photos')
    .delete()
    .eq('id', photoId)

  // clustering will re-run on next page load with correct photos
  await supabase
    .from('clusters')
    .delete()
    .eq('room_id', roomId)

  if (deleteError) {
    console.error('DB delete failed:', deleteError.message)
    return NextResponse.json(
      { success: false, error: 'Failed to delete photo' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true })
}