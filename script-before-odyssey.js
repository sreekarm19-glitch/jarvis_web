const input = document.getElementById("commandInput");
const responseBox = document.getElementById("responseBox");
const micBtn = document.getElementById("micBtn");
const sendBtn = document.getElementById("sendBtn");
const muteBtn = document.getElementById("muteBtn");
const voiceBtn = document.getElementById("voiceBtn");
const listenStatus = document.getElementById("listenStatus");
const connectBtn = document.getElementById("connectGlassesBtn");

const EMERGENCY_PHONE_NUMBER = "9963296459";

let isMuted = false;
let isProcessing = false;
let currentVoiceMode = 0;

const voiceModes = [
{ name: "Deep", rate: 0.95, pitch: 0.85 },
{ name: "Female", rate: 0.96, pitch: 1.1 },
{ name: "Robotic", rate: 0.9, pitch: 0.7 }
];

function setResponse(text) {
if (responseBox) {
responseBox.innerText = text;
}
}

function setStatus(text) {
if (listenStatus) {
listenStatus.innerText = text;
}
}

function sendToVirtualOled(text) {
const oled = document.getElementById("virtualOled");

if (oled) {
oled.innerHTML = String(text || "").split("\n").join("<br>");
}
}

function updateClock() {
const now = new Date();
const timeEl = document.getElementById("time");
const dateEl = document.getElementById("date");

if (timeEl) {
timeEl.innerText = now.toLocaleTimeString([], {
hour: "2-digit",
minute: "2-digit"
});
}

if (dateEl) {
dateEl.innerText = now.toDateString();
}
}

setInterval(updateClock, 1000);
updateClock();



/* JARVIS SAFE VOICE HELPERS START */

var jarvisAvailableVoices = [];

function jarvisLoadVoices() {
  if (window.speechSynthesis) {
    jarvisAvailableVoices = window.speechSynthesis.getVoices() || [];
  }
}

function jarvisPickVoice() {
  if (!window.speechSynthesis) return null;

  const voices = jarvisAvailableVoices.length
    ? jarvisAvailableVoices
    : window.speechSynthesis.getVoices();

  if (!voices || voices.length === 0) return null;

  const mode = voiceModes[currentVoiceMode].name.toLowerCase();

  if (mode.includes("female")) {
    return (
      voices.find(function (v) { return /samantha|victoria|zira|karen|moira|tessa|female/i.test(v.name); }) ||
      voices.find(function (v) { return /en/i.test(v.lang); }) ||
      voices[0]
    );
  }

  if (mode.includes("robotic")) {
    return (
      voices.find(function (v) { return /fred|ralph|albert|bad news|boing|bubbles|cellos|organ/i.test(v.name); }) ||
      voices[0]
    );
  }

  return (
    voices.find(function (v) { return /daniel|alex|rishi|male/i.test(v.name); }) ||
    voices.find(function (v) { return /en/i.test(v.lang); }) ||
    voices[0]
  );
}

if (window.speechSynthesis) {
  jarvisLoadVoices();
  window.speechSynthesis.onvoiceschanged = jarvisLoadVoices;
}

/* JARVIS SAFE VOICE HELPERS END */

function speak(text) {
if (isMuted) return;
if (!text) return;
if (!window.speechSynthesis) return;

speechSynthesis.cancel();

const voiceSettings = voiceModes[currentVoiceMode];
const speech = new SpeechSynthesisUtterance(text);
speech.rate = voiceSettings.rate;
speech.pitch = voiceSettings.pitch;
speech.voice = jarvisPickVoice();
  speech.volume = 1;

speechSynthesis.speak(speech);
}

if (voiceBtn) {
voiceBtn.addEventListener("click", function () {
currentVoiceMode = currentVoiceMode + 1;


if (currentVoiceMode >= voiceModes.length) {
  currentVoiceMode = 0;
}

const voiceName = voiceModes[currentVoiceMode].name;
voiceBtn.innerText = "Voice: " + voiceName;
setStatus("Voice changed to " + voiceName);
speak("Voice changed to " + voiceName);


});
}

if (muteBtn) {
muteBtn.addEventListener("click", function () {
isMuted = !isMuted;


if (isMuted) {
  if (window.speechSynthesis) {
    speechSynthesis.cancel();
  }

  muteBtn.innerText = "UNMUTE";
  setStatus("Muted");
} else {
  muteBtn.innerText = "MUTE";
  setStatus("System Active");
}


});
}

function cleanText(text) {
return String(text || "")
.split("*").join("")
.split("#").join("")
.split("\r").join("")
.split("\n").join(" ")
.split("  ").join(" ")
.trim();
}

function getFirstSentence(text) {
const clean = cleanText(text);
const dot = clean.indexOf(".");
const exclamation = clean.indexOf("!");
const question = clean.indexOf("?");

const positions = [dot, exclamation, question].filter(function (value) {
return value >= 0;
});

if (positions.length === 0) {
return clean;
}

const firstEnd = Math.min.apply(null, positions);
return clean.slice(0, firstEnd).trim();
}

