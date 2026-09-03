import { Routes, Route } from "react-router-dom";

import Landing from "./Pages/Landing.jsx";
import Login from "./Pages/Login.jsx";
import Register from "./Pages/Register.jsx";
import Dashboard from "./Pages/Dashboard.jsx";
import RoomEditor from "./Pages/RoomEditor.jsx";

import ProtectedRoute from "./Components/ProtectedRoutes.jsx";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/room/:roomCode"
        element={
          <ProtectedRoute>
            <RoomEditor />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;