import { useState, useEffect, useRef } from "react";
import { Cpu, Pencil, Check } from "lucide-react";
import Sidebar from "./components/Sidebar";
import ChatWindow from "./components/Chatwindow";
import MessageInput from "./components/MessageInput";
import Dashboard from "./components/Dashboard";
import WelcomeScreen from "./components/WelcomeScreen";
import { useToast } from "./components/Toast";
import { getMessages, sendMessage, createConversation, updateConversationTitle } from "./api/api";
import "./App.css";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export default function App() {
  const { toast } = useToast();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [activeTitle, setActiveTitle] = useState("New Chat");
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState("");
  const [sidebarKey, setSidebarKey] = useState(0);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!activeId) { setMessages([]); return; }
    getMessages(activeId)
      .then((res) => setMessages(res.data.data))
      .catch(() => toast("Failed to load messages", "error"));
  }, [activeId]);

  useEffect(() => {
    if (editingTitle) titleRef.current?.focus();
  }, [editingTitle]);

  const handleSelect = (id: string, title?: string) => {
    setActiveId(id);
    if (title) setActiveTitle(title);
    setShowDashboard(false);
  };

  const handleNew = (id: string) => {
    setActiveId(id);
    setMessages([]);
    setShowDashboard(false);
    setActiveTitle("New Chat");
    setSidebarKey(k => k + 1);
  };

  const startEditTitle = () => {
    setTitleInput(activeTitle);
    setEditingTitle(true);
  };

  const saveTitle = async () => {
    const trimmed = titleInput.trim();
    if (!trimmed || !activeId) { setEditingTitle(false); return; }
    try {
      await updateConversationTitle(activeId, trimmed);
      setActiveTitle(trimmed);
      setSidebarKey(k => k + 1); // refresh sidebar to show new title
      toast("Title updated", "success");
    } catch {
      toast("Failed to update title", "error");
    }
    setEditingTitle(false);
  };

  const handleSend = async (text: string, model: string, provider: string) => {
    if (!activeId) {
      try {
        const res = await createConversation(text.slice(0, 40));
        const newId = res.data.data.id;
        setActiveId(newId);
        setActiveTitle(text.slice(0, 40));
        setSidebarKey(k => k + 1);
        sendToApi(newId, text, model, provider);
      } catch {
        toast("Failed to create conversation", "error");
      }
      return;
    }
    sendToApi(activeId, text, model, provider);
  };

  const sendToApi = async (convId: string, text: string, model: string, provider: string) => {
    const tempUserMsg: Message = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setLoading(true);

    try {
      const res = await sendMessage({ conversationId: convId, message: text, model, provider });
      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: res.data.data.content,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      toast("Failed to get response. Check your API key.", "error");
      setMessages((prev) => [...prev, {
        id: `err-${Date.now()}`,
        role: "assistant",
        content: "Something went wrong. Please try again.",
        createdAt: new Date().toISOString(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-layout">
      <Sidebar
        key={sidebarKey}
        activeId={activeId}
        onSelect={handleSelect}
        onNew={handleNew}
        showDashboard={showDashboard}
        onToggleDashboard={() => setShowDashboard((v) => !v)}
      />

      <div className="main-area">
        {showDashboard ? (
          <>
            <div className="chat-header">
              <div className="chat-header-left">
                <Cpu size={18} color="#1e3a2f" />
                <div>
                  <div className="chat-header-title">Dashboard</div>
                  <div className="chat-header-sub">Inference metrics & logs</div>
                </div>
              </div>
            </div>
            <Dashboard />
          </>
        ) : activeId ? (
          <>
            <div className="chat-header">
              <div className="chat-header-left">
                <div>
                  {editingTitle ? (
                    <div className="title-edit-row">
                      <input
                        ref={titleRef}
                        className="title-input"
                        value={titleInput}
                        onChange={(e) => setTitleInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && saveTitle()}
                        onBlur={saveTitle}
                      />
                      <button className="title-save-btn" onClick={saveTitle}>
                        <Check size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="title-display-row">
                      <div className="chat-header-title">{activeTitle}</div>
                      <button className="title-edit-btn" onClick={startEditTitle}>
                        <Pencil size={13} />
                      </button>
                    </div>
                  )}
                  <div className="chat-header-sub">{messages.length} messages</div>
                </div>
              </div>
            </div>
            <ChatWindow messages={messages} loading={loading} />
            <div className="input-area">
              <div className="input-center">
                <MessageInput onSend={handleSend} disabled={loading} />
              </div>
            </div>
          </>
        ) : (
          <WelcomeScreen onSend={handleSend} disabled={loading} />
        )}
      </div>
    </div>
  );
}
