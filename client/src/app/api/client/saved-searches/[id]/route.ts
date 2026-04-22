import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/server/request-auth';
import { getSupabaseAdmin } from '@/lib/server/supabase';

export const dynamic = 'force-dynamic';

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  const { id } = await context.params;
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const deleted = await supabaseAdmin
      .from('saved_searches')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
      .select('id')
      .maybeSingle();

    if (deleted.error) {
      return NextResponse.json(
        { error: deleted.error.message || 'Failed to delete saved search' },
        { status: 500 }
      );
    }
    if (!deleted.data) {
      return NextResponse.json({ error: 'Saved search not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete saved search';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
