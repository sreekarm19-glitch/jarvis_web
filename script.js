const input = document.getElementById("commandInput");
const responseBox = document.getElementById("responseBox");
const micBtn = document.getElementById("micBtn");
const sendBtn = document.getElementById("sendBtn");
const listenStatus = document.getElementById("listenStatus");
const muteBtn = document.getElementById("muteBtn");

let isMuted = false;
let isProcessing = false;
let isListening = false;

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

let jarvisVoices = [];

function loadVoices() {
  jarvisVoices = speechSynthesis.getVoices();
}

speechSynthesis.onvoiceschanged = loadVoices;
loadVoices();

function speak(text) {
  if (isMuted) return;

  speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);

  const preferredVoice =
    jarvisVoices.find(voice => voice.name.toLowerCase().includes("daniel")) ||
    jarvisVoices.find(voice => voice.name.toLowerCase().includes("google uk english male")) ||
    jarvisVoices.find(voice => voice.name.toLowerCase().includes("microsoft david")) ||
    jarvisVoices.find(voice => voice.name.toLowerCase().includes("male")) ||
    jarvisVoices.find(voice => voice.lang.includes("en"));

  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }

  utterance.rate = 0.92;
  utterance.pitch = 0.75;
  utterance.volume = 1;

  speechSynthesis.speak(utterance);
}

if (muteBtn) {
  muteBtn.addEventListener("click", () => {
    isMuted = !isMuted;

    if (isMuted) {
      speechSynthesis.cancel();
      muteBtn.innerText = "UNMUTE";
      listenStatus.innerText = "Muted";
    } else {
      muteBtn.innerText = "MUTE";
      listenStatus.innerText = "System Active";
    }
  });
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
  if (isProcessing) return;

  const message = input.value.trim();

  if (!message) return;

  isProcessing = true;

  speechSynthesis.cancel();

  responseBox.innerText = "Thinking...";
  listenStatus.innerText = "Processing...";

  const reply = await askJarvis(message);

  responseBox.innerText = reply;
  listenStatus.innerText = "System Active";

  const shortAnswer = makeShortForGlasses(reply);
  console.log("OLED short answer:", shortAnswer);

  if (typeof sendToVirtualOled === "function") {
    sendToVirtualOled(reply);
  }

  speak(reply);

  input.value = "";
  isProcessing = false;
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
  if (isListening || isProcessing) return;

  speechSynthesis.cancel();

  isListening = true;
  listenStatus.innerText = "Listening...";
  responseBox.innerText = "Listening...";

  try {
    recognition.start();
  } catch (error) {
    isListening = false;
    listenStatus.innerText = "Mic Error";
  }
});

  recognition.onresult = (event) => {
  const transcript = event.results[0][0].transcript.trim();

  if (!transcript) return;

  input.value = transcript;

  isListening = false;
  recognition.stop();

  sendMessage();
};

recognition.onerror = () => {
  isListening = false;
  listenStatus.innerText = "Mic Error";
  responseBox.innerText = "Microphone error. Check Chrome microphone permission.";
};

recognition.onend = () => {
  isListening = false;

  if (!isProcessing && listenStatus.innerText === "Listening...") {
    listenStatus.innerText = "System Active";
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
    responseBox.innerText = "Opening Google.";
     speak("Opening Google.");
    }

    if (action === "youtube") {
      window.open("https://youtube.com", "_blank");
    responseBox.innerText = "Opening YouTube.";
     speak("Opening YouTube.");
    }

    if (action === "weather") {
      window.open("https://www.google.com/search?q=weather", "_blank");
    responseBox.innerText = "Opening Weather.";
     speak("Opening Weather.");
    }

    if (action === "calculator") {
      window.open("https://www.google.com/search?q=calculator", "_blank");
    responseBox.innerText = "Opening Calculator.";
     speak("Opening Calculator.");
    }

    if (action === "netflix") {
      window.open("https://www.netflix.com", "_blank");
    responseBox.innerText = "Opening Netflix.";
     speak("Opening Netflix.");
    }

    if (action === "swiggy") {
  window.open("https://www.swiggy.com", "_blank");
  responseBox.innerText = "Opening Swiggy.";
     speak("Opening Swiggy.");
}
  });
});
 async function updateSystemStatus() {
  try {
    const res = await fetch("/status");
    const data = await res.json();

    const cpu = data.cpu ?? 0;
    const ram = data.ram ?? 0;

    document.getElementById("cpuText").innerText = cpu + "%";
    document.getElementById("cpuBar").style.width = cpu + "%";

    document.getElementById("ramText").innerText = ram + "%";
    document.getElementById("ramBar").style.width = ram + "%";
  } catch (error) {
    document.getElementById("cpuText").innerText = "ERR";
    document.getElementById("ramText").innerText = "ERR";
  }
}