function makeHudLines(text) {
const words = String(text || "No response.").split(" ");
const lines = [];
let line = "";

for (let i = 0; i < words.length; i++) {
const word = words[i];
const testLine = (line + " " + word).trim();


if (testLine.length <= 20) {
  line = testLine;
} else {
  if (line) {
    lines.push(line);
  }

  line = word;
}

if (lines.length === 3) {
  break;
}


}

if (line && lines.length < 3) {
lines.push(line);
}

return lines.join("\n");
}

function makeTinyHudAnswer(question, answer) {
const q = String(question || "").toLowerCase();

if (q.includes("2+2") || q.includes("2 + 2")) {
return "2 + 2 = 4";
}

if (q.includes("speed")) {
return "Speed = Distance / Time";
}

if (q.includes("photosynthesis")) {
return "Plants make food\nusing sunlight.";
}

if (q.includes("gravity")) {
return "Gravity pulls objects\ntowards Earth.";
}

if (q.includes("force")) {
return "Force = Mass x\nAcceleration";
}

if (
q.includes("who created you") ||
q.includes("who made you") ||
q.includes("who built you")
) {
return "Created by\nSreekar";
}

const firstSentence = getFirstSentence(answer);
return makeHudLines(firstSentence);
}

function isEmergencyCommand(message) {
const lower = String(message || "").toLowerCase().trim();

return (
lower.includes("jarvis activate emergency") ||
lower.includes("activate emergency") ||
lower.includes("trigger emergency") ||
lower.includes("send emergency alert") ||
lower.includes("emergency mode") ||
lower.includes("i am in danger") ||
lower.includes("im in danger") ||
lower.includes("help me") ||
lower === "help" ||
lower === "emergency"
);
}




async function askJarvis(message) {
const lower = String(message || "").toLowerCase();

if (isEmergencyCommand(message)) {
sendToVirtualOled("SOS ACTIVE");
await openWhatsAppSOS();


return {
  reply: "Emergency mode activated. Opening WhatsApp SOS message.",
  hud: "SOS ACTIVE"
};


}

if (
lower.includes("who created you") ||
lower.includes("who made you") ||
lower.includes("who built you") ||
lower.includes("who coded you") ||
lower.includes("who developed you") ||
lower.includes("your creator")
) {
return {
reply: "I was created and developed by Sreekar.",
hud: "Created by\nSreekar"
};
}

if (lower.includes("open youtube")) {
window.open("https://youtube.com", "_blank");
return { reply: "Opening YouTube.", hud: "Opening\nYouTube" };
}

if (lower.includes("open google")) {
window.open("https://google.com", "_blank");
return { reply: "Opening Google.", hud: "Opening\nGoogle" };
}

if (lower.includes("calculator")) {
window.open("https://www.google.com/search?q=calculator", "_blank");
return { reply: "Opening calculator.", hud: "Opening\nCalculator" };
}

if (lower.includes("weather")) {
window.open("https://www.google.com/search?q=weather", "_blank");
return { reply: "Opening weather.", hud: "Opening\nWeather" };
}

try {
const res = await fetch("/ask", {
method: "POST",
headers: {
"Content-Type": "application/json"
},
body: JSON.stringify({
message: message
})
});


const data = await res.json();

if (!res.ok) {
  const errorText = data && data.error ? data.error : "Unknown server error";
  return {
    reply: "AI server error: " + errorText,
    hud: "AI Server Error"
  };
}

if (data && data.reply) {
  return {
    reply: data.reply,
    hud: data.hud || makeTinyHudAnswer(message, data.reply)
  };
}

return {
  reply: "No proper response from the AI server.",
  hud: "No response"
};


} catch (error) {
console.error("Ask error:", error);
return {
reply: "Cannot connect to the JARVIS server.",
hud: "Server offline"
};
}
}

async function sendMessage() {
if (isProcessing) return;
if (!input) return;

const message = input.value.trim();

if (!message) return;

isProcessing = true;

if (window.speechSynthesis) {
speechSynthesis.cancel();
}

setResponse("Thinking...");
setStatus("Processing...");

try {
const result = await askJarvis(message);
const reply = result.reply || "No response.";
const hud = result.hud || makeTinyHudAnswer(message, reply);


setResponse(reply);
setStatus("System Active");
sendToVirtualOled(hud);
speak(reply);

input.value = "";


} catch (error) {
console.error("Send error:", error);
setResponse("Something went wrong in JARVIS.");
setStatus("Error");
} finally {
isProcessing = false;
}
}

if (sendBtn) {
sendBtn.addEventListener("click", sendMessage);
}

