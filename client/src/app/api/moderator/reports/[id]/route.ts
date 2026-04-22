import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthenticatedUser } from '@/lib/server/request-auth';
import { getSupabaseAdmin } from '@/lib/server/supabase';

const updateReportSchema = z.object({
  status: z.enum(['under_review', 'resolved', 'dismissed']),
  moderator_note: z.string().max(1000).optional(),
});

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  if (!['moderator', 'admin', 'super_admin'].includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await context.params;
  try {
    const body = updateReportSchema.parse(await request.json());
    const supabaseAdmin = getSupabaseAdmin();

    const updated = await supabaseAdmin
      .from('ad_reports')
      .update({
        status: body.status,
        moderator_note: body.moderator_note || null,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single();

    if (updated.error || !updated.data) {
      return NextResponse.json({ error: updated.error?.message || 'Failed to update report' }, { status: 500 });
    }

    if (updated.data.reporter_id) {
      await supabaseAdmin.from('notifications').insert({
        user_id: updated.data.reporter_id as string,
        title: 'Report updated',
        body: `Your ad complaint is now ${body.status}.`,
        type: body.status === 'resolved' ? 'success' : 'info',
        ad_id: updated.data.ad_id as string,
      });
    }

    return NextResponse.json(updated.data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 422 });
    }
    const message = error instanceof Error ? error.message : 'Failed to update report';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
