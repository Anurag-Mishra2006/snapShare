
import { NextResponse } from 'next/server'
import { callAI } from '@/app/lib/ai'

export async function GET() {
  try {
    const result = await callAI({
      systemPrompt: 'You are a helpful assistant. Always respond with valid JSON only.',
      userText: 'Say hello. Respond with { "message": "hello" }',
    })
    return NextResponse.json({ success: true, result })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}