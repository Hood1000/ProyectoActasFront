import React, { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { IconBell, IconMenu2 } from "@tabler/icons-react";

import NotificationsCenter from "../../components/NotificationsCenter";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationsContext";
import Sidebar from "./components/Sidebar";
import "./styles.css";

const Dashboard = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();
  const { isPanelOpen, setIsPanelOpen, unreadCount } = useNotifications();

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed((previous) => !previous);
  };

  // En móvil el menú es un panel deslizable: se cierra al navegar o con Escape.
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isMobileMenuOpen) return undefined;
    const handleKey = (event) => {
      if (event.key === "Escape") setIsMobileMenuOpen(false);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isMobileMenuOpen]);

  return (
    <div className="dashboardContent">
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        onToggleCollapse={handleToggleSidebar}
      />
      {isMobileMenuOpen && (
        <div className="dashboardSidebarBackdrop" onClick={() => setIsMobileMenuOpen(false)} />
      )}
      <NotificationsCenter />
      <main className={`dashboardMain ${isSidebarCollapsed ? "sidebarCollapsed" : ""}`}>
        <div className="dashboardTopbar">
          <button
            aria-expanded={isMobileMenuOpen}
            aria-label="Abrir menú"
            className="dashboardMenuBtn"
            onClick={() => setIsMobileMenuOpen(true)}
            type="button"
          >
            <IconMenu2 size={20} />
          </button>
          <div className="dashboardTopbarInfo">
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
