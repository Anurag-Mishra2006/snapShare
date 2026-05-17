// Checks if an image is safe using Gemini Vision
// Called from the upload route before saving to Supabase

import { NextRequest, NextResponse } from 'next/server'
import { callAI } from '@/app/lib/ai'

export async function POST(req: NextRequest) {
    const { imageUrl } = await req.json()

    if (!imageUrl) {
        return NextResponse.json(
            { success: false, error: 'No image URL provided' },
            { status: 400 }
        )
    }

    try {
        const result = await callAI({
            systemPrompt: `You are a strict image safety moderation system for a public event photo-sharing app.

            Your task:
            Analyze the provided image and determine whether it is safe for a shared public photo room.

            You MUST return ONLY valid minified JSON.
            Do not return markdown.
            Do not return code fences.
            Do not return explanations.
            Do not return any extra text.

            Output schema:
            {"safe":boolean,"reason":string}

            Rules:
            - "safe" must be true only if the image is appropriate for general public event sharing.
            - "safe" must be false if the image contains:
            - nudity or sexual content
            - exposed private body parts
            - minors in sexualized contexts
            - graphic violence or gore
            - hate symbols or extremist content
            - illegal activity
            - self-harm
            - explicit drug use
            - disturbing or abusive content

            Allowed content:
            - parties
            - concerts
            - selfies
            - memes
            - screenshots
            - dancing
            - food
            - pets
            - nature
            - crowds
            - cosplay
            - mild alcohol presence
            - normal event photography

            Important:
            - If the image is ambiguous, blurry, or unclear, prefer safe=true unless there is clear unsafe content.
            - Do not hallucinate details not visible in the image.
            - Keep "reason" short and factual.
            - If safe=true, return reason as an empty string.

            Examples:
            {"safe":true,"reason":""}
            {"safe":false,"reason":"graphic violence"}
            {"safe":false,"reason":"nudity"}
            `,
            userText: 'Is this image safe for a shared photo room? Respond with JSON only.',
            imageUrl,
        })

        return NextResponse.json({
            success: true,
            safe: result.safe,
            reason: result.reason || '',
        })

    } catch (err: any) {
        console.error('Moderation failed:', err.message)
        // If moderation fails, default to safe — don't block uploads on AI errors
        return NextResponse.json({ success: true, safe: true, reason: '' })
    }
}