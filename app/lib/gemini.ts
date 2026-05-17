// To switch to Claude later, only ai.ts needs to change

import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

interface CallGeminiParams {
    systemPrompt: string
    userText: string
    imageUrl?: string
}

export async function callGemini({ systemPrompt, userText, imageUrl }: CallGeminiParams) {
    const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' })

    let attempts: number = 0
    // adding delay  function for limiting the quota
    while (attempts < 2) {
        try {
            const parts: any[] = []
            // ... your existing code ...
            // If image provided, fetch and convert to base64
            // Gemini requires base64 for images, not URLs directly
            if (imageUrl) {
                const imageRes = await fetch(imageUrl)
                const arrayBuffer = await imageRes.arrayBuffer()
                const base64 = Buffer.from(arrayBuffer).toString('base64')
                const mimeType = imageRes.headers.get('content-type') || 'image/jpeg'

                parts.push({
                    inlineData: {
                        data: base64,
                        mimeType,
                    },
                })
            }
            parts.push({ text: `${systemPrompt}\n\n${userText}` })
            const result = await model.generateContent(parts)
            const text = result.response.text()
            // Strip markdown fences if present — Gemini sometimes wraps JSON in ```json
            const clean = text.replace(/```json|```/g, '').trim()
            return JSON.parse(clean)
             
        } catch (err: any) {
            if (err.message?.includes('429') || err.message?.includes('quota')) {
                attempts++
                console.warn(`Gemini quota hit, retrying in 5s (attempt ${attempts})`)
                await delay(5000) // wait 5 seconds before retry
            } else {
                throw err // not a quota error, throw immediately
            }
        }
    }
    throw new Error('Gemini quota exceeded after retries')
}

