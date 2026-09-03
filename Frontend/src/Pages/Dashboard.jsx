import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../config.js";
import { useAuth } from "../Context/authContext.jsx";
import "./Dashboard.css";

function Dashboard() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  const [roomName, setRoomName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [createdRoom, setCreatedRoom] = useState(null);
  const [createError, setCreateError] = useState("");
  const [joinError, setJoinError] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreateError("");
    setIsCreating(true);

    try {
      const res = await axios.post(
        `${API_URL}/rooms/create`,
        { name: roomName },
        authHeader
      );
      setCreatedRoom(res.data.room);
    } catch (error) {
      setCreateError(error.response?.data?.message || "Couldn't create room");
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    setJoinError("");
    setIsJoining(true);

    try {
      const res = await axios.post(
        `${API_URL}/rooms/join`,
        { roomCode: joinCode.trim().toUpperCase() },
        authHeader
      );
      navigate(`/room/${res.data.room.roomCode}`);
    } catch (error) {
      setJoinError(error.response?.data?.message || "Couldn't join room");
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="dashboard">
      <nav className="dashboard-nav">
        <span className="dashboard-nav__logo">paircode<span className="cursor-blink">_</span></span>
        <button className="dashboard-nav__logout" onClick={logout}>Log out</button>
      </nav>

      <main className="dashboard-main">
        <h1>Your workspace</h1>
        <p className="dashboard-sub">Create a room to start a session, or join one with a code.</p>

        <div className="panel-grid">
          <section className="panel panel--a">
            <p className="panel__eyebrow">start a session</p>
            <h2>Create a room</h2>

            {!createdRoom ? (
              <form onSubmit={handleCreate} className="panel-form">
                <div className="panel-field">
                  <label>Room name</label>
                  <input
                    type="text"
                    placeholder="e.g. LeetCode grind"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                  />
                </div>
                <button className="panel-submit panel-submit--a" type="submit" disabled={isCreating}>
                  {isCreating ? "Creating…" : "Create room"}
                </button>
                {createError && <p className="panel-error">❌ {createError}</p>}
              </form>
            ) : (
              <div className="room-result">
                <p className="room-result__label">Room code</p>
                <p className="room-result__code">{createdRoom.roomCode}</p>
                <button
                  className="panel-submit panel-submit--a"
                  onClick={() => navigate(`/room/${createdRoom.roomCode}`)}
                >
                  Enter room →
                </button>
              </div>
            )}
          </section>

          <section className="panel panel--b">
            <p className="panel__eyebrow">join a session</p>
            <h2>Join a room</h2>

            <form onSubmit={handleJoin} className="panel-form">
              <div className="panel-field">
                <label>Room code</label>
                <input
                  type="text"
                  placeholder="X7K92"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  className="room-code-input"
                />
              </div>
              <button className="panel-submit panel-submit--b" type="submit" disabled={isJoining}>
                {isJoining ? "Joining…" : "Join room"}
              </button>
              {joinError && <p className="panel-error">❌ {joinError}</p>}
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;