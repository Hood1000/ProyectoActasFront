import React from "react";

import ContenRoutes from "./components/routes";
import "./App.css";
import { AuthProvider } from "./context/AuthContext";
import { NotificationsProvider } from "./context/NotificationsContext";

const App = () => {
  return (
    <AuthProvider>
      <NotificationsProvider>
        <ContenRoutes />
      </NotificationsProvider>
    </AuthProvider>
  );
};

export default App;