if (input) {
input.addEventListener("keydown", function (event) {
if (event.key === "Enter") {
sendMessage();
}
});
}

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (SpeechRecognition && micBtn) {
const recognition = new SpeechRecognition();
recognition.lang = "en-US";
recognition.continuous = false;
recognition.interimResults = false;

micBtn.addEventListener("click", function () {
if (isProcessing) return;


setResponse("Listening...");
setStatus("Listening...");

try {
  recognition.start();
} catch (error) {
  console.error("Mic error:", error);
  setStatus("Mic Error");
}


});

recognition.onresult = function (event) {
const transcript = event.results[0][0].transcript.trim();


if (input) {
  input.value = transcript;
}

setResponse("You said: " + transcript);
setStatus("Processing...");

setTimeout(sendMessage, 300);


};

recognition.onerror = function () {
setResponse("Microphone error. Check Chrome microphone permission.");
setStatus("Mic Error");
};
} else if (micBtn) {
micBtn.disabled = true;
micBtn.innerText = "NO MIC";
}

function setupQuickButtons() {
const buttons = document.querySelectorAll(".quick-grid button");

buttons.forEach(function (button) {
button.addEventListener("click", function () {
const action = button.dataset.action;


  if (action === "google") {
    window.open("https://google.com", "_blank");
    setResponse("Opening Google.");
    sendToVirtualOled("Opening\nGoogle");
    speak("Opening Google.");
  }

  if (action === "youtube") {
    window.open("https://youtube.com", "_blank");
    setResponse("Opening YouTube.");
    sendToVirtualOled("Opening\nYouTube");
    speak("Opening YouTube.");
  }

  if (action === "weather") {
    window.open("https://www.google.com/search?q=weather", "_blank");
    setResponse("Opening Weather.");
    sendToVirtualOled("Opening\nWeather");
    speak("Opening Weather.");
  }

  if (action === "calculator") {
    window.open("https://www.google.com/search?q=calculator", "_blank");
    setResponse("Opening Calculator.");
    sendToVirtualOled("Opening\nCalculator");
    speak("Opening Calculator.");
  }

  if (action === "netflix") {
    window.open("https://www.netflix.com", "_blank");
    setResponse("Opening Netflix.");
    sendToVirtualOled("Opening\nNetflix");
    speak("Opening Netflix.");
  }

  if (action === "swiggy") {
    window.open("https://www.swiggy.com", "_blank");
    setResponse("Opening Swiggy.");
    sendToVirtualOled("Opening\nSwiggy");
    speak("Opening Swiggy.");
  }
});


});
}

setupQuickButtons();

async function updateSystemStatus() {
try {
const res = await fetch("/status");
const data = await res.json();


const cpu = data.cpu || 0;
const ram = data.ram || 0;

const cpuText = document.getElementById("cpuText");
const cpuBar = document.getElementById("cpuBar");
const ramText = document.getElementById("ramText");
const ramBar = document.getElementById("ramBar");

if (cpuText) cpuText.innerText = cpu + "%";
if (cpuBar) cpuBar.style.width = cpu + "%";
if (ramText) ramText.innerText = ram + "%";
if (ramBar) ramBar.style.width = ram + "%";


} catch (error) {
console.error("Status error:", error);
}
}

setInterval(updateSystemStatus, 3000);
updateSystemStatus();

async function updateBatteryStatus() {
const batteryText = document.getElementById("batteryText");
const batteryBar = document.getElementById("batteryBar");

try {
if ("getBattery" in navigator && typeof navigator.getBattery === "function") {
const battery = await navigator.getBattery();


  function setBattery() {
    const percent = Math.round(battery.level * 100);
    if (batteryText) batteryText.innerText = percent + "%";
    if (batteryBar) batteryBar.style.width = percent + "%";
  }

  setBattery();
  battery.addEventListener("levelchange", setBattery);
  battery.addEventListener("chargingchange", setBattery);
} else {
  if (batteryText) batteryText.innerText = "N/A";
  if (batteryBar) batteryBar.style.width = "0%";
}


} catch (error) {
if (batteryText) batteryText.innerText = "N/A";
if (batteryBar) batteryBar.style.width = "0%";
}
}

updateBatteryStatus();

if (connectBtn) {
connectBtn.innerText = "Connect EDITH";
connectBtn.addEventListener("click", function () {
setResponse("EDITH Bluetooth will be added after JARVIS core is stable.");
setStatus("EDITH Pending");
sendToVirtualOled("EDITH READY\nBluetooth later");
});
}

console.log("JARVIS stable script with WhatsApp SOS loaded.");

async function openWhatsAppSOS() {
  let locationText = "Location could not be detected.";

  try {
    const position = await new Promise(function (resolve, reject) {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      });
    });

    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;

    locationText =
      "My current location:\n" +
      "https://maps.google.com/?q=" + latitude + "," + longitude;
  } catch (error) {
    alert("Location failed: " + error.message);
    console.error("Location error:", error);
  }

  const message = encodeURIComponent(
    "EMERGENCY ALERT from JARVIS/EDITH.\n" +
    "I may need help.\n" +
    "Please contact me immediately.\n\n" +
    locationText
  );

  window.open(
    "https://wa.me/" + EMERGENCY_PHONE_NUMBER + "?text=" + message,
    "_blank"
  );
}
