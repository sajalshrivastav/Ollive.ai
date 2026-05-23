import { useEffect, useRef } from "react";
import { Bot, User } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

interface Props {
  messages: Message[];
  loading: boolean;
}

export default function ChatWindow({ messages, loading }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  if (messages.length === 0 && !loading) {
    return (
      <div className="chat-window">
        <div className="empty-state">
          <div className="empty-state-icon">
            <Bot size={26} color="#a0c4b4" />
          </div>
          <h3>Start the conversation</h3>
          <p>Type a message below to chat with the AI assistant.</p>
        </div>
      </div>
    );
  }

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="chat-window">
      {messages.map((m) => (
        <div key={m.id} className={`message-row ${m.role}`}>
          <div className="message-avatar">
            {m.role === "user" ? <User size={14} /> : <Bot size={14} />}
          </div>
          <div className="message-content-wrap">
            {m.role === "assistant" ? (
              <div className="message-bubble markdown-body">
                <ReactMarkdown
                  components={{
                    // Code blocks
                    code({ className, children, ...props }) {
                      const isBlock = className?.includes("language-");
                      return isBlock ? (
                        <pre className="md-code-block">
                          <code className={className} {...props}>
                            {children}
                          </code>
                        </pre>
                      ) : (
                        <code className="md-inline-code" {...props}>
                          {children}
                        </code>
                      );
                    },
                    // Paragraphs
                    p({ children }) {
                      return <p className="md-p">{children}</p>;
                    },
                    // Headings
                    h1({ children }) { return <h1 className="md-h1">{children}</h1>; },
                    h2({ children }) { return <h2 className="md-h2">{children}</h2>; },
                    h3({ children }) { return <h3 className="md-h3">{children}</h3>; },
                    // Lists
                    ul({ children }) { return <ul className="md-ul">{children}</ul>; },
                    ol({ children }) { return <ol className="md-ol">{children}</ol>; },
                    li({ children }) { return <li className="md-li">{children}</li>; },
                    // Bold & italic
                    strong({ children }) { return <strong className="md-strong">{children}</strong>; },
                    em({ children }) { return <em className="md-em">{children}</em>; },
                    // Blockquote
                    blockquote({ children }) {
                      return <blockquote className="md-blockquote">{children}</blockquote>;
                    },
                    // Horizontal rule
                    hr() { return <hr className="md-hr" />; },
                  }}
                >
                  {m.content}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="message-bubble">{m.content}</div>
            )}
            <div className="message-time">{formatTime(m.createdAt)}</div>
          </div>
        </div>
      ))}

      {/* Typing indicator */}
      {loading && (
        <div className="message-row assistant">
          <div className="message-avatar">
            <Bot size={14} />
          </div>
          <div className="message-content-wrap">
            <div className="message-bubble">
              <div className="typing-indicator">
                <div className="typing-dot" />
                <div className="typing-dot" />
                <div className="typing-dot" />
              </div>
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
