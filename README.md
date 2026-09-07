# PairCode

> A real-time collaborative coding environment where developers can write, run, and share code together in the same room.

PairCode is a full-stack real-time coding platform built to explore authentication, WebSockets, real-time synchronization, room-based collaboration, and remote code execution.

Multiple users can join the same coding room, write code together, change languages, see who is online, and execute programs with custom input.

---

## Features

- 🔐 JWT-based authentication
- 🚪 Create and join coding rooms
- 👥 Real-time room presence
- 💻 Monaco-based code editor
- 🔄 Real-time code synchronization
- 🌐 Real-time language synchronization
- ✍️ Typing presence indicator
- 🧑‍💻 Editable display usernames
- 👑 Room ownership
- 🚫 Owner-controlled member removal
- ▶️ Remote code execution
- ⌨️ Custom stdin input
- ⚡ Support for multiple programming languages
- 🛡️ Protected room access
- 🔌 Socket connection and disconnect handling

---

## Supported Languages

PairCode currently supports:

- JavaScript
- TypeScript
- Python
- Java
- C++
- C
- Go

Code execution is handled through *Judge0 CE* rather than executing arbitrary user code directly on the application server.

---

## Tech Stack

### Frontend

- React
- Vite
- React Router
- Monaco Editor
- Axios
- Socket.IO Client
- CSS

### Backend

- Node.js
- Express
- MongoDB
- Mongoose
- JWT
- bcrypt
- Socket.IO
- Axios

### Code Execution

- Judge0 CE

---

## Architecture

PairCode uses a combination of **REST APIs, WebSockets, and MongoDB**.


                    ┌─────────────────┐
                    │     React       │
                    │    Frontend     │
                    └────────┬────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
          REST API                     Socket.IO
              │                             │
              ▼                             ▼
     ┌─────────────────┐          ┌─────────────────┐
     │     Express     │          │  Real-time Room │
     │     Backend     │          │     Events      │
     └────────┬────────┘          └────────┬────────┘
              │                            │
              ▼                            │
     ┌─────────────────┐                   │
     │    MongoDB      │                   │
     │ Users / Rooms   │                   │
     └─────────────────┘                   │
                                           │
                                           ▼
                                  ┌─────────────────┐
                                  │  Connected      │
                                  │    Clients      │
                                  └─────────────────┘