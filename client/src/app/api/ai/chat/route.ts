import { NextRequest, NextResponse } from 'next/server';

type ChatRequest = {
  message?: string;
  session_id?: string | null;
};

function normalizeReply(text: string): string {
  const cleaned = text
    .replace(/\*\*/g, '')
    .replace(/^\s*[\*-]\s+/gm, '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => {
      const lower = line.toLowerCase();
      if (lower.includes('session is ready')) return false;
      if (lower.includes('current time')) return false;
      if (lower.includes('specific city')) return false;
      if (lower.includes('time in') && lower.includes('ask')) return false;
      return true;
    })
    .join('\n')
    .trim();

  return cleaned || 'I am the AI assistant of Adflow for your guide.';
}

function safeSessionId(sessionId?: string | null): string {
  if (sessionId && sessionId.trim()) return sessionId.trim();
  return crypto.randomUUID();
}

function getBackendUrl(): string | null {
  const raw = (
    process.env.AI_BACKEND_URL ||
    process.env.NEXT_PUBLIC_CHATBOT_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    ''
  ).trim();
  if (!raw) return null;

  try {
    const parsed = new URL(raw);
    const isLocal =
      parsed.hostname === 'localhost' ||
      parsed.hostname === '127.0.0.1' ||
      parsed.hostname.endsWith('.local');
    const isProduction = process.env.VERCEL_ENV === 'production';
    if (isProduction && isLocal) return null;
    return raw.replace(/\/+$/, '');
  } catch {
    return null;
  }
}

async function tryBackendProxy(message: string, sessionId: string): Promise<string | null> {
  const base = getBackendUrl();
  if (!base) return null;

  const res = await fetch(`${base}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, session_id: sessionId }),
    signal: AbortSignal.timeout(25000),
  });

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      typeof payload?.detail === 'string'
        ? payload.detail
        : typeof payload?.error === 'string'
          ? payload.error
          : `AI backend error (${res.status})`
    );
  }

  if (typeof payload?.reply === 'string' && payload.reply.trim().length > 0) {
    return normalizeReply(payload.reply);
  }
  return null;
}

async function tryGemini(message: string): Promise<string | null> {
  const apiKey = (process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || '').trim();
  if (!apiKey) return null;

  const prompt = [
    'You are Adflow AI assistant.',
    'Guide users about Adflow ads, posting, dashboard, packages, and account usage.',
    'Reply in plain text only. Do not use markdown bullets or asterisks.',
    'Do not suggest current time unless user explicitly asks for time.',
    `User message: ${message}`,
  ].join('\n');

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
      signal: AbortSignal.timeout(25000),
    }
  );

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err =
      payload?.error?.message ||
      payload?.message ||
      `Gemini request failed (${res.status})`;
    throw new Error(String(err));
  }

  const reply =
    payload?.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part?.text || '')
      .join('\n')
      .trim() || '';

  if (!reply) return null;
  return normalizeReply(reply);
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ChatRequest;
    const message = String(body?.message || '').trim();
    const sessionId = safeSessionId(body?.session_id);

    if (!message) {
      return NextResponse.json({ error: 'Message is required.' }, { status: 400 });
    }

    const proxied = await tryBackendProxy(message, sessionId);
    if (proxied) {
      return NextResponse.json({ reply: proxied, session_id: sessionId });
    }

    const gemini = await tryGemini(message);
    if (gemini) {
      return NextResponse.json({ reply: gemini, session_id: sessionId });
    }

    return NextResponse.json(
      {
        reply: 'AI is not fully configured yet. Add AI_BACKEND_URL or GOOGLE_API_KEY in Vercel environment variables.',
        session_id: sessionId,
      },
      { status: 200 }
    );
  } catch (error) {
    const detail =
      error instanceof Error ? error.message : 'Unexpected AI error occurred.';
    return NextResponse.json({ error: detail }, { status: 500 });
  }
}
