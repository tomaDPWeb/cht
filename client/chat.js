// ✅ FILE: chat.js
const chatDisplay = document.getElementById("chatDisplay");
const inputText = document.getElementById("inputText");
const zonaButoane = document.getElementById("zonaButoane");

let lastTimestamp = null;
let loadingOlder = false;

inputText.addEventListener("input", () => {
  inputText.style.height = "auto";
  inputText.style.height = Math.min(inputText.scrollHeight, 120) + "px";
});

document.addEventListener("DOMContentLoaded", () => {
  incarcaMesajeInitiale();
  creeazaButoaneActiune();
});

async function trimiteMesaj() {
  const mesaj = inputText.value.trim();
  if (!mesaj) return;

  const now = new Date().toISOString();
  adaugaMesaj("user", mesaj, now);
  inputText.value = "";
  inputText.style.height = "2.5rem";
  adaugaTyping();

  const raspuns = await fetch("/api/sendMessage", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mesaj })
  });

  stergeTyping();

  const result = await raspuns.json();
  const gptTime = new Date().toISOString();
  if (result.raspuns) {
    adaugaMesaj("gpt", result.raspuns, gptTime);
  } else {
    adaugaMesaj("gpt", "[Eroare GPT]", gptTime);
  }
}

function adaugaMesaj(autor, text, timestamp = null) {
  const mesajDiv = document.createElement("div");
  mesajDiv.className = `message ${autor === "user" ? "user-message" : "gpt-message"}`;

  if (timestamp) {
    const date = new Date(timestamp);
    const ora = date.toLocaleString([], {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    mesajDiv.innerHTML = `<div style="font-size:0.75rem;opacity:0.6;">${ora}</div>${text}`;
  } else {
    mesajDiv.textContent = text;
  }

  chatDisplay.appendChild(mesajDiv);
  chatDisplay.scrollTop = chatDisplay.scrollHeight;
}

function adaugaTyping() {
  const typing = document.createElement("div");
  typing.className = "typing-indicator";
  typing.id = "typing";
  typing.textContent = "GPT scrie...";
  chatDisplay.appendChild(typing);
  chatDisplay.scrollTop = chatDisplay.scrollHeight;
}

function stergeTyping() {
  const typing = document.getElementById("typing");
  if (typing) typing.remove();
}

function incarcaMesajeInitiale() {
  fetch("/api/loadMessages")
    .then(res => res.json())
    .then(data => {
      data = data.reverse();
      for (const msg of data) {
        const autor = msg.text_type === "sent" ? "user" : "gpt";
        adaugaMesaj(autor, msg.text, msg.created_at);
      }
      if (data.length > 0) lastTimestamp = data[0].created_at;
    });
}

async function incarcaMesajeVechi() {
  if (loadingOlder || !lastTimestamp) return;
  loadingOlder = true;

  const raspuns = await fetch(`/api/loadMessages?before=${encodeURIComponent(lastTimestamp)}`);
  let data = await raspuns.json();

  for (const msg of data) {
    const autor = msg.text_type === "sent" ? "user" : "gpt";
    const mesajDiv = document.createElement("div");
    mesajDiv.className = `message ${autor === "user" ? "user-message" : "gpt-message"}`;
    const ora = new Date(msg.created_at).toLocaleString([], {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    mesajDiv.innerHTML = `<div style="font-size:0.75rem;opacity:0.6;">${ora}</div>${msg.text}`;
    chatDisplay.insertBefore(mesajDiv, chatDisplay.firstChild);
  }

  if (data.length > 0) lastTimestamp = data[data.length - 1].created_at;
  loadingOlder = false;
}

function creeazaButoaneActiune() {
  const butoane = [
    { label: "Trimite", id: "btn-trimite", actiune: trimiteMesaj },
    { label: "⬆ Mai vechi", id: "btn-mai-vechi", actiune: incarcaMesajeVechi },
    { label: "C", id: "btn-C", actiune: () => {} },
    { label: "D", id: "btn-D", actiune: () => {} }
  ];

  for (const btnInfo of butoane) {
    const btn = document.createElement("button");
    btn.textContent = btnInfo.label;
    btn.id = btnInfo.id;
    btn.addEventListener("click", btnInfo.actiune);
    zonaButoane.appendChild(btn);
  }
}

window.trimiteMesaj = trimiteMesaj;
