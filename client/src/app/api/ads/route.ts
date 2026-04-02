import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/server/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin();
  const category = request.nextUrl.searchParams.get('category');
  const city = request.nextUrl.searchParams.get('city');
  const search = request.nextUrl.searchParams.get('search');
  const page = Number(request.nextUrl.searchParams.get('page') || '1');
  const limit = Number(request.nextUrl.searchParams.get('limit') || '20');

  let query = supabaseAdmin
    .from('ads')
    .select('*, category:categories(name,slug), city:cities(name,slug), package:packages(name,weight), media:ad_media(*)')
    .eq('status', 'published')
    .gt('expires_at', new Date().toISOString())
    .order('rank_score', { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (category) query = query.eq('categories.slug', category);
  if (city) query = query.eq('cities.slug', city);
  if (search) query = query.ilike('title', `%${search}%`);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message || 'Failed to load ads' }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}
