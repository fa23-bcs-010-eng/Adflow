'use client';

import { FormEvent, useState } from 'react';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
};

export default function AiModeWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'I am the AI assistant of Adflow for your guide.',
    },
  ]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = input.trim();
    if (!message || sending) return;

    const userMessage: ChatMessage = {
      id: `${Date.now()}-user`,
      role: 'user',
      text: message,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setSending(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, session_id: sessionId || null }),
      });

      const payload = await res.json().catch(() => ({}));
      const replyText =
        typeof payload?.reply === 'string' && payload.reply.trim().length > 0
          ? payload.reply.trim()
          : 'I am the AI assistant of Adflow for your guide.';

      if (typeof payload?.session_id === 'string' && payload.session_id.length > 0) {
        setSessionId(payload.session_id);
      }

      if (!res.ok) {
        throw new Error(
          typeof payload?.error === 'string' && payload.error
            ? payload.error
            : 'AI request failed.'
        );
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-assistant`,
          role: 'assistant',
          text: replyText,
        },
      ]);
    } catch (err) {
      const text = err instanceof Error ? err.message : 'Unable to reach AI right now.';
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-assistant-error`,
          role: 'assistant',
          text: text,
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className="ai-mode-toggle"
        aria-expanded={open}
        aria-controls="ai-mode-panel"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="ai-mode-dot">AI</span>
        <span>{open ? 'Close AI' : 'AI Mode'}</span>
      </button>

      {open && (
        <section id="ai-mode-panel" className="ai-mode-panel" aria-label="AI chatbot panel">
          <div className="ai-mode-head">
            <p>Adflow AI</p>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close AI panel">
              x
            </button>
          </div>
          <div className="ai-mode-chat">
            <div className="ai-mode-messages" aria-live="polite">
              {messages.map((message) => (
                <div key={message.id} className={`ai-msg-row ${message.role}`}>
                  <div className="ai-msg-bubble">{message.text}</div>
                </div>
              ))}
            </div>
            <form className="ai-mode-form" onSubmit={onSubmit}>
              <input
                className="ai-mode-input"
                placeholder="Ask anything about ads, posting, or dashboard..."
                value={input}
                onChange={(event) => setInput(event.target.value)}
                disabled={sending}
              />
              <button type="submit" className="ai-mode-send" disabled={sending}>
                {sending ? 'Sending...' : 'Send'}
              </button>
            </form>
          </div>
        </section>
      )}
    </>
  );
}
