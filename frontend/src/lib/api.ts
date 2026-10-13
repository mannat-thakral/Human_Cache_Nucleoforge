function getApiBase(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== "undefined") {
    const host = window.location.hostname || "127.0.0.1";
    return `http://${host}:8000/api/v1`;
  }
  return "http://127.0.0.1:8000/api/v1";
}

const TOKEN_STORAGE_KEY = "humancache_token";

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_STORAGE_KEY) || sessionStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setStoredToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
  }
}

export async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const base = getApiBase();
  const url = `${base}${cleanEndpoint}`;
  const token = getStoredToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };

  // Add Authorization Bearer fallback header if token is stored
  if (token && !headers["Authorization"]) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      credentials: "include", // Required for HttpOnly session cookies
      headers,
    });
  } catch (initialErr: any) {
    // If proxy request (/api/v1) had a network error, try direct backend on port 8000
    if (typeof window !== "undefined" && url.startsWith("/")) {
      const host = window.location.hostname || "127.0.0.1";
      const directUrl = `http://${host}:8000/api/v1${cleanEndpoint}`;
      try {
        response = await fetch(directUrl, {
          ...options,
          credentials: "include",
          headers,
        });
      } catch {
        throw new Error(
          "Backend server is offline or unreachable at port 8000. Please start the backend with: uvicorn backend.main:app --port 8000"
        );
      }
    } else {
      throw new Error(
        "Backend server is offline or unreachable at port 8000. Please start the backend with: uvicorn backend.main:app --port 8000"
      );
    }
  }

  if (!response.ok) {
    let errorDetail = `Request failed with status ${response.status}`;
    try {
      const errorJson = await response.json();
      if (typeof errorJson === "string") {
        errorDetail = errorJson;
      } else if (errorJson && errorJson.detail) {
        errorDetail = typeof errorJson.detail === "string" ? errorJson.detail : JSON.stringify(errorJson.detail);
      } else if (errorJson && errorJson.message) {
        errorDetail = errorJson.message;
      }
    } catch {
      try {
        const text = await response.text();
        if (text) errorDetail = text.slice(0, 200);
      } catch {
        // ignore
      }
    }
    const err: any = new Error(errorDetail);
    err.status = response.status;
    throw err;
  }

  return response.json();
}

