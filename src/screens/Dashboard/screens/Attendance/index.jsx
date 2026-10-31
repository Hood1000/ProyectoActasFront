import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  IconCalendarEvent,
  IconCircleCheck,
  IconCircleX,
  IconClock,
  IconFileCertificate,
  IconMapPin,
  IconRefresh,
} from "@tabler/icons-react";
import meetingsService from "../../../../api/services/meetingsService";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../../../context/AuthContext";
import AttendanceHistory from "./components/AttendanceHistory";
import { getAvatarColor, getInitials, ROLE_LABELS } from "../../../../utils/people";
import "./styles.css";

const STATUS_LABELS = {
  AUSENTE: "Ausente",
  JUSTIFICADA: "Justificada",
  PENDIENTE: "Pendiente",
  PRESENTE: "Presente",
};

const MEETING_STATUS_LABELS = {
  EN_CURSO: "En curso",
  PROGRAMADA: "Programada",
};

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleString("es-VE", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "America/Caracas",
      })
    : "Sin fecha";

const isWindowOpen = (meeting) =>
  Boolean(meeting?.attendanceOpensAt) && Date.now() >= new Date(meeting.attendanceOpensAt).getTime();

const canFinalize = (meeting) =>
  Boolean(meeting?.attendanceClosesAt) &&
  !meeting.attendanceFinalized &&
  Date.now() >= new Date(meeting.attendanceClosesAt).getTime();

