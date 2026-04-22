import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/server/request-auth';
import { getSupabaseAdmin } from '@/lib/server/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const user = getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  if (!['moderator', 'admin', 'super_admin'].includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data: reports, error } = await supabaseAdmin
      .from('ad_reports')
      .select('*, ad:ads(id,title,slug,status), reporter:users!ad_reports_reporter_id_fkey(id,full_name,email), seller:users!ad_reports_seller_id_fkey(id,full_name,email)')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      return NextResponse.json({ error: error.message || 'Failed to load moderation reports' }, { status: 500 });
    }

    return NextResponse.json(reports ?? []);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load moderation reports';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
