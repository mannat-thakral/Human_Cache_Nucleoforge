const API_BASE = "http://127.0.0.1:8000/api/v1";

document.addEventListener("DOMContentLoaded", async () => {
  const statusDot = document.getElementById("statusDot");
  const statusLabel = document.getElementById("statusLabel");
  const pageTitleInput = document.getElementById("pageTitle");
  const pageUrlInput = document.getElementById("pageUrl");
  const btnCapture = document.getElementById("btnCaptureCurrentPage");
  const btnOpenWebApp = document.getElementById("btnOpenWebApp");
  const captureForm = document.getElementById("captureForm");
  const authBox = document.getElementById("authBox");
  const btnLogin = document.getElementById("btnLogin");
  const authEmail = document.getElementById("authEmail");
  const authPassword = document.getElementById("authPassword");
  const alertBox = document.getElementById("alertBox");

  function showAlert(msg, isSuccess = true) {
    alertBox.style.display = "block";
    alertBox.className = `alert ${isSuccess ? "alert-success" : "alert-error"}`;
    alertBox.textContent = msg;
    setTimeout(() => {
      alertBox.style.display = "none";
    }, 4000);
  }

  // 1. Get active tab info
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs && tabs[0]) {
      pageTitleInput.value = tabs[0].title || "Web Resource";
      pageUrlInput.value = tabs[0].url || "";
    }
  });

  // 2. Check token in storage
  let token = await getStoredToken();

  // 3. Verify backend health and auth status
  try {
    const healthRes = await fetch("http://127.0.0.1:8000/health");
    if (healthRes.ok) {
      if (token) {
        // Verify token with /auth/me
        const meRes = await fetch(`${API_BASE}/auth/me`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (meRes.ok) {
          const user = await meRes.json();
          statusDot.className = "status-dot";
          statusLabel.textContent = `Connected as ${user.email}`;
          captureForm.style.display = "block";
          authBox.style.display = "none";
        } else {
          showLoginState();
        }
      } else {
        showLoginState();
      }
    } else {
      showOfflineState();
    }
  } catch (e) {
    showOfflineState();
  }

  function showOfflineState() {
    statusDot.className = "status-dot offline";
    statusLabel.textContent = "Backend offline (port 8000)";
  }

  function showLoginState() {
    statusDot.className = "status-dot";
    statusLabel.textContent = "Please log in to Human Cache";
    captureForm.style.display = "none";
    authBox.style.display = "block";
  }

  // Handle Login
  btnLogin?.addEventListener("click", async () => {
    const email = authEmail.value.trim();
    const password = authPassword.value;
    if (!email || !password) return;

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.session_token) {
          await setStoredToken(data.session_token);
          token = data.session_token;
          showAlert("Logged in successfully!");
          statusDot.className = "status-dot";
          statusLabel.textContent = `Connected as ${data.user.email}`;
          captureForm.style.display = "block";
          authBox.style.display = "none";
        }
      } else {
        showAlert("Invalid email or password", false);
      }
    } catch {
      showAlert("Login failed: could not connect to backend", false);
    }
  });

  // Handle Capture Current Page
  btnCapture?.addEventListener("click", async () => {
    const url = pageUrlInput.value;
    if (!url) return;

    btnCapture.disabled = true;
    btnCapture.textContent = "Analyzing & Saving...";

    try {
      const res = await fetch(`${API_BASE}/capture/url`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ url, source_type: "extension" })
      });

      if (res.ok) {
        const data = await res.json();
        showAlert(`Saved to Inbox! Suggested: "${data.recommended_category_name}"`);
      } else {
        const err = await res.json();
        showAlert(err.detail || "Capture failed", false);
      }
    } catch (e) {
      showAlert("Error saving capture", false);
    } finally {
      btnCapture.disabled = false;
      btnCapture.textContent = "⚡ Save Page to Human Cache";
    }
  });

  btnOpenWebApp?.addEventListener("click", () => {
    chrome.tabs.create({ url: "http://localhost:3000" });
  });

  async function getStoredToken() {
    return new Promise((resolve) => {
      chrome.storage.local.get(["humancache_token"], (r) => {
        resolve(r.humancache_token || null);
      });
    });
  }

  async function setStoredToken(t) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ humancache_token: t }, resolve);
    });
  }
});
