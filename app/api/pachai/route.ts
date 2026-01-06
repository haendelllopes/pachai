import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { getPromptForState, ConversationState } from '@/app/lib/pachai/prompts'
import { inferConversationState } from '@/app/lib/pachai/states'

export async function POST(req: NextRequest) {
  try {
    const { conversationHistory, userMessage } = await req.json()

    if (!userMessage) {
      return NextResponse.json(
        { error: 'userMessage is required' },
        { status: 400 }
      )
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    const state = inferConversationState(conversationHistory || '') as ConversationState
    const systemPrompt = getPromptForState(state)

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: userMessage,
        },
      ],
      temperature: 0.4,
      max_tokens: 400,
    })

    const reply = completion.choices[0]?.message?.content?.trim() || ''

    if (!reply) {
      return NextResponse.json(
        { error: 'No response generated' },
        { status: 500 }
      )
    }

    return NextResponse.json({ reply })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
