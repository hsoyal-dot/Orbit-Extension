/* popup.js
   - Handles UI for popup.html
   - Imports current tab (selection or title)
   - Shows detected events (from chrome.storage.local)
   - Sends save requests to backend for saved events
*/

// Import configuration (backend URL is centralized in config.js)
// Note: Backend base URL is no longer needed here as background.js handles all API calls

// --- DOM helpers ---
const $ = (id) => document.getElementById(id);

// Called on popup load
async function initPopup() {
  // wire buttons
  const importBtn = $("importTabBtn");
  if (importBtn) importBtn.addEventListener("click", importCurrentTab);

  const exportIcsBtn = $("exportIcsBtn");
  if (exportIcsBtn) exportIcsBtn.addEventListener("click", exportIcs);

  const manageEventsBtn = $("manageEventsBtn");
  if (manageEventsBtn) manageEventsBtn.addEventListener("click", showSavedEvents);

  const backToMainBtn = $("backToMainBtn");
  if (backToMainBtn) backToMainBtn.addEventListener("click", showMainView);

  const clearAllBtn = $("clearAllBtn");
  if (clearAllBtn) clearAllBtn.addEventListener("click", clearAllEvents);

  const toggleCapture = $("toggleCapture");
  if (toggleCapture) {
    toggleCapture.addEventListener("change", () => {
      // toggle capturing in storage
      const enabled = toggleCapture.checked;
      chrome.storage.local.set({ capturing: enabled }, () => {
        renderCaptureToggle(enabled);
        updateStatus(enabled);
      });
      // notify background too
      chrome.runtime.sendMessage({
        type: "TOGGLE_CAPTURE",
        enabled: enabled,
      });
    });
  }

  // initial render
  renderCaptureToggle();
  updateStatus();
  loadDetectedIntoUI();
  // also listen for runtime messages (background -> popup)
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === "NEW_DETECTIONS") {
      renderDetectedList(msg.detected || []);
    }
  });
}

function renderCaptureToggle(value) {
  const checkbox = $("toggleCapture");
  if (!checkbox) return;
  if (typeof value === "undefined") {
    chrome.storage.local.get(["capturing"], (res) => {
      const enabled = !!res.capturing;
      checkbox.checked = enabled;
      renderCaptureToggle(enabled);
      updateStatus(enabled);
    });
    return;
  }
  checkbox.checked = value;
}

function updateStatus(value) {
  const statusEl = $("status");
  if (!statusEl) return;
  if (typeof value === "undefined") {
    chrome.storage.local.get(["capturing"], (res) => {
      updateStatus(!!res.capturing);
    });
    return;
  }
  statusEl.textContent = value ? "Running" : "Idle";
}

// --- Import current tab handler (this is the improved piece) ---
async function importCurrentTab() {
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (!tab) return alert("No active tab found");

    // request page selection via scripting.executeScript (runs in page)
    chrome.scripting.executeScript(
      {
        target: { tabId: tab.id },
        func: () => window.getSelection().toString().trim(),
      },
      (results) => {
        if (chrome.runtime.lastError) {
          console.error(
            "executeScript error:",
            chrome.runtime.lastError.message
          );
          alert(
            "Could not read selection from page: " +
              chrome.runtime.lastError.message
          );
          return;
        }

        const snippet =
          results && results[0] && results[0].result ? results[0].result : "";
        const payload = {
          url: tab.url,
          title: tab.title,
          snippet: snippet || tab.title,
        };

        // Send to background to perform extraction (background handles sending to backend)
        chrome.runtime.sendMessage({ type: "IMPORT_PAGE", payload }, (resp) => {
          if (chrome.runtime.lastError) {
            console.error(
              "Runtime error sending message:",
              chrome.runtime.lastError.message
            );
            alert("Import failed: " + chrome.runtime.lastError.message);
            return;
          }
          if (resp && resp.ok) {
            alert("Imported — check detected list");
            // refresh UI
            loadDetectedIntoUI();
          } else {
            const errorMsg = resp?.err || resp?.reason || "Unknown error";
            console.error("Import response error", resp);
            alert("Import failed: " + errorMsg);
          }
        });
      }
    );
  } catch (err) {
    console.error(err);
    alert("Import failed: " + (err && err.message ? err.message : err));
  }
}

// --- Detected events UI ---
function loadDetectedIntoUI() {
  chrome.storage.local.get(["detectedEvents"], (res) => {
    const detected = res.detectedEvents || [];
    renderDetectedList(detected);
  });
}

