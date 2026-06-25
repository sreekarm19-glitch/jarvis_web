cat > script.js <<'EOF'
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
{ name: "Male Deep", rate: 0.92, pitch: 0.85 },
{ name: "Female", rate: 0.96, pitch: 1.08 },
{ name: "Robotic", rate: 0.92, pitch: 0.75 }
];

function setStatus(text) {
if (listenStatus) listenStatus.innerText = text;
}

function setResponse(text) {
if (responseBox) responseBox.innerText = text;
}

function sendToVirtualOled(text) {
const virtualOled = document.getElementById("virtualOled");
if (virtualOled) virtualOled.innerHTML = String(text || "").replace(/\n/g, "<br>");
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

if (dateEl) dateEl.innerText = now.toDateString();
}

setInterval(updateClock, 1000);
updateClock();

function speak(text) {
if (isMuted || !text || !("speechSynthesis" in window)) return;

speechSynthesis.cancel();

const utterance = new SpeechSynthesisUtterance(text);
utterance.rate = voiceModes[currentVoiceMode].rate;
utterance.pitch = voiceModes[currentVoiceMode].pitch;
utterance.volume = 1;

speechSynthesis.speak(utterance);
}

if (voiceBtn) {
voiceBtn.addEventListener("click", function () {
currentVoiceMode++;

```
if (currentVoiceMode >= voiceModes.length) {
  currentVoiceMode = 0;
}

voiceBtn.innerText = "Voice: " + voiceModes[currentVoiceMode].name;
setStatus("Voice changed to " + voiceModes[currentVoiceMode].name);
speak("Voice changed to " + voiceModes[currentVoiceMode].name);
```

});
}

if (muteBtn) {
muteBtn.addEventListener("click", function () {
isMuted = !isMuted;

```
if (isMuted) {
  if ("speechSynthesis" in window) speechSynthesis.cancel();
  muteBtn.innerText = "UNMUTE";
  setStatus("Muted");
} else {
  muteBtn.innerText = "MUTE";
  setStatus("System Active");
}
```

});
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
lower.includes("i'm in danger") ||
lower.includes("help me") ||
lower === "help" ||
lower === "emergency"
);
}

function makeHudLines(text) {
if (!text) return "No response.";

const words = String(text).split(" ");
const lines = [];
let line = "";

for (let i = 0; i < words.length; i++) {
const word = words[i];
const testLine = (line + " " + word).trim();

```
if (testLine.length <= 20) {
  line = testLine;
} else {
  if (line) lines.push(line);
  line = word;
}

if (lines.length === 3) break;
```

}

if (line && lines.length < 3) lines.push(line);

return lines.join("\n");
}

function makeTinyHudAnswer(question, answer) {
const q = String(question || "").toLowerCase();

const clean = String(answer || "")
.replace(/*/g, "")
.replace(/#/g, "")
.replace(/\n+/g, " ")
.replace(/\s+/g, " ")
.trim();

if (q.includes("speed")) return "Speed = Distance / Time";
if (q.includes("photosynthesis")) return "Plants make food\nusing sunlight.";
if (q.includes("gravity")) return "Gravity pulls objects\ntowards Earth.";
if (q.includes("force")) return "Force = Mass x\nAcceleration";
if (q.includes("area of circle")) return "Area = pi r^2";
if (q.includes("jarvis") && q.includes("full form")) {
return "JARVIS:\nJust A Rather Very\nIntelligent System";
}

if (clean.indexOf(":") !== -1) {
const afterColon = clean.split(":").slice(1).join(":").trim();
if (afterColon.length > 0) return makeHudLines(afterColon);
}

const firstSentence = clean.split(/[.!?]/)[0].trim();
return makeHudLines(firstSentence);
}

function cleanHudText(text) {
if (!text) return "No response.";

const clean = String(text)
.replace(/*/g, "")
.replace(/#/g, "")
.replace(/\r/g, "")
.replace(/\n{3,}/g, "\n")
.trim();

const lines = clean
.split("\n")
.map(function (line) {
return line.trim();
})
.filter(function (line) {
return line.length > 0;
});

if (lines.length > 0) {
return lines.slice(0, 3).join("\n");
}

return makeHudLines(clean);
}

async function askJarvis(message) {
const lower = String(message || "").toLowerCase();

if (isEmergencyCommand(message)) {
await triggerEmergencySOS();

```
return {
  reply: "Emergency mode activated. Opening WhatsApp SOS message.",
  hud: "SOS ACTIVE"
};
```

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

```
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
  reply: "I could not get a proper response from the AI server.",
  hud: "No proper\nresponse."
};
```

} catch (error) {
console.error("Ask JARVIS error:", error);

```
return {
  reply: "I cannot connect to the JARVIS AI server.",
  hud: "Server offline."
};
```

}
}

async function sendMessage() {
if (isProcessing || !input) return;

const message = input.value.trim();

if (!message) return;

isProcessing = true;

if ("speechSynthesis" in window) speechSynthesis.cancel();

setResponse("Thinking...");
setStatus("Processing...");

try {
const emergencyCommand = isEmergencyCommand(message);
const result = await askJarvis(message);

```
const reply = result.reply || String(result);
const hudAnswer = result.hud || makeTinyHudAnswer(message, reply);
const shortAnswer = cleanHudText(hudAnswer);

setResponse(reply);
setStatus("System Active");
sendToVirtualOled(shortAnswer);

if (!emergencyCommand) {
  await sendToGlasses("AI:" + shortAnswer);
}

speak(reply);
input.value = "";
```

} catch (error) {
console.error("Send message error:", error);
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
if (event.key === "Enter") sendMessage();
});
}

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;

