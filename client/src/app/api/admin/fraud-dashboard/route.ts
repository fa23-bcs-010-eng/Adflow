import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/server/request-auth';
import { getSupabaseAdmin } from '@/lib/server/supabase';
import { riskBand } from '@/lib/server/marketplace-intelligence';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const user = getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  if (!['admin', 'super_admin'].includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const [{ data: assessments }, { data: reports }, { data: escrow }, { data: ads }] = await Promise.all([
      supabaseAdmin
        .from('ad_ai_assessments')
        .select('id,ad_id,user_id,quality_score,risk_score,moderation_decision,reasoning,created_at')
        .order('created_at', { ascending: false })
        .limit(100),
      supabaseAdmin
        .from('ad_reports')
        .select('id,ad_id,seller_id,status,created_at')
        .order('created_at', { ascending: false })
        .limit(200),
      supabaseAdmin
        .from('escrow_transactions')
        .select('id,order_id,seller_id,amount,status,risk_score,created_at')
        .order('created_at', { ascending: false })
        .limit(100),
      supabaseAdmin
        .from('ads')
        .select('id,title,user_id,status,created_at')
        .order('created_at', { ascending: false })
        .limit(200),
    ]);

    const reportCountByAd = new Map<string, number>();
    (reports ?? []).forEach((report: any) => {
      reportCountByAd.set(report.ad_id, (reportCountByAd.get(report.ad_id) || 0) + 1);
    });

    const assessmentRows = (assessments ?? []).map((item: any) => ({
      ...item,
      report_count: reportCountByAd.get(item.ad_id) || 0,
      risk_band: riskBand(Number(item.risk_score || 0)),
    }));

    const highRiskAds = assessmentRows.filter((row) => row.risk_band === 'high').length;
    const mediumRiskAds = assessmentRows.filter((row) => row.risk_band === 'medium').length;
    const disputedEscrow = (escrow ?? []).filter((row: any) => String(row.status) === 'disputed').length;

    return NextResponse.json({
      summary: {
        assessed_ads: assessmentRows.length,
        high_risk_ads: highRiskAds,
        medium_risk_ads: mediumRiskAds,
        open_reports: (reports ?? []).filter((row: any) => ['open', 'under_review'].includes(String(row.status))).length,
        disputed_escrow: disputedEscrow,
      },
      risks: assessmentRows,
      escrow: escrow ?? [],
      reports: reports ?? [],
      recent_ads: ads ?? [],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load fraud dashboard';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
