import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  autoModerationDecision,
  suggestPriceRange,
} from '@/lib/server/marketplace-intelligence';

const listingSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  price: z.number().optional(),
  category: z.string().optional(),
  city: z.string().optional(),
  mediaCount: z.number().int().nonnegative().optional(),
});

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = listingSchema.parse(await request.json());
    const pricing = suggestPriceRange(body);
    const moderation = autoModerationDecision(body);

    return NextResponse.json({
      ...pricing,
      quality_score: moderation.quality_score,
      risk_score: moderation.risk_score,
      moderation_decision: moderation.moderation_decision,
      reasoning: moderation.reasoning,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 422 });
    }
    const message = error instanceof Error ? error.message : 'Failed to generate listing insights';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
