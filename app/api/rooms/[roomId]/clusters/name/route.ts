// Called after clusters are saved
// Sends cover photo to Gemini → gets a name → saves to DB

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'
import { callAI } from '@/app/lib/ai'

interface Props {
    params: Promise<{ roomId: string }>
}

export async function POST(req: NextRequest, { params }: Props) {
    const { roomId } = await params
    const { clusterId, coverPhotoUrl, photoCount } = await req.json()

    if (!clusterId || !coverPhotoUrl) {
        return NextResponse.json(
            { success: false, error: 'Missing clusterId or coverPhotoUrl' },
            { status: 400 }
        )
    }

    try {
        const result = await callAI({
            systemPrompt: `You are an AI assistant that generates short, friendly titles for photo clusters in a shared photo album.

You will receive a single image that may contain one person, multiple people, or no clear subject.

Your task:
Generate a concise, warm, human-friendly cluster name based only on the visible scene.

IMPORTANT:
- Respond ONLY with valid JSON
- No markdown
- No extra text
- No explanations
- Output format exactly:
{ "name": "Cluster Name 😊" }

Naming Rules:
- Maximum 4 words total (excluding emoji)
- Always include exactly 1 relevant emoji at the end
- Keep names natural, positive, and casual
- Do NOT invent identities or specific names
- Do NOT guess gender, age, ethnicity, relationships, or personal details
- Do NOT describe sensitive attributes
- Avoid repetitive generic outputs when possible

Guidelines:
- Single person:
  Use soft generic labels like:
  "Happy Moment 📸"
  "Solo Vibes ✨"
  "Smiling Person 😊"

- Multiple people:
  Use social/group-style labels like:
  "Fun Together 🎉"
  "Best Moments 💫"
  "Group Memories 📷"

- If the image is unclear:
  Return a safe neutral title like:
  "Captured Moment 📸"

- If there is no person visible:
  Describe the scene briefly and warmly:
  "Beach Sunset 🌅"
  "Food Time 🍕"

Output Example:
{ "name": "Fun Together 🎉" }`,
            userText: `This cluster contains ${photoCount} related photo(s). Create a short warm name for the person, group, or scene shown in the images.`,

            imageUrl: coverPhotoUrl,
        })

        // Save name to Supabase
        const { error } = await supabase
            .from('clusters')
            .update({ name: result.name })
            .eq('id', clusterId)

        if (error) {
            console.error('Failed to save cluster name:', error.message)
            return NextResponse.json(
                { success: false, error: 'Failed to save name' },
                { status: 500 }
            )
        }

        return NextResponse.json({ success: true, name: result.name })

    } catch (err: any) {
        console.error('Naming failed:', err.message)
        // Fail silently — unnamed cluster is fine
        return NextResponse.json({ success: true, name: null })
    }
}