import { useState } from "react";
import axios from "axios";
import { API_URL } from "../config.js";

function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault(); // stop the browser's default full-page-reload form behavior

    try {
      const res = await axios.post(`${API_URL}/auth/register`, {
        username,
        email,
        password
      });
      setMessage(`✅ Registered as ${res.data.user.username}`);
    } catch (error) {
      setMessage(`❌ ${error.response?.data?.message || "Something went wrong"}`);
    }
  };

  return (
    <div>
      <h2>Register</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <br />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <br />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <br />
        <button type="submit">Register</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}

export default Register;