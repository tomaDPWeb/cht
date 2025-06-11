const chatDisplay = document.getElementById("chatDisplay");
const inputText = document.getElementById("inputText");

let lastTimestamp = null;
let loadingOlder = false;

inputText.addEventListener("input", () => {
  inputText.style.height = "auto";
  inputText.style.height = Math.min(inputText.scrollHeight, 120) + "px";
});

document.addEventListener("DOMContentLoaded", () => {
  incarcaMesajeInitiale();
  creeazaButonLoadMore();
});

async function trimiteMesaj() {
  const mesaj = inputText.value.trim();
  if (!mesaj) return;

  adaugaMesaj("user", mesaj);
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
  if (result.raspuns) {
    adaugaMesaj("gpt", result.raspuns);
  } else {
    adaugaMesaj("gpt", "[Eroare GPT]");
  }
}

function adaugaMesaj(autor, text, timestamp = null) {
  const mesajDiv = document.createElement("div");
  mesajDiv.className = `message ${autor === "user" ? "user-message" : "gpt-message"}`;

  if (timestamp) {
    const date = new Date(timestamp);
    const ora = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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

function creeazaButonLoadMore() {
  const btn = document.createElement("button");
  btn.textContent = "⬆ Mai vechi";
  btn.className = "load-more";
  btn.addEventListener("click", incarcaMesajeVechi);
  document.body.appendChild(btn);
}

async function incarcaMesajeInitiale() {
  const raspuns = await fetch("/api/loadMessages");
  const data = await raspuns.json();
  const grupate = grupeazaMesaje(data);

  for (const grup of grupate) {
    adaugaMesaj("user", grup.sent.text, grup.sent.created_at);
    adaugaMesaj("gpt", grup.response.text, grup.response.created_at);
  }

  if (data.length > 0) lastTimestamp = data[0].created_at;
}

async function incarcaMesajeVechi() {
  if (loadingOlder || !lastTimestamp) return;
  loadingOlder = true;

  const raspuns = await fetch(`/api/loadMessages?before=${encodeURIComponent(lastTimestamp)}`);
  const data = await raspuns.json();
  const grupate = grupeazaMesaje(data);

  for (let i = grupate.length - 1; i >= 0; i--) {
    const grup = grupate[i];
    const userDiv = document.createElement("div");
    userDiv.className = "message user-message";
    userDiv.innerHTML = `<div style="font-size:0.75rem;opacity:0.6;">${new Date(grup.sent.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>${grup.sent.text}`;

    const gptDiv = document.createElement("div");
    gptDiv.className = "message gpt-message";
    gptDiv.innerHTML = `<div style="font-size:0.75rem;opacity:0.6;">${new Date(grup.response.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>${grup.response.text}`;

    chatDisplay.insertBefore(gptDiv, chatDisplay.firstChild);
    chatDisplay.insertBefore(userDiv, chatDisplay.firstChild);
  }

  if (data.length > 0) lastTimestamp = data[0].created_at;
  loadingOlder = false;
}



function grupeazaMesaje(lista) {
  const grupate = [];
  for (let i = 0; i < lista.length - 1; i++) {
    const cur = lista[i], next = lista[i + 1];
    if (cur.text_type === "sent" && next.text_type === "response") {
      grupate.push({ sent: cur, response: next });
      i++; // skip next
    }
  }
  return grupate;
}

