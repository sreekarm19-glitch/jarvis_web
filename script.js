const input = document.getElementById("commandInput");
const responseBox = document.getElementById("responseBox");
const micBtn = document.getElementById("micBtn");
const sendBtn = document.getElementById("sendBtn");
const listenStatus = document.getElementById("listenStatus");
const muteBtn = document.getElementById("muteBtn");
const voiceBtn = document.getElementById("voiceBtn");

let isMuted = false;
let isProcessing = false;
let isListening = false;

let currentVoiceMode = 0;

const voiceModes = [
  {
    name: "Male Deep",
    voiceKeywords: ["daniel", "google us english male", "microsoft david", "male"],
    rate: 0.92,
    pitch: 0.85
  },
  {
    name: "Female",
    voiceKeywords: ["samantha", "google us english", "microsoft zira", "female"],
    rate: 0.96,
    pitch: 1.08
  },
  {
    name: "Robotic",
    voiceKeywords: ["alex", "google uk english male", "daniel", "english"],
    rate: 0.92,
    pitch: 0.75
  }
];

// ================= CLOCK =================

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

// ================= VOICE =================

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
  const selectedMode = voiceModes[currentVoiceMode];

  let preferredVoice = null;

  for (const keyword of selectedMode.voiceKeywords) {
    preferredVoice = jarvisVoices.find(voice =>
      voice.name.toLowerCase().includes(keyword.toLowerCase())
    );

    if (preferredVoice) break;
  }

  if (!preferredVoice) {
    preferredVoice = jarvisVoices.find(voice => voice.lang.includes("en"));
  }

  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }

  utterance.rate = selectedMode.rate;
  utterance.pitch = selectedMode.pitch;
  utterance.volume = 1;

  speechSynthesis.speak(utterance);
}

