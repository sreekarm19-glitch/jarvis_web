(function () {
  function addRefreshButton() {
    const inputBar = document.querySelector(".input-bar");
    const input = document.getElementById("commandInput");
    const sendBtn = document.getElementById("sendBtn");

    if (!inputBar || !sendBtn) return;
    if (document.getElementById("chatRefreshBtn")) return;

    const refreshBtn = document.createElement("button");
    refreshBtn.id = "chatRefreshBtn";
    refreshBtn.innerHTML = "↻";
    refreshBtn.title = "New chat";
    refreshBtn.setAttribute("aria-label", "New chat");

    inputBar.insertBefore(refreshBtn, sendBtn);

    refreshBtn.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopImmediatePropagation();

      if (window.jarvisCreateNewChat) {
        window.jarvisCreateNewChat();
      } else {
        const chatScroll = document.querySelector(".chat-scroll");
        const responseBox = document.getElementById("responseBox");

        if (chatScroll) {
          chatScroll.innerHTML =
            '<div class="message assistant">' +
              '<div class="avatar">J</div>' +
              '<div class="message-content">' +
                '<div class="message-meta"><strong>JARVIS</strong><span>Now</span></div>' +
                '<p>How can I assist you today?</p>' +
              '</div>' +
            '</div>';
        }

        if (responseBox) {
          responseBox.innerText = "Ready when you are.";
        }
      }

      if (input) {
        input.value = "";
        input.focus();
      }

      if (typeof setStatus === "function") {
        setStatus("New Chat");
      }
    }, true);
  }

  setTimeout(addRefreshButton, 300);
})();
