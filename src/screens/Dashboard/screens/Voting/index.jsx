import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../../context/AuthContext";
import meetingsService from "../../../../api/services/meetingsService";
import "./styles.css";

const MINIMUM_ATTENDEES_TO_PROCEED = 2;

const Voting = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [meetings, setMeetings] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadMeetings = async () => {
      setIsLoading(true);
      setError("");
      try {
        const response = await meetingsService.list();
        setMeetings(Array.isArray(response) ? response : []);
      } catch {
        setMeetings([]);
        setError("No fue posible cargar la información de reuniones.");
      } finally {
        setIsLoading(false);
      }
    };
    loadMeetings();
  }, []);

  const activeMeeting = useMemo(
    () =>
      meetings.find(
        (meeting) =>
          !meeting.isClosed && !["CANCELADA", "FINALIZADA"].includes(meeting.status),
      ) || null,
    [meetings],
  );

  const presentCount = activeMeeting?.presentCount || 0;
  const totalInvited = activeMeeting?.totalInvited || 0;
  const votingEnabled = presentCount >= MINIMUM_ATTENDEES_TO_PROCEED;
  const missingForMinimum = Math.max(0, MINIMUM_ATTENDEES_TO_PROCEED - presentCount);
  const canManageMeetings = ["ADMIN", "SECRETARIO"].includes(user?.role || "");

  if (isLoading) {
    return (
      <section className="votingPage">
        <div className="votingLoading">Validando asistencia de la reunion activa...</div>
      </section>
    );
  }

  return (
    <section className="votingPage">
      <header className="votingHeader">
        <h2>Votaciones</h2>
        <p>Control de votaciones de la reunion activa.</p>
      </header>

      {error && <div className="votingError">{error}</div>}

      {!error && !activeMeeting && (
        <div className="votingEmptyState">
          <div className="votingEmptyIcon">—</div>
          <h3>No hay una reunion activa</h3>
          {canManageMeetings ? (
            <>
              <p>
                Debes crear y gestionar una reunion desde Control de Actas antes de poder
                registrar votaciones.
              </p>
              <button
                className="votingPrimaryBtn"
                onClick={() => navigate("/dashboard/controlreuniones")}
                type="button"
              >
                Ir a Control de Actas
              </button>
            </>
          ) : (
            <p>
              El administrador o secretario debe crear una reunion activa para que puedas
              participar en las votaciones.
            </p>
          )}
        </div>
      )}

      {!error && activeMeeting && (
        <div className="votingMeetingCard">
          <div className="votingMeetingTitle">
            <h3>{activeMeeting.title}</h3>
            <span className="votingQuorumBadge votingQuorumBadge--active">En curso</span>
          </div>

          <div className="votingAttendanceRow">
            <div className="votingAttendanceStat">
              <span className="votingStatValue">{presentCount}</span>
              <span className="votingStatLabel">Presentes</span>
            </div>
            <div className="votingAttendanceDivider" />
            <div className="votingAttendanceStat">
              <span className="votingStatValue">{totalInvited}</span>
              <span className="votingStatLabel">Invitados</span>
            </div>
            <div className="votingAttendanceDivider" />
            <div className="votingAttendanceStat">
              <span className="votingStatValue">{MINIMUM_ATTENDEES_TO_PROCEED}</span>
              <span className="votingStatLabel">Minimo</span>
            </div>
          </div>

          {votingEnabled ? (
            <div className="votingQuorumOk">
              Quorum alcanzado. Las votaciones estan habilitadas.
            </div>
          ) : (
            <div className="votingQuorumWarning">
              Faltan {missingForMinimum} asistente(s) para alcanzar el minimo requerido de{" "}
              {MINIMUM_ATTENDEES_TO_PROCEED}.
            </div>
          )}

          <button className="votingPrimaryBtn" disabled={!votingEnabled} type="button">
            {votingEnabled ? "Iniciar votacion" : "Votacion bloqueada — sin quorum"}
          </button>
        </div>
      )}
    </section>
  );
};

export default Voting;
