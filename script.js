const input = document.getElementById("commandInput");
const responseBox = document.getElementById("responseBox");
const micBtn = document.getElementById("micBtn");
const sendBtn = document.getElementById("sendBtn");
const muteBtn = document.getElementById("muteBtn");
const voiceBtn = document.getElementById("voiceBtn");
const listenStatus = document.getElementById("listenStatus");
const connectBtn = document.getElementById("connectGlassesBtn");

let isMuted = false;
let isProcessing = false;

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

function speak(text) {
if (isMuted) return;
if (!text) return;
if (!window.speechSynthesis) return;

speechSynthesis.cancel();

const voice = new SpeechSynthesisUtterance(text);
voice.rate = 0.95;
voice.pitch = 0.85;
voice.volume = 1;

speechSynthesis.speak(voice);
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

if (voiceBtn) {
voiceBtn.addEventListener("click", function () {
setStatus("Voice mode ready");
speak("Voice mode ready");
});
}

function sendToVirtualOled(text) {
const oled = document.getElementById("virtualOled");

if (oled) {
oled.innerHTML = String(text || "").replace(/\n/g, "<br>");
}
}

function makeHudLines(text) {
const words = String(text || "No response.").split(" ");
const lines = [];
let line = "";

for (let i = 0; i < words.length; i++) {
const test = (line + " " + words[i]).trim();


if (test.length <= 20) {
  line = test;
} else {
  if (line) {
    lines.push(line);
  }

  line = words[i];
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

const clean = String(answer || "")
.split("*").join("")
.replace(/#/g, "")
.replace(/\n+/g, " ")
.replace(/\s+/g, " ")
.trim();

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

if (q.includes("who created you") || q.includes("who made you")) {
return "Created by\nSreekar";
}

const firstSentence = clean.split(/[.!?]/)[0].trim();
return makeHudLines(firstSentence);
}

function isEmergencyCommand(message) {
const lower = String(message || "").toLowerCase().trim();

return (
lower.includes("activate emergency") ||
lower.includes("emergency mode") ||
lower.includes("help me") ||
lower === "help" ||
lower === "emergency"
);
}

async function askJarvis(message) {
const lower = String(message || "").toLowerCase();

if (isEmergencyCommand(message)) {
sendToVirtualOled("SOS ACTIVE");
return {
reply: "Emergency mode activated. WhatsApp SOS can be added later.",
hud: "SOS ACTIVE"
};
}

if (
lower.includes("who created you") ||
lower.includes("who made you") ||
lower.includes("who built you") ||
lower.includes("who coded you")
) {
return {
reply: "I was created and developed by Sreekar.",
hud: "Created by\nSreekar"
};
}

if (lower.includes("open youtube")) {
window.open("https://youtube.com", "_blank");
return {
reply: "Opening YouTube.",
hud: "Opening\nYouTube"
};
}

if (lower.includes("open google")) {
window.open("https://google.com", "_blank");
return {
reply: "Opening Google.",
hud: "Opening\nGoogle"
};
}

if (lower.includes("calculator")) {
window.open("https://www.google.com/search?q=calculator", "_blank");
return {
reply: "Opening calculator.",
hud: "Opening\nCalculator"
};
}

if (lower.includes("weather")) {
window.open("https://www.google.com/search?q=weather", "_blank");
return {
reply: "Opening weather.",
hud: "Opening\nWeather"
};
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
  const errorMessage = data && data.error ? data.error : "Unknown server error";

  return {
    reply: "AI server error: " + errorMessage,
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

document.querySelectorAll(".quick-grid button").forEach(function (button) {
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

console.log("JARVIS minimal stable script loaded.");
