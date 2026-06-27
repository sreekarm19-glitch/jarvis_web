(function () {
  function makeButton() {
    const inputBar = document.querySelector(".input-bar");
    const input = document.getElementById("commandInput");

    if (!inputBar) return;

    let btn = document.getElementById("chatRefreshBtn");

    if (!btn) {
      btn = document.createElement("button");
      btn.id = "chatRefreshBtn";
      btn.innerHTML = "↻";
      btn.title = "New chat";
      btn.setAttribute("aria-label", "New chat");
      inputBar.appendChild(btn);
    }

    btn.onclick = function (event) {
      event.preventDefault();
      event.stopImmediatePropagation();

      if (window.jarvisCreateNewChat) {
        window.jarvisCreateNewChat();
      }

      const chatScroll = document.querySelector(".chat-scroll");
      const responseBox = document.getElementById("responseBox");

      if (responseBox) {
        responseBox.innerText = "Ready when you are.";
      }

      if (input) {
        input.value = "";
        input.focus();
      }

      if (typeof setStatus === "function") {
        setStatus("New Chat");
      }
    };
  }

  setTimeout(makeButton, 500);
  setTimeout(makeButton, 1500);
})();