if (voiceBtn) {
  voiceBtn.addEventListener("click", () => {
    currentVoiceMode++;

    if (currentVoiceMode >= voiceModes.length) {
      currentVoiceMode = 0;
    }

    const selectedMode = voiceModes[currentVoiceMode];

    voiceBtn.innerText = "Voice: " + selectedMode.name;
    listenStatus.innerText = "Voice changed to " + selectedMode.name;

    speak("Voice changed to " + selectedMode.name);
  });
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

// ================= EDITH EMERGENCY CHECK =================

function isEmergencyCommand(message) {
  const lower = message.toLowerCase();

  return (
    lower.includes("jarvis activate emergency") ||
    lower.includes("activate emergency") ||
    lower.includes("trigger emergency") ||
    lower.includes("send emergency alert") ||
    lower.includes("emergency mode")
  );
}

// ================= JARVIS AI =================

async function askJarvis(message) {
  const lower = message.toLowerCase();

  if (isEmergencyCommand(message)) {
    await triggerEmergencySOS();
    return "Emergency mode activated. Opening WhatsApp SOS message.";
  }

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

// ================= SEND MESSAGE =================

async function sendMessage() {
  if (isProcessing) return;

  const message = input.value.trim();

  if (!message) return;

  isProcessing = true;

  speechSynthesis.cancel();

  responseBox.innerText = "Thinking...";
  listenStatus.innerText = "Processing...";

  const emergencyCommand = isEmergencyCommand(message);
  const reply = await askJarvis(message);

  responseBox.innerText = reply;
  listenStatus.innerText = "System Active";

  const shortAnswer = makeTinyHudAnswer(message, reply);
  console.log("OLED short answer:", shortAnswer);

  const virtualOled = document.getElementById("virtualOled");
if (virtualOled) {
  virtualOled.innerHTML = shortAnswer;
}

  sendToVirtualOled(shortAnswer);

  if (!emergencyCommand) {
    await sendToGlasses("AI:" + shortAnswer);
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

// ================= MIC INPUT =================

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

    if (!transcript) {
      isListening = false;
      return;
    }

    input.value = transcript;
    responseBox.innerText = "You said: " + transcript;
    listenStatus.innerText = "Processing...";

    isListening = false;

    setTimeout(() => {
      sendMessage();
    }, 300);
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
      responseBox.innerText = "No speech detected. Try again.";
    }
  };

} else {
  micBtn.disabled = true;
  micBtn.innerText = "NO MIC";
}

// ================= QUICK ACCESS =================

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

// ================= SYSTEM STATUS =================

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

// ================= SHORT ANSWER FOR EDITH =================


function makeShortForGlasses(text) {
  if (!text) return "No response.";

  let clean = text
    .replace(/\*/g, "")
    .replace(/#/g, "")
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Prefer formula-style answers
  if (clean.toLowerCase().includes("speed")) {
    return "Speed = Distance / Time";
  }

  if (clean.toLowerCase().includes("photosynthesis")) {
    return "Plants make food using sunlight.";
  }

  if (clean.toLowerCase().includes("gravity")) {
    return "Gravity pulls objects downward.";
  }

  // Take only first sentence
  let firstSentence = clean.split(/[.!?]/)[0].trim();

  // Max HUD limit
  if (firstSentence.length > 42) {
    firstSentence = firstSentence.substring(0, 39).trim() + "...";
  }

  return firstSentence;
}

// ================= EDITH BLUETOOTH + OLED BRIDGE =================

let glassesDevice = null;
let glassesCharacteristic = null;
let glassesConnected = false;

// These UUIDs must match the ESP32 Arduino code
const EDITH_SERVICE_UUID = "7b3f0001-2a6d-4a4e-9b8b-ed1700000001";
const EDITH_CHARACTERISTIC_UUID = "7b3f0002-2a6d-4a4e-9b8b-ed1700000002";

// Replace this number before using emergency mode.
// Format: country code + number, no + sign, no spaces.
// Example: 919876543210
const EMERGENCY_PHONE_NUMBER = "9963296459";

async function connectGlasses() {
  try {
    if (!navigator.bluetooth) {
      responseBox.innerText = "Bluetooth not supported. Use Chrome or Edge.";
      listenStatus.innerText = "Bluetooth Not Supported";
      return;
    }

    responseBox.innerText = "Searching for EDITH...";
    listenStatus.innerText = "Connecting...";

    glassesDevice = await navigator.bluetooth.requestDevice({
      filters: [{ namePrefix: "EDITH" }],
      optionalServices: [EDITH_SERVICE_UUID]
    });

    glassesDevice.addEventListener("gattserverdisconnected", () => {
      glassesConnected = false;
      glassesCharacteristic = null;

      responseBox.innerText = "EDITH disconnected.";
      listenStatus.innerText = "EDITH Disconnected";
      sendToVirtualOled("EDITH DISCONNECTED");
    });

    const server = await glassesDevice.gatt.connect();
    const service = await server.getPrimaryService(EDITH_SERVICE_UUID);
    glassesCharacteristic = await service.getCharacteristic(EDITH_CHARACTERISTIC_UUID);

    glassesConnected = true;

    responseBox.innerText = "EDITH connected.";
    listenStatus.innerText = "EDITH Connected";
    sendToVirtualOled("EDITH CONNECTED<br>Ready for JARVIS");

    speak("EDITH connected.");
  } catch (error) {
    console.error(error);
    responseBox.innerText = "Could not connect to EDITH. Use Chrome and turn on Bluetooth.";
    listenStatus.innerText = "Connection Failed";
  }
}

async function sendToGlasses(command) {
  if (!glassesConnected || !glassesCharacteristic) {
    console.log("EDITH not connected. Command:", command);
    return;
  }

  try {
    const encoder = new TextEncoder();
    await glassesCharacteristic.writeValue(encoder.encode(command));
    console.log("Sent to EDITH:", command);
  } catch (error) {
    console.error("EDITH send error:", error);
    responseBox.innerText += "\n\nEDITH disconnected. Reconnect EDITH.";
    listenStatus.innerText = "EDITH Send Failed";
  }
}

function sendToVirtualOled(text) {
  const virtualOled = document.getElementById("virtualOled");

  if (virtualOled) {
    virtualOled.innerHTML = text;
  }
}

async function triggerEmergencySOS() {
  sendToVirtualOled("SOS ACTIVE<br>Emergency triggered");
  await sendToGlasses("SOS");

  try {
    const position = await getCurrentLocation();

    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;

    openWhatsAppSOS(latitude, longitude);
  } catch (error) {
    console.error("Location error:", error);

    const message = encodeURIComponent(
      "EMERGENCY ALERT from EDITH.\nI may need help.\nLocation could not be detected."
    );

    window.open(`https://wa.me/${EMERGENCY_PHONE_NUMBER}?text=${message}`, "_blank");
  }
}

function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not supported"));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    });
  });
}

function openWhatsAppSOS(latitude, longitude) {
  const locationLink = `https://maps.google.com/?q=${latitude},${longitude}`;

  const message = encodeURIComponent(
    `EMERGENCY ALERT from EDITH.\n` +
    `I may need help.\n` +
    `My current location:\n${locationLink}`
  );

  window.open(`https://wa.me/${EMERGENCY_PHONE_NUMBER}?text=${message}`, "_blank");
}

const connectBtn = document.getElementById("connectGlassesBtn");

if (connectBtn) {
  connectBtn.innerText = "Connect EDITH";
  connectBtn.addEventListener("click", connectGlasses);
}

function makeTinyHudAnswer(question, answer) {
  const q = (question || "").toLowerCase();
  const a = (answer || "").toLowerCase();

  if (q.includes("speed") || a.includes("speed")) {
    return "Speed = Distance / Time";
  }

  if (q.includes("photosynthesis") || a.includes("photosynthesis")) {
    return "Plants make food using sunlight.";
  }

  if (q.includes("gravity") || a.includes("gravity")) {
    return "Gravity pulls objects downward.";
  }

  if (q.includes("force") || a.includes("force")) {
    return "Force = Mass x Acceleration";
  }

  if (q.includes("area of circle") || a.includes("area of circle")) {
    return "Area of circle = pi r^2";
  }

  let clean = answer
    .replace(/\*/g, "")
    .replace(/#/g, "")
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  let sentence = clean.split(/[.!?]/)[0].trim();

  if (sentence.length > 35) {
    sentence = sentence.substring(0, 32).trim() + "...";
  }

  return sentence;
}