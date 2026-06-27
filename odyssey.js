(function () {
  const CHATS_KEY = "jarvis_saved_chats_v2";
  const ACTIVE_KEY = "jarvis_active_chat_v2";
  const MEMORY_KEY = "jarvis_memory";
  const MODEL_KEY = "jarvis_selected_model";

  const input = document.getElementById("commandInput");
  const sendBtn = document.getElementById("sendBtn");
  const micBtn = document.getElementById("micBtn");
  const responseBox = document.getElementById("responseBox");
  const chatScroll = document.querySelector(".chat-scroll");
  const inputBar = document.querySelector(".input-bar");

  if (!input || !sendBtn || !chatScroll || !inputBar) return;

  let isSending = false;
  let chats = loadChats();
  let activeChatId = localStorage.getItem(ACTIVE_KEY);

  function makeId() {
    return "chat_" + Date.now() + "_" + Math.random().toString(16).slice(2);
  }

  function loadChats() {
    try {
      const data = JSON.parse(localStorage.getItem(CHATS_KEY) || "[]");
      return Array.isArray(data) ? data : [];
    } catch (error) {
      return [];
    }
  }

  function saveChats() {
    localStorage.setItem(CHATS_KEY, JSON.stringify(chats));
    localStorage.setItem(ACTIVE_KEY, activeChatId);
  }

  function getChat(id) {
    return chats.find(function (chat) {
      return chat.id === id;
    });
  }

  function createNewChat() {
    const chat = {
      id: makeId(),
      title: "New chat",
      pinned: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: []
    };

    chats.unshift(chat);
    activeChatId = chat.id;
    saveChats();
    renderActiveChat();

    return chat;
  }

  if (!activeChatId || !getChat(activeChatId)) {
    createNewChat();
  }

  function getActiveChat() {
    let chat = getChat(activeChatId);

    if (!chat) {
      chat = createNewChat();
    }

    return chat;
  }

  function makeTitle(text) {
    const clean = String(text || "New chat").replace(/\s+/g, " ").trim();
    if (!clean) return "New chat";
    return clean.length > 40 ? clean.slice(0, 40) + "..." : clean;
  }

  function getSelectedMode() {
    const selector = document.getElementById("modelSelect");
    return selector ? selector.value : "JARVIS";
  }

  function getMemory() {
    return localStorage.getItem(MEMORY_KEY) || "";
  }

  function saveMemory(memory) {
    localStorage.setItem(MEMORY_KEY, memory || "");
  }

  function ensureModelSelector() {
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

    selector.onchange = function () {
      localStorage.setItem(MODEL_KEY, selector.value);
      setStatusLine("Model switched to " + selector.value + ".");
      if (typeof setStatus === "function") setStatus(selector.value + " Active");
    };
  }

  function clearChatDom() {
    chatScroll.innerHTML = "";
  }

  function createMessageElement(role, content, mode) {
    const wrap = document.createElement("div");
    wrap.className = "message " + (role === "user" ? "user" : "assistant");

    const avatar = document.createElement("div");
    avatar.className = "avatar";
    avatar.textContent = role === "user" ? "U" : "J";

    const body = document.createElement("div");
    body.className = "message-content";

    const meta = document.createElement("div");
    meta.className = "message-meta";

    const name = document.createElement("strong");
    name.textContent = role === "user" ? "You" : (mode || getSelectedMode());

    const time = document.createElement("span");
    time.textContent = "Now";

    const p = document.createElement("p");
    p.textContent = content;

    meta.appendChild(name);
    meta.appendChild(time);
    body.appendChild(meta);
    body.appendChild(p);

    wrap.appendChild(avatar);
    wrap.appendChild(body);

    return wrap;
  }

  function appendMessage(role, content, save, mode) {
    const el = createMessageElement(role, content, mode);
    chatScroll.appendChild(el);
    chatScroll.scrollTop = chatScroll.scrollHeight;

    if (save) {
      const chat = getActiveChat();

      chat.messages.push({
        role: role,
        content: content,
        mode: mode || (role === "assistant" ? getSelectedMode() : "USER"),
        time: Date.now()
      });

      if (role === "user" && chat.title === "New chat") {
        chat.title = makeTitle(content);
      }

      chat.updatedAt = Date.now();
      saveChats();
    }

    return el;
  }

  function setStatusLine(text) {
    const line = document.createElement("div");
    line.className = "model-status-line";
    line.textContent = text;
    chatScroll.appendChild(line);
    chatScroll.scrollTop = chatScroll.scrollHeight;
  }

  function renderActiveChat() {
    clearChatDom();

    const chat = getActiveChat();

    if (!chat.messages || chat.messages.length === 0) {
      appendMessage("assistant", "How can I assist you today?", false, "JARVIS");
      if (responseBox) responseBox.innerText = "Ready when you are.";
      return;
    }

    chat.messages.forEach(function (msg) {
      appendMessage(msg.role, msg.content, false, msg.mode);
    });

    const lastAssistant = chat.messages.slice().reverse().find(function (msg) {
      return msg.role === "assistant";
    });

    if (responseBox && lastAssistant) {
      responseBox.innerText = lastAssistant.content;
    }
  }

  async function updateMemoryIfNeeded() {
    const chat = getActiveChat();
    const userMessages = chat.messages.filter(function (m) {
      return m.role === "user";
    });

    if (userMessages.length === 0 || userMessages.length % 5 !== 0) return;

    try {
      setStatusLine("Updating memory...");

      const recent = chat.messages.slice(-10).map(function (m) {
        return { role: m.role, content: m.content };
      });

      const res = await fetch("/memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memory: getMemory(), history: recent })
      });

      const data = await res.json();

      if (res.ok && data.memory) {
        saveMemory(data.memory);
        setStatusLine("Memory updated.");
      }
    } catch (error) {
      console.error("Memory update failed:", error);
    }
  }

  async function sendJarvisMessage() {
    if (isSending) return;

    const message = input.value.trim();
    if (!message) return;

    isSending = true;
    input.value = "";

    const selectedMode = getSelectedMode();

    appendMessage("user", message, true, "USER");

    const thinking = appendMessage("assistant", selectedMode + " is thinking...", false, selectedMode);

    try {
      const chat = getActiveChat();

      const history = chat.messages.slice(-12).map(function (m) {
        return { role: m.role, content: m.content };
      });

      const res = await fetch("/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: message,
          mode: selectedMode,
          history: history,
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

      appendMessage("assistant", reply, true, selectedMode);

      if (responseBox) responseBox.innerText = reply;
      if (typeof sendToVirtualOled === "function") sendToVirtualOled(hud);
      if (typeof speak === "function") speak(reply);
      if (typeof setStatus === "function") setStatus(selectedMode + " Active");

      updateMemoryIfNeeded();
    } catch (error) {
      thinking.remove();
      appendMessage("assistant", "Error: " + error.message, true, selectedMode);
    } finally {
      isSending = false;
    }
  }

  ensureModelSelector();

  if (micBtn) {
    micBtn.innerHTML = "🎙";
  }

  sendBtn.innerHTML = "↑";

  sendBtn.addEventListener("click", function (event) {
    event.preventDefault();
    event.stopImmediatePropagation();
    sendJarvisMessage();
  }, true);

  input.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      event.preventDefault();
      event.stopImmediatePropagation();
      sendJarvisMessage();
    }
  }, true);

  window.jarvisCreateNewChat = function () {
    return createNewChat();
  };

  window.jarvisLoadChat = function (id) {
    if (!getChat(id)) return;
    activeChatId = id;
    saveChats();
    renderActiveChat();
  };

  window.jarvisDeleteChat = function (id) {
    chats = chats.filter(function (chat) {
      return chat.id !== id;
    });

    if (!chats.length) {
      createNewChat();
      return;
    }

    if (activeChatId === id) {
      activeChatId = chats[0].id;
    }

    saveChats();
    renderActiveChat();
  };

  window.jarvisPinChat = function (id) {
    const chat = getChat(id);
    if (!chat) return;
    chat.pinned = !chat.pinned;
    chat.updatedAt = Date.now();
    saveChats();
  };

  window.jarvisGetChats = function () {
    return chats;
  };

  window.jarvisClearSavedChat = function () {
    const chat = getActiveChat();
    chat.messages = [];
    chat.title = "New chat";
    chat.updatedAt = Date.now();
    saveChats();
    renderActiveChat();
  };

  window.jarvisOpenActiveChat = function () {
    renderActiveChat();
  };

  renderActiveChat();
})();
