import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { IconGavel, IconPresentation, IconRefresh } from "@tabler/icons-react";
import { useAuth } from "../../../../context/AuthContext";
import meetingsService from "../../../../api/services/meetingsService";
import { PollCard } from "../../../../components/MeetingPolls";
import { sortPolls } from "../../../../components/MeetingPolls/utils";
import "./styles.css";

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleString("es-VE", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "America/Caracas",
      })
    : "Sin fecha";

const MEETING_STATUS_LABELS = {
  EN_CURSO: "En curso",
  FINALIZADA: "Finalizada",
};

// Mismo criterio que la tarjeta de cada votación.
const pollVerdict = ({ aFavor = 0, enContra = 0, total = 0 } = {}) => {
  if (total === 0) return "empty";
  if (aFavor > enContra) return "approved";
  if (enContra > aFavor) return "rejected";
  return "tie";
};

const Voting = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [meetings, setMeetings] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [error, setError] = useState("");
  const [polls, setPolls] = useState({ meetingId: "", items: [], error: "" });
  const [pollsLoading, setPollsLoading] = useState(false);
  const [revision, setRevision] = useState(0);

  const canManageMeetings = ["ADMIN", "SECRETARIO"].includes(user?.role || "");

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

  // Secretaría y Coordinación también consultan reuniones finalizadas; los docentes solo la reunión en curso.
  const votingMeetings = useMemo(
    () =>
      meetings
        .filter((meeting) =>
          meeting.status === "EN_CURSO"
            ? !meeting.isClosed
            : canManageMeetings && meeting.status === "FINALIZADA",
        )
        .sort((a, b) => {
          if (a.status !== b.status) return a.status === "EN_CURSO" ? -1 : 1;
          return new Date(b.date) - new Date(a.date);
        }),
    [meetings, canManageMeetings],
  );

  const activeMeeting =
    votingMeetings.find((meeting) => meeting.id === selectedId) || votingMeetings[0] || null;
  const activeMeetingId = activeMeeting?.id || "";
  const isRunning = activeMeeting?.status === "EN_CURSO";

  useEffect(() => {
    if (!activeMeetingId) return undefined;
    let cancelled = false;
    setPollsLoading(true);
    meetingsService
      .listMeetingPolls(activeMeetingId)
      .then((response) => {
        if (!cancelled) setPolls({ meetingId: activeMeetingId, items: sortPolls(Array.isArray(response) ? response : []), error: "" });
      })
      .catch((failure) => {
        if (!cancelled) {
          setPolls({
            meetingId: activeMeetingId,
            items: [],
            error: failure?.response?.data?.message || "No se pudieron cargar las votaciones de esta reunión.",
          });
        }
      })
      .finally(() => {
        if (!cancelled) setPollsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeMeetingId, revision]);

  const pollItems = polls.meetingId === activeMeetingId ? polls.items : [];
  const pollsError = polls.meetingId === activeMeetingId ? polls.error : "";

  const summary = pollItems.reduce(
    (acc, poll) => {
      if (poll.status === "OPEN") acc.open += 1;
      else acc[pollVerdict(poll.results)] += 1;
      return acc;
    },
    { approved: 0, empty: 0, open: 0, rejected: 0, tie: 0 },
  );

  const refresh = () => {
    loadMeetings();
    setRevision((value) => value + 1);
  };

  if (isLoading) {
    return (
      <section className="votingPage">
        <div className="votingLoading">Buscando reuniones con votaciones...</div>
      </section>
    );
  }

  const presentCount = activeMeeting?.presentCount || 0;
  const totalInvited = activeMeeting?.totalInvited || 0;

  return (
    <section className="votingPage">
      <header className="votingHeader">
        <div className="votingHeaderText">
          <h2>Votaciones</h2>
          <p>
            {canManageMeetings
              ? "Sigue en vivo la reunión en curso y consulta cómo se votó cada punto en reuniones anteriores."
              : "Vota y sigue en vivo las decisiones de la reunión en curso."}
          </p>
        </div>
        <button className="votingRefreshBtn" onClick={refresh} title="Actualizar" type="button">
          <IconRefresh size={18} />
        </button>
      </header>

      {error && <div className="votingError">{error}</div>}

      {!error && !activeMeeting && (
        <div className="votingEmptyState">
          <div className="votingEmptyIcon">
            <IconGavel size={26} />
          </div>
          <h3>{canManageMeetings ? "Aún no hay reuniones con votaciones" : "No hay una reunión en curso"}</h3>
          {canManageMeetings ? (
            <>
              <p>
                Las votaciones se abren durante una reunión en curso. Programa o gestiona las
                reuniones desde Control de Reuniones.
              </p>
              <button
                className="votingPrimaryBtn votingPrimaryBtn--inline"
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
          <div className="votingToolbar">
            <label htmlFor="voting-meeting">Reunión</label>
            <select
              id="voting-meeting"
              onChange={(event) => setSelectedId(event.target.value)}
              value={activeMeeting.id}
            >
              {votingMeetings.map((meeting) => (
                <option key={meeting.id} value={meeting.id}>
                  {MEETING_STATUS_LABELS[meeting.status]} · {meeting.title} · {formatDate(meeting.date)}
                </option>
              ))}
            </select>
          </div>

          <div className="votingLayout">
            <aside className="votingMeetingCard">
              <div className="votingMeetingTitle">
                <div>
                  <h3>{activeMeeting.title}</h3>
                  <p className="votingMeetingMeta">
                    {formatDate(activeMeeting.date)} · {activeMeeting.location || "Sin lugar"}
                  </p>
                </div>
                <span className={`votingQuorumBadge ${isRunning ? "votingQuorumBadge--active" : "votingQuorumBadge--done"}`}>
                  {MEETING_STATUS_LABELS[activeMeeting.status]}
                </span>
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

              {!isRunning ? (
                <div className="votingQuorumInfo">Reunión finalizada: solo consulta de resultados.</div>
              ) : activeMeeting.votingOpen ? (
                <div className="votingQuorumOk">La fase de votación está abierta.</div>
              ) : activeMeeting.hasQuorum ? (
                <div className="votingQuorumOk">
                  Quórum alcanzado. Secretaría iniciará la votación desde la sesión.
                </div>
              ) : (
                <div className="votingQuorumWarning">
                  Sin quórum: se requiere {activeMeeting.quorumFormula?.toLowerCase() || "el mínimo de asistentes"}.
                </div>
              )}

              {isRunning && (
                <button
                  className="votingPrimaryBtn"
                  onClick={() => navigate(`/dashboard/reuniones/${activeMeeting.id}/sesion`)}
                  type="button"
                >
                  <IconPresentation size={18} /> Ir a la sesión para votar
                </button>
              )}
            </aside>

            <section className="votingResults">
              <div className="votingResultsHeader">
                <h3>Resultados por punto</h3>
                <div className="votingSummary">
                  <span className="votingSummaryChip votingSummaryChip--approved">{summary.approved} aprobados</span>
                  <span className="votingSummaryChip votingSummaryChip--rejected">{summary.rejected} rechazados</span>
                  {summary.tie > 0 && <span className="votingSummaryChip">{summary.tie} empatados</span>}
                  {summary.open > 0 && <span className="votingSummaryChip votingSummaryChip--open">{summary.open} abiertos</span>}
                </div>
              </div>

              {pollsError && <div className="votingError">{pollsError}</div>}
              {pollsLoading && !pollItems.length && <p className="votingMuted">Cargando votaciones...</p>}
              {!pollsLoading && !pollsError && pollItems.length === 0 && (
                <p className="votingMuted votingResultsEmpty">
                  {isRunning
                    ? "Todavía no se ha abierto ninguna votación en esta reunión."
                    : "En esta reunión no se registraron votaciones."}
                </p>
              )}

              <div className="votingPollGrid">
                {pollItems.map((poll) => (
                  <PollCard
                    canVote={false}
                    isManager={false}
                    key={poll.id}
                    meetingId={activeMeeting.id}
                    onPollChange={() => setRevision((value) => value + 1)}
                    poll={poll}
                    presentCount={isRunning ? presentCount : 0}
                    userId={user?.id}
                    voteBlockReason={isRunning ? "Para votar entra a la sesión de la reunión." : ""}
                  />
                ))}
              </div>
            </section>
          </div>
        </>
      )}
    </section>
  );
};

export default Voting;
