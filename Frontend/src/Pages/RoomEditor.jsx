import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useSocket } from "../Hooks/useSocket.js";
import Editor from "@monaco-editor/react";
import "./RoomEditor.css";
import axios from "axios";
import { API_URL } from "../config.js";
import { useAuth } from "../Context/authContext.jsx";

const AVATAR_COLORS = [
  "#5EEAD4",
  "#FF8B6B",
  "#A78BFA",
  "#FBBF24",
  "#60A5FA"
];

const LANGUAGES = [
  { id: "javascript", label: "JavaScript" },
  { id: "typescript", label: "TypeScript" },
  { id: "python", label: "Python" },
  { id: "java", label: "Java" },
  { id: "cpp", label: "C++" },
  { id: "c", label: "C" },
  { id: "go", label: "Go" }
];

const RUN_TIMEOUT_MS = 15000;

function colorForId(id) {
  let hash = 0;

  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }

  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function RoomEditor() {
  const { roomCode } = useParams();
  const { token } = useAuth();
  const socketRef = useSocket(token);

  const editorRef = useRef(null);
  const isRemoteUpdate = useRef(false);
  const typingTimeoutRef = useRef(null);

  const [users, setUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [copied, setCopied] = useState(false);
  const [connected, setConnected] = useState(false);
  const [language, setLanguage] = useState("javascript");
  const [output, setOutput] = useState(null);
  const [input, setInput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [editingUsername, setEditingUsername] = useState(false);
  const [usernameInput, setUsernameInput] = useState("");

  // =========================
  // SOCKET EVENTS
  // =========================

  useEffect(() => {
    const socket = socketRef.current;

    if (!socket) return;

    const handleConnect = () => {
      setConnected(true);
      socket.emit("join-room", roomCode);
    };

    const handleDisconnect = () => {
      setConnected(false);
    };

    const handleRoomUsers = (userList) => {
      console.log("ROOM USERS:", userList);
  
      setUsers(userList);
  
      const socketId = socketRef.current?.id;
  
      const me = userList.find(
          (user) => user.socketId === socketId
      );
  
      if (me) {
          setUsername(me.username);
      }
  };

    const handleInitState = ({ code, language: lang }) => {
      const editor = editorRef.current;

      if (editor && code) {
        isRemoteUpdate.current = true;

        editor.setValue(code);

        isRemoteUpdate.current = false;
      }

      if (lang) {
        setLanguage(lang);
      }
    };

    const handleCodeChange = (code) => {
      const editor = editorRef.current;

      if (!editor) return;

      const current = editor.getValue();

      if (current === code) return;

      isRemoteUpdate.current = true;

      editor.setValue(code);

      isRemoteUpdate.current = false;
    };

    const handleLanguageChange = (lang) => {
      setLanguage(lang);
    };

    const handleTypingStart = (userId) => {
      setTypingUsers((current) =>
        current.includes(userId)
          ? current
          : [...current, userId]
      );
    };

    const handleTypingStop = (userId) => {
      setTypingUsers((current) =>
        current.filter((id) => id !== userId)
      );
    };

    const handleMemberRemoved = () => {
      console.log("🚫 You were removed from the room");
  
      socket.disconnect();
  
      window.location.href = "/dashboard";
  };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("room-users", handleRoomUsers);
    socket.on("init-state", handleInitState);
    socket.on("code-change", handleCodeChange);
    socket.on("language-change", handleLanguageChange);
    socket.on("typing-start", handleTypingStart);
    socket.on("typing-stop", handleTypingStop);
    socket.on("member-removed", handleMemberRemoved);

    if (socket.connected) {
      handleConnect();
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("room-users", handleRoomUsers);
      socket.off("init-state", handleInitState);
      socket.off("code-change", handleCodeChange);
      socket.off("language-change", handleLanguageChange);
      socket.off("typing-start", handleTypingStart);
      socket.off("typing-stop", handleTypingStop);
      socket.off("member-removed", handleMemberRemoved);
    };
  }, [roomCode, socketRef]);

  // =========================
  // EDITOR
  // =========================

  const handleEditorMount = (editor) => {
    editorRef.current = editor;
  };

  const handleEditorChange = (value) => {
    if (isRemoteUpdate.current) return;

    const socket = socketRef.current;

    if (socket) {
      socket.emit("code-change", {
        roomCode,
        code: value
      });

      socket.emit("typing-start", roomCode);

      clearTimeout(typingTimeoutRef.current);

      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("typing-stop", roomCode);
      }, 1000);
    }
  };

  // =========================
  // LANGUAGE
  // =========================

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;

    setLanguage(newLang);

    const socket = socketRef.current;

    if (socket) {
      socket.emit("language-change", {
        roomCode,
        language: newLang
      });
    }
  };

  // =========================
  // COPY ROOM CODE
  // =========================

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch (error) {
      console.error(
        "Failed to copy room code:",
        error
      );
    }
  };

  const startEditingUsername = () => {
    setUsernameInput(username);
    setEditingUsername(true);
};

