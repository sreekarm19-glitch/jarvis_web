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

// ================= VOICE =================

let jarvisVoices = [];

function loadVoices() {
jarvisVoices = speechSynthesis.getVoices();
}

speechSynthesis.onvoiceschanged = loadVoices;
loadVoices();

function speak(text) {
if (isMuted) return;
if (!text) return;

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
const lower = (message || "").toLowerCase().trim();

return (
lower.includes("jarvis activate emergency") ||
lower.includes("activate emergency") ||
lower.includes("trigger emergency") ||
lower.includes("send emergency alert") ||
lower.includes("emergency mode") ||
lower.includes("i am in danger") ||
lower.includes("im in danger") ||
lower.includes("i'm in danger") ||
lower.includes("help me") ||
lower === "emergency" ||
lower === "help"
);
}

// ================= JARVIS AI =================

async function askJarvis(message) {
const lower = message.toLowerCase();

if (isEmergencyCommand(message)) {
await triggerEmergencySOS();


return {
  reply: "Emergency mode activated. Opening WhatsApp SOS message.",
  hud: "SOS ACTIVE"
};


}

if (
lower.includes("who created you") ||
lower.includes("who made you") ||
lower.includes("who built you") ||
lower.includes("your creator") ||
lower.includes("who developed you") ||
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
body: JSON.stringify({ message: message })
});


const data = await res.json();

if (data.reply) {
  return {
    reply: data.reply,
    hud: data.hud || makeTinyHudAnswer(message, data.reply)
  };
}

if (data.error) {
  const errorText = "AI server error: " + data.error;

  return {
    reply: errorText,
    hud: "AI Server Error"
  };
}

return {
  reply: "I could not get a proper response from the AI server.",
  hud: "No proper\nresponse."
};


} catch (error) {
console.error("Ask JARVIS error:", error);


return {
  reply: "I cannot connect to the JARVIS AI server. Make sure the server is running.",
  hud: "Server offline."
};


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

try {
const emergencyCommand = isEmergencyCommand(message);
const result = await askJarvis(message);


const reply = typeof result === "string" ? result : result.reply;
const hudAnswer =
  typeof result === "string"
    ? makeTinyHudAnswer(message, result)
    : result.hud || makeTinyHudAnswer(message, result.reply);

responseBox.innerText = reply;
listenStatus.innerText = "System Active";

const shortAnswer = cleanHudText(hudAnswer);

console.log("EDITH HUD answer:", shortAnswer);

sendToVirtualOled(shortAnswer);

if (!emergencyCommand) {
  await sendToGlasses("AI:" + shortAnswer);
}

speak(reply);
input.value = "";


} catch (error) {
console.error("Send message error:", error);
responseBox.innerText = "Something went wrong in JARVIS.";
listenStatus.innerText = "Error";
} finally {
isProcessing = false;
}
}

if (sendBtn) {
sendBtn.addEventListener("click", sendMessage);
}

if (input) {
input.addEventListener("keydown", event => {
if (event.key === "Enter") {
sendMessage();
}
});
}

// ================= MIC INPUT =================

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;

if (SpeechRecognition) {
recognition = new SpeechRecognition();

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
  console.error("Mic start error:", error);
  isListening = false;
  listenStatus.innerText = "Mic Error";
}


});

recognition.onresult = event => {
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
if (micBtn) {
micBtn.disabled = true;
micBtn.innerText = "NO MIC";
}
}

// ================= QUICK ACCESS =================

