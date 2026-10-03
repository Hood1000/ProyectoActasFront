import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { IconBell } from "@tabler/icons-react";

import NotificationsCenter from "../../components/NotificationsCenter";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationsContext";
import Sidebar from "./components/Sidebar";
import "./styles.css";

const Dashboard = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { user } = useAuth();
  const { isPanelOpen, setIsPanelOpen, unreadCount } = useNotifications();

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed((previous) => !previous);
  };

  return (
    <div className="dashboardContent">
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
      />
      <NotificationsCenter />
      <main className={`dashboardMain ${isSidebarCollapsed ? "sidebarCollapsed" : ""}`}>
        <div className="dashboardTopbar">
          <div>
            <p className="dashboardTopbarEyebrow">Sistema de actas</p>
            <h1 className="dashboardTopbarTitle">{user?.name || user?.email || "Panel institucional"}</h1>
          </div>
          <button
            aria-label="Notificaciones"
            aria-pressed={isPanelOpen}
            className={`dashboardNotifyBtn ${isPanelOpen ? "active" : ""}`}
            onClick={() => setIsPanelOpen((current) => !current)}
            type="button"
          >
            <IconBell size={18} />
            {unreadCount > 0 && <span className="dashboardNotifyBadge">{unreadCount}</span>}
          </button>
        </div>
        <div className="dashboardMainContent">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
