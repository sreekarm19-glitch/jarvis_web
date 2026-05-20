const input = document.getElementById("commandInput");
const responseBox = document.getElementById("responseBox");
const micBtn = document.getElementById("micBtn");
const sendBtn = document.getElementById("sendBtn");
const listenStatus = document.getElementById("listenStatus");

function updateClock() {
  const now = new Date();

  document.getElementById("time").innerText = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });

  document.getElementById("date").innerText = now.toDateString();
}

setInterval(updateClock, 1000);
updateClock();

function speak(text) {
  speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1;
  utterance.pitch = 1;
  utterance.volume = 1;

  speechSynthesis.speak(utterance);
}

async function askJarvis(message) {
  const lower = message.toLowerCase();
  
    if (
    lower.includes("who created you") ||
    lower.includes("who made you") ||
    lower.includes("who built you") ||
    lower.includes("your creator") ||
    lower.includes("who developed you") ||
    lower.includes("who coded you")
  ) {
    return "I was created and developed by Sreekar.";
  }
  if (lower.includes("open youtube")) {
    window.open("https://youtube.com", "_blank");
    return "Opening YouTube.";
  }

  if (lower.includes("open google")) {
    window.open("https://google.com", "_blank");
    return "Opening Google.";
  }

  if (lower.includes("calculator")) {
    window.open("https://www.google.com/search?q=calculator", "_blank");
    return "Opening calculator.";
  }

  if (lower.includes("weather")) {
    window.open("https://www.google.com/search?q=weather", "_blank");
    return "Opening weather.";
  }

  try {
    const res = await fetch("/ask", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message })
    });

    const data = await res.json();

    if (data.reply) {
  return data.reply;
}

if (data.error) {
  return "AI server error: " + data.error;
}

return "I could not get a proper response from the AI server.";
  } catch (error) {
    return "I cannot connect to the JARVIS AI server. Make sure node server.js is running.";
  }
}

async function sendMessage() {
  const message = input.value.trim();

  if (!message) return;

  responseBox.innerText = "Thinking...";
  listenStatus.innerText = "Processing...";

  const reply = await askJarvis(message);

  responseBox.innerText = reply;
  listenStatus.innerText = "System Ready";

  speak(reply);

  input.value = "";
}

sendBtn.addEventListener("click", sendMessage);

input.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    sendMessage();
  }
});

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (SpeechRecognition) {
  const recognition = new SpeechRecognition();

  recognition.lang = "en-US";
  recognition.continuous = false;
  recognition.interimResults = false;

  micBtn.addEventListener("click", () => {
    listenStatus.innerText = "Listening...";
    responseBox.innerText = "Listening...";
    recognition.start();
  });

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    input.value = transcript;
    sendMessage();
  };

  recognition.onerror = () => {
    listenStatus.innerText = "Mic Error";
    responseBox.innerText = "Microphone error. Check Chrome microphone permission.";
  };

  recognition.onend = () => {
    if (listenStatus.innerText === "Listening...") {
      listenStatus.innerText = "System Ready";
    }
  };
} else {
  micBtn.disabled = true;
  micBtn.innerText = "NO MIC";
}

document.querySelectorAll(".quick-grid button").forEach((button) => {
  button.addEventListener("click", () => {
    const action = button.dataset.action;

    if (action === "google") {
      window.open("https://google.com", "_blank");
    }

    if (action === "youtube") {
      window.open("https://youtube.com", "_blank");
    }

    if (action === "weather") {
      window.open("https://www.google.com/search?q=weather", "_blank");
    }

    if (action === "calculator") {
      window.open("https://www.google.com/search?q=calculator", "_blank");
    }

    if (action === "netflix") {
      window.open("https://www.netflix.com", "_blank");
    }

    if (action === "notes") {
      responseBox.innerText = "Notes module will be added later.";
      speak("Notes module will be added later.");
    }
  });
});