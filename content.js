// content.js - listens for selection or page metadata and sends message to background
(function () {
  // Inject styles for the glow effect
  function injectGlowStyles() {
    if (document.getElementById("orbit-glow-styles")) return;
    
    const style = document.createElement("style");
    style.id = "orbit-glow-styles";
    style.textContent = `
      @keyframes orbitGlow {
        0% {
          box-shadow: 0 0 0 0 rgba(6, 182, 212, 0);
        }
        50% {
          box-shadow: 0 0 100px 30px rgba(6, 182, 212, 0.4),
                      0 0 200px 60px rgba(6, 182, 212, 0.2),
                      inset 0 0 100px 30px rgba(6, 182, 212, 0.1);
        }
        100% {
          box-shadow: 0 0 0 0 rgba(6, 182, 212, 0);
        }
      }
      
      body.orbit-glow-active {
        animation: orbitGlow 1.5s ease-out;
        position: relative;
      }
      
      body.orbit-glow-active::before {
        content: '';
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: radial-gradient(circle at center, 
          rgba(6, 182, 212, 0.15) 0%, 
          rgba(6, 182, 212, 0.05) 40%, 
          transparent 70%);
        pointer-events: none;
        z-index: 999998;
        animation: orbitGlow 1.5s ease-out;
      }
    `;
    document.head.appendChild(style);
  }

  function captureSelection() {
    const sel = window.getSelection().toString().trim();
    if (!sel) return null;
    return {
      url: location.href,
      title: document.title,
      snippet: sel,
    };
  }

  function getNearbyText() {
    // Simple strategy: gather first 600 chars of body text
    const body = document.body ? document.body.innerText : "";
    return body.slice(0, 1200);
  }

  // Shortcut: Ctrl+Shift+Y to capture selection
  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === "Y") {
      e.preventDefault(); // Prevent any default browser behavior
      
      const payload = captureSelection();
      if (!payload) {
        // Show glow effect even when no text is selected (as feedback)
        injectGlowStyles();
        document.body.classList.add("orbit-glow-active");
        setTimeout(() => {
          document.body.classList.remove("orbit-glow-active");
        }, 1500);
        return;
      }
      
      // Add glow effect to the page
      injectGlowStyles();
      document.body.classList.add("orbit-glow-active");
      
      // Remove the class after animation completes
      setTimeout(() => {
        document.body.classList.remove("orbit-glow-active");
      }, 1500);
      
      chrome.runtime.sendMessage({ type: "PAGE_CAPTURE", payload }, (resp) => {
        if (chrome.runtime.lastError) {
          console.error("Error sending message:", chrome.runtime.lastError);
          return;
        }
        console.log("Capture result", resp);
      });
    }
  });

  // Also auto-send a small metadata ping when page loads (if capture enabled)
  // window.addEventListener("load", () => {
  //   chrome.runtime.sendMessage({
  //     type: "PAGE_LOADED",
  //     payload: { url: location.href, title: document.title },
  //   });
  // });
})();
