import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useSocket } from "../Hooks/useSocket.js";
import "./RoomEditor.css";

function RoomEditor() {
  const { roomCode } = useParams();
  const socketRef = useSocket();
  const [users, setUsers] = useState([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    socket.on("connect", () => {
      socket.emit("join-room", roomCode);
      setUsers((prev) => [...prev, socket.id]);
    });

    socket.on("user-joined", ({ socketId }) => {
      setUsers((prev) => [...prev, socketId]);
    });

    socket.on("user-left", ({ socketId }) => {
      setUsers((prev) => prev.filter((id) => id !== socketId));
    });

    return () => {
      socket.off("connect");
      socket.off("user-joined");
      socket.off("user-left");
    };
  }, [roomCode, socketRef]);

  const handleCopy = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="room">
      <nav className="room-nav">
        <Link to="/dashboard" className="room-nav__back">← Dashboard</Link>
        <button className="room-code-pill" onClick={handleCopy}>
          {roomCode} {copied ? "· copied" : "· copy"}
        </button>
      </nav>

      <div className="room-body">
        <aside className="room-sidebar">
          <p className="room-sidebar__label">In this room ({users.length})</p>
          <ul className="room-users">
            {users.map((id) => (
              <li key={id} className="room-user">
                <span className="room-user__dot" />
                {id === socketRef.current?.id ? "You" : id.slice(0, 6)}
              </li>
            ))}
          </ul>
        </aside>

        <main className="room-editor-placeholder">
          <p>Editor goes here — next step.</p>
        </main>
      </div>
    </div>
  );
}

export default RoomEditor;