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

  function showMemoryPage() {
    if (hero) hero.style.display = "none";
    if (chatPanel) chatPanel.style.display = "none";
    if (inputSection) inputSection.style.display = "none";

    pageView.style.display = "block";

    navItems.forEach(function (btn) {
      btn.classList.remove("active");
      if ((btn.textContent || "").toLowerCase().includes("memory")) {
        btn.classList.add("active");
      }
    });

    renderMemoryList("");
  }

  function showChatPage() {
    if (hero) hero.style.display = "";
    if (chatPanel) chatPanel.style.display = "";
    if (inputSection) inputSection.style.display = "";
    pageView.style.display = "none";

    navItems.forEach(function (btn) {
      btn.classList.remove("active");
      if ((btn.textContent || "").toLowerCase().includes("home")) {
        btn.classList.add("active");
      }
    });
  }

  function formatDate(time) {
    if (!time) return "";
    const d = new Date(time);
    return d.toLocaleDateString([], {
      month: "short",
      day: "numeric"
    });
  }

  function createChatRow(chat) {
    const row = document.createElement("div");
    row.className = "saved-chat-row";

    const title = document.createElement("button");
    title.className = "saved-chat-title";
    title.innerHTML =
      '<span class="chat-dot">◌</span>' +
      '<span>' + escapeHtml(chat.title || "New chat") + '</span>' +
      '<small>' + formatDate(chat.updatedAt) + '</small>';

    title.onclick = function () {
      if (window.jarvisLoadChat) {
        window.jarvisLoadChat(chat.id);
      }
      showChatPage();
    };

    const actions = document.createElement("div");
    actions.className = "saved-chat-actions";

    const pin = document.createElement("button");
    pin.textContent = chat.pinned ? "Unpin" : "Pin";
    pin.onclick = function () {
      if (window.jarvisPinChat) {
        window.jarvisPinChat(chat.id);
      }
      renderMemoryList(document.getElementById("memorySearchInput").value || "");
    };

    const del = document.createElement("button");
    del.textContent = "Delete";
    del.onclick = function () {
      
      if (window.jarvisDeleteChat) {
        window.jarvisDeleteChat(chat.id);
      }
      renderMemoryList(document.getElementById("memorySearchInput").value || "");
    };

    actions.appendChild(pin);
    actions.appendChild(del);
    row.appendChild(title);
    row.appendChild(actions);

    return row;
  }

  function escapeHtml(text) {
    return String(text || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function renderMemoryList(search) {
    const chats = window.jarvisGetChats ? window.jarvisGetChats() : [];
    const q = String(search || "").toLowerCase();

    const filtered = chats.filter(function (chat) {
      return String(chat.title || "").toLowerCase().includes(q);
    });

    const pinned = filtered.filter(function (chat) {
      return chat.pinned;
    });

    const recents = filtered.filter(function (chat) {
      return !chat.pinned;
    });

    pageView.innerHTML =
      '<div class="memory-chat-page">' +
        '<div class="memory-topbar">' +
          '<div>' +
            '<p>JARVIS MEMORY</p>' +
            '<h2>Chats</h2>' +
          '</div>' +
          '<button id="newChatMemoryBtn">＋ New Chat</button>' +
        '</div>' +
        '<div class="memory-search-wrap">' +
          '<input id="memorySearchInput" placeholder="Search chats..." value="' + escapeHtml(search || "") + '">' +
        '</div>' +
        '<div class="memory-sections">' +
          '<section><h3>Pinned</h3><div id="pinnedChats"></div></section>' +
          '<section><h3>Recents</h3><div id="recentChats"></div></section>' +
        '</div>' +
      '</div>';

    const pinnedBox = document.getElementById("pinnedChats");
    const recentBox = document.getElementById("recentChats");

    if (pinned.length === 0) {
      pinnedBox.innerHTML = '<p class="empty-chat-note">No pinned chats yet.</p>';
    } else {
      pinned.forEach(function (chat) {
        pinnedBox.appendChild(createChatRow(chat));
      });
    }

    if (recents.length === 0) {
      recentBox.innerHTML = '<p class="empty-chat-note">No recent chats yet.</p>';
    } else {
      recents.forEach(function (chat) {
        recentBox.appendChild(createChatRow(chat));
      });
    }

    document.getElementById("newChatMemoryBtn").onclick = function () {
      if (window.jarvisCreateNewChat) {
        window.jarvisCreateNewChat();
      }
      showChatPage();
    };

    document.getElementById("memorySearchInput").oninput = function (event) {
      renderMemoryList(event.target.value);
    };
  }

  navItems.forEach(function (btn) {
    const text = (btn.textContent || "").toLowerCase();

    if (text.includes("memory")) {
      btn.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopImmediatePropagation();
        showMemoryPage();
      }, true);
    }
  });

  window.jarvisOpenMemoryPage = showMemoryPage;
})();
