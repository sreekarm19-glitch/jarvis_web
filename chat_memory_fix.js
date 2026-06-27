(function () {
  const CHATS_KEY = "jarvis_saved_chats_v1";
  const ACTIVE_KEY = "jarvis_active_chat_id";

  const hero = document.querySelector(".hero");
  const chatPanel = document.querySelector(".chat-panel");
  const inputSection = document.querySelector(".input-section");
  const mainArea = document.querySelector(".main-area");
  const navItems = document.querySelectorAll(".nav-item");

  if (!mainArea) return;

  let pageView = document.getElementById("pageView");

  if (!pageView) {
    pageView = document.createElement("section");
    pageView.id = "pageView";
    pageView.className = "page-view";
    mainArea.insertBefore(pageView, inputSection);
  }

  function readChats() {
    if (window.jarvisGetChats) {
      return window.jarvisGetChats() || [];
    }

    try {
      return JSON.parse(localStorage.getItem(CHATS_KEY) || "[]");
    } catch (error) {
      return [];
    }
  }

  function saveChats(chats) {
    localStorage.setItem(CHATS_KEY, JSON.stringify(chats));
  }

  function makeId() {
    return "chat_" + Date.now() + "_" + Math.random().toString(16).slice(2);
  }

  function makeTitle(text) {
    const clean = String(text || "New chat").replace(/\s+/g, " ").trim();
    return clean.length > 38 ? clean.slice(0, 38) + "..." : clean || "New chat";
  }

  function setActiveNav(name) {
    navItems.forEach(function (btn) {
      btn.classList.remove("active");

      if ((btn.textContent || "").toLowerCase().includes(name)) {
        btn.classList.add("active");
      }
    });
  }

  function showChat() {
    if (hero) hero.style.display = "";
    if (chatPanel) chatPanel.style.display = "";
    if (inputSection) inputSection.style.display = "";
    pageView.style.display = "none";

    setActiveNav("home");

    if (window.jarvisOpenActiveChat) {
      window.jarvisOpenActiveChat();
    }
  }

  function createNewChat() {
    if (window.jarvisCreateNewChat) {
      window.jarvisCreateNewChat();
      showChat();
      return;
    }

    const chats = readChats();

    const chat = {
      id: makeId(),
      title: "New chat",
      pinned: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: []
    };

    chats.unshift(chat);
    saveChats(chats);
    localStorage.setItem(ACTIVE_KEY, chat.id);

    showChat();
  }

  function loadChat(id) {
    if (window.jarvisLoadChat) {
      window.jarvisLoadChat(id);
      showChat();
      return;
    }

    localStorage.setItem(ACTIVE_KEY, id);
    location.reload();
  }

  function pinChat(id) {
    if (window.jarvisPinChat) {
      window.jarvisPinChat(id);
      renderMemoryPage();
      return;
    }

    const chats = readChats();

    chats.forEach(function (chat) {
      if (chat.id === id) chat.pinned = !chat.pinned;
    });

    saveChats(chats);
    renderMemoryPage();
  }

  function deleteChat(id) {
    

    if (window.jarvisDeleteChat) {
      window.jarvisDeleteChat(id);
      renderMemoryPage();
      return;
    }

    const chats = readChats().filter(function (chat) {
      return chat.id !== id;
    });

    saveChats(chats);
    renderMemoryPage();
  }

  function formatDate(time) {
    if (!time) return "";
    return new Date(time).toLocaleDateString([], {
      month: "short",
      day: "numeric"
    });
  }

  function escapeHtml(text) {
    return String(text || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function chatCount(chat) {
    if (!chat.messages) return "0 messages";
    return chat.messages.length + " messages";
  }

  function createRow(chat) {
    const row = document.createElement("div");
    row.className = "chat-history-row";

    const open = document.createElement("button");
    open.className = "chat-history-open";
    open.innerHTML =
      '<span class="chat-history-icon">◌</span>' +
      '<span class="chat-history-title">' + escapeHtml(chat.title || "New chat") + '</span>' +
      '<span class="chat-history-meta">' + chatCount(chat) + " · " + formatDate(chat.updatedAt) + '</span>';

    open.onclick = function () {
      loadChat(chat.id);
    };

    const actions = document.createElement("div");
    actions.className = "chat-history-actions";

    const pin = document.createElement("button");
    pin.textContent = chat.pinned ? "Unpin" : "Pin";
    pin.onclick = function () {
      pinChat(chat.id);
    };

    const del = document.createElement("button");
    del.textContent = "Delete";
    del.onclick = function () {
      deleteChat(chat.id);
    };

    actions.appendChild(pin);
    actions.appendChild(del);

    row.appendChild(open);
    row.appendChild(actions);

    return row;
  }

  function renderRows(container, chats) {
    if (chats.length === 0) {
      container.innerHTML = '<p class="empty-chat-note">No chats here yet.</p>';
      return;
    }

    chats.forEach(function (chat) {
      container.appendChild(createRow(chat));
    });
  }

  function renderMemoryPage(searchValue) {
    if (hero) hero.style.display = "none";
    if (chatPanel) chatPanel.style.display = "none";
    if (inputSection) inputSection.style.display = "none";

    pageView.style.display = "block";
    setActiveNav("memory");

    const search = String(searchValue || "").toLowerCase();
    const chats = readChats();

    const filtered = chats
      .filter(function (chat) {
        return String(chat.title || "").toLowerCase().includes(search);
      })
      .sort(function (a, b) {
        return Number(b.updatedAt || 0) - Number(a.updatedAt || 0);
      });

    const pinned = filtered.filter(function (chat) {
      return chat.pinned;
    });

    const recents = filtered.filter(function (chat) {
      return !chat.pinned;
    });

    pageView.innerHTML =
      '<div class="chat-memory-page">' +
        '<div class="chat-memory-top">' +
          '<div>' +
            '<h2>Chats</h2>' +
            '<p>Your JARVIS conversations are saved automatically.</p>' +
          '</div>' +
          '<button id="memoryNewChatBtn">＋ New Chat</button>' +
        '</div>' +
        '<input id="memorySearchBox" class="chat-memory-search" placeholder="Search chats..." value="' + escapeHtml(searchValue || "") + '">' +
        '<section class="chat-memory-section">' +
          '<h3>Pinned</h3>' +
          '<div id="memoryPinnedList"></div>' +
        '</section>' +
        '<section class="chat-memory-section">' +
          '<h3>Recents</h3>' +
          '<div id="memoryRecentList"></div>' +
        '</section>' +
      '</div>';

    renderRows(document.getElementById("memoryPinnedList"), pinned);
    renderRows(document.getElementById("memoryRecentList"), recents);

    document.getElementById("memoryNewChatBtn").onclick = createNewChat;

    document.getElementById("memorySearchBox").oninput = function (event) {
      renderMemoryPage(event.target.value);
    };
  }

  document.addEventListener("click", function (event) {
    const btn = event.target.closest(".nav-item");
    if (!btn) return;

    const text = (btn.textContent || "").toLowerCase();

    if (text.includes("memory")) {
      event.preventDefault();
      event.stopImmediatePropagation();
      renderMemoryPage();
    }

    if (text.includes("chat")) {
      event.preventDefault();
      event.stopImmediatePropagation();
      createNewChat();
    }
  }, true);

  window.jarvisRenderChatMemory = renderMemoryPage;
})();
