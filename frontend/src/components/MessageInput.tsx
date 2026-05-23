import { useState, useRef, useEffect } from "react";
import { Send, ChevronDown, Check, Cpu } from "lucide-react";

const MODELS = [
//   { label: "GPT-4o",            value: "openai/gpt-4o",                    provider: "openai",     color: "#10a37f" },
  { label: "GPT-4o Mini",       value: "openai/gpt-4o-mini",               provider: "openai",     color: "#10a37f" },
  { label: "Claude 3.5 Sonnet", value: "anthropic/claude-3.5-sonnet",      provider: "anthropic",  color: "#d97706" },
//   { label: "Claude 3 Haiku",    value: "anthropic/claude-3-haiku",         provider: "anthropic",  color: "#d97706" },
  { label: "Gemini Pro 1.5",    value: "google/gemini-pro-1.5",            provider: "gemini",     color: "#4285f4" },
//   { label: "Llama 3.1 8B",      value: "meta-llama/llama-3.1-8b-instruct", provider: "meta",       color: "#0866ff" },
  { label: "Mistral 7B",        value: "mistralai/mistral-7b-instruct",    provider: "mistral",    color: "#ff7000" },
];

interface Props {
  onSend: (message: string, model: string, provider: string) => void;
  disabled: boolean;
}

export default function MessageInput({ onSend, disabled }: Props) {
  const [text, setText] = useState("");
  const [selectedModel, setSelectedModel] = useState(MODELS[0].value);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selected = MODELS.find((m) => m.value === selectedModel) || MODELS[0];

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSend = () => {
    if (!text.trim() || disabled) return;
    onSend(text.trim(), selected.value, selected.provider);
    setText("");
    if (textareaRef.current) textareaRef.current.style.height = "22px";
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    e.target.style.height = "22px";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 140)}px`;
  };

  return (
    <div className="mi-wrapper">
      <div className={`mi-box ${disabled ? "mi-box--disabled" : ""}`}>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          className="mi-textarea"
          value={text}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Message Ollive AI..."
          disabled={disabled}
          rows={1}
        />

        {/* Bottom bar: pill selector + send */}
        <div className="mi-bottom">

          {/* Model pill */}
          <div className="mi-pill-wrap" ref={dropdownRef}>
            <button
              className="mi-pill"
              onClick={() => setDropdownOpen((v) => !v)}
              style={{ "--pill-color": selected.color } as React.CSSProperties}
            >
              <span className="mi-pill-dot" style={{ background: selected.color }} />
              <span className="mi-pill-label">{selected.label}</span>
              <ChevronDown size={12} className={`mi-pill-chevron ${dropdownOpen ? "open" : ""}`} />
            </button>

            {/* Custom dropdown */}
            {dropdownOpen && (
              <div className="mi-dropdown">
                <div className="mi-dropdown-header">
                  <Cpu size={12} />
                  Select Model
                </div>
                {MODELS.map((m) => (
                  <button
                    key={m.value}
                    className={`mi-dropdown-item ${m.value === selectedModel ? "active" : ""}`}
                    onClick={() => { setSelectedModel(m.value); setDropdownOpen(false); }}
                  >
                    <span className="mi-dropdown-dot" style={{ background: m.color }} />
                    <div className="mi-dropdown-info">
                      <span className="mi-dropdown-name">{m.label}</span>
                      <span className="mi-dropdown-provider">via {m.provider}</span>
                    </div>
                    {m.value === selectedModel && <Check size={13} className="mi-dropdown-check" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Send button */}
          <button
            className="mi-send"
            onClick={handleSend}
            disabled={disabled || !text.trim()}
          >
           Send <Send size={14} />
          </button>
        </div>
      </div>
      <div className="mi-hint">Press Enter to send · Shift+Enter for new line</div>
    </div>
  );
}
