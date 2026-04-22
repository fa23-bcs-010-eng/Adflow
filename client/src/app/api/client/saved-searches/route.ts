import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthenticatedUser } from '@/lib/server/request-auth';
import { getSupabaseAdmin } from '@/lib/server/supabase';

const createSavedSearchSchema = z.object({
  query: z.string().max(120).optional(),
  category_slug: z.string().max(120).optional(),
  city_slug: z.string().max(120).optional(),
});

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const user = getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from('saved_searches')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      return NextResponse.json({ error: error.message || 'Failed to load saved searches' }, { status: 500 });
    }
    return NextResponse.json(data ?? []);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load saved searches';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  if (!['client', 'admin', 'super_admin'].includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = createSavedSearchSchema.parse(await request.json());
    const supabaseAdmin = getSupabaseAdmin();

    if (!body.query && !body.category_slug && !body.city_slug) {
      return NextResponse.json({ error: 'Provide at least one filter' }, { status: 422 });
    }

    const existing = await supabaseAdmin
      .from('saved_searches')
      .select('id')
      .eq('user_id', user.id)
      .eq('query', body.query || null)
      .eq('category_slug', body.category_slug || null)
      .eq('city_slug', body.city_slug || null)
      .maybeSingle();

    if (existing.data?.id) {
      return NextResponse.json({ error: 'Search alert already saved' }, { status: 409 });
    }

    const created = await supabaseAdmin
      .from('saved_searches')
      .insert({
        user_id: user.id,
        query: body.query || null,
        category_slug: body.category_slug || null,
        city_slug: body.city_slug || null,
      })
      .select('*')
      .single();

    if (created.error || !created.data) {
      return NextResponse.json(
        { error: created.error?.message || 'Failed to save search' },
        { status: 500 }
      );
    }

    let matches = supabaseAdmin
      .from('ads')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'published')
      .gt('expires_at', new Date().toISOString());

    if (body.query) matches = matches.ilike('title', `%${body.query}%`);
    if (body.category_slug) {
      const categoryRes = await supabaseAdmin
        .from('categories')
        .select('id')
        .eq('slug', body.category_slug)
        .maybeSingle();
      if (categoryRes.data?.id) matches = matches.eq('category_id', categoryRes.data.id);
    }
    if (body.city_slug) {
      const cityRes = await supabaseAdmin
        .from('cities')
        .select('id')
        .eq('slug', body.city_slug)
        .maybeSingle();
      if (cityRes.data?.id) matches = matches.eq('city_id', cityRes.data.id);
    }
    const { count: matchesCount } = await matches;

    await supabaseAdmin.from('notifications').insert({
      user_id: user.id,
      title: 'Search alert saved',
      body: `Your search alert is active. Current matching ads: ${matchesCount || 0}.`,
      type: 'success',
    });

    return NextResponse.json(created.data, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 422 });
    }
    const message = error instanceof Error ? error.message : 'Failed to save search';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