function renderDetectedList(list) {
  const container = $("detectedList");
  if (!container) {
    console.warn("No detectedList element in popup.html");
    return;
  }
  container.innerHTML = "";

  if (!list || list.length === 0) {
    container.innerHTML = '<div class="empty">No detections yet.</div>';
    return;
  }

  list.forEach((ev, idx) => {
    const card = document.createElement("div");
    card.className = "detected-card";

    const title = document.createElement("div");
    title.className = "detected-title";
    title.textContent =
      ev.title ||
      (ev.sourceSnippet ? ev.sourceSnippet.substring(0, 60) + "..." : ev.url);

    const meta = document.createElement("div");
    meta.className = "detected-meta";
    meta.textContent = `${ev.date || "unknown date"} ${ev.time || ""} • ${
      ev.tag || "unclassified"
    } • ${Math.round((ev.confidence || 0) * 100)}%`;

    const actions = document.createElement("div");
    actions.className = "detected-actions";

    const saveBtn = document.createElement("button");
    saveBtn.textContent = "Save";
    saveBtn.addEventListener("click", () => saveDetectedEvent(ev, idx));

    const openBtn = document.createElement("button");
    openBtn.textContent = "Open";
    openBtn.addEventListener("click", () => {
      if (ev.url) chrome.tabs.create({ url: ev.url });
    });

    const removeBtn = document.createElement("button");
    removeBtn.textContent = "Remove";
    removeBtn.addEventListener("click", () => removeDetectedEvent(idx));

    actions.appendChild(saveBtn);
    actions.appendChild(openBtn);
    actions.appendChild(removeBtn);

    const snippet = document.createElement("pre");
    snippet.className = "detected-snippet";
    snippet.textContent = ev.sourceSnippet || ev.snippet || "";

    card.appendChild(title);
    card.appendChild(meta);
    card.appendChild(snippet);
    card.appendChild(actions);

    container.appendChild(card);
  });
}

// Save a detected event to backend (via background script)
async function saveDetectedEvent(ev, idx) {
  try {
    // normalize payload to server field names (adjust according to your Event entity)
    const payload = {
      title: ev.title || ev.sourceSnippet?.substring(0, 100) || "Untitled",
      date: ev.date || "",
      time: ev.time || "",
      tag: ev.tag || "Uncategorized",
      confidence: ev.confidence || 0,
      sourceSnippet: ev.sourceSnippet || ev.snippet || "",
      url: ev.url || "",
    };

    // Route through background script to avoid CORS issues
    chrome.runtime.sendMessage({ type: "SAVE_EVENT", payload }, (resp) => {
      if (chrome.runtime.lastError) {
        console.error("Runtime error:", chrome.runtime.lastError.message);
        alert("Save failed: " + chrome.runtime.lastError.message);
        return;
      }
      if (resp && resp.ok) {
        alert("Saved to server");
        // optionally remove from detected list after saving (persisted server-side)
        chrome.storage.local.get(["detectedEvents"], (res) => {
          const arr = res.detectedEvents || [];
          arr.splice(idx, 1);
          chrome.storage.local.set({ detectedEvents: arr }, () =>
            loadDetectedIntoUI()
          );
        });
      } else {
        const errorMsg = resp?.err || resp?.reason || "Unknown error";
        console.error("Save response error", resp);
        alert("Save failed: " + errorMsg);
      }
    });
  } catch (err) {
    console.error(err);
    alert("Save failed: " + (err.message || err));
  }
}

// Remove a detected event from the list
function removeDetectedEvent(idx) {
  chrome.storage.local.get(["detectedEvents"], (res) => {
    const arr = res.detectedEvents || [];
    if (idx >= 0 && idx < arr.length) {
      arr.splice(idx, 1);
      chrome.storage.local.set({ detectedEvents: arr }, () => {
        loadDetectedIntoUI();
      });
    }
  });
}

