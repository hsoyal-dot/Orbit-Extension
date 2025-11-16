// content.js - listens for selection or page metadata and sends message to background
(function () {
  function captureSelection() {
    const sel = window.getSelection().toString().trim();
    if (!sel) return null;
    return {
      type: "selection",
      text: sel,
      url: location.href,
      title: document.title,
      context: getNearbyText(), // helper
    };
  }

  function getNearbyText() {
    // Simple strategy: gather first 600 chars of body text
    const body = document.body ? document.body.innerText : "";
    return body.slice(0, 1200);
  }

  // When user presses Ctrl+Shift+Y, send selection to background (for quick demo)
  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === "Y") {
      const data = captureSelection();
      if (data) {
        chrome.runtime.sendMessage(
          { type: "PAGE_CAPTURE", payload: data },
          (resp) => {
            console.log("Capture response", resp);
          }
        );
      } else {
        alert("Select text to capture first.");
      }
    }
  });

  // Also auto-send a small metadata ping when page loads (if capture enabled)
  window.addEventListener("load", () => {
    chrome.runtime.sendMessage({
      type: "PAGE_LOADED",
      payload: { url: location.href, title: document.title },
    });
  });
})();