const handleSaveUsername = async () => {
  try {
      const response = await axios.patch(
          `${API_URL}/auth/username`,
          {
              username: usernameInput
          },
          {
              headers: {
                  Authorization: `Bearer ${token}`
              }
          }
      );

      setUsername(response.data.user.username);

      socketRef.current?.emit("username-updated");

      setEditingUsername(false);

  } catch (error) {
      console.error(
          "Failed to update username:",
          error.response?.data || error.message
      );
  }
};

  

  // =========================
  // RUN CODE
  // =========================

  const handleRun = async () => {
    const editor = editorRef.current;

    if (!editor) {
      console.error("Editor is not mounted.");
      return;
    }

    const code = editor.getValue();

    if (!code.trim()) {
      setPanelOpen(true);

      setOutput({
        stdout: "",
        stderr: "Write some code first.",
        exitCode: 1
      });

      return;
    }

    setIsRunning(true);
    setPanelOpen(true);
    setOutput(null);

    try {
      const res = await axios.post(
        `${API_URL}/execute`,
        {
          language,
          code,
          input
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          },
          timeout: RUN_TIMEOUT_MS
        }
      );

      console.log(
        "EXECUTE RESPONSE:",
        res.data
      );

      setOutput({
        stdout: res.data.stdout || "",
        stderr: res.data.stderr || "",
        exitCode: res.data.exitCode
      });

    } catch (error) {
      console.error(
        "Execution error:",
        error
      );

      const timedOut =
        error.code === "ECONNABORTED" ||
        /timeout/i.test(error.message || "");

      setOutput({
        stdout: "",
        stderr: timedOut
          ? `Execution timed out after ${
              RUN_TIMEOUT_MS / 1000
            }s — check for an infinite loop.`
          : error.response?.data?.message ||
            "Execution failed",
        exitCode: 1
      });

    } finally {
      setIsRunning(false);
    }
  };

  // =========================
  // USERS
  // =========================

  const myId = socketRef.current?.id;

  const sortedUsers = useMemo(
    () =>
      [...users].sort((a, b) => {
        if (a.socketId === myId) return -1;

        if (b.socketId === myId) return 1;

        return 0;
      }),
    [users, myId]
  );

  const currentUser = users.find(
    (user) => user.socketId === myId
  );

  // =========================
  // JSX
  // =========================

  return (
    <div className="room">

      {/* NAVBAR */}

      <nav className="room-nav">

        <div className="room-nav__left">

          <Link
            to="/dashboard"
            className="room-nav__back"
          >
            ←
          </Link>

          <span className="room-nav__title">
            paircode
          </span>

          <button
            className="room-code-pill"
            onClick={handleCopy}
          >
            {roomCode}

            <span className="room-code-pill__action">
              {copied ? "copied" : "copy"}
            </span>
          </button>

        </div>

        <div className="room-nav__right">

          <span
            className={`status-dot ${
              connected
                ? "status-dot--live"
                : ""
            }`}
          />

          <span className="status-label">
            {connected
              ? "Connected"
              : "Connecting…"}
          </span>

          <div className="avatar-stack">

            {sortedUsers
              .slice(0, 5)
              .map((user) => (

                <div
                  key={user.socketId}
                  className="avatar"
                  style={{
                    background:
                      colorForId(
                        user.socketId
                      )
                  }}
                  title={
                    user.socketId === myId
                      ? "You"
                      : user.username
                  }
                >
                  {user.socketId === myId
                    ? "Y"
                    : user.username
                        .slice(0, 2)
                        .toUpperCase()}
                </div>

              ))}

          </div>

        </div>

      </nav>

      {/* ROOM BODY */}

      <div className="room-body">

        {/* SIDEBAR */}

        <aside className="room-sidebar">

          <p className="room-sidebar__label">
            In this room · {users.length}
          </p>

          <div className="room-username">
  {editingUsername ? (
    <div className="room-username__edit">
      <input
        className="room-username__input"
        value={usernameInput}
        onChange={(e) =>
          setUsernameInput(e.target.value)
        }
        autoFocus
        maxLength={20}
      />

      <button
        className="room-username__save"
        onClick={handleSaveUsername}
      >
        Save
      </button>
    </div>
  ) : (
    <div className="room-username__display">
      <span>
        {username || "Loading..."}
      </span>

      <button
        className="room-username__edit-button"
        onClick={startEditingUsername}
      >
        Edit
      </button>
    </div>
  )}
</div>

          <ul className="room-users">

            {sortedUsers.map((user) => (

              <li
                key={user.socketId}
                className="room-user"
              >

                <span
                  className="room-user__dot"
                  style={{
                    background:
                      colorForId(
                        user.socketId
                      )
                  }}
                />

                <span>
                  {user.socketId === myId
                    ? "You"
                    : user.username}
                </span>

                {user.isOwner && (
                  <span className="room-user__owner">
                    Owner
                  </span>
                )}

                {currentUser?.isOwner &&
                  user.socketId !== myId && (

                    <button
                      className="room-user__remove"
                      onClick={() =>
                        socketRef.current?.emit(
                          "remove-member",
                          {
                            roomCode,
                            targetSocketId:
                              user.socketId
                          }
                        )
                      }
                    >
                      Remove
                    </button>

                )}

              </li>

            ))}

          </ul>

        </aside>

        {/* EDITOR */}

        <main className="room-editor-main">

          {/* TOOLBAR */}

          <div className="file-tabs">

            <div className="file-tab file-tab--active">

              <span className="file-tab__dot" />

              main

            </div>

            <button
              className="run-button"
              onClick={handleRun}
              disabled={isRunning}
            >

              {isRunning ? (

                <span className="run-button__spinner" />

              ) : (

                <svg
                  width="10"
                  height="12"
                  viewBox="0 0 10 12"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M0 0L10 6L0 12V0Z" />
                </svg>

              )}

              {isRunning
                ? "Running…"
                : "Run"}

            </button>

            <div className="language-select-wrapper">

              <span
                className="language-select__dot"
                style={{
                  background:
                    colorForId(language)
                }}
              />

              <select
                className="language-select"
                value={language}
                onChange={
                  handleLanguageChange
                }
              >

                {LANGUAGES.map((lang) => (

                  <option
                    key={lang.id}
                    value={lang.id}
                  >
                    {lang.label}
                  </option>

                ))}

              </select>

              <svg
                className="language-select__chevron"
                width="10"
                height="6"
                viewBox="0 0 10 6"
                fill="none"
                aria-hidden="true"
              >

                <path
                  d="M1 1L5 5L9 1"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

              </svg>

            </div>

          </div>

          {/* TYPING INDICATOR */}

          {typingUsers.length > 0 && (

            <div className="typing-indicator">

              {typingUsers.length === 1
                ? `${typingUsers[0].slice(
                    0,
                    8
                  )} is typing…`
                : `${typingUsers.length} people are typing…`}

            </div>

          )}

          {/* MONACO */}

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
                fontFamily:
                  "'JetBrains Mono', monospace",
                minimap: {
                  enabled: false
                },
                padding: {
                  top: 16
                },
                smoothScrolling: true,
                cursorBlinking: "smooth"
              }}
            />

          </div>

          {/* INPUT + OUTPUT PANELS */}

          {panelOpen && (

            <>

              {/* INPUT PANEL */}

              <div className="input-panel">

                <div className="input-panel__header">

                  <span className="input-panel__title">
                    Input
                  </span>

                </div>

                <textarea
                  className="input-panel__textarea"
                  value={input}
                  onChange={(e) =>
                    setInput(e.target.value)
                  }
                  placeholder="Enter input for your program..."
                  spellCheck="false"
                />

              </div>

              {/* OUTPUT PANEL */}

              <section
                className={`output-panel ${
                  output
                    ? output.exitCode === 0
                      ? "output-panel--ok"
                      : "output-panel--error"
                    : ""
                }`}
              >

                {/* HEADER */}

                <div className="output-panel__header">

                  <span className="output-panel__title">
                    Output
                  </span>

                  <button
                    className="output-panel__close"
                    onClick={() =>
                      setPanelOpen(false)
                    }
                    aria-label="Close output panel"
                  >
                    ✕
                  </button>

                </div>

                {/* RESULT */}

                {output && (

                  <div
                    className={`output-panel__result ${
                      output.exitCode === 0
                        ? "output-panel__result--ok"
                        : "output-panel__result--error"
                    }`}
                  >

                    <span className="output-panel__result-icon">
                      {output.exitCode === 0
                        ? "✓"
                        : "✕"}
                    </span>

                    <div className="output-panel__result-content">

                      <span className="output-panel__result-text">
                        {output.exitCode === 0
                          ? "Ran successfully"
                          : "Execution failed"}
                      </span>

                      {output.exitCode === 0 &&
                        output.stdout && (

                          <pre className="output-panel__stdout">
                            {output.stdout}
                          </pre>

                        )}

                      {output.exitCode !== 0 &&
                        output.stderr && (

                          <span className="output-panel__error-message">
                            {output.stderr}
                          </span>

                        )}

                    </div>

                  </div>

                )}

                {/* LOADING */}

                {isRunning && (

                  <div className="output-panel__loading">

                    <span className="output-panel__loading-dot" />

                    Running your code…

                  </div>

                )}

              </section>

            </>

          )}

        </main>

      </div>

    </div>
  );
}

export default RoomEditor;