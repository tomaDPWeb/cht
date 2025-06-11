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

function adaugaMesaj(autor, text) {
  const mesajDiv = document.createElement("div");
  mesajDiv.className = `message ${autor === "user" ? "user-message" : "gpt-message"}`;
  mesajDiv.textContent = text;
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
  for (const msg of grupate) {
    adaugaMesaj(msg.text_type === "sent" ? "user" : "gpt", msg.text);
  }
  if (data.length > 0) {
    lastTimestamp = data[0].created_at;
  }
}

async function incarcaMesajeVechi() {
  if (loadingOlder || !lastTimestamp) return;
  loadingOlder = true;

  const raspuns = await fetch(`/api/loadMessages?before=${encodeURIComponent(lastTimestamp)}`);
  const data = await raspuns.json();

  const grupate = grupeazaMesaje(data);
  for (let i = grupate.length - 1; i >= 0; i--) {
    const msg = grupate[i];
    const mesajDiv = document.createElement("div");
    mesajDiv.className = `message ${msg.text_type === "sent" ? "user-message" : "gpt-message"}`;
    mesajDiv.textContent = msg.text;
    chatDisplay.insertBefore(mesajDiv, chatDisplay.firstChild);
  }

  if (data.length > 0) {
    lastTimestamp = data[0].created_at;
  }
  loadingOlder = false;
}


function grupeazaMesaje(lista) {
  const result = [];
  for (let i = 0; i < lista.length; i += 2) {
    const a = lista[i], b = lista[i + 1];
    if (!b) {
      result.push(a);
    } else if (a.text_type === "sent") {
      result.push(a, b);
    } else {
      result.push(b, a);
    }
  }
  return result;
}
