// background.js - service worker MV3
let capturing = false;

// Listen for toggle from popup
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "TOGGLE_CAPTURE") {
    capturing = !!msg.enabled;
    sendResponse({ ok: true, capturing });
  } else if (msg.type === "PAGE_CAPTURE" && capturing) {
    handlePageCapture(msg.payload);
    sendResponse({ ok: true });
  } else if (msg.type === "PAGE_LOADED" && capturing) {
    // Optionally fetch page snippet from backend for extraction (lightweight)
    handlePageLoad(msg.payload);
  } else {
    sendResponse({ ok: false });
  }
});

async function handlePageCapture(payload) {
  try {
    // Send to backend extract endpoint
    const resp = await fetch("http://localhost:8080/api/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: payload.url,
        title: payload.title,
        snippet: payload.text || payload.context,
      }),
    });
    const data = await resp.json();
    if (data && data.detected) {
      // Send to popup (and store in chrome storage)
      chrome.runtime.sendMessage({
        type: "NEW_DETECTIONS",
        detected: data.detected,
      });
    }
  } catch (err) {
    console.error("Extraction failed", err);
  }
}

async function handlePageLoad(payload) {
  try {
    // Light extraction using small page context to detect prominent dates (optional)
    const resp = await fetch("http://localhost:8080/api/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: payload.url,
        title: payload.title,
        snippet: payload.title, // simple for speed
      }),
    });
    const data = await resp.json();
    if (data && data.detected && data.detected.length) {
      chrome.runtime.sendMessage({
        type: "NEW_DETECTIONS",
        detected: data.detected,
      });
    }
  } catch (err) {
    console.error(err);
  }
}