export const api = {
  // Authentication & Session
  register: async (data: { email: string; password: string; name: string }) => {
    const res = await fetchAPI("/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.session_token) {
      setStoredToken(res.session_token);
    }
    return res;
  },
  login: async (data: { email: string; password: string }) => {
    const res = await fetchAPI("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.session_token) {
      setStoredToken(res.session_token);
    }
    return res;
  },
  getAuthMe: () => fetchAPI("/auth/me"),
  logout: async () => {
    try {
      await fetchAPI("/auth/logout", { method: "POST" });
    } finally {
      setStoredToken(null);
    }
  },

  // System & Reset
  resetDemo: () => fetchAPI("/demo/reset", { method: "POST" }),
  
  // Dashboard
  getDashboardOverview: () => fetchAPI("/dashboard/overview"),
  
  // Categories & Documents
  getCategories: () => fetchAPI("/categories"),
  createCategory: (data: { name: string; description?: string; color?: string }) =>
    fetchAPI("/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
  getDocuments: () => fetchAPI("/documents"),
  uploadDocument: async (file: File, categoryId?: string) => {
    const formData = new FormData();
    formData.append("file", file);
    if (categoryId) formData.append("category_id", categoryId);
    return fetchAPI("/documents/upload", {
      method: "POST",
      body: formData,
    });
  },

  // Secure Capture Inbox & Smart Share
  captureUrl: (url: string, sourceType: string = "web_url") =>
    fetchAPI("/capture/url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, source_type: sourceType }),
    }),
  captureText: (data: { content_text: string; title?: string; source_type?: string; source_url?: string }) =>
    fetchAPI("/capture/text", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
  captureFile: async (file: File, title?: string, sourceType: string = "file") => {
    const formData = new FormData();
    formData.append("file", file);
    if (title) formData.append("title", title);
    formData.append("source_type", sourceType);
    return fetchAPI("/capture/file", {
      method: "POST",
      body: formData,
    });
  },
  getCaptureInbox: () => fetchAPI("/capture/inbox"),
  confirmCapture: (captureId: string, data: { category_id?: string; new_category_name?: string; custom_title?: string }) =>
    fetchAPI(`/capture/${captureId}/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
  discardCapture: (captureId: string) =>
    fetchAPI(`/capture/${captureId}`, {
      method: "DELETE",
    }),


  // Topics & Graph
  getTopics: () => fetchAPI("/topics"),
  getKnowledgeGraph: (detailLevel: string = "simple", focusTopicId?: string, categoryId?: string) => {
    let url = `/knowledge-graph?detail_level=${encodeURIComponent(detailLevel)}`;
    if (focusTopicId) url += `&focus_topic_id=${encodeURIComponent(focusTopicId)}`;
    if (categoryId) url += `&category_id=${encodeURIComponent(categoryId)}`;
    return fetchAPI(url);
  },
  getConceptDetails: (topicId: string) => fetchAPI(`/knowledge-graph/concepts/${topicId}/details`),
  toggleMuteTopic: (topicId: string, mute: boolean) =>
    fetchAPI(`/topics/${topicId}/mute?mute=${mute}`, { method: "POST" }),

  // Learn & AI Tutoring
  explainTopic: (data: { topic_ids?: string[]; query?: string; depth?: string; mode?: string; persona_override?: string }) =>
    fetchAPI("/learn/explain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
  tutorChat: (data: { message: string; conversation_history?: Array<{ role: string; content: string }>; document_ids?: string[] }) =>
    fetchAPI("/tutor/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
  saveLearnAsNote: (data: { title: string; content: string; topic_id?: string; category_id?: string }) =>
    fetchAPI("/learn/save-note", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),

  // Recall & Quizzes
  generateQuiz: (data: { topic_ids?: string[]; question_count?: number; difficulty?: string }) =>
    fetchAPI("/recall/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
  submitQuiz: (data: { quiz_id: string; user_answers: Record<string, string> }) =>
    fetchAPI("/recall/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),

  // Flashcards
  getFlashcardDecks: () => fetchAPI("/flashcards/decks"),
  getDeckCards: (deckId: string) => fetchAPI(`/flashcards/decks/${deckId}/cards`),
  generateFlashcards: (topicId: string, detailLevel?: string, cardCount?: number) => {
    let url = `/flashcards/generate?topic_id=${topicId}`;
    if (detailLevel) url += `&detail_level=${encodeURIComponent(detailLevel)}`;
    if (cardCount) url += `&card_count=${cardCount}`;
    return fetchAPI(url, { method: "POST" });
  },

  // Mind Maps
  getMindMaps: () => fetchAPI("/mind-maps"),
  generateMindMap: (
    centralTopic: string,
    detailLevel: string = "semi-detailed",
    topicId?: string,
    documentId?: string
  ) =>
    fetchAPI("/mind-maps/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        central_topic: centralTopic,
        detail_level: detailLevel,
        topic_id: topicId || null,
        document_id: documentId || null,
      }),
    }),

  // Exam Planner & Date Sheet
  getExams: () => fetchAPI("/exams"),
  createExam: (data: any) =>
    fetchAPI("/exams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
  deleteExam: (examId: string) => fetchAPI(`/exams/${examId}`, { method: "DELETE" }),
  extractDateSheet: async (file?: File, rawText?: string) => {
    const formData = new FormData();
    if (file) formData.append("file", file);
    if (rawText) formData.append("raw_text", rawText);
    return fetchAPI("/exams/date-sheet/extract", {
      method: "POST",
      body: formData,
    });
  },
  getExamTasks: (examId: string) => fetchAPI(`/exams/${examId}/tasks`),
  toggleTask: (taskId: string) => fetchAPI(`/tasks/${taskId}/toggle`, { method: "POST" }),

  // Notes
  getNotes: () => fetchAPI("/notes"),
  createNote: (data: { title: string; content: string; tags?: string[] }) =>
    fetchAPI("/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
  deleteNote: (noteId: string) => fetchAPI(`/notes/${noteId}`, { method: "DELETE" }),

  // Connectivity
  getConnectivity: () => fetchAPI("/connectivity"),

  // Notifications & Autonomous Memory Coach
  getNotifications: () => fetchAPI("/notifications"),
  startNotification: (notifId: string) =>
    fetchAPI(`/notifications/${notifId}/start`, { method: "POST" }),
  markNotificationRead: (notifId: string) =>
    fetchAPI(`/notifications/${notifId}/read`, { method: "POST" }),
  markAllNotificationsRead: () =>
    fetchAPI("/notifications/read-all", { method: "POST" }),
  snoozeNotification: (notifId: string, minutes: number = 60) =>
    fetchAPI(`/notifications/${notifId}/snooze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ snooze_minutes: minutes }),
    }),
  dismissNotification: (notifId: string) =>
    fetchAPI(`/notifications/${notifId}/dismiss`, { method: "POST" }),
  noNeedNotification: (notifId: string) =>
    fetchAPI(`/notifications/${notifId}/no-need`, { method: "POST" }),

  // Suppressed Topics Management
  getSuppressedTopics: () => fetchAPI("/topics/suppressed"),
  unsuppressTopic: (topicId: string) =>
    fetchAPI(`/topics/${topicId}/unsuppress`, { method: "POST" }),

  // Web Push Subscriptions
  subscribeWebPush: (subscriptionData: { endpoint: string; p256dh: string; auth: string; user_agent?: string }) =>
    fetchAPI("/notifications/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(subscriptionData),
    }),
  unsubscribeWebPush: (endpoint: string) =>
    fetchAPI("/notifications/push/unsubscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint }),
    }),

  // User Profile
  getUserProfile: () => fetchAPI("/users/me"),
  updateUserPreferences: (data: any) =>
    fetchAPI("/users/preferences", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
};
