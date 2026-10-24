import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { IconGavel, IconRefresh } from "@tabler/icons-react";
import { useAuth } from "../../../../context/AuthContext";
import meetingsService from "../../../../api/services/meetingsService";
import MeetingPolls from "../../../../components/MeetingPolls";
import "./styles.css";

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleString("es-VE", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "America/Caracas",
      })
    : "Sin fecha";

const Voting = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [meetings, setMeetings] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [error, setError] = useState("");

  const loadMeetings = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    loadMeetings();
  }, [loadMeetings]);

  const activeMeetings = useMemo(
    () =>
      meetings
        .filter((meeting) => meeting.status === "EN_CURSO" && !meeting.isClosed)
        .sort((a, b) => new Date(a.date) - new Date(b.date)),
    [meetings],
  );

  const activeMeeting =
    activeMeetings.find((meeting) => meeting.id === selectedId) || activeMeetings[0] || null;

  const canManageMeetings = ["ADMIN", "SECRETARIO"].includes(user?.role || "");
  const presentCount = activeMeeting?.presentCount || 0;
  const totalInvited = activeMeeting?.totalInvited || 0;

  if (isLoading) {
    return (
      <section className="votingPage">
        <div className="votingLoading">Buscando reuniones en curso...</div>
      </section>
    );
  }

  return (
    <section className="votingPage">
      <header className="votingHeader">
        <div>
          <h2>Votaciones</h2>
          <p>Vota y sigue en vivo las decisiones de la reunión en curso.</p>
        </div>
        <button className="votingRefreshBtn" onClick={loadMeetings} title="Actualizar asistencia" type="button">
          <IconRefresh size={18} />
        </button>
      </header>

      {error && <div className="votingError">{error}</div>}

      {!error && !activeMeeting && (
        <div className="votingEmptyState">
          <div className="votingEmptyIcon">
            <IconGavel size={26} />
          </div>
          <h3>No hay una reunión en curso</h3>
          {canManageMeetings ? (
            <>
              <p>
                Las votaciones se abren durante una reunión en curso. Programa o gestiona las
                reuniones desde Control de Reuniones.
              </p>
              <button
                className="votingPrimaryBtn"
                onClick={() => navigate("/dashboard/controlreuniones")}
                type="button"
              >
                Ir a Control de Reuniones
              </button>
            </>
          ) : (
            <p>
              Cuando comience una reunión a la que estés convocado, sus votaciones aparecerán
              aquí.
            </p>
          )}
        </div>
      )}

      {!error && activeMeeting && (
        <>
          {activeMeetings.length > 1 && (
            <div className="votingSelector" role="tablist" aria-label="Reuniones en curso">
              {activeMeetings.map((meeting) => (
                <button
                  aria-selected={meeting.id === activeMeeting.id}
                  className={`votingSelectorBtn ${meeting.id === activeMeeting.id ? "isActive" : ""}`}
                  key={meeting.id}
                  onClick={() => setSelectedId(meeting.id)}
                  role="tab"
                  type="button"
                >
                  {meeting.title}
                </button>
              ))}
            </div>
          )}

          <div className="votingMeetingCard">
            <div className="votingMeetingTitle">
              <div>
                <h3>{activeMeeting.title}</h3>
                <p className="votingMeetingMeta">
                  {formatDate(activeMeeting.date)} · {activeMeeting.location || "Sin lugar"}
                </p>
              </div>
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
                <span className="votingStatLabel">Convocados</span>
              </div>
              <div className="votingAttendanceDivider" />
              <div className="votingAttendanceStat">
                <span className={`votingStatValue ${activeMeeting.hasQuorum ? "isOk" : "isBad"}`}>
                  {activeMeeting.hasQuorum ? "Sí" : "No"}
                </span>
                <span className="votingStatLabel">Quórum</span>
              </div>
            </div>

            {activeMeeting.hasQuorum ? (
              <div className="votingQuorumOk">Quórum alcanzado. Las votaciones están habilitadas.</div>
            ) : (
              <div className="votingQuorumWarning">
                Sin quórum: se requiere {activeMeeting.quorumFormula?.toLowerCase() || "el mínimo de asistentes"}.
              </div>
            )}
          </div>

          <div className="votingPollsCard">
            <MeetingPolls key={activeMeeting.id} meeting={activeMeeting} user={user} />
          </div>
        </>
      )}
    </section>
  );
};

export default Voting;
