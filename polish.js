(function () {
  const micIcon =
    '<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">' +
    '<path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3Z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>' +
    '<path d="M19 11a7 7 0 0 1-14 0M12 18v4M8 22h8" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>' +
    '</svg>';

  const micOffIcon =
    '<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">' +
    '<path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-5.4-1.8" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>' +
    '<path d="M9 9v2a3 3 0 0 0 4.4 2.7M19 11a7 7 0 0 1-10.8 5.9M5 11a7 7 0 0 0 7 7M12 18v4M8 22h8M3 3l18 18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>' +
    '</svg>';

  let polishMuted = false;

  function setRealMuted(value) {
    polishMuted = value;

    try {
      isMuted = value;
    } catch (error) {}

    if (value && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }

  function cleanBrand() {
    const brandSubtitle = document.querySelector(".brand p");
    if (brandSubtitle) {
      brandSubtitle.remove();
    }
  }

  function updateMicButtons() {
    const micBtn = document.getElementById("micBtn");
    const muteBtn = document.getElementById("muteBtn");

    if (micBtn) {
      micBtn.innerHTML = micIcon;
      micBtn.title = "Voice input";
      micBtn.setAttribute("aria-label", "Voice input");
      micBtn.classList.add("clean-round-icon");
    }

    if (muteBtn) {
      muteBtn.innerHTML = polishMuted ? micOffIcon : micIcon;
      muteBtn.title = polishMuted ? "Unmute voice" : "Mute voice";
      muteBtn.setAttribute("aria-label", polishMuted ? "Unmute voice" : "Mute voice");
      muteBtn.classList.add("clean-round-icon");

      if (polishMuted) {
        muteBtn.classList.add("mic-muted");
      } else {
        muteBtn.classList.remove("mic-muted");
      }
    }
  }

  function installMuteOverride() {
    const muteBtn = document.getElementById("muteBtn");
    if (!muteBtn) return;

    muteBtn.onclick = null;

    muteBtn.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopImmediatePropagation();

      setRealMuted(!polishMuted);
      updateMicButtons();

      if (typeof setStatus === "function") {
        setStatus(polishMuted ? "Muted" : "System Active");
      }
    }, true);
  }

  function installClearChatFix() {
    document.addEventListener("click", function (event) {
      const target = event.target;
      if (!target || target.id !== "clearChat") return;

      event.preventDefault();
      event.stopImmediatePropagation();

      if (window.jarvisClearSavedChat) {
        window.jarvisClearSavedChat();
      }

      localStorage.removeItem("jarvis_chat_history");

      const responseBox = document.getElementById("responseBox");
      if (responseBox) {
        responseBox.innerText = "Ready when you are.";
      }

      if (typeof sendToVirtualOled === "function") {
        sendToVirtualOled("JARVIS ONLINE\nAwaiting command...");
      }

      alert("Chat cleared.");
    }, true);
  }

  cleanBrand();
  setRealMuted(false);
  updateMicButtons();
  installMuteOverride();
  installClearChatFix();

  window.jarvisRefreshPolish = updateMicButtons;
})();
