(function () {
  const mainArea = document.querySelector(".main-area");
  const hero = document.querySelector(".hero");
  const chatPanel = document.querySelector(".chat-panel");
  const inputSection = document.querySelector(".input-section");
  const navItems = document.querySelectorAll(".nav-item");

  if (!mainArea) return;

  let pageView = document.getElementById("pageView");

  if (!pageView) {
    pageView = document.createElement("section");
    pageView.id = "pageView";
    pageView.className = "page-view";
    mainArea.insertBefore(pageView, inputSection);
  }

  function setActive(name) {
    navItems.forEach(function (btn) {
      btn.classList.remove("active");
      const text = String(btn.textContent || "").toLowerCase();
      if (text.includes(name)) btn.classList.add("active");
    });
  }

  function showChat(active) {
    if (hero) hero.style.display = "";
    if (chatPanel) chatPanel.style.display = "";
    if (inputSection) inputSection.style.display = "";
    pageView.style.display = "none";
    setActive(active || "home");

    if (window.jarvisOpenActiveChat) {
      window.jarvisOpenActiveChat();
    }
  }

  function newChat() {
    if (window.jarvisCreateNewChat) {
      window.jarvisCreateNewChat();
    }

    showChat("chat");

    const input = document.getElementById("commandInput");
    if (input) input.focus();
  }

  function escapeHtml(text) {
    return String(text || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function formatDate(time) {
    if (!time) return "";
    return new Date(time).toLocaleDateString([], {
      month: "short",
      day: "numeric"
    });
  }

  function renderPage(name, title, subtitle, body) {
    if (hero) hero.style.display = "none";
    if (chatPanel) chatPanel.style.display = "none";
    if (inputSection) inputSection.style.display = "none";

    pageView.style.display = "block";
    setActive(name);

    pageView.innerHTML =
      '<div class="page-title">' +
        '<p>JARVIS MODULE</p>' +
        '<h2>' + title + '</h2>' +
        '<span>' + subtitle + '</span>' +
      '</div>' +
      body;
  }

  function renderMemory() {
    if (hero) hero.style.display = "none";
    if (chatPanel) chatPanel.style.display = "none";
    if (inputSection) inputSection.style.display = "none";

    pageView.style.display = "block";
    setActive("memory");

    const chats = window.jarvisGetChats ? window.jarvisGetChats() : [];
    const pinned = chats.filter(function (c) { return c.pinned; });
    const recents = chats.filter(function (c) { return !c.pinned; });

    pageView.innerHTML =
      '<div class="memory-chat-page-final">' +
        '<div class="memory-chat-top-final">' +
          '<div><h2>Chats</h2></div>' +
          '<button id="newChatFromMemory">＋ New Chat</button>' +
        '</div>' +
        '<div class="memory-chat-section-final"><h3>Pinned</h3><div id="pinnedList"></div></div>' +
        '<div class="memory-chat-section-final"><h3>Recents</h3><div id="recentList"></div></div>' +
      '</div>';

    function addRows(box, list) {
      if (!list.length) {
        box.innerHTML = '<p class="empty-chat-note">No chats here yet.</p>';
        return;
      }

      list.forEach(function (chat) {
        const row = document.createElement("div");
        row.className = "memory-chat-row";

        const open = document.createElement("button");
        open.className = "memory-chat-open";
        open.innerHTML =
          '<span>◌</span>' +
          '<span class="memory-chat-title">' + escapeHtml(chat.title || "New chat") + '</span>' +
          '<small>' + formatDate(chat.updatedAt) + '</small>';

        open.onclick = function () {
          if (window.jarvisLoadChat) window.jarvisLoadChat(chat.id);
          showChat("home");
        };

        const actions = document.createElement("div");
        actions.className = "memory-chat-actions";

        const pin = document.createElement("button");
        pin.textContent = chat.pinned ? "Unpin" : "Pin";
        pin.onclick = function () {
          if (window.jarvisPinChat) window.jarvisPinChat(chat.id);
          renderMemory();
        };

        const del = document.createElement("button");
        del.textContent = "Delete";
        del.onclick = function () {
          
          if (window.jarvisDeleteChat) window.jarvisDeleteChat(chat.id);
          renderMemory();
        };

        actions.appendChild(pin);
        actions.appendChild(del);
        row.appendChild(open);
        row.appendChild(actions);
        box.appendChild(row);
      });
    }

    addRows(document.getElementById("pinnedList"), pinned);
    addRows(document.getElementById("recentList"), recents);

    document.getElementById("newChatFromMemory").onclick = newChat;
  }

  async function renderSystem() {
    const cpuText = document.getElementById("cpuText");
    const ramText = document.getElementById("ramText");
    const batteryText = document.getElementById("batteryText");

    const cpu = cpuText ? cpuText.innerText : "N/A";
    const ram = ramText ? ramText.innerText : "N/A";
    const battery = batteryText ? batteryText.innerText : "N/A";

    renderPage(
      "system",
      "System",
      "Status, EDITH connection, and emergency controls.",
      '<div class="page-grid">' +
        '<div class="panel-card"><h3>CPU</h3><strong>' + cpu + '</strong><p>Current server activity.</p></div>' +
        '<div class="panel-card"><h3>RAM</h3><strong>' + ram + '</strong><p>Memory usage.</p></div>' +
        '<div class="panel-card"><h3>Battery</h3><strong>' + battery + '</strong><p>Browser device battery.</p></div>' +
        '<div class="panel-card"><h3>EDITH</h3><p>Connect your wearable HUD device.</p><button class="panel-btn" id="systemConnectEdith">Connect EDITH</button></div>' +
        '<div class="panel-card"><h3>JARVIS</h3><p>AI server and chat interface are active.</p><button class="panel-btn" id="systemRefreshStatus">Refresh Status</button></div>' +
        '<div class="panel-card"><h3>Emergency</h3><p>Open WhatsApp SOS with location.</p><button class="panel-btn danger-text" id="systemSos">Test SOS</button></div>' +
      '</div>'
    );

    document.getElementById("systemConnectEdith").onclick = function () {
      const connect = document.getElementById("connectGlassesBtn");
      if (connect) connect.click();
    };

    document.getElementById("systemRefreshStatus").onclick = function () {
      if (typeof updateSystemStatus === "function") {
        updateSystemStatus();
      }
      renderSystem();
    };

    document.getElementById("systemSos").onclick = function () {
      showChat("home");
      const input = document.getElementById("commandInput");
      const send = document.getElementById("sendBtn");
      if (input) input.value = "activate emergency";
      if (send) send.click();
    };
  }

  function renderTools() {
    renderPage(
      "tools",
      "Tools",
      "Quick actions and useful shortcuts.",
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

    document.getElementById("toolGoogle").onclick = function () {
      window.open("https://google.com", "_blank");
    };

    document.getElementById("toolYoutube").onclick = function () {
      window.open("https://youtube.com", "_blank");
    };

    document.getElementById("toolWeather").onclick = function () {
      window.open("https://www.google.com/search?q=weather", "_blank");
    };

    document.getElementById("toolCalculator").onclick = function () {
      window.open("https://www.google.com/search?q=calculator", "_blank");
    };

    document.getElementById("toolNetflix").onclick = function () {
      window.open("https://netflix.com", "_blank");
    };

    document.getElementById("toolSwiggy").onclick = function () {
      window.open("https://swiggy.com", "_blank");
    };

    document.getElementById("toolSos").onclick = function () {
      showChat("home");
      const input = document.getElementById("commandInput");
      const send = document.getElementById("sendBtn");
      if (input) input.value = "activate emergency";
      if (send) send.click();
    };
  }

  function renderSettings() {
    renderPage(
      "settings",
      "Settings",
      "Control JARVIS behaviour.",
      '<div class="page-grid">' +
        '<div class="panel-card"><h3>Chat</h3><p>Clear the current active chat.</p><button class="panel-btn" id="clearChat">Clear Chat</button></div>' +
        '<div class="panel-card"><h3>Model</h3><p>Reset model selector to JARVIS balanced mode.</p><button class="panel-btn" id="resetModel">Reset Model</button></div>' +
        '<div class="panel-card"><h3>Audio</h3><p>Mute or unmute JARVIS voice output.</p><button class="panel-btn" id="settingsMute">Toggle Mute</button></div>' +
        '<div class="panel-card"><h3>Memory</h3><p>Clear long-term browser memory summary only.</p><button class="panel-btn danger-text" id="clearMemoryOnly">Clear Memory</button></div>' +
      '</div>'
    );

    document.getElementById("clearChat").onclick = function () {
      if (window.jarvisClearSavedChat) window.jarvisClearSavedChat();
      showChat("home");
    };

    document.getElementById("resetModel").onclick = function () {
      localStorage.setItem("jarvis_selected_model", "JARVIS");
      const select = document.getElementById("modelSelect");
      if (select) select.value = "JARVIS";
      alert("Model reset to JARVIS.");
    };

    document.getElementById("settingsMute").onclick = function () {
      const mute = document.getElementById("muteBtn");
      if (mute) mute.click();
    };

    document.getElementById("clearMemoryOnly").onclick = function () {
      localStorage.removeItem("jarvis_memory");
      alert("Memory summary cleared.");
    };
  }

  function renderVision() {
    renderPage(
      "vision",
      "Vision",
      "Camera and image features.",
      '<div class="page-grid">' +
        '<div class="panel-card"><h3>Image Analysis</h3><p>Upload or camera vision can be added later.</p><button class="panel-btn" disabled>Coming Soon</button></div>' +
        '<div class="panel-card"><h3>EDITH Camera</h3><p>Future wearable vision support.</p><button class="panel-btn" disabled>Pending</button></div>' +
      '</div>'
    );
  }

  document.addEventListener("click", function (event) {
    const btn = event.target.closest(".nav-item");
    if (!btn) return;

    const text = String(btn.textContent || "").toLowerCase();

    if (text.includes("home")) {
      event.preventDefault();
      event.stopImmediatePropagation();
      showChat("home");
    } else if (text.includes("chat")) {
      event.preventDefault();
      event.stopImmediatePropagation();
      newChat();
    } else if (text.includes("memory")) {
      event.preventDefault();
      event.stopImmediatePropagation();
      renderMemory();
    } else if (text.includes("vision")) {
      event.preventDefault();
      event.stopImmediatePropagation();
      renderVision();
    } else if (text.includes("system")) {
      event.preventDefault();
      event.stopImmediatePropagation();
      renderSystem();
    } else if (text.includes("tools")) {
      event.preventDefault();
      event.stopImmediatePropagation();
      renderTools();
    } else if (text.includes("settings")) {
      event.preventDefault();
      event.stopImmediatePropagation();
      renderSettings();
    }
  }, true);
})();
