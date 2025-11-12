// popup.js - simple UI logic for Orbit demo
const toggle = document.getElementById("toggleCapture");
const status = document.getElementById("status");
const detectedList = document.getElementById("detectedList");
const filterSelect = document.getElementById("filterSelect");
const exportIcsBtn = document.getElementById("exportIcsBtn");
const syncGoogleBtn = document.getElementById("syncGoogleBtn");

let detected = []; // local cache of detected events

// Load stored detected events from chrome.storage
function loadDetected() {
  chrome.storage.local.get(["detectedEvents"], (res) => {
    detected = res.detectedEvents || [];
    renderList();
  });
}

function renderList() {
  const filter = filterSelect.value;
  detectedList.innerHTML = "";
  const filtered = detected.filter((e) =>
    filter === "all" ? true : e.tag === filter
  );
  if (filtered.length === 0) {
    detectedList.innerHTML = '<p style="color:#666">No detected events</p>';
    return;
  }
  filtered.forEach((ev, idx) => {
    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `
      <div>
        <div><strong>${ev.title}</strong> <small class="conf">(${Math.round(
      (ev.confidence || 0) * 100
    )}%)</small></div>
        <div class="meta">${ev.date}${
      ev.time ? " " + ev.time : ""
    } — <a href="#" data-idx="${idx}" class="openSource">source</a></div>
        <div class="meta">${ev.source_snippet || ""}</div>
      </div>
      <div class="actions">
        <button data-action="approve" data-idx="${idx}">Save</button>
        <button data-action="delete" data-idx="${idx}">Remove</button>
      </div>
    `;
    detectedList.appendChild(div);
  });
}

detectedList.addEventListener("click", (e) => {
  const target = e.target;
  if (target.matches("button")) {
    const idx = parseInt(target.dataset.idx);
    const action = target.dataset.action;
    if (action === "approve") approveEvent(idx);
    if (action === "delete") deleteEvent(idx);
  } else if (target.matches("a.openSource")) {
    const idx = parseInt(target.dataset.idx);
    const ev = detected[idx];
    if (ev && ev.url) chrome.tabs.create({ url: ev.url });
  }
});

function approveEvent(idx) {
  const ev = detected[idx];
  fetch("http://localhost:8080/api/saveEvent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(ev),
  })
    .then(() => {
      // Optionally remove from detected or mark saved
      detected[idx].saved = true;
      chrome.storage.local.set({ detectedEvents: detected }, loadDetected);
    })
    .catch((err) => alert("Save failed: " + err));
}

function deleteEvent(idx) {
  detected.splice(idx, 1);
  chrome.storage.local.set({ detectedEvents: detected }, loadDetected);
}

toggle.addEventListener("change", () => {
  const on = toggle.checked;
  status.textContent = on ? "Capturing" : "Idle";
  // Inform background to enable/disable capture
  chrome.runtime.sendMessage({ type: "TOGGLE_CAPTURE", enabled: on });
});

filterSelect.addEventListener("change", renderList);

exportIcsBtn.addEventListener("click", () => {
  fetch("http://localhost:8080/api/export/ics", { method: "GET" })
    .then((resp) => resp.blob())
    .then((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "orbit-events.ics";
      a.click();
      URL.revokeObjectURL(url);
    });
});

syncGoogleBtn.addEventListener("click", () => {
  // Open auth endpoint which will initiate server-side OAuth
  chrome.tabs.create({ url: "http://localhost:8080/api/auth/google" });
});

// Listen for messages from background (new detections)
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "NEW_DETECTIONS") {
    detected = (msg.detected || []).concat(detected);
    chrome.storage.local.set({ detectedEvents: detected }, loadDetected);
  }
});

loadDetected();
