import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Landing.css";

const SCRIPT = [
  { user: "a", text: "function twoSum(nums, target) {\n" },
  { user: "b", text: "  const seen = new Map();\n" },
  { user: "a", text: "  for (let i = 0; i < nums.length; i++) {\n" },
  { user: "b", text: "    const need = target - nums[i];\n" },
  { user: "a", text: "    if (seen.has(need)) return [seen.get(need), i];\n" },
  { user: "b", text: "    seen.set(nums[i], i);\n" },
  { user: "a", text: "  }\n}" }
];

function useTypedDemo() {
  const [lines, setLines] = useState([]);
  const [activeUser, setActiveUser] = useState("a");

  useEffect(() => {
    let lineIndex = 0;
    let charIndex = 0;
    let current = "";
    let cancelled = false;

    const type = () => {
      if (cancelled) return;

      if (lineIndex >= SCRIPT.length) {
        setTimeout(() => {
          if (cancelled) return;
          setLines([]);
          lineIndex = 0;
          charIndex = 0;
          current = "";
          type();
        }, 1800);
        return;
      }

      const line = SCRIPT[lineIndex];
      setActiveUser(line.user);

      if (charIndex < line.text.length) {
        current += line.text[charIndex];
        charIndex++;
        setLines((prev) => [...prev.slice(0, lineIndex), current]);
        setTimeout(type, 22);
      } else {
        lineIndex++;
        charIndex = 0;
        current = "";
        setTimeout(type, 200);
      }
    };

    type();
    return () => {
      cancelled = true;
    };
  }, []);

  return { lines, activeUser };
}

function Landing() {
  const { lines, activeUser } = useTypedDemo();

  return (
    <div className="landing">
      <nav className="landing-nav">
        <span className="landing-nav__logo">paircode<span className="cursor-blink">_</span></span>
        <div className="landing-nav__links">
          <Link to="/login" className="landing-nav__ghost">Log in</Link>
          <Link to="/register" className="landing-nav__cta">Get started</Link>
        </div>
      </nav>

      <header className="hero">
        <div className="hero-copy">
          <p className="hero-eyebrow">real-time collaborative coding</p>
          <h1>
            Code together.
            <br />
            Same file, same room, no delay.
          </h1>
          <p className="hero-sub">
            PAIRCODE is a browser-based editor where you and a teammate write,
            run, and debug code in the same session — live cursors, shared
            files, one room code to join.
          </p>
          <div className="hero-actions">
            <Link to="/register" className="btn btn--a">Start a session</Link>
            <Link to="/login" className="btn btn--ghost">I have an account</Link>
          </div>
        </div>

        <div className="hero-demo">
          <div className="demo-window">
            <div className="demo-window__bar">
              <span className="demo-dot" />
              <span className="demo-dot" />
              <span className="demo-dot" />
              <span className="demo-window__title">two-sum.js</span>
            </div>
            <div className="demo-window__body">
              <pre>
                {lines.join("\n")}
                <span className={`demo-cursor demo-cursor--${activeUser}`}>▍</span>
              </pre>
            </div>
            <div className="demo-window__footer">
              <span className="presence-dot presence-dot--a" /> Tanishq
              <span className="presence-dot presence-dot--b" /> Rahul
            </div>
          </div>
        </div>
      </header>

      <section className="features">
        <p className="section-eyebrow">what you get</p>
        <div className="feature-list">
          <div className="feature feature--a">
            <h3>Live sync</h3>
            <p>Every keystroke reaches everyone in the room over a persistent WebSocket connection — no refresh, no polling.</p>
          </div>
          <div className="feature feature--b">
            <h3>Presence</h3>
            <p>See who's in the room, who joined, who left — updated the instant it happens.</p>
          </div>
          <div className="feature feature--a">
            <h3>Shareable rooms</h3>
            <p>Create a room, get a short code, send it to a teammate. They're in the session in one step.</p>
          </div>
          <div className="feature feature--b">
            <h3>Real accounts</h3>
            <p>JWT-based auth keeps your rooms and sessions tied to you, not a browser tab.</p>
          </div>
        </div>
      </section>

      <section className="how">
        <p className="section-eyebrow">how it works</p>
        <ol className="how-steps">
          <li>
            <span className="how-num">1</span>
            <div>
              <h4>Create a room</h4>
              <p>Spin up a session and get a unique room code.</p>
            </div>
          </li>
          <li>
            <span className="how-num">2</span>
            <div>
              <h4>Share the code</h4>
              <p>Send it to whoever you're pairing with.</p>
            </div>
          </li>
          <li>
            <span className="how-num">3</span>
            <div>
              <h4>Code together</h4>
              <p>Same file, same room, live — right in the browser.</p>
            </div>
          </li>
        </ol>
      </section>

      <footer className="landing-footer">
        <p>Built with React, Node/Express, Socket.IO, and MongoDB.</p>
      </footer>
    </div>
  );
}

export default Landing;