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
    return new Date(time).toLocaleDateString([], { month: "short", day: "numeric" });
  }

  function renderMemory() {
    if (hero) hero.style.display = "none";
    if (chatPanel) chatPanel.style.display = "none";
    if (inputSection) inputSection.style.display = "none";

    pageView.style.display = "block";
    setActive("memory");

    const chats = window.jarvisGetChats ? window.jarvisGetChats() : [];
    const pinned = chats.filter(c => c.pinned);
    const recents = chats.filter(c => !c.pinned);

    pageView.innerHTML =
      '<div class="memory-chat-page-final">' +
        '<div class="memory-chat-top-final">' +
          '<div><h2>Chats</h2><p>Auto-saved JARVIS conversations</p></div>' +
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
          if (!confirm("Delete this chat?")) return;
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

  function renderSimple(name, title, body) {
    if (hero) hero.style.display = "none";
    if (chatPanel) chatPanel.style.display = "none";
    if (inputSection) inputSection.style.display = "none";

    pageView.style.display = "block";
    setActive(name);

    pageView.innerHTML =
      '<div class="page-title"><p>JARVIS MODULE</p><h2>' + title + '</h2></div>' +
      body;
  }

  function renderSettings() {
    renderSimple(
      "settings",
      "Settings",
      '<div class="page-grid">' +
        '<div class="panel-card"><h3>Chat</h3><p>Clear current chat.</p><button class="panel-btn" id="clearChat">Clear Chat</button></div>' +
      '</div>'
    );

    document.getElementById("clearChat").onclick = function () {
      if (window.jarvisClearSavedChat) window.jarvisClearSavedChat();
      showChat("home");
    };
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
    } else if (text.includes("settings")) {
      event.preventDefault();
      event.stopImmediatePropagation();
      renderSettings();
    } else if (text.includes("vision")) {
      event.preventDefault();
      event.stopImmediatePropagation();
      renderSimple("vision", "Vision", '<div class="panel-card"><p>Vision will be added later.</p></div>');
    } else if (text.includes("system")) {
      event.preventDefault();
      event.stopImmediatePropagation();
      renderSimple("system", "System", '<div class="panel-card"><p>System controls will be added here.</p></div>');
    } else if (text.includes("tools")) {
      event.preventDefault();
      event.stopImmediatePropagation();
      renderSimple("tools", "Tools", '<div class="panel-card"><p>Tools will be added here.</p></div>');
    }
  }, true);
})();
