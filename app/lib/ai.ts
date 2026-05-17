// Provider-agnostic AI wrapper
// THIS is the only file you change when switching to Claude
// Just swap callGemini for callClaude — nothing else changes

import { callGemini } from './gemini'

interface CallAIParams {
  systemPrompt: string
  userText: string
  imageUrl?: string
}

export async function callAI(params: CallAIParams) {
  // 👇 Change this one line when switching to Claude
  return callGemini(params)
}