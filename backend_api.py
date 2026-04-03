from __future__ import annotations

import os
import re
import time
import uuid
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from google.adk.runners import InMemoryRunner
from google.genai import types
from my_agent.agent import root_agent


BASE_DIR = Path(__file__).resolve().parent
WEB_DIR = BASE_DIR / "web"
MY_AGENT_ENV = BASE_DIR / "my_agent" / ".env"

# Load local env files so the ADK runner can access GOOGLE_API_KEY.
load_dotenv(BASE_DIR / ".env", override=False)
load_dotenv(MY_AGENT_ENV, override=False)

APP_NAME = "adflow-chatbot"
DEFAULT_USER_ID = "web-user"

app = FastAPI(title="Adflow AI Agent API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

runner = InMemoryRunner(agent=root_agent, app_name=APP_NAME)
_known_sessions: set[str] = set()


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    session_id: str | None = None


class ChatResponse(BaseModel):
    reply: str
    session_id: str


def _normalize_reply(text: str) -> str:
    cleaned = (text or "").replace("**", "")
    cleaned = re.sub(r"^\s*[\*\-]\s+", "", cleaned, flags=re.MULTILINE)

    filtered_lines: list[str] = []
    for raw_line in cleaned.splitlines():
        line = raw_line.strip()
        if not line:
            continue
        lower = line.lower()
        # Remove any time-helper prompts or session boilerplate.
        if "session is ready" in lower:
            continue
        if "current time" in lower:
            continue
        if "specific city" in lower:
            continue
        if "time in" in lower and "ask" in lower:
            continue
        filtered_lines.append(line)

    cleaned = "\n".join(filtered_lines).strip()
    if not cleaned:
        return "I am the AI assistant of Adflow."

    return cleaned


def _ensure_session(session_id: str) -> None:
    if session_id in _known_sessions:
        return

    runner.session_service.create_session_sync(
        app_name=APP_NAME,
        user_id=DEFAULT_USER_ID,
        session_id=session_id,
    )
    _known_sessions.add(session_id)


def _extract_reply(message: str, session_id: str) -> str:
    user_content = types.UserContent(parts=[types.Part.from_text(text=message)])
    chunks: list[str] = []

    try:
        events = runner.run(
            user_id=DEFAULT_USER_ID,
            session_id=session_id,
            new_message=user_content,
        )

        for event in events:
            if event.error_message:
                detail = str(event.error_message)
                if "503" in detail or "UNAVAILABLE" in detail.upper():
                    raise HTTPException(status_code=503, detail=detail)
                raise HTTPException(status_code=500, detail=detail)

            if not event.content or not event.content.parts:
                continue

            for part in event.content.parts:
                text = getattr(part, "text", None)
                if text:
                    chunks.append(text)
    except HTTPException:
        raise
    except Exception as exc:
        detail = str(exc)
        if "503" in detail or "UNAVAILABLE" in detail.upper():
            raise HTTPException(status_code=503, detail=detail) from exc
        raise HTTPException(status_code=500, detail=detail) from exc

    if not chunks:
        return "I could not generate a response. Please try again."

    return _normalize_reply(chunks[-1])


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/chat", response_model=ChatResponse)
def chat(payload: ChatRequest) -> ChatResponse:
    session_id = payload.session_id or str(uuid.uuid4())
    _ensure_session(session_id)

    message = payload.message.strip()

    # Retry transient overload responses from Gemini.
    max_attempts = 3
    delays = [0.9, 1.8]
    last_error: HTTPException | None = None

    for attempt in range(max_attempts):
        try:
            reply = _extract_reply(message, session_id)
            return ChatResponse(reply=reply, session_id=session_id)
        except HTTPException as exc:
            last_error = exc
            if exc.status_code != 503 or attempt == max_attempts - 1:
                break
            time.sleep(delays[attempt])
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"Agent error: {exc}") from exc

    # Keep the chat usable even when model traffic is high.
    if last_error and last_error.status_code == 503:
        fallback = (
            "The AI model is temporarily busy due to high traffic. "
            "Please retry in a few seconds."
        )
        return ChatResponse(reply=fallback, session_id=session_id)

    if last_error:
        raise last_error
    raise HTTPException(status_code=500, detail="Unknown agent error")


if WEB_DIR.exists():
    app.mount("/web", StaticFiles(directory=str(WEB_DIR)), name="web")


@app.get("/")
def index() -> FileResponse:
    index_file = WEB_DIR / "index.html"
    if not index_file.exists():
        raise HTTPException(status_code=404, detail="web/index.html not found")
    return FileResponse(index_file)


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("backend_api:app", host="0.0.0.0", port=port, reload=True)
