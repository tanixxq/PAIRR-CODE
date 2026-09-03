import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useSocket } from "../Hooks/useSocket.js";
import Editor from "@monaco-editor/react";
import "./RoomEditor.css";

const AVATAR_COLORS = ["#5EEAD4", "#FF8B6B", "#A78BFA", "#FBBF24", "#60A5FA"];

const LANGUAGES = [
  { id: "javascript", label: "JavaScript" },
  { id: "typescript", label: "TypeScript" },
  { id: "python", label: "Python" },
  { id: "java", label: "Java" },
  { id: "cpp", label: "C++" },
  { id: "c", label: "C" },
  { id: "go", label: "Go" }
];

function colorForId(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function RoomEditor() {
  const { roomCode } = useParams();
  const socketRef = useSocket();
  const editorRef = useRef(null);
  const isRemoteUpdate = useRef(false);

  const [users, setUsers] = useState([]);
  const [copied, setCopied] = useState(false);
  const [connected, setConnected] = useState(false);
  const [language, setLanguage] = useState("javascript");

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("join-room", roomCode);
    });

    socket.on("disconnect", () => setConnected(false));

    socket.on("room-users", (userList) => {
      setUsers(userList);
    });

    socket.on("init-state", ({ code, language: lang }) => {
      const editor = editorRef.current;
      if (editor && code) {
        isRemoteUpdate.current = true;
        editor.setValue(code);
        isRemoteUpdate.current = false;
      }
      if (lang) setLanguage(lang);
    });

    socket.on("code-change", (code) => {
      const editor = editorRef.current;
      if (!editor) return;

      const current = editor.getValue();
      if (current === code) return;

      isRemoteUpdate.current = true;
      editor.setValue(code);
      isRemoteUpdate.current = false;
    });

    socket.on("language-change", (lang) => {
      setLanguage(lang);
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("room-users");
      socket.off("init-state");
      socket.off("code-change");
      socket.off("language-change");
    };
  }, [roomCode, socketRef]);

  const handleEditorMount = (editor) => {
    editorRef.current = editor;
  };

  const handleEditorChange = (value) => {
    if (isRemoteUpdate.current) return;

    const socket = socketRef.current;
    if (socket) {
      socket.emit("code-change", { roomCode, code: value });
    }
  };

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setLanguage(newLang);

    const socket = socketRef.current;
    if (socket) {
      socket.emit("language-change", { roomCode, language: newLang });
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const myId = socketRef.current?.id;
  const sortedUsers = useMemo(
    () => [...users].sort((a) => (a === myId ? -1 : 1)),
    [users, myId]
  );

  return (
    <div className="room">
      <nav className="room-nav">
        <div className="room-nav__left">
          <Link to="/dashboard" className="room-nav__back">←</Link>
          <span className="room-nav__title">paircode</span>
          <button className="room-code-pill" onClick={handleCopy}>
            {roomCode} <span className="room-code-pill__action">{copied ? "copied" : "copy"}</span>
          </button>
        </div>

        <div className="room-nav__right">
          <span className={`status-dot ${connected ? "status-dot--live" : ""}`} />
          <span className="status-label">{connected ? "Connected" : "Connecting…"}</span>

          <div className="avatar-stack">
            {sortedUsers.slice(0, 5).map((id) => (
              <div
                key={id}
                className="avatar"
                style={{ background: colorForId(id) }}
                title={id === myId ? "You" : id}
              >
                {id === myId ? "Y" : id.slice(0, 2).toUpperCase()}
              </div>
            ))}
          </div>
        </div>
      </nav>

      <div className="room-body">
        <aside className="room-sidebar">
          <p className="room-sidebar__label">In this room · {users.length}</p>
          <ul className="room-users">
            {sortedUsers.map((id) => (
              <li key={id} className="room-user">
                <span className="room-user__dot" style={{ background: colorForId(id) }} />
                {id === myId ? "You" : id.slice(0, 8)}
              </li>
            ))}
          </ul>
        </aside>

        <main className="room-editor-main">
          <div className="file-tabs">
            <div className="file-tab file-tab--active">
              <span className="file-tab__dot" />
              main
            </div>

            <div className="language-select-wrapper">
              <span className="language-select__dot" style={{ background: colorForId(language) }} />
              <select
                className="language-select"
                value={language}
                onChange={handleLanguageChange}
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.id} value={lang.id}>
                    {lang.label}
                  </option>
                ))}
              </select>
              <svg className="language-select__chevron" width="10" height="6" viewBox="0 0 10 6" fill="none">
                <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>

          <div className="editor-wrapper">
            <Editor
              height="100%"
              language={language}
              defaultValue="// start typing..."
              theme="vs-dark"
              onMount={handleEditorMount}
              onChange={handleEditorChange}
              options={{
                fontSize: 14,
                fontFamily: "'JetBrains Mono', monospace",
                minimap: { enabled: false },
                padding: { top: 16 },
                smoothScrolling: true,
                cursorBlinking: "smooth"
              }}
            />
          </div>
        </main>
      </div>
    </div>
  );
}

export default RoomEditor;