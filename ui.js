(function () {
  const navItems = document.querySelectorAll(".nav-item");
  const hero = document.querySelector(".hero");
  const chatPanel = document.querySelector(".chat-panel");
  const inputSection = document.querySelector(".input-section");
  const mainArea = document.querySelector(".main-area");

  let pageView = document.getElementById("pageView");

  if (!pageView) {
    pageView = document.createElement("section");
    pageView.id = "pageView";
    pageView.className = "page-view";
    pageView.style.display = "none";
    mainArea.insertBefore(pageView, inputSection);
  }

  function openChat() {
    hero.style.display = "";
    chatPanel.style.display = "";
    inputSection.style.display = "";
    pageView.style.display = "none";
  }

  function openPage(title, subtitle, content) {
    hero.style.display = "none";
    chatPanel.style.display = "none";
    inputSection.style.display = "none";

    pageView.style.display = "block";
    pageView.innerHTML =
      '<div class="page-title">' +
      '<p>JARVIS MODULE</p>' +
      '<h2>' + title + '</h2>' +
      '<span>' + subtitle + '</span>' +
      '</div>' +
      content;
  }

  function setActive(clicked) {
    navItems.forEach(function (btn) {
      btn.classList.remove("active");
    });
    clicked.classList.add("active");
  }

  function openSystem() {
    const cpu = document.getElementById("cpuText") ? document.getElementById("cpuText").innerText : "N/A";
    const ram = document.getElementById("ramText") ? document.getElementById("ramText").innerText : "N/A";
    const battery = document.getElementById("batteryText") ? document.getElementById("batteryText").innerText : "N/A";

    openPage(
      "System",
      "System settings and status moved here.",
      '<div class="page-grid">' +
        '<div class="panel-card"><h3>CPU</h3><strong>' + cpu + '</strong></div>' +
        '<div class="panel-card"><h3>RAM</h3><strong>' + ram + '</strong></div>' +
        '<div class="panel-card"><h3>Battery</h3><strong>' + battery + '</strong></div>' +
        '<div class="panel-card"><h3>EDITH</h3><p>Bluetooth connection pending.</p><button class="panel-btn" id="systemConnectEdith">Connect EDITH</button></div>' +
        '<div class="panel-card"><h3>JARVIS</h3><p>AI server and chat interface active.</p></div>' +
        '<div class="panel-card"><h3>Emergency</h3><p>WhatsApp SOS is active.</p><button class="panel-btn danger-text" id="systemSos">Test SOS</button></div>' +
      '</div>'
    );

    document.getElementById("systemConnectEdith").onclick = function () {
      document.getElementById("connectGlassesBtn").click();
    };

    document.getElementById("systemSos").onclick = function () {
      openChat();
      document.getElementById("commandInput").value = "activate emergency";
      document.getElementById("sendBtn").click();
    };
  }

  function openMemory() {
    const saved = localStorage.getItem("jarvis_memory") || "";

    openPage(
      "Memory",
      "Save simple browser memory for JARVIS.",
      '<div class="panel-card memory-card">' +
        '<h3>Saved Memory</h3>' +
        '<textarea id="memoryInput" placeholder="Example: My project is EDITH. My creator is Sreekar.">' + saved + '</textarea>' +
        '<br><br>' +
        '<button class="panel-btn" id="saveMemory">Save Memory</button> ' +
        '<button class="panel-btn" id="clearMemory">Clear</button>' +
        '<p id="memoryMsg">Ready.</p>' +
      '</div>'
    );

    document.getElementById("saveMemory").onclick = function () {
      const value = document.getElementById("memoryInput").value;
      localStorage.setItem("jarvis_memory", value);
      document.getElementById("memoryMsg").innerText = "Memory saved.";
    };

    document.getElementById("clearMemory").onclick = function () {
      localStorage.removeItem("jarvis_memory");
      document.getElementById("memoryInput").value = "";
      document.getElementById("memoryMsg").innerText = "Memory cleared.";
    };
  }

  function openTools() {
    openPage(
      "Tools",
      "Quick actions and shortcuts.",
      '<div class="tools-grid">' +
        '<button class="tool-button" id="toolGoogle">🌐 Web Search</button>' +
        '<button class="tool-button" id="toolYoutube">▶ YouTube</button>' +
        '<button class="tool-button" id="toolWeather">☁ Weather</button>' +
        '<button class="tool-button" id="toolCalculator">🧮 Calculator</button>' +
        '<button class="tool-button" id="toolNetflix">N Netflix</button>' +
        '<button class="tool-button" id="toolSwiggy">🍽 Swiggy</button>' +
        '<button class="tool-button danger-text" id="toolSos">🚨 Emergency SOS</button>' +
      '</div>'
    );

    document.getElementById("toolGoogle").onclick = function () { window.open("https://google.com", "_blank"); };
    document.getElementById("toolYoutube").onclick = function () { window.open("https://youtube.com", "_blank"); };
    document.getElementById("toolWeather").onclick = function () { window.open("https://www.google.com/search?q=weather", "_blank"); };
    document.getElementById("toolCalculator").onclick = function () { window.open("https://www.google.com/search?q=calculator", "_blank"); };
    document.getElementById("toolNetflix").onclick = function () { window.open("https://netflix.com", "_blank"); };
    document.getElementById("toolSwiggy").onclick = function () { window.open("https://swiggy.com", "_blank"); };

    document.getElementById("toolSos").onclick = function () {
      openChat();
      document.getElementById("commandInput").value = "activate emergency";
      document.getElementById("sendBtn").click();
    };
  }

  function openSettings() {
    openPage(
      "Settings",
      "Control JARVIS voice and chat settings.",
      '<div class="page-grid">' +
        '<div class="panel-card"><h3>Voice</h3><p>Switch voice mode.</p><button class="panel-btn" id="voiceDeep">Deep</button> <button class="panel-btn" id="voiceFemale">Female</button> <button class="panel-btn" id="voiceRobotic">Robotic</button></div>' +
        '<div class="panel-card"><h3>Audio</h3><p>Mute or unmute JARVIS.</p><button class="panel-btn" id="toggleMute">Toggle Mute</button></div>' +
        '<div class="panel-card"><h3>Chat</h3><p>Clear response box.</p><button class="panel-btn" id="clearChat">Clear Chat</button></div>' +
      '</div>'
    );

    function setVoice(index) {
      try {
        currentVoiceMode = index;
        const voiceName = voiceModes[currentVoiceMode].name;
        document.getElementById("voiceBtn").innerText = "≋ Voice: " + voiceName;
        setStatus("Voice changed to " + voiceName);
        speak("Voice changed to " + voiceName);
      } catch (err) {
        console.log(err);
      }
    }

    document.getElementById("voiceDeep").onclick = function () { setVoice(0); };
    document.getElementById("voiceFemale").onclick = function () { setVoice(1); };
    document.getElementById("voiceRobotic").onclick = function () { setVoice(2); };

    document.getElementById("toggleMute").onclick = function () {
      document.getElementById("muteBtn").click();
    };

    document.getElementById("clearChat").onclick = function () {
      document.getElementById("responseBox").innerText = "Ready when you are.";
    };
  }

  function cycleVoice() {
    try {
      currentVoiceMode++;
      if (currentVoiceMode >= voiceModes.length) {
        currentVoiceMode = 0;
      }

      const voiceName = voiceModes[currentVoiceMode].name;
      document.getElementById("voiceBtn").innerText = "≋ Voice: " + voiceName;
      setStatus("Voice changed to " + voiceName);
      speak("Voice changed to " + voiceName);
    } catch (err) {
      console.log(err);
    }
  }

  navItems.forEach(function (button) {
    button.addEventListener("click", function (event) {
      const text = button.innerText.toLowerCase();

      setActive(button);

      if (text.includes("home")) openChat();
      else if (text.includes("chat")) openChat();
      else if (text.includes("voice")) return;
      else if (text.includes("vision")) openPage("Vision", "Vision features can be added later.", '<div class="panel-card"><h3>Vision</h3><p>Camera/image input will be added later.</p></div>');
      else if (text.includes("system")) openSystem();
      else if (text.includes("memory")) openMemory();
      else if (text.includes("tools")) openTools();
      else if (text.includes("settings")) openSettings();
    });
  });
})();