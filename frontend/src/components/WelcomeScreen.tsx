import { useEffect, useState } from "react";
import MessageInput from "./MessageInput";

interface Props {
  onSend: (text: string, model: string, provider: string) => void;
  disabled: boolean;
}

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 18) return "Good Afternoon";
  return "Good Evening";
};

const GREETING = getGreeting();
const SUBTEXT = "How can I help you today?";

export default function WelcomeScreen({ onSend, disabled }: Props) {
  const [displayedGreeting, setDisplayedGreeting] = useState("");
  const [displayedSub, setDisplayedSub] = useState("");
  const [greetDone, setGreetDone] = useState(false);
  const [subDone, setSubDone] = useState(false);

  useEffect(() => {
    let i = 0;
    setDisplayedGreeting("");
    setDisplayedSub("");
    setGreetDone(false);
    setSubDone(false);

    // Phase 1: type greeting
    const greetInterval = setInterval(() => {
      i++;
      setDisplayedGreeting(GREETING.slice(0, i));
      if (i >= GREETING.length) {
        clearInterval(greetInterval);
        setGreetDone(true);

        // Phase 2: type subtext after pause
        let j = 0;
        setTimeout(() => {
          const subInterval = setInterval(() => {
            j++;
            setDisplayedSub(SUBTEXT.slice(0, j));
            if (j >= SUBTEXT.length) {
              clearInterval(subInterval);
              setSubDone(true);
            }
          }, 35);
        }, 250);
      }
    }, 50);

    return () => clearInterval(greetInterval);
  }, []);

  return (
    <div className="welcome-screen">
      <div className="welcome-text-block">
        <h1 className="welcome-greeting">
          {displayedGreeting}
          {!greetDone && <span className="typewriter-cursor">|</span>}
        </h1>
        <h2 className="welcome-subtext">
          {greetDone ? displayedSub : ""}
          {greetDone && !subDone && <span className="typewriter-cursor">|</span>}
        </h2>
      </div>

      <div className="welcome-input-wrap">
        <MessageInput onSend={onSend} disabled={disabled} />
      </div>
    </div>
  );
}
