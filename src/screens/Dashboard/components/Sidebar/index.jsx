import React from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../../../context/AuthContext";
import "./styles.css";

const Sidebar = ({ isCollapsed = false, onToggleCollapse }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const roleLabel = {
    ADMIN: "Coordinadora",
    SECRETARIO: "Secretario",
    DOCENTE: "Docente",
  };

  const canManageUsers = user?.role === "ADMIN";
  const canManageMeetings = ["ADMIN", "SECRETARIO"].includes(user?.role || "");

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className={`sidebar ${isCollapsed ? "isCollapsed" : ""}`}>
      <div className="sidebar-header">
        <div className="sidebarBrandRow">
          <h3 className="sidebarBrandTitle">
            <span className="brandText">UPT JFR</span>
          </h3>
          <button
            aria-label={isCollapsed ? "Expandir menú" : "Colapsar menú"}
            className="sidebarCollapseBtn"
            onClick={onToggleCollapse}
            type="button"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              {isCollapsed ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="m9 5 7 7-7 7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="m15 19-7-7 7-7" />
              )}
            </svg>
          </button>
        </div>
        {user && <p className="sidebar-role">{roleLabel[user.role] || user.role}</p>}
      </div>

      <ul className="nav-menu">
        <li>
          <NavLink
            title="Panel de Control"
            to="/dashboard/controlpanel"
            className={({ isActive }) => {
              const isIndex = location.pathname === "/dashboard" || location.pathname === "/dashboard/";
              return isActive || isIndex ? "active" : "";
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
            </svg>
            <span className="navText">Panel de Control</span>
          </NavLink>
        </li>
        {canManageMeetings && (
          <li>
            <NavLink
              title="Control de Reuniones"
              to="/dashboard/controlreuniones"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
              </svg>
              <span className="navText">Control de Reuniones</span>
            </NavLink>
          </li>
        )}
        <li>
          <NavLink
            title="Reuniones"
            to="/dashboard/reuniones"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 3.75h9a2.25 2.25 0 0 1 2.25 2.25v12a2.25 2.25 0 0 1-2.25 2.25h-9A2.25 2.25 0 0 1 5.25 18V6A2.25 2.25 0 0 1 7.5 3.75Zm2.25 4.5h4.5m-4.5 3h4.5m-4.5 3h3" />
            </svg>
            <span className="navText">Reuniones</span>
          </NavLink>
        </li>
        <li>
          <NavLink
            title="Mi Perfil"
            to="/dashboard/profile"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
            <span className="navText">Mi Perfil</span>
          </NavLink>
        </li>
        {canManageUsers && (
          <li>
            <NavLink
              title="Usuarios"
              to="/dashboard/users"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
              </svg>
              <span className="navText">Usuarios</span>
            </NavLink>
          </li>
        )}
      </ul>

      <div className="sidebar-footer">
        <button className="btn-logout" onClick={handleLogout} title="Cerrar Sesión">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
          </svg>
          <span className="navText">Cerrar Sesión</span>
        </button>
      </div>
    </nav>
  );
};

export default Sidebar;