async function updateBatteryStatus() {
  try {
    if ("getBattery" in navigator) {
      const battery = await navigator.getBattery();

      function setBattery() {
        const percent = Math.round(battery.level * 100);

        document.getElementById("batteryText").innerText = percent + "%";
        document.getElementById("batteryBar").style.width = percent + "%";
      }

      setBattery();

      battery.addEventListener("levelchange", setBattery);
      battery.addEventListener("chargingchange", setBattery);
    } else {
      document.getElementById("batteryText").innerText = "N/A";
      document.getElementById("batteryBar").style.width = "0%";
    }
  } catch (error) {
    document.getElementById("batteryText").innerText = "N/A";
    document.getElementById("batteryBar").style.width = "0%";
  }
}

setInterval(updateSystemStatus, 3000);
updateSystemStatus();
updateBatteryStatus();

function makeShortForGlasses(text) {
  if (!text) return "No response.";

  let clean = text
    .replace(/\*/g, "")
    .replace(/#/g, "")
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // If answer is already short, keep it
  if (clean.length <= 80) {
    return clean;
  }

  // Take first 1-2 useful sentences
  const sentences = clean
    .split(/[.!?]/)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  let shortText = "";

  if (sentences.length >= 2) {
    shortText = sentences[0] + ". " + sentences[1] + ".";
  } else if (sentences.length === 1) {
    shortText = sentences[0] + ".";
  } else {
    shortText = clean;
  }

  // OLED limit
  if (shortText.length > 90) {
    shortText = shortText.substring(0, 87).trim() + "...";
  }

  return shortText;
}
let glassesDevice = null;
let glassesCharacteristic = null;

const EDITH_SERVICE_UUID = "d7f37c01-4f4a-4f5a-9f66-edith0000001";
const EDITH_CHARACTERISTIC_UUID = "d7f37c02-4f4a-4f5a-9f66-edith0000002";

async function connectGlasses() {
  try {
    responseBox.innerText = "Searching for E.D.I.T.H glasses...";
    listenStatus.innerText = "Connecting...";

    glassesDevice = await navigator.bluetooth.requestDevice({
      filters: [{ name: "EDITH_GLASSES" }],
      optionalServices: [EDITH_SERVICE_UUID]
    });

    const server = await glassesDevice.gatt.connect();
    const service = await server.getPrimaryService(EDITH_SERVICE_UUID);
    glassesCharacteristic = await service.getCharacteristic(EDITH_CHARACTERISTIC_UUID);

    responseBox.innerText = "E.D.I.T.H glasses connected.";
    listenStatus.innerText = "Glasses Connected";

    speak("E.D.I.T.H glasses connected.");
  } catch (error) {
    console.error(error);
    responseBox.innerText = "Could not connect to glasses. Use Chrome and turn on Bluetooth.";
    listenStatus.innerText = "Connection Failed";
  }
}

async function sendToGlasses(text) {
  if (!glassesCharacteristic) {
    console.log("Glasses not connected. Short answer:", text);
    return;
  }

  try {
    const encoder = new TextEncoder();
    await glassesCharacteristic.writeValue(encoder.encode(text));
    console.log("Sent to glasses:", text);
  } catch (error) {
    console.error("Glasses send error:", error);
    responseBox.innerText += "\n\nGlasses disconnected. Reconnect glasses.";
  }
}

const connectBtn = document.getElementById("connectGlassesBtn");

if (connectBtn) {
  connectBtn.addEventListener("click", connectGlasses);
}