const AttendanceRegistration = () => {
  const [meetings, setMeetings] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [busyUserId, setBusyUserId] = useState("");
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [excuseFor, setExcuseFor] = useState("");
  const [excuseText, setExcuseText] = useState("");
  const [message, setMessage] = useState({ text: "", tone: "" });

  const loadMeetings = useCallback(async () => {
    try {
      const response = await meetingsService.list();
      setMeetings(Array.isArray(response) ? response : []);
    } catch {
      setMessage({ text: "No se pudo cargar la lista de reuniones.", tone: "error" });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMeetings();
  }, [loadMeetings]);

  // Reuniones donde todavía se puede registrar asistencia: en curso primero, luego las próximas.
  const candidates = useMemo(
    () =>
      meetings
        .filter((meeting) => !meeting.isClosed && ["EN_CURSO", "PROGRAMADA"].includes(meeting.status))
        .sort((a, b) => {
          if (a.status !== b.status) return a.status === "EN_CURSO" ? -1 : 1;
          return new Date(a.date) - new Date(b.date);
        }),
    [meetings],
  );

  const meeting = candidates.find((item) => item.id === selectedId) || candidates[0] || null;

  const rows = useMemo(
    () =>
      [...(meeting?.attendance || [])].sort((a, b) =>
        (a.user?.name || "").localeCompare(b.user?.name || "", "es"),
      ),
    [meeting],
  );

  const counts = useMemo(
    () =>
      rows.reduce(
        (acc, row) => ({ ...acc, [row.status]: (acc[row.status] || 0) + 1 }),
        { AUSENTE: 0, JUSTIFICADA: 0, PENDIENTE: 0, PRESENTE: 0 },
      ),
    [rows],
  );

  const replaceMeeting = (updated) => {
    if (!updated?.id) return;
    setMeetings((prev) => prev.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)));
  };

  const handleMark = async (userId, status, excuse) => {
    if (!meeting) return;
    setBusyUserId(userId);
    setMessage({ text: "", tone: "" });
    try {
      replaceMeeting(
        await meetingsService.markAttendance(meeting.id, userId, {
          status,
          ...(excuse ? { excuse } : {}),
        }),
      );
      setExcuseFor("");
      setExcuseText("");
    } catch (err) {
      setMessage({
        text: err?.response?.data?.message || "No se pudo registrar la asistencia.",
        tone: "error",
      });
    } finally {
      setBusyUserId("");
    }
  };

  const handleFinalize = async () => {
    if (!meeting) return;
    setIsFinalizing(true);
    setMessage({ text: "", tone: "" });
    try {
      replaceMeeting(await meetingsService.finalizeAttendance(meeting.id));
      setMessage({
        text: "Asistencia finalizada. Los pendientes quedaron registrados como ausentes.",
        tone: "success",
      });
    } catch (err) {
      setMessage({
        text: err?.response?.data?.message || "No se pudo finalizar la asistencia.",
        tone: "error",
      });
    } finally {
      setIsFinalizing(false);
    }
  };

  if (isLoading) {
    return (
      <section className="attPage">
        <p className="attMuted">Cargando reuniones...</p>
      </section>
    );
  }

  const windowOpen = isWindowOpen(meeting);

  return (
    <section className="attPage">
      <header className="attHeader">
        <div>
          <h2>Asistencia</h2>
          <p>Registra y corrige la asistencia de los convocados (llegadas tarde y justificativos).</p>
        </div>
        <button className="attIconBtn" onClick={loadMeetings} title="Actualizar" type="button">
          <IconRefresh size={18} />
        </button>
      </header>

      {message.text && <div className={`attMessage attMessage--${message.tone}`}>{message.text}</div>}

      {!meeting ? (
        <div className="attEmpty">
          <IconFileCertificate size={32} />
          <strong>No hay reuniones abiertas para registrar asistencia</strong>
          <p>Las reuniones programadas o en curso aparecerán aquí.</p>
        </div>
      ) : (
        <>
          <div className="attToolbar">
            <span className="attToolbarIcon">
              <IconCalendarEvent size={22} />
            </span>
            <div className="attToolbarField">
              <label htmlFor="att-meeting">
                Reunión
                {candidates.length > 1 && <small>{candidates.length} disponibles</small>}
              </label>
              <select
                id="att-meeting"
                onChange={(event) => {
                  setSelectedId(event.target.value);
                  setExcuseFor("");
                  setMessage({ text: "", tone: "" });
                }}
                value={meeting.id}
              >
                {candidates.map((item) => (
                  <option key={item.id} value={item.id}>
                    {MEETING_STATUS_LABELS[item.status]} · {item.title} · {formatDate(item.date)}
                  </option>
                ))}
              </select>
            </div>
            <div className="attToolbarMeta">
              <span className={`attMeetingStatus attMeetingStatus--${meeting.status.toLowerCase()}`}>
                {MEETING_STATUS_LABELS[meeting.status]}
              </span>
              <span className="attMetaItem">
                <IconClock size={15} /> {formatDate(meeting.date)}
              </span>
              <span className="attMetaItem">
                <IconMapPin size={15} /> {meeting.location || "Sin lugar"}
              </span>
            </div>
          </div>

          <div className="attSummary">
            <div className="attStat">
              <span className="attStatValue attStatValue--ok">{counts.PRESENTE}</span>
              <span className="attStatLabel">Presentes</span>
            </div>
            <div className="attStat">
              <span className="attStatValue attStatValue--warn">{counts.JUSTIFICADA}</span>
              <span className="attStatLabel">Justificadas</span>
            </div>
            <div className="attStat">
              <span className="attStatValue attStatValue--bad">{counts.AUSENTE}</span>
              <span className="attStatLabel">Ausentes</span>
            </div>
            <div className="attStat">
              <span className="attStatValue">{counts.PENDIENTE}</span>
              <span className="attStatLabel">Pendientes</span>
            </div>
            <div className={`attQuorum ${meeting.hasQuorum ? "attQuorum--ok" : ""}`}>
              {meeting.hasQuorum ? <IconCircleCheck size={18} /> : <IconCircleX size={18} />}
              <div>
                <strong>{meeting.hasQuorum ? "Con quórum" : "Sin quórum"}</strong>
                <span>{meeting.quorumFormula}</span>
              </div>
            </div>
          </div>

          {!windowOpen && (
            <p className="attNotice">
              La toma de asistencia abre el {formatDate(meeting.attendanceOpensAt)} (15 minutos antes del
              inicio). Hasta entonces solo puedes consultar la lista.
            </p>
          )}
          {meeting.attendanceFinalized && (
            <p className="attNotice attNotice--info">
              La ventana de asistencia ya cerró. Aún puedes corregir registros hasta que la reunión se
              finalice.
            </p>
          )}

          {rows.length === 0 ? (
            <div className="attEmpty">
              <strong>Esta reunión no tiene convocados</strong>
              <p>Agrega invitados desde Control de Reuniones antes de que abra la asistencia.</p>
            </div>
          ) : (
            <ul className="attList">
              {rows.map((row) => {
                const color = getAvatarColor(row.user?.id || row.userId);
                const isBusy = busyUserId === row.userId;
                const disabled = !windowOpen || Boolean(busyUserId);
                return (
                  <li className="attRow" key={row.userId}>
                    <div className="attPerson">
                      <span className="attAvatar" style={{ background: color.bg, color: color.fg }}>
                        {getInitials(row.user?.name)}
                      </span>
                      <div className="attPersonInfo">
                        <strong>{row.user?.name || "Participante"}</strong>
                        <span>
                          {ROLE_LABELS[row.user?.role] || row.user?.role}
                          {row.status === "JUSTIFICADA" && row.excuse ? ` · ${row.excuse}` : ""}
                        </span>
                      </div>
                      <span className={`attChip attChip--${row.status.toLowerCase()}`}>
                        {isBusy ? "Guardando…" : STATUS_LABELS[row.status]}
                      </span>
                    </div>

                    <div className="attActions">
                      <button
                        className={`attBtn attBtn--presente ${row.status === "PRESENTE" ? "isActive" : ""}`}
                        disabled={disabled || row.status === "PRESENTE"}
                        onClick={() => handleMark(row.userId, "PRESENTE")}
                        type="button"
                      >
                        Presente
                      </button>
                      <button
                        className={`attBtn attBtn--ausente ${row.status === "AUSENTE" ? "isActive" : ""}`}
                        disabled={disabled || row.status === "AUSENTE"}
                        onClick={() => handleMark(row.userId, "AUSENTE")}
                        type="button"
                      >
                        Ausente
                      </button>
                      <button
                        className={`attBtn attBtn--justificada ${row.status === "JUSTIFICADA" ? "isActive" : ""}`}
                        disabled={disabled}
                        onClick={() => {
                          setExcuseFor(excuseFor === row.userId ? "" : row.userId);
                          setExcuseText(row.excuse || "");
                        }}
                        type="button"
                      >
                        Justificar
                      </button>
                    </div>

                    {excuseFor === row.userId && (
                      <form
                        className="attExcuse"
                        onSubmit={(event) => {
                          event.preventDefault();
                          handleMark(row.userId, "JUSTIFICADA", excuseText.trim());
                        }}
                      >
                        <input
                          autoFocus
                          maxLength={500}
                          onChange={(event) => setExcuseText(event.target.value)}
                          placeholder="Motivo de la justificación (reposo médico, comisión de servicio…)"
                          required
                          value={excuseText}
                        />
                        <button className="attBtn attBtn--primary" disabled={isBusy || !excuseText.trim()} type="submit">
                          Guardar
                        </button>
                      </form>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          <div className="attFooter">
            <p className="attMuted">
              Al finalizar, los convocados que sigan pendientes se registran como ausentes. El sistema
              también lo hace automáticamente al cerrar la ventana.
            </p>
            <button
              className="attBtn attBtn--primary"
              disabled={!canFinalize(meeting) || isFinalizing}
              onClick={handleFinalize}
              title={
                meeting.attendanceFinalized
                  ? "La asistencia ya fue finalizada"
                  : canFinalize(meeting)
                    ? "Finalizar asistencia"
                    : "Disponible cuando cierre la ventana de asistencia"
              }
              type="button"
            >
              {meeting.attendanceFinalized
                ? "Asistencia finalizada"
                : isFinalizing
                  ? "Finalizando…"
                  : "Finalizar asistencia"}
            </button>
          </div>
        </>
      )}
    </section>
  );
};

const Attendance = () => {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const canSeeHistory = ["ADMIN", "SECRETARIO"].includes(user?.role);
  const historyVisible = canSeeHistory && params.get("view") === "history";
  return <div className="attWorkspace">
    {canSeeHistory && <div aria-label="Vistas de asistencia" className="attViews" role="tablist">
      <button aria-selected={!historyVisible} onClick={() => setParams({ view: "registration" })} role="tab" type="button">Registro por reunión</button>
      <button aria-selected={historyVisible} onClick={() => setParams({ view: "history" })} role="tab" type="button">Historial por docente</button>
    </div>}
    {historyVisible ? <AttendanceHistory /> : <AttendanceRegistration />}
  </div>;
};

export default Attendance;
