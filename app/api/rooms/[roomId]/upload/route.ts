// src/app/api/rooms/[roomId]/upload/route.ts
// Receives image from client, uploads to Cloudinary, saves URL to Supabase

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'
import cloudinary from '@/app/lib/cloudinary'

interface Props {
    params: Promise<{ roomId: string }>
}

export async function POST(req: NextRequest, { params }: Props) {
    const { roomId } = await params

    // Verify room exists and is not expired
    const { data: room, error: roomError } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', roomId)
        .eq('is_expired', false)
        .single()

    if (roomError || !room) {
        return NextResponse.json(
            { success: false, error: 'Room not found or expired' },
            { status: 404 }
        )
    }

    // Parse the uploaded file from form data
    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
        return NextResponse.json(
            { success: false, error: 'No file provided' },
            { status: 400 }
        )
    }

    // Convert File to base64 for Cloudinary upload
    // Cloudinary accepts base64 strings directly — no temp files needed
    const arrayBuffer = await file.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')
    const dataUri = `data:${file.type};base64,${base64}`

    // Upload to Cloudinary inside this room's folder
    const timestamp = Date.now()

    const uploadResult = await cloudinary.uploader.upload(dataUri, {
        folder: `rooms/${roomId}`,
        public_id: `snapshare_${timestamp}`,  // ← clean readable name
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'heic'],
    })

    // Save photo record to Supabase
    const { error: insertError } = await supabase.from('photos').insert({
        room_id: roomId,
        cloudinary_url: uploadResult.secure_url,
        cloudinary_public_id: uploadResult.public_id,
    })

    if (insertError) {
        console.error('Failed to save photo to DB:', insertError.message)
        return NextResponse.json(
            { success: false, error: 'Failed to save photo' },
            { status: 500 }
        )
    }

    return NextResponse.json({
        success: true,
        url: uploadResult.secure_url,
    })
}