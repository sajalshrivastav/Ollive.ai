import { useEffect, useState } from "react";
import { MessageSquare, Plus, BarChart2, X } from "lucide-react";
import { getConversations, createConversation, deleteConversation } from "../api/api";

interface Conversation {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  _count: { messages: number };
}

interface Props {
  activeId: string | null;
  onSelect: (id: string, title: string) => void;
  onNew: (id: string) => void;
  showDashboard: boolean;
  onToggleDashboard: () => void;
}

// Shimmer skeleton for loading state
function ShimmerItem() {
  return (
    <div className="shimmer-item">
      <div className="shimmer-icon shimmer" />
      <div className="shimmer-lines">
        <div className="shimmer-line shimmer" style={{ width: "70%" }} />
        <div className="shimmer-line shimmer" style={{ width: "40%" }} />
      </div>
    </div>
  );
}

export default function Sidebar({ activeId, onSelect, onNew, showDashboard, onToggleDashboard }: Props) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const res = await getConversations();
      setConversations(res.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleNew = async () => {
    const res = await createConversation("New Chat");
    onNew(res.data.data.id);
    load();
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await deleteConversation(id);
    load();
  };

  return (
    <div className="sidebar">
      {/* Header */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          {/* <div className="sidebar-logo-icon"> */}
            {/* <span style={{ color: "#fff", fontSize: 13, fontWeight: 800 }}>O</span> */}
          {/* </div> */}
          Ollive.AI
        </div>
        <button className="btn-new" onClick={handleNew}>
          <Plus size={13} /> New
        </button>
      </div>

      {/* Label */}
      <div className="sidebar-section-label">Conversations</div>

      {/* List */}
      <div className="sidebar-list">

        {/* Loading shimmer */}
        {loading && (
          <>
            <ShimmerItem />
            <ShimmerItem />
            <ShimmerItem />
            <ShimmerItem />
          </>
        )}

        {/* Empty state */}
        {!loading && conversations.length === 0 && (
          <div className="sidebar-empty">
            <MessageSquare size={28} color="#a0c4b4" style={{ marginBottom: 8 }} />
            <div style={{ fontWeight: 600, color: "#4a7a64", marginBottom: 4 }}>No chats yet</div>
            <div>Click <strong>+ New</strong> to start your first conversation.</div>
          </div>
        )}

        {/* Conversation list */}
        {!loading && conversations.map((c) => (
          <div
            key={c.id}
            className={`conv-item ${activeId === c.id ? "active" : ""} ${c.status === "CANCELLED" ? "cancelled" : ""}`}
            onClick={() => c.status !== "CANCELLED" && onSelect(c.id, c.title)}
          >
            <div className="conv-icon">
              <MessageSquare size={16} />
            </div>
            <div className="conv-info">
              <div className="conv-title">{c.title}</div>
              <div className="conv-meta">
                {c._count.messages} messages
                {c.status === "CANCELLED" && " · cancelled"}
              </div>
            </div>
            <button className="conv-cancel-btn" onClick={(e) => handleDelete(e, c.id)} title="Delete">
              <X size={12} />
            </button>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="sidebar-footer">
        <button
          className={`btn-dashboard ${showDashboard ? "active" : ""}`}
          onClick={onToggleDashboard}
        >
          <BarChart2 size={15} />
          Dashboard
        </button>
      </div>
    </div>
  );
}
