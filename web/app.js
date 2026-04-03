const messagesEl = document.getElementById("messages");
const formEl = document.getElementById("chat-form");
const inputEl = document.getElementById("chat-input");
const sendBtnEl = document.getElementById("send-btn");

const SESSION_KEY = "adflow_ai_session_id";
let sessionId = localStorage.getItem(SESSION_KEY) || "";

function addMessage(role, text) {
  const row = document.createElement("div");
  row.className = `message-row ${role}`;

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = text;

  row.appendChild(bubble);
  messagesEl.appendChild(row);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

async function sendMessage(message) {
  const response = await fetch("/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, session_id: sessionId || null }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const errorText = payload.detail || payload.error || "Request failed";
    throw new Error(errorText);
  }

  if (payload.session_id && payload.session_id !== sessionId) {
    sessionId = payload.session_id;
    localStorage.setItem(SESSION_KEY, sessionId);
  }

  return payload.reply || "";
}

formEl.addEventListener("submit", async (event) => {
  event.preventDefault();
  const message = inputEl.value.trim();
  if (!message) return;

  addMessage("user", message);
  inputEl.value = "";
  inputEl.focus();

  sendBtnEl.disabled = true;
  sendBtnEl.textContent = "Sending...";

  try {
    const reply = await sendMessage(message);
    addMessage("assistant", reply || "No reply from agent.");
  } catch (error) {
    addMessage("assistant", `Error: ${error.message}`);
  } finally {
    sendBtnEl.disabled = false;
    sendBtnEl.textContent = "Send";
  }
});

addMessage("assistant", "Hi. I am your Adflow AI Agent. Ask me the time in any city.");