document.querySelectorAll(".quick-grid button").forEach(button => {
button.addEventListener("click", () => {
const action = button.dataset.action;


if (action === "google") {
  window.open("https://google.com", "_blank");
  responseBox.innerText = "Opening Google.";
  sendToVirtualOled("Opening\nGoogle");
  speak("Opening Google.");
}

if (action === "youtube") {
  window.open("https://youtube.com", "_blank");
  responseBox.innerText = "Opening YouTube.";
  sendToVirtualOled("Opening\nYouTube");
  speak("Opening YouTube.");
}

if (action === "weather") {
  window.open("https://www.google.com/search?q=weather", "_blank");
  responseBox.innerText = "Opening Weather.";
  sendToVirtualOled("Opening\nWeather");
  speak("Opening Weather.");
}

if (action === "calculator") {
  window.open("https://www.google.com/search?q=calculator", "_blank");
  responseBox.innerText = "Opening Calculator.";
  sendToVirtualOled("Opening\nCalculator");
  speak("Opening Calculator.");
}

if (action === "netflix") {
  window.open("https://www.netflix.com", "_blank");
  responseBox.innerText = "Opening Netflix.";
  sendToVirtualOled("Opening\nNetflix");
  speak("Opening Netflix.");
}

if (action === "swiggy") {
  window.open("https://www.swiggy.com", "_blank");
  responseBox.innerText = "Opening Swiggy.";
  sendToVirtualOled("Opening\nSwiggy");
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

const cpuText = document.getElementById("cpuText");
const cpuBar = document.getElementById("cpuBar");
const ramText = document.getElementById("ramText");
const ramBar = document.getElementById("ramBar");

if (cpuText) cpuText.innerText = cpu + "%";
if (cpuBar) cpuBar.style.width = cpu + "%";

if (ramText) ramText.innerText = ram + "%";
if (ramBar) ramBar.style.width = ram + "%";


} catch (error) {
const cpuText = document.getElementById("cpuText");
const ramText = document.getElementById("ramText");


if (cpuText) cpuText.innerText = "ERR";
if (ramText) ramText.innerText = "ERR";


}
}

async function updateBatteryStatus() {
try {
const batteryText = document.getElementById("batteryText");
const batteryBar = document.getElementById("batteryBar");


if ("getBattery" in navigator) {
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
const batteryText = document.getElementById("batteryText");
const batteryBar = document.getElementById("batteryBar");


if (batteryText) batteryText.innerText = "N/A";
if (batteryBar) batteryBar.style.width = "0%";


}
}

setInterval(updateSystemStatus, 3000);
updateSystemStatus();
updateBatteryStatus();

// ================= SHORT ANSWER FOR EDITH =================

function cleanHudText(text) {
if (!text) return "No response.";

let clean = text
.toString()
.replace(/*/g, "")
.replace(/#/g, "")
.replace(/\r/g, "")
.replace(/\n{3,}/g, "\n")
.trim();

const lines = clean
.split("\n")
.map(line => line.trim())
.filter(line => line.length > 0);

if (lines.length > 0) {
return lines.slice(0, 3).join("\n");
}

return makeHudLines(clean);
}

function makeTinyHudAnswer(question, answer) {
const q = (question || "").toLowerCase();

let clean = (answer || "")
.replace(/*/g, "")
.replace(/#/g, "")
.replace(/\n+/g, " ")
.replace(/\s+/g, " ")
.trim();

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

if (q.includes("area of circle")) {
return "Area = pi r^2";
}

if (q.includes("jarvis") && q.includes("full form")) {
return "JARVIS:\nJust A Rather Very\nIntelligent System";
}

if (clean.includes(":")) {
const afterColon = clean.split(":").slice(1).join(":").trim();


if (afterColon.length > 0) {
  return makeHudLines(afterColon);
}


}

const firstSentence = clean.split(/[.!?]/)[0].trim();

return makeHudLines(firstSentence);
}

function makeHudLines(text) {
if (!text) return "No response.";

const words = text.split(" ");
const lines = [];
let line = "";

for (const word of words) {
if ((line + " " + word).trim().length <= 20) {
line = (line + " " + word).trim();
} else {
if (line) lines.push(line);
line = word;
}


if (lines.length === 3) break;


}

if (line && lines.length < 3) {
lines.push(line);
}

return lines.join("\n");
}

// ================= EDITH BLUETOOTH + OLED BRIDGE =================

let glassesDevice = null;
let glassesCharacteristic = null;
let glassesTxCharacteristic = null;
let glassesConnected = false;

const EDITH_SERVICE_UUID = "7b3f0001-2a6d-4a4e-9b8b-ed1700000001";
const EDITH_RX_CHARACTERISTIC_UUID = "7b3f0002-2a6d-4a4e-9b8b-ed1700000002";
const EDITH_TX_CHARACTERISTIC_UUID = "7b3f0003-2a6d-4a4e-9b8b-ed1700000003";

const EMERGENCY_PHONE_NUMBER = "91XXXXXXXXXX";

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
  glassesTxCharacteristic = null;

  responseBox.innerText = "EDITH disconnected.";
  listenStatus.innerText = "EDITH Disconnected";
  sendToVirtualOled("EDITH DISCONNECTED");
});

const server = await glassesDevice.gatt.connect();
const service = await server.getPrimaryService(EDITH_SERVICE_UUID);

glassesCharacteristic = await service.getCharacteristic(EDITH_RX_CHARACTERISTIC_UUID);
glassesTxCharacteristic = await service.getCharacteristic(EDITH_TX_CHARACTERISTIC_UUID);

await glassesTxCharacteristic.startNotifications();

glassesTxCharacteristic.addEventListener(
  "characteristicvaluechanged",
  handleEdithNotification
);

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

function handleEdithNotification(event) {
const decoder = new TextDecoder();
const command = decoder.decode(event.target.value);

console.log("Received from EDITH:", command);

if (command === "JARVIS_LISTEN") {
startJarvisFromEdith();
return;
}

if (command === "SOS_TRIGGERED") {
responseBox.innerText = "Emergency triggered from EDITH button.";
listenStatus.innerText = "SOS Triggered";
input.value = "Jarvis activate emergency";
sendMessage();
return;
}

if (command === "EDITH_SLEEP") {
responseBox.innerText = "EDITH entered standby mode.";
listenStatus.innerText = "EDITH Standby";
sendToVirtualOled("EDITH STANDBY");
return;
}

if (command === "EDITH_WAKE") {
responseBox.innerText = "EDITH is awake.";
listenStatus.innerText = "EDITH Awake";
sendToVirtualOled("EDITH AWAKE<br>Ready");
return;
}
}

function startJarvisFromEdith() {
if (isProcessing) {
responseBox.innerText = "JARVIS is already processing.";
return;
}

responseBox.innerText = "EDITH requested JARVIS voice input.";
listenStatus.innerText = "Listening from EDITH...";
sendToVirtualOled("JARVIS<br>LISTENING");

if (micBtn && !micBtn.disabled) {
micBtn.click();
} else {
responseBox.innerText = "Microphone is not available in this browser.";
listenStatus.innerText = "Mic Not Available";
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
virtualOled.innerHTML = text.toString().replace(/\n/g, "<br>");
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

window.open("https://wa.me/" + EMERGENCY_PHONE_NUMBER + "?text=" + message, "_blank");


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
const locationLink = "https://maps.google.com/?q=" + latitude + "," + longitude;

const message = encodeURIComponent(
"EMERGENCY ALERT from EDITH.\n" +
"I may need help.\n" +
"My current location:\n" +
locationLink
);

window.open("https://wa.me/" + EMERGENCY_PHONE_NUMBER + "?text=" + message, "_blank");
}

const connectBtn = document.getElementById("connectGlassesBtn");

if (connectBtn) {
connectBtn.innerText = "Connect EDITH";
connectBtn.addEventListener("click", connectGlasses);
}

console.log("JARVIS script loaded successfully.");

