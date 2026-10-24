import React from "react";

import ContenRoutes from "./components/routes";
import "./App.css";
import { AuthProvider } from "./context/AuthContext";
import { NotificationsProvider } from "./context/NotificationsContext";
import { SocketProvider } from "./context/SocketContext";

const App = () => {
  return (
    <AuthProvider>
      <SocketProvider>
        <NotificationsProvider>
          <ContenRoutes />
        </NotificationsProvider>
      </SocketProvider>
    </AuthProvider>
  );
};

export default App;
