import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'
import cloudinary from '@/app/lib/cloudinary'
import { callAI } from '@/app/lib/ai'

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

  // Parse uploaded file
  const formData = await req.formData()
  const file = formData.get('file') as File

  if (!file) {
    return NextResponse.json(
      { success: false, error: 'No file provided' },
      { status: 400 }
    )
  }

  const arrayBuffer = await file.arrayBuffer()
  const base64 = Buffer.from(arrayBuffer).toString('base64')
  const dataUri = `data:${file.type};base64,${base64}`

  try {
    // Step 1 — Upload to Cloudinary first (we need the URL for moderation)
    const timestamp = Date.now()
    const uploadResult = await cloudinary.uploader.upload(dataUri, {
      folder: `rooms/${roomId}`,
      public_id: `snapshare_${timestamp}`,
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'heic'],
      transformation: [
        { quality: 'auto' },   //  auto quality optimization
        { fetch_format: 'auto' } //   auto format (webp for browsers that support it)
      ],
    })

    // Step 2 — Moderate the image using Gemini
    let moderationStatus = 'approved'
    const shouldModerate = Math.random() < 0.4
    if (shouldModerate) {
      try {
        const moderation = await callAI({
          systemPrompt: `
You are a strict image safety moderation system for a public event photo-sharing app.

Your task:
Analyze the provided image and determine whether it is safe for a shared public photo room.

Return ONLY valid minified JSON.
No markdown.
No code fences.
No explanations.
No extra text.

Exact output schema:
{"safe":boolean,"reason":string}

Rules:
Set "safe" to false ONLY if the image clearly contains:
- explicit nudity
- explicit sexual content
- visible genitals
- exposed breasts
- minors in sexualized contexts
- graphic gore or severe violence
- hate symbols or extremist propaganda
- self-harm
- clearly illegal activity
- disturbing abusive content

Allowed content:
- parties
- concerts
- dancing
- selfies
- group photos
- cosplay
- memes
- screenshots
- food
- pets
- nature
- crowds
- normal event photography
- mild alcohol presence
- swimwear
- beach photos
- gym photos

Important rules:
- If content is ambiguous or unclear, prefer safe=true.
- Do not hallucinate details not visible in the image.
- Do not infer age unless clearly visible.
- Keep "reason" short and factual.
- If safe=true, reason must be "".
- Do not include additional keys.

Examples:
{"safe":true,"reason":""}
{"safe":false,"reason":"graphic gore"}
{"safe":false,"reason":"explicit nudity"}
`,
          userText: 'Is this image safe for a shared photo room? Respond with JSON only.',
          imageUrl: uploadResult.secure_url,
        })

        if (!moderation.safe) {
          // Delete from Cloudinary — don't store unsafe images
          await cloudinary.uploader.destroy(uploadResult.public_id)
          return NextResponse.json(
            {
              success: false,
              error: `Image rejected: ${moderation.reason || 'Content not allowed'}`,
              rejected: true,
            },
            { status: 400 }
          )
        }

        moderationStatus = 'approved'
      } catch (modErr) {
        // Moderation failed — default to approved, don't block upload
        console.error('Moderation error:', modErr)
        moderationStatus = 'approved'
      }
    }
    // Step 3 — Save to Supabase with moderation status
    const { data: inserted, error: insertError } = await supabase
      .from('photos')
      .insert({
        room_id: roomId,
        cloudinary_url: uploadResult.secure_url,
        cloudinary_public_id: uploadResult.public_id,
        moderation_status: moderationStatus,
      })
      .select('id')
      .single()

    if (insertError || !inserted) {
      console.error('Failed to save photo to DB:', insertError?.message)
      return NextResponse.json(
        { success: false, error: 'Failed to save photo' },
        { status: 500 }
      )
    }
    //  Count photos to maybe trigger room title
    const { count } = await supabase
      .from('photos')
      .select('*', { count: 'exact', head: true })
      .eq('room_id', roomId)

    // Trigger room title on 3rd photo
    if (count === 3) {
      fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/rooms/${roomId}/title`, {
        method: 'POST',
      }).catch(() => { })
    }

    // Clear clusters on every new upload — forces re-clustering
    // on next page load with all photos including the new one
    if (count && count > 0) {
      await supabase
        .from('clusters')
        .delete()
        .eq('room_id', roomId)
    }
    return NextResponse.json({
      success: true,
      url: uploadResult.secure_url,
      id: inserted.id,
      publicId: uploadResult.public_id,
    })


  }
  catch (err: any) {
    console.error('Upload failed:', err.message)
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    )
  }
}