if (SpeechRecognition) {
recognition = new SpeechRecognition();
recognition.lang = "en-US";
recognition.continuous = false;
recognition.interimResults = false;

if (micBtn) {
micBtn.addEventListener("click", function () {
if (isListening || isProcessing) return;

```
  if ("speechSynthesis" in window) speechSynthesis.cancel();

  isListening = true;
  setStatus("Listening...");
  setResponse("Listening...");

  try {
    recognition.start();
  } catch (error) {
    console.error("Mic start error:", error);
    isListening = false;
    setStatus("Mic Error");
  }
});
```

}

recognition.onresult = function (event) {
const transcript = event.results[0][0].transcript.trim();

```
if (!transcript) {
  isListening = false;
  return;
}

input.value = transcript;
setResponse("You said: " + transcript);
setStatus("Processing...");
isListening = false;

setTimeout(sendMessage, 300);
```

};

recognition.onerror = function () {
isListening = false;
setStatus("Mic Error");
setResponse("Microphone error. Check Chrome microphone permission.");
};

recognition.onend = function () {
isListening = false;

```
if (!isProcessing && listenStatus && listenStatus.innerText === "Listening...") {
  setStatus("System Active");
  setResponse("No speech detected. Try again.");
}
```

};
} else if (micBtn) {
micBtn.disabled = true;
micBtn.innerText = "NO MIC";
}

function setupQuickAccessButtons() {
const buttons = document.querySelectorAll(".quick-grid button");

buttons.forEach(function (button) {
button.addEventListener("click", function () {
const action = button.dataset.action;

```
  if (action === "google") {
    window.open("https://google.com", "_blank");
    setResponse("Opening Google.");
    sendToVirtualOled("Opening\nGoogle");
    speak("Opening Google.");
  } else if (action === "youtube") {
    window.open("https://youtube.com", "_blank");
    setResponse("Opening YouTube.");
    sendToVirtualOled("Opening\nYouTube");
    speak("Opening YouTube.");
  } else if (action === "weather") {
    window.open("https://www.google.com/search?q=weather", "_blank");
    setResponse("Opening Weather.");
    sendToVirtualOled("Opening\nWeather");
    speak("Opening Weather.");
  } else if (action === "calculator") {
    window.open("https://www.google.com/search?q=calculator", "_blank");
    setResponse("Opening Calculator.");
    sendToVirtualOled("Opening\nCalculator");
    speak("Opening Calculator.");
  } else if (action === "netflix") {
    window.open("https://www.netflix.com", "_blank");
    setResponse("Opening Netflix.");
    sendToVirtualOled("Opening\nNetflix");
    speak("Opening Netflix.");
  } else if (action === "swiggy") {
    window.open("https://www.swiggy.com", "_blank");
    setResponse("Opening Swiggy.");
    sendToVirtualOled("Opening\nSwiggy");
    speak("Opening Swiggy.");
  }
});
```

});
}

setupQuickAccessButtons();

async function updateSystemStatus() {
try {
const res = await fetch("/status");
const data = await res.json();

```
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
```

} catch (error) {
console.error("System status error:", error);
}
}

async function updateBatteryStatus() {
const batteryText = document.getElementById("batteryText");
const batteryBar = document.getElementById("batteryBar");

try {
if ("getBattery" in navigator && typeof navigator.getBattery === "function") {
const battery = await navigator.getBattery();

```
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
```

} catch (error) {
console.error("Battery status error:", error);

```
if (batteryText) batteryText.innerText = "N/A";
if (batteryBar) batteryBar.style.width = "0%";
```

}
}

setInterval(updateSystemStatus, 3000);
updateSystemStatus();
updateBatteryStatus();

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
setResponse("Bluetooth not supported. Use Chrome or Edge.");
setStatus("Bluetooth Not Supported");
return;
}

```
setResponse("Searching for EDITH...");
setStatus("Connecting...");

glassesDevice = await navigator.bluetooth.requestDevice({
  filters: [{ namePrefix: "EDITH" }],
  optionalServices: [EDITH_SERVICE_UUID]
});

glassesDevice.addEventListener("gattserverdisconnected", function () {
  glassesConnected = false;
  glassesCharacteristic = null;
  glassesTxCharacteristic = null;
  setResponse("EDITH disconnected.");
  setStatus("EDITH Disconnected");
  sendToVirtualOled("EDITH DISCONNECTED");
});

const server = await glassesDevice.gatt.connect();
const service = await server.getPrimaryService(EDITH_SERVICE_UUID);

glassesCharacteristic = await service.getCharacteristic(EDITH_RX_CHARACTERISTIC_UUID);
glassesTxCharacteristic = await service.getCharacteristic(EDITH_TX_CHARACTERISTIC_UUID);

await glassesTxCharacteristic.startNotifications();
glassesTxCharacteristic.addEventListener("characteristicvaluechanged", handleEdithNotification);

glassesConnected = true;

setResponse("EDITH connected.");
setStatus("EDITH Connected");
sendToVirtualOled("EDITH CONNECTED<br>Ready for JARVIS");
speak("EDITH connected.");
```

} catch (error) {
console.error("EDITH connection error:", error);
setResponse("Could not connect to EDITH. Use Chrome and turn on Bluetooth.");
setStatus("Connection Failed");
}
}

function handleEdithNotification(event) {
const decoder = new TextDecoder();
const command = decoder.decode(event.target.value);

console.log("Received from EDITH:", command);

if (command === "JARVIS_LISTEN") {
startJarvisFromEdith();
} else if (command === "SOS_TRIGGERED") {
setResponse("Emergency triggered from EDITH button.");
setStatus("SOS Triggered");

```
if (input) input.value = "Jarvis activate emergency";

sendMessage();
```

} else if (command === "EDITH_SLEEP") {
setResponse("EDITH entered standby mode.");
setStatus("EDITH Standby");
sendToVirtualOled("EDITH STANDBY");
} else if (command === "EDITH_WAKE") {
setResponse("EDITH is awake.");
setStatus("EDITH Awake");
sendToVirtualOled("EDITH AWAKE<br>Ready");
}
}

function startJarvisFromEdith() {
if (isProcessing) {
setResponse("JARVIS is already processing.");
return;
}

setResponse("EDITH requested JARVIS voice input.");
setStatus("Listening from EDITH...");
sendToVirtualOled("JARVIS<br>LISTENING");

if (micBtn && !micBtn.disabled) {
micBtn.click();
} else {
setResponse("Microphone is not available in this browser.");
setStatus("Mic Not Available");
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

```
console.log("Sent to EDITH:", command);
```

} catch (error) {
console.error("EDITH send error:", error);

```
setResponse("EDITH disconnected. Reconnect EDITH.");
setStatus("EDITH Send Failed");
```

}
}

async function triggerEmergencySOS() {
sendToVirtualOled("SOS ACTIVE<br>Emergency triggered");

await sendToGlasses("SOS");

try {
const position = await getCurrentLocation();
const latitude = position.coords.latitude;
const longitude = position.coords.longitude;

```
openWhatsAppSOS(latitude, longitude);
```

} catch (error) {
console.error("Location error:", error);

```
const message = encodeURIComponent(
  "EMERGENCY ALERT from EDITH.\nI may need help.\nLocation could not be detected."
);

window.open("https://wa.me/" + EMERGENCY_PHONE_NUMBER + "?text=" + message, "_blank");
```

}
}

function getCurrentLocation() {
return new Promise(function (resolve, reject) {
if (!navigator.geolocation) {
reject(new Error("Geolocation not supported"));
return;
}

```
navigator.geolocation.getCurrentPosition(resolve, reject, {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 0
});
```

});
}

function openWhatsAppSOS(latitude, longitude) {
const locationLink = "https://maps.google.com/?q=" + latitude + "," + longitude;

const message = encodeURIComponent(
"EMERGENCY ALERT from EDITH.\nI may need help.\nMy current location:\n" + locationLink
);

window.open("https://wa.me/" + EMERGENCY_PHONE_NUMBER + "?text=" + message, "_blank");
}

const connectBtn = document.getElementById("connectGlassesBtn");

if (connectBtn) {
connectBtn.innerText = "Connect EDITH";
connectBtn.addEventListener("click", connectGlasses);
}

console.log("JARVIS clean script loaded.");
EOF

node --check script.js
