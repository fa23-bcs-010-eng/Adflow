'use client';

import { useMemo, useState } from 'react';

export default function AiModeWidget() {
  const [open, setOpen] = useState(false);

  const chatbotUrl = useMemo(() => {
    const raw = process.env.NEXT_PUBLIC_CHATBOT_URL?.trim();
    return raw && raw.length > 0 ? raw : 'http://localhost:8000';
  }, []);

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
          <iframe
            src={chatbotUrl}
            title="Adflow AI Chatbot"
            className="ai-mode-frame"
            loading="lazy"
          />
        </section>
      )}
    </>
  );
}