// Export ICS file
async function exportIcs() {
  try {
    chrome.runtime.sendMessage({ type: "EXPORT_ICS" }, (resp) => {
      if (chrome.runtime.lastError) {
        console.error("Runtime error:", chrome.runtime.lastError.message);
        alert("Export failed: " + chrome.runtime.lastError.message);
        return;
      }
      if (resp && resp.ok && resp.data) {
        // Create download link
        const blob = new Blob([resp.data], { type: "text/calendar" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "orbit-events.ics";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        alert("ICS file downloaded");
      } else {
        const errorMsg = resp?.err || resp?.reason || "Unknown error";
        console.error("Export response error", resp);
        alert("Export failed: " + errorMsg);
      }
    });
  } catch (err) {
    console.error(err);
    alert("Export failed: " + (err.message || err));
  }
}

// --- Event Management Functions ---

function showMainView() {
  const mainContainer = document.querySelector(".container");
  const savedEventsSection = $("savedEventsSection");
  if (mainContainer) mainContainer.style.display = "block";
  if (savedEventsSection) savedEventsSection.classList.add("hidden");
}

function showSavedEvents() {
  chrome.runtime.sendMessage({ type: "GET_SAVED_EVENTS" }, (resp) => {
    if (chrome.runtime.lastError) {
      console.error("Runtime error:", chrome.runtime.lastError.message);
      alert("Failed to fetch events: " + chrome.runtime.lastError.message);
      return;
    }
    if (resp && resp.ok) {
      renderSavedEventsList(resp.data || []);
      // Switch to saved events view
      const mainContainer = document.querySelector(".container");
      const savedEventsSection = $("savedEventsSection");
      if (mainContainer) mainContainer.style.display = "none";
      if (savedEventsSection) savedEventsSection.classList.remove("hidden");
    } else {
      const errorMsg = resp?.err || resp?.reason || "Unknown error";
      console.error("Fetch events error", resp);
      alert("Failed to fetch events: " + errorMsg);
    }
  });
}

function renderSavedEventsList(events) {
  const container = $("savedEventsList");
  if (!container) return;
  
  container.innerHTML = "";
  
  if (!events || events.length === 0) {
    container.innerHTML = '<div class="empty">No saved events on server.</div>';
    return;
  }
  
  events.forEach((event) => {
    const card = document.createElement("div");
    card.className = "detected-card";
    
    const title = document.createElement("div");
    title.className = "detected-title";
    title.textContent = event.title || "Untitled Event";
    
    const meta = document.createElement("div");
    meta.className = "detected-meta";
    meta.textContent = `${event.date || "No date"} ${event.time || ""} • ${event.tag || "Uncategorized"}`;
    
    const actions = document.createElement("div");
    actions.className = "detected-actions";
    
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.className = "delete-btn";
    deleteBtn.addEventListener("click", () => deleteSavedEvent(event.id));
    
    const openBtn = document.createElement("button");
    openBtn.textContent = "Open";
    openBtn.addEventListener("click", () => {
      if (event.url) chrome.tabs.create({ url: event.url });
    });
    
    actions.appendChild(openBtn);
    actions.appendChild(deleteBtn);
    
    const snippet = document.createElement("pre");
    snippet.className = "detected-snippet";
    snippet.textContent = event.sourceSnippet || "";
    
    card.appendChild(title);
    card.appendChild(meta);
    card.appendChild(snippet);
    card.appendChild(actions);
    
    container.appendChild(card);
  });
}

function deleteSavedEvent(id) {
  if (!confirm("Delete this event from the server?")) return;
  
  chrome.runtime.sendMessage({ type: "DELETE_EVENT", id: id }, (resp) => {
    if (chrome.runtime.lastError) {
      console.error("Runtime error:", chrome.runtime.lastError.message);
      alert("Delete failed: " + chrome.runtime.lastError.message);
      return;
    }
    if (resp && resp.ok) {
      // Refresh the list
      showSavedEvents();
    } else {
      const errorMsg = resp?.err || resp?.reason || "Unknown error";
      console.error("Delete error", resp);
      alert("Delete failed: " + errorMsg);
    }
  });
}

function clearAllEvents() {
  if (!confirm("Delete ALL saved events from the server? This cannot be undone.")) return;
  
  chrome.runtime.sendMessage({ type: "CLEAR_ALL_EVENTS" }, (resp) => {
    if (chrome.runtime.lastError) {
      console.error("Runtime error:", chrome.runtime.lastError.message);
      alert("Clear failed: " + chrome.runtime.lastError.message);
      return;
    }
    if (resp && resp.ok) {
      alert("All events cleared from server");
      // Refresh the list
      showSavedEvents();
    } else {
      const errorMsg = resp?.err || resp?.reason || "Unknown error";
      console.error("Clear all error", resp);
      alert("Clear failed: " + errorMsg);
    }
  });
}

// --- Start up ---
document.addEventListener("DOMContentLoaded", initPopup);
