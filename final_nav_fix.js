(function () {
  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      setTimeout(fn, 50);
    }
  }

  ready(function () {
    const mainArea = document.querySelector(".main-area");
    const hero = document.querySelector(".hero");
    const chatPanel = document.querySelector(".chat-panel");
    const inputSection = document.querySelector(".input-section");

    if (!mainArea) return;

    let pageView = document.getElementById("pageView");

    if (!pageView) {
      pageView = document.createElement("section");
      pageView.id = "pageView";
      pageView.className = "page-view";
      mainArea.insertBefore(pageView, inputSection);
    }

    // Remove old broken click listeners by cloning sidebar buttons
    const oldButtons = Array.from(document.querySelectorAll(".nav-item"));

    oldButtons.forEach(function (btn) {
      const clone = btn.cloneNode(true);
      btn.parentNode.replaceChild(clone, btn);
    });

    const navItems = Array.from(document.querySelectorAll(".nav-item"));

    function setActive(name) {
      navItems.forEach(function (btn) {
        btn.classList.remove("active");
        const text = String(btn.textContent || "").toLowerCase();

        if (text.includes(name)) {
          btn.classList.add("active");
        }
      });
    }

    function showChat(activeName) {
      if (hero) hero.style.display = "";
      if (chatPanel) chatPanel.style.display = "";
      if (inputSection) inputSection.style.display = "";
      pageView.style.display = "none";

      setActive(activeName || "home");

      if (window.jarvisOpenActiveChat) {
        window.jarvisOpenActiveChat();
      }

      const input = document.getElementById("commandInput");
      if (input) input.focus();
    }

    function newChat() {
      if (window.jarvisCreateNewChat) {
        window.jarvisCreateNewChat();
      }

      showChat("chat");
    }

    function getChats() {
      if (window.jarvisGetChats) {
        return window.jarvisGetChats() || [];
      }

      try {
        return JSON.parse(localStorage.getItem("jarvis_saved_chats_v2") || "[]");
      } catch (error) {
        return [];
      }
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

    function openChat(id) {
      if (window.jarvisLoadChat) {
        window.jarvisLoadChat(id);
      }

      showChat("home");
    }

    function pinChat(id) {
      if (window.jarvisPinChat) {
        window.jarvisPinChat(id);
      }

      renderMemory();
    }

    function deleteChat(id) {
      

      if (window.jarvisDeleteChat) {
        window.jarvisDeleteChat(id);
      }

      renderMemory();
    }

    function makeRow(chat) {
      const row = document.createElement("div");
      row.className = "real-chat-row";

      const open = document.createElement("button");
      open.className = "real-chat-open";

      open.innerHTML =
        '<span class="real-chat-bubble">◌</span>' +
        '<span class="real-chat-title">' + escapeHtml(chat.title || "New chat") + '</span>' +
        '<small>' + formatDate(chat.updatedAt) + '</small>';

      open.onclick = function () {
        openChat(chat.id);
      };

      const actions = document.createElement("div");
      actions.className = "real-chat-actions";

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

    function fillList(box, chats) {
      box.innerHTML = "";

      if (!chats.length) {
        box.innerHTML = '<p class="empty-chat-note">No chats here yet.</p>';
        return;
      }

      chats.forEach(function (chat) {
        box.appendChild(makeRow(chat));
      });
    }

    function renderMemory(searchValue) {
      if (hero) hero.style.display = "none";
      if (chatPanel) chatPanel.style.display = "none";
      if (inputSection) inputSection.style.display = "none";

      pageView.style.display = "block";
      setActive("memory");

      const q = String(searchValue || "").toLowerCase();

      const chats = getChats()
        .filter(function (chat) {
          return String(chat.title || "New chat").toLowerCase().includes(q);
        })
        .sort(function (a, b) {
          return Number(b.updatedAt || 0) - Number(a.updatedAt || 0);
        });

      const pinned = chats.filter(function (chat) {
        return chat.pinned;
      });

      const recents = chats.filter(function (chat) {
        return !chat.pinned;
      });

      pageView.innerHTML =
        '<div class="real-memory-page">' +
          '<div class="real-memory-top">' +
            '<div>' +
              '<h2>Chats</h2>' +
              '<p>Auto-saved JARVIS conversations</p>' +
            '</div>' +
            '<button id="realNewChatBtn">＋ New Chat</button>' +
          '</div>' +

          '<input id="realChatSearch" class="real-chat-search" placeholder="Search chats..." value="' + escapeHtml(searchValue || "") + '">' +

          '<section class="real-chat-section">' +
            '<h3>Pinned</h3>' +
            '<div id="realPinnedChats"></div>' +
          '</section>' +

          '<section class="real-chat-section">' +
            '<h3>Recents</h3>' +
            '<div id="realRecentChats"></div>' +
          '</section>' +
        '</div>';

      fillList(document.getElementById("realPinnedChats"), pinned);
      fillList(document.getElementById("realRecentChats"), recents);

      document.getElementById("realNewChatBtn").onclick = newChat;

      document.getElementById("realChatSearch").oninput = function (event) {
        renderMemory(event.target.value);
      };
    }

    function simplePage(name, title, text) {
      if (hero) hero.style.display = "none";
      if (chatPanel) chatPanel.style.display = "none";
      if (inputSection) inputSection.style.display = "none";

      pageView.style.display = "block";
      setActive(name);

      pageView.innerHTML =
        '<div class="page-title">' +
          '<p>JARVIS MODULE</p>' +
          '<h2>' + title + '</h2>' +
          '<span>' + text + '</span>' +
        '</div>';
    }

    function settingsPage() {
      if (hero) hero.style.display = "none";
      if (chatPanel) chatPanel.style.display = "none";
      if (inputSection) inputSection.style.display = "none";

      pageView.style.display = "block";
      setActive("settings");

      pageView.innerHTML =
        '<div class="page-title">' +
          '<p>JARVIS MODULE</p>' +
          '<h2>Settings</h2>' +
          '<span>Control JARVIS settings.</span>' +
        '</div>' +
        '<div class="page-grid">' +
          '<div class="panel-card">' +
            '<h3>Chat</h3>' +
            '<p>Clear current active chat.</p>' +
            '<button class="panel-btn" id="clearChat">Clear Chat</button>' +
          '</div>' +
        '</div>';

      document.getElementById("clearChat").onclick = function () {
        if (window.jarvisClearSavedChat) {
          window.jarvisClearSavedChat();
        }

        showChat("home");
      };
    }

    navItems.forEach(function (btn) {
      btn.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopImmediatePropagation();

        const text = String(btn.textContent || "").toLowerCase();

        if (text.includes("home")) {
          showChat("home");
        } else if (text.includes("chat")) {
          newChat();
        } else if (text.includes("memory")) {
          renderMemory();
        } else if (text.includes("vision")) {
          simplePage("vision", "Vision", "Vision features will be added later.");
        } else if (text.includes("system")) {
          simplePage("system", "System", "System controls will be added here.");
        } else if (text.includes("tools")) {
          simplePage("tools", "Tools", "Tools will be added here.");
        } else if (text.includes("settings")) {
          settingsPage();
        }
      }, true);
    });

    window.forceJarvisMemoryPage = renderMemory;
  });
})();
