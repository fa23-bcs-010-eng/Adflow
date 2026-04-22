import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthenticatedUser } from '@/lib/server/request-auth';
import { getSupabaseAdmin } from '@/lib/server/supabase';

const sendMessageSchema = z.object({
  ad_id: z.string().min(1),
  message: z.string().min(1).max(2000),
});

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const user = getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  const adId = request.nextUrl.searchParams.get('ad_id');
  if (!adId) {
    return NextResponse.json({ error: 'ad_id is required' }, { status: 422 });
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data: conversations, error: conversationErr } = await supabaseAdmin
      .from('ad_conversations')
      .select('*')
      .eq('ad_id', adId)
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
      .order('last_message_at', { ascending: false })
      .limit(1);

    if (conversationErr) {
      return NextResponse.json(
        { error: conversationErr.message || 'Failed to load conversation' },
        { status: 500 }
      );
    }

    const conversation = conversations?.[0] || null;
    if (!conversation) {
      return NextResponse.json({ conversation: null, messages: [] });
    }

    const { data: messages, error: messagesErr } = await supabaseAdmin
      .from('conversation_messages')
      .select('id,conversation_id,sender_id,body,created_at')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: true })
      .limit(200);

    if (messagesErr) {
      return NextResponse.json(
        { error: messagesErr.message || 'Failed to load messages' },
        { status: 500 }
      );
    }

    const senderIds = Array.from(new Set((messages ?? []).map((m) => m.sender_id).filter(Boolean)));
    let senderMap = new Map<string, { id: string; full_name: string | null; email: string | null }>();

    if (senderIds.length > 0) {
      const { data: senders } = await supabaseAdmin
        .from('users')
        .select('id,full_name,email')
        .in('id', senderIds);
      senderMap = new Map(
        (senders ?? []).map((s) => [
          s.id as string,
          { id: s.id as string, full_name: (s.full_name as string) || null, email: (s.email as string) || null },
        ])
      );
    }

    return NextResponse.json({
      conversation,
      messages: (messages ?? []).map((m) => ({
        ...m,
        sender: senderMap.get(m.sender_id) || null,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load chat';
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
    const body = sendMessageSchema.parse(await request.json());
    const supabaseAdmin = getSupabaseAdmin();

    const { data: ad, error: adErr } = await supabaseAdmin
      .from('ads')
      .select('id,title,user_id,status')
      .eq('id', body.ad_id)
      .eq('status', 'published')
      .maybeSingle();

    if (adErr || !ad) {
      return NextResponse.json({ error: 'Ad not found' }, { status: 404 });
    }

    const sellerId = ad.user_id as string;
    const buyerId = user.id;
    if (sellerId === buyerId) {
      return NextResponse.json({ error: 'You cannot start chat on your own ad' }, { status: 422 });
    }

    let conversationId: string | null = null;
    const { data: existing } = await supabaseAdmin
      .from('ad_conversations')
      .select('id')
      .eq('ad_id', body.ad_id)
      .eq('buyer_id', buyerId)
      .eq('seller_id', sellerId)
      .maybeSingle();

    if (existing?.id) {
      conversationId = existing.id as string;
    } else {
      const createdConversation = await supabaseAdmin
        .from('ad_conversations')
        .insert({
          ad_id: body.ad_id,
          buyer_id: buyerId,
          seller_id: sellerId,
          last_message_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (createdConversation.error || !createdConversation.data) {
        return NextResponse.json(
          { error: createdConversation.error?.message || 'Failed to create conversation' },
          { status: 500 }
        );
      }
      conversationId = createdConversation.data.id as string;
    }

    const createdMessage = await supabaseAdmin
      .from('conversation_messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        body: body.message.trim(),
      })
      .select('id,conversation_id,sender_id,body,created_at')
      .single();

    if (createdMessage.error || !createdMessage.data) {
      return NextResponse.json(
        { error: createdMessage.error?.message || 'Failed to send message' },
        { status: 500 }
      );
    }

    await supabaseAdmin
      .from('ad_conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversationId);

    await supabaseAdmin.from('notifications').insert({
      user_id: sellerId,
      title: 'New chat message',
      body: `You received a new message on ad "${ad.title}"`,
      type: 'info',
      ad_id: ad.id as string,
    });

    return NextResponse.json(createdMessage.data, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 422 });
    }
    const message = error instanceof Error ? error.message : 'Failed to send message';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
