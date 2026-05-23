import axios from "axios";

const BASE_URL = "http://localhost:8000";

const api = axios.create({ baseURL: BASE_URL });

// Conversations
export const getConversations = () => api.get("/api/conversation");
export const createConversation = (title: string) => api.post("/api/conversation", { title });
export const cancelConversation = (id: string) => api.patch(`/api/conversation/${id}/cancel`);
export const deleteConversation = (id: string) => api.delete(`/api/conversation/${id}`);
export const updateConversationTitle = (id: string, title: string) => api.patch(`/api/conversation/${id}/title`, { title });
export const getMessages = (id: string) => api.get(`/api/conversation/${id}/messages`);

// Chat
export const sendMessage = (data: {
  conversationId: string;
  message: string;
  model: string;
  provider: string;
}) => api.post("/api/chat", data);

// Dashboard
export const getDashboard = () => api.get("/api/dashboard");
