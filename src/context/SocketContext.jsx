import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

// Si VITE_API_URL trae prefijo (p.ej. https://dominio/api), socket.io lo tomaría como
// namespace; se usa como path para que pase por el mismo proxy que la API.
const API_URL = new URL(
  import.meta.env.VITE_API_URL || "http://localhost:5000",
  window.location.origin,
);
const SOCKET_URL = API_URL.origin;
const SOCKET_PATH = `${API_URL.pathname.replace(/\/+$/, "")}/socket.io`;

const SocketContext = createContext(null);

// Un solo socket por pestaña, compartido por toda la app.
export const SocketProvider = ({ children }) => {
  const { token } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!token) {
      setSocket(null);
      return undefined;
    }

    const nextSocket = io(SOCKET_URL, {
      path: SOCKET_PATH,
      auth: { token },
      transports: ["websocket"],
    });
    setSocket(nextSocket);

    return () => {
      nextSocket.disconnect();
    };
  }, [token]);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);

export default SocketContext;
