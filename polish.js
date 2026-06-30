(function () {
  const micIcon =
    '<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">' +
    '<path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3Z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>' +
    '<path d="M19 11a7 7 0 0 1-14 0M12 18v4M8 22h8" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>' +
    '</svg>';

  const speakerIcon =
    '<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">' +
    '<path d="M4 9v6h4l5 4V5L8 9H4Z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/>' +
    '<path d="M16 9.5c1 .9 1.5 1.7 1.5 2.5S17 13.6 16 14.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>' +
    '<path d="M18.5 7c1.8 1.6 2.8 3.2 2.8 5s-1 3.4-2.8 5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>' +
    '</svg>';

  const speakerOffIcon =
    '<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">' +
    '<path d="M4 9v6h4l5 4V5L8 9H4Z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/>' +
    '<path d="M3 3l18 18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>' +
    '</svg>';

  let audioMuted = false;

  function setRealMuted(value) {
    audioMuted = value;

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

  function updateAudioButtons() {
    const micBtn = document.getElementById("micBtn");
    const muteBtn = document.getElementById("muteBtn");

    if (micBtn) {
      micBtn.innerHTML = micIcon;
      micBtn.title = "Voice input";
      micBtn.setAttribute("aria-label", "Voice input");
      micBtn.classList.add("clean-round-icon");
    }

    if (muteBtn) {
      muteBtn.innerHTML = audioMuted ? speakerOffIcon : speakerIcon;
      muteBtn.title = audioMuted ? "Unmute speaker" : "Mute speaker";
      muteBtn.setAttribute("aria-label", audioMuted ? "Unmute speaker" : "Mute speaker");
      muteBtn.classList.add("clean-round-icon");

      if (audioMuted) {
        muteBtn.classList.add("speaker-muted");
      } else {
        muteBtn.classList.remove("speaker-muted");
      }
    }
  }

  function installSpeakerOverride() {
    const muteBtn = document.getElementById("muteBtn");
    if (!muteBtn) return;

    muteBtn.onclick = null;

    muteBtn.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopImmediatePropagation();

      setRealMuted(!audioMuted);
      updateAudioButtons();

      if (typeof setStatus === "function") {
        setStatus(audioMuted ? "Speaker Muted" : "Speaker Active");
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

      const responseBox = document.getElementById("responseBox");
      if (responseBox) {
        responseBox.innerText = "Ready when you are.";
      }

      if (typeof sendToVirtualOled === "function") {
        sendToVirtualOled("JARVIS ONLINE\nAwaiting command...");
      }
    }, true);
  }

  cleanBrand();
  setRealMuted(false);
  updateAudioButtons();
  installSpeakerOverride();
  installClearChatFix();

  window.jarvisRefreshPolish = updateAudioButtons;
})();
