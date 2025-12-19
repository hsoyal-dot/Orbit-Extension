// background.js (MV3 service worker)

// Configuration - Update USE_PRODUCTION and PRODUCTION_URL before publishing
const CONFIG = {
  USE_PRODUCTION: false, // Set to true for Chrome Web Store release
  PRODUCTION_URL: "https://your-backend-url.railway.app", // Update after backend deployment
  DEVELOPMENT_URL: "http://localhost:8080"
};

const getBackendUrl = () => CONFIG.USE_PRODUCTION ? CONFIG.PRODUCTION_URL : CONFIG.DEVELOPMENT_URL;

let capturing = false;

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === "TOGGLE_CAPTURE") {
    capturing = !!msg.enabled;
    sendResponse({ ok: true, capturing });
    return true;
  }

  if (msg.type === "PAGE_CAPTURE" && capturing) {
    handlePageCapture(msg.payload)
      .then((resp) => sendResponse({ ok: true, resp }))
      .catch((err) => sendResponse({ ok: false, err: String(err) }));
    return true; // indicates async response
  }

  if (msg.type === "IMPORT_PAGE" && msg.payload) {
    // directly extract on user's request
    handlePageCapture(msg.payload)
      .then((resp) => sendResponse({ ok: true, resp }))
      .catch((err) => sendResponse({ ok: false, err: String(err) }));
    return true;
  }

  if (msg.type === "SAVE_EVENT" && msg.payload) {
    handleSaveEvent(msg.payload)
      .then((resp) => sendResponse({ ok: true, resp }))
      .catch((err) => sendResponse({ ok: false, err: String(err) }));
    return true;
  }

  if (msg.type === "EXPORT_ICS") {
    handleExportIcs()
      .then((data) => sendResponse({ ok: true, data }))
      .catch((err) => sendResponse({ ok: false, err: String(err) }));
    return true;
  }

  if (msg.type === "SYNC_GOOGLE") {
    handleSyncGoogle()
      .then((resp) => sendResponse({ ok: true, resp }))
      .catch((err) => sendResponse({ ok: false, err: String(err) }));
    return true;
  }

  sendResponse({ ok: false, reason: "unknown_message" });
  return false;
});

async function handlePageCapture(payload) {
  try {
    // send snippet to backend extract endpoint
    const backendUrl = getBackendUrl();
    const resp = await fetch(`${backendUrl}/api/extract`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: payload.url,
        title: payload.title,
        snippet: payload.snippet,
      }),
    });
    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`Extract failed: ${resp.status} ${text}`);
    }
    const data = await resp.json();
    // store locally and notify popup
    chrome.storage.local.get(["detectedEvents"], (res) => {
      const detected = res.detectedEvents || [];
      const merged = (data.detected || []).concat(detected);
      chrome.storage.local.set({ detectedEvents: merged }, () => {
        // notify popup UI
        chrome.runtime.sendMessage({
          type: "NEW_DETECTIONS",
          detected: merged,
        });
      });
    });
    return data;
  } catch (err) {
    if (err.message && err.message.includes("Failed to fetch")) {
      throw new Error(
        `Backend not reachable. Is the server running on ${getBackendUrl()}?`
      );
    }
    throw err;
  }
}

async function handleSaveEvent(payload) {
  try {
    const backendUrl = getBackendUrl();
    const resp = await fetch(`${backendUrl}/api/saveEvent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`Save failed: ${resp.status} ${text}`);
    }
    return await resp.json();
  } catch (err) {
    if (err.message && err.message.includes("Failed to fetch")) {
      throw new Error(
        `Backend not reachable. Is the server running on ${getBackendUrl()}?`
      );
    }
    throw err;
  }
}

async function handleExportIcs() {
  try {
    const backendUrl = getBackendUrl();
    const resp = await fetch(`${backendUrl}/api/export/ics`, {
      method: "GET",
    });
    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`Export failed: ${resp.status} ${text}`);
    }
    return await resp.text();
  } catch (err) {
    if (err.message && err.message.includes("Failed to fetch")) {
      throw new Error(
        `Backend not reachable. Is the server running on ${getBackendUrl()}?`
      );
    }
    throw err;
  }
}

async function handleSyncGoogle() {
  // TODO: Implement Google Calendar sync
  // For now, just return success
  return { message: "Google Calendar sync not yet implemented" };
}
