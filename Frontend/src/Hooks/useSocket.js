import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { SOCKET_URL } from "../config.js";

export function useSocket() {
  const socketRef = useRef(null);

  useEffect(() => {
    socketRef.current = io(SOCKET_URL);

    return () => {
      socketRef.current.disconnect();
    };
  }, []);

  return socketRef;
}