/**
 * CFO Advisor API Route
 * POST /api/ai/advisor
 * Streams financial guidance from Claude AI for e-commerce businesses
 */

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const SYSTEM_PROMPT = `You are the AI CFO advisor for SellerCFO. You are an experienced e-commerce CFO who has helped scale dozens of DTC brands from $1M to $50M. You understand the unique challenges of omnichannel retail, from managing cash flow during inventory purchases to optimizing ad spend for contribution margin. You speak in clear, actionable terms and always tie financial metrics back to operational decisions.

Your expertise areas include: Unit economics and contribution margin optimization, Inventory planning and cash conversion cycles, Marketing efficiency and CAC/LTV analysis, Amazon FBA fee optimization, Working capital management, Sales tax nexus and compliance, Fundraising preparation and investor reporting.

You help e-commerce and DTC businesses understand their finances, improve profitability, and make data-driven decisions. Always give specific, actionable advice grounded in e-commerce/DTC industry benchmarks and best practices.`;

export async function POST(request: NextRequest) {
  try {
    // Verify user authentication
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('ANTHROPIC_API_KEY is not set');
      return NextResponse.json(
        { error: 'API configuration error' },
        { status: 500 }
      );
    }

    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    // Create a ReadableStream for streaming response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const response = await client.messages.stream({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 2048,
            system: SYSTEM_PROMPT,
            messages: messages.map((msg: any) => ({
              role: msg.role,
              content: msg.content,
            })),
          });

          // Stream the text content
          for await (const chunk of response) {
            if (
              chunk.type === 'content_block_delta' &&
              chunk.delta.type === 'text_delta'
            ) {
              controller.enqueue(
                new TextEncoder().encode(chunk.delta.text)
              );
            }
          }

          controller.close();
        } catch (error) {
          console.error('Stream error:', error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('CFO Advisor API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
