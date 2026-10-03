import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";

import Dashboard from "../..";
import Login from "../Login";
import ControlPanel from "../../screens/ControlPanel";
import ControlActas from "../../screens/ControlActas";
import Users from "../../screens/Users";
import Agenda from "../../screens/Dashboard/Agenda";
import Attendance from "../../screens/Dashboard/Attendance";
import Voting from "../../screens/Voting";
import Sanctions from "../../../Sanctions";
import Actas from "../../screens/Dashboard/Actas";

const RequireAuth = ({ children }) => {
  const auth = localStorage.getItem("auth");
  if (!auth) return <Navigate to="/" replace />;
  return children;
};

const ContenRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
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
          <Route path="controlactas" element={<ControlActas />} />
          <Route path="users" element={<Users />} />
          <Route path="agenda" element={<Agenda />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="voting" element={<Voting />} />
          <Route path="sanctions" element={<Sanctions />} />
          <Route path="actas" element={<Actas />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default ContenRoutes;
