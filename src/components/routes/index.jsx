import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

import Dashboard from "../../screens/Dashboard";
import Login from "../../screens/Dashboard/components/Login";
import ForgotPassword from "../../screens/Auth/ForgotPassword";
import ResetPassword from "../../screens/Auth/ResetPassword";
import ControlPanel from "../../screens/Dashboard/screens/ControlPanel";
import ControlActas from "../../screens/Dashboard/screens/ControlActas";
import Users from "../../screens/Dashboard/screens/Users";
import Profile from "../../screens/Dashboard/screens/Profile";
import Agenda from "../../screens/Dashboard/screens/Agenda";
import Attendance from "../../screens/Dashboard/screens/Attendance";
import Voting from "../../screens/Dashboard/screens/Voting";
import Sanctions from "../../screens/Dashboard/screens/Sanctions";
import Actas from "../../screens/Dashboard/screens/Actas";
import MeetingSession from "../../screens/Dashboard/screens/MeetingSession";
import AnnualReport from "../../screens/Dashboard/screens/AnnualReport";

const RequireAuth = ({ children }) => {
  const { token, loading } = useAuth();
  if (loading) return <div>Validando...</div>;
  if (!token) return <Navigate to="/" replace />;
  return children;
};
export const RequireRole = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Validando...</div>;
  if (!user || !allowedRoles.includes(user?.role))
    return <Navigate to="/dashboard" replace />;
  return children;
};

const ContenRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route element={<ForgotPassword />} path="/recuperar-contrasena" />
        <Route element={<ResetPassword />} path="/restablecer-contrasena" />
        <Route
          path="/dashboard/*"
          element={
            <RequireAuth>
              <Dashboard />
            </RequireAuth>
          }
        >
          <Route index element={<ControlPanel />} />
          <Route path="controlpanel" element={<ControlPanel />} />
          <Route
            path="controlreuniones"
            element={
              <RequireRole allowedRoles={["ADMIN", "SECRETARIO"]}>
                <ControlActas />
              </RequireRole>
            }
          />
          <Route
            path="controlactas"
            element={
              <RequireRole allowedRoles={["ADMIN", "SECRETARIO"]}>
                <ControlActas />
              </RequireRole>
            }
          />
          <Route
            path="users"
            element={
              <RequireRole allowedRoles={["ADMIN"]}>
                <Users />
              </RequireRole>
            }
          />
          <Route path="profile" element={<Profile />} />
          <Route
            path="agenda"
            element={
              <RequireRole allowedRoles={["ADMIN", "DOCENTE", "SECRETARIO"]}>
                <Agenda />
              </RequireRole>
            }
          />
          <Route
            path="attendance"
            element={
              <RequireRole allowedRoles={["ADMIN", "SECRETARIO"]}>
                <Attendance />
              </RequireRole>
            }
          />
          <Route path="voting" element={<Voting />} />
          <Route
            path="sanctions"
            element={
              <RequireRole allowedRoles={["ADMIN", "SECRETARIO", "DOCENTE"]}>
                <Sanctions />
              </RequireRole>
            }
          />
          <Route path="reuniones" element={<Actas />} />
          <Route path="reuniones/:id/sesion" element={<MeetingSession />} />
          <Route path="actas" element={<Actas />} />
        </Route>
        <Route
          path="/annual-report/:year"
          element={
            <RequireAuth>
              <RequireRole allowedRoles={["ADMIN"]}>
                <AnnualReport />
              </RequireRole>
            </RequireAuth>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default ContenRoutes;
