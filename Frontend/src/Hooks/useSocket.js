import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { SOCKET_URL } from "../config.js";

export function useSocket(token) {

  const socketRef = useRef(null);

  useEffect(() => {

    if (!token) return;

    socketRef.current = io(SOCKET_URL, {
      auth: {
        token
      }
    });

    return () => {

      socketRef.current?.disconnect();

    };

  }, [token]);

  return socketRef;

}