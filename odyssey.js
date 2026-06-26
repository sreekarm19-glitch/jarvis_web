(function () {
  const CHAT_KEY = "jarvis_chat_history";
  const MEMORY_KEY = "jarvis_memory";
  const MODEL_KEY = "jarvis_selected_model";

  const input = document.getElementById("commandInput");
  const sendBtn = document.getElementById("sendBtn");
  const micBtn = document.getElementById("micBtn");
  const responseBox = document.getElementById("responseBox");
  const chatScroll = document.querySelector(".chat-scroll");
  const inputBar = document.querySelector(".input-bar");

  if (!input || !sendBtn || !chatScroll || !inputBar) return;

  let odysseyProcessing = false;
  let chatHistory = loadChatHistory();

  function createModelSelector() {
    let selector = document.getElementById("modelSelect");

    if (!selector) {
      selector = document.createElement("select");
      selector.id = "modelSelect";
      selector.className = "model-select";

      selector.innerHTML =
        '<option value="FRIDAY">FRIDAY · Fast</option>' +
        '<option value="JARVIS">JARVIS · Balanced</option>' +
        '<option value="ODYSSEY">ODYSSEY · Powerful</option>';

      inputBar.insertBefore(selector, input);
    }

    selector.value = localStorage.getItem(MODEL_KEY) || "JARVIS";

    selector.addEventListener("change", function () {
      localStorage.setItem(MODEL_KEY, selector.value);
      addSystemLine("Model switched to " + selector.value + ".");
      if (typeof setStatus === "function") {
        setStatus(selector.value + " Mode");
      }
    });

    return selector;
  }

  const modelSelect = createModelSelector();

  if (micBtn) {
    micBtn.innerHTML = "🎙";
    micBtn.title = "Voice input";
    micBtn.setAttribute("aria-label", "Voice input");
  }

  sendBtn.innerHTML = "↑";
  sendBtn.title = "Send";
  sendBtn.setAttribute("aria-label", "Send");

  function loadChatHistory() {
    try {
      const saved = JSON.parse(localStorage.getItem(CHAT_KEY) || "[]");
      return Array.isArray(saved) ? saved : [];
    } catch (error) {
      return [];
    }
  }

  function saveChatHistory() {
    const trimmed = chatHistory.slice(-80);
    chatHistory = trimmed;
    localStorage.setItem(CHAT_KEY, JSON.stringify(trimmed));
  }

  function getMemory() {
    return localStorage.getItem(MEMORY_KEY) || "";
  }

  function saveMemory(memory) {
    localStorage.setItem(MEMORY_KEY, memory || "");
  }

  function clearChatPanel() {
    chatScroll.innerHTML = "";
  }

  function addMessage(role, content, save) {
    const message = document.createElement("div");
    message.className = "message " + (role === "user" ? "user" : "assistant");

    const avatar = document.createElement("div");
    avatar.className = "avatar";
    avatar.textContent = role === "user" ? "U" : "J";

    const card = document.createElement("div");
    card.className = "message-content";

    const meta = document.createElement("div");
    meta.className = "message-meta";

    const name = document.createElement("strong");
    name.textContent = role === "user" ? "You" : getSelectedMode();

    const time = document.createElement("span");
    time.textContent = "Now";

    const text = document.createElement("p");
    text.textContent = content;

    meta.appendChild(name);
    meta.appendChild(time);
    card.appendChild(meta);
    card.appendChild(text);
    message.appendChild(avatar);
    message.appendChild(card);
    chatScroll.appendChild(message);

    chatScroll.scrollTop = chatScroll.scrollHeight;

    if (save) {
      chatHistory.push({
        role: role,
        content: content,
        time: Date.now()
      });
      saveChatHistory();
    }

    return message;
  }

  function addSystemLine(text) {
    const line = document.createElement("div");
    line.className = "model-status-line";
    line.textContent = text;
    chatScroll.appendChild(line);
    chatScroll.scrollTop = chatScroll.scrollHeight;
  }

  function renderChatHistory() {
    clearChatPanel();

    addMessage("assistant", "How can I assist you today?", false);

    chatHistory.forEach(function (item) {
      addMessage(item.role, item.content, false);
    });

    if (chatHistory.length === 0) {
      if (responseBox) responseBox.innerText = "Ready when you are.";
    } else {
      const lastAssistant = chatHistory.slice().reverse().find(function (item) {
        return item.role === "assistant";
      });
      if (responseBox && lastAssistant) responseBox.innerText = lastAssistant.content;
    }
  }

  function getSelectedMode() {
    return modelSelect ? modelSelect.value : "JARVIS";
  }

  async function updateMemoryIfNeeded() {
    const userCount = chatHistory.filter(function (item) {
      return item.role === "user";
    }).length;

    if (userCount === 0 || userCount % 5 !== 0) return;

    try {
      addSystemLine("Updating memory...");

      const res = await fetch("/memory", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          memory: getMemory(),
          history: chatHistory.slice(-10)
        })
      });

      const data = await res.json();

      if (res.ok && data.memory) {
        saveMemory(data.memory);
        addSystemLine("Memory updated.");
      } else {
        addSystemLine("Memory update skipped.");
      }
    } catch (error) {
      console.error("Memory update failed:", error);
      addSystemLine("Memory update failed.");
    }
  }

  async function sendOdysseyMessage() {
    if (odysseyProcessing) return;

    const message = input.value.trim();
    if (!message) return;

    odysseyProcessing = true;
    input.value = "";

    addMessage("user", message, true);

    const thinking = addMessage("assistant", getSelectedMode() + " is thinking...", false);

    if (typeof setStatus === "function") {
      setStatus(getSelectedMode() + " Thinking...");
    }

    try {
      const historyPayload = chatHistory.slice(-12).map(function (item) {
        return {
          role: item.role,
          content: item.content
        };
      });

      const res = await fetch("/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: message,
          mode: getSelectedMode(),
          history: historyPayload,
          memory: getMemory()
        })
      });

      const data = await res.json();

      thinking.remove();

      if (!res.ok) {
        throw new Error(data.error || "Server error");
      }

      const reply = data.reply || "No response.";
      const hud = data.hud || reply.slice(0, 60);

      addMessage("assistant", reply, true);

      if (responseBox) responseBox.innerText = reply;

      if (typeof sendToVirtualOled === "function") {
        sendToVirtualOled(hud);
      }

      if (typeof speak === "function") {
        speak(reply);
      }

      if (typeof setStatus === "function") {
        setStatus(getSelectedMode() + " Active");
      }

      updateMemoryIfNeeded();
    } catch (error) {
      thinking.remove();

      const errorText = "Error: " + error.message;
      addMessage("assistant", errorText, true);

      if (responseBox) responseBox.innerText = errorText;

      if (typeof setStatus === "function") {
        setStatus("Error");
      }
    } finally {
      odysseyProcessing = false;
    }
  }

  sendBtn.addEventListener("click", function (event) {
    event.preventDefault();
    event.stopImmediatePropagation();
    sendOdysseyMessage();
  }, true);

  input.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      event.preventDefault();
      event.stopImmediatePropagation();
      sendOdysseyMessage();
    }
  }, true);

  try {
    window.sendMessage = sendOdysseyMessage;
    sendMessage = sendOdysseyMessage;
  } catch (error) {}

  window.jarvisClearSavedChat = function () {
    chatHistory = [];
    saveChatHistory();
    renderChatHistory();
  };

  window.jarvisGetMemory = function () {
    return getMemory();
  };

  renderChatHistory();
})();
