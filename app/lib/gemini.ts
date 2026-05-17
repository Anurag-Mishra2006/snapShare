// app/lib/gemini.ts
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

interface CallGeminiParams {
  systemPrompt: string
  userText: string
  imageUrl?: string
}

export async function callGemini({ systemPrompt, userText, imageUrl }: CallGeminiParams) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' }) // ← updated

  let attempts = 0

  while (attempts < 3) {
    try {
      const parts: any[] = [] // ← inside loop, fresh on every attempt

      if (imageUrl) {
        const imageRes = await fetch(imageUrl)
        const arrayBuffer = await imageRes.arrayBuffer()
        const base64 = Buffer.from(arrayBuffer).toString('base64')
        const mimeType = imageRes.headers.get('content-type') || 'image/jpeg'
        parts.push({ inlineData: { data: base64, mimeType } })
      }

      parts.push({ text: `${systemPrompt}\n\n${userText}` })

      const result = await model.generateContent(parts)
      const text = result.response.text()

      // Strip markdown fences
      const clean = text.replace(/```json|```/g, '').trim()

      // Extract JSON even if Gemini adds surrounding text
      const jsonMatch = clean.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error(`No JSON found in response: ${clean}`)

      return JSON.parse(jsonMatch[0])

    } catch (err: any) {
      if (err.message?.includes('429') || err.message?.includes('quota')) {
        attempts++
        console.warn(`Gemini quota hit, retrying in 5s (attempt ${attempts})`)
        await delay(5000)
      } else {
        throw err // not a quota error — throw immediately
      }
    }
  }

  throw new Error('Gemini quota exceeded after retries')
}