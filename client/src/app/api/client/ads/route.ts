import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthenticatedUser } from '@/lib/server/request-auth';
import { getSupabaseAdmin } from '@/lib/server/supabase';

const createAdSchema = z.object({
  title: z.string().min(5, 'Title too short'),
  description: z.string().optional(),
  price: z.number().positive().optional(),
  category_id: z.string().uuid().optional(),
  city_id: z.string().uuid().optional(),
  package_id: z.string().uuid().optional(),
  contact_phone: z.string().optional(),
  contact_email: z.string().email().optional(),
  contact_whatsapp: z.string().optional(),
  media: z
    .array(
      z.object({
        media_url: z.string().url('Must be a valid URL'),
        media_type: z.enum(['image', 'video', 'youtube']).default('image'),
      })
    )
    .max(10)
    .optional(),
});

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const user = getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from('ads')
    .select('*, media:ad_media(*), package:packages(name,price)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message || 'Failed to load ads' }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: NextRequest) {
  const user = getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  if (!['client', 'super_admin'].includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const body = createAdSchema.parse(await request.json());
    const baseSlug = body.title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const slug = `${baseSlug || 'ad'}-${Date.now()}-${randomUUID().slice(0, 6)}`;

    const { media, title, ...rest } = body;
    const created = await supabaseAdmin
      .from('ads')
      .insert({
        user_id: user.id,
        slug,
        title,
        status: 'draft',
        ...rest,
      })
      .select('*')
      .single();

    if (created.error || !created.data) {
      return NextResponse.json({ error: created.error?.message || 'Failed to create ad' }, { status: 500 });
    }

    if (media && media.length > 0) {
      await supabaseAdmin.from('ad_media').insert(
        media.map((m, idx) => ({
          ad_id: created.data.id,
          media_url: m.media_url,
          media_type: m.media_type || 'image',
          display_order: idx,
          is_primary: idx === 0,
        }))
      );
    }

    return NextResponse.json(created.data, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 422 });
    }
    const message = error instanceof Error ? error.message : 'Failed to create ad';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
