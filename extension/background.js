/**
 * Human Cache Extension — Background Service Worker (Manifest V3)
 * Handles context menu creation, selected text capture, and communication with backend.
 */

const API_BASE_URL = "http://127.0.0.1:8000/api/v1";

// 1. Create Context Menu item on extension install
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "save-to-human-cache",
    title: "Save to Human Cache",
    contexts: ["selection", "page", "link"]
  });
});

// 2. Handle Context Menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "save-to-human-cache") {
    const sessionToken = await getStoredSessionToken();
    if (!sessionToken) {
      chrome.action.openPopup?.();
      return;
    }

    if (info.selectionText) {
      // Capture selection
      await sendCaptureToBackend({
        endpoint: "/capture/text",
        payload: {
          content_text: info.selectionText,
          title: tab?.title ? `Excerpt: ${tab.title}` : "Web Selection",
          source_type: "extension",
          source_url: tab?.url || info.pageUrl
        },
        sessionToken
      });
    } else if (info.linkUrl) {
      // Capture linked URL
      await sendCaptureToBackend({
        endpoint: "/capture/url",
        payload: {
          url: info.linkUrl,
          source_type: "extension"
        },
        sessionToken
      });
    } else if (tab?.url) {
      // Capture active page URL
      await sendCaptureToBackend({
        endpoint: "/capture/url",
        payload: {
          url: tab.url,
          source_type: "extension"
        },
        sessionToken
      });
    }
  }
});

// 3. Helper to retrieve stored session token from chrome.storage.local
async function getStoredSessionToken() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["humancache_token"], (result) => {
      resolve(result.humancache_token || null);
    });
  });
}

// 4. Send capture to backend API
async function sendCaptureToBackend({ endpoint, payload, sessionToken }) {
  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${sessionToken}`
      },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      const data = await res.json();
      chrome.notifications?.create({
        type: "basic",
        iconUrl: "icons/icon48.png",
        title: "Saved to Human Cache Inbox",
        message: `"${data.title || 'Resource'}" is ready in your Capture Inbox with AI category suggestion.`
      });
    } else {
      console.error("Capture request returned non-OK status:", res.status);
    }
  } catch (err) {
    console.error("Capture network request failed:", err);
  }
}
