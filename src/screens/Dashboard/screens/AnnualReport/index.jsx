import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { IconArrowLeft, IconDownload } from "@tabler/icons-react";
import meetingsService from "../../../../api/services/meetingsService";
import { downloadBlob } from "../../../../utils/download";
import {
  ATTENDANCE_STATUS,
  CATEGORY_LABELS,
  MEETING_STATUS,
  MODALITY_LABELS,
  POINT_STATUS,
  ROLE_LABELS,
} from "./constants";
import "./styles.css";

const formatDate = (value) => {
  if (!value) return "Sin fecha";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Sin fecha";
  return parsed.toLocaleString("es-VE", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Caracas",
  });
};

const AnnualReport = () => {
  const { year } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      setIsLoading(true);
      try {
        const payload = await meetingsService.getAnnualArchiveData(year);
        if (active) {
          setData(payload);
          setError("");
        }
      } catch (err) {
        if (active) {
          setError(err?.response?.data?.message || "No se pudo cargar el cierre anual.");
        }
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [year]);

  const handleDownloadPdf = async () => {
    setIsDownloading(true);
    try {
      const blob = await meetingsService.downloadAnnualReportPdf(year);
      downloadBlob(blob, `Cierre-anual-${year}.pdf`);
    } catch {
      window.alert("No se pudo generar el PDF del cierre anual.");
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) return <div className="arState">Cargando cierre anual...</div>;
  if (error) return <div className="arState arState--error">{error}</div>;
  if (!data) return null;

  const stats = data.stats || {};
  const meetings = Array.isArray(data.meetings) ? data.meetings : [];

  return (
    <div className="arPage">
      <div className="arInner">
      <div className="arToolbar">
        <button className="arBtn arBtn--ghost" onClick={() => navigate(-1)} type="button">
          <IconArrowLeft size={16} /> Volver
        </button>
        <button
          className="arBtn arBtn--primary"
          disabled={isDownloading}
          onClick={handleDownloadPdf}
          type="button"
        >
          <IconDownload size={16} /> {isDownloading ? "Generando..." : "Descargar PDF"}
        </button>
      </div>

      <header className="arHero">
        <h1>Cierre anual {data.year}</h1>
        <p className="arHeroMeta">Fecha de cierre: {formatDate(data.closedAt)}</p>
        <p className="arHeroMeta">
          Documento consolidado del año: reuniones, asistencia, agenda y evidencias registradas.
        </p>
        <div className="arCards">
          <div className="arCard">
            <span>Reuniones</span>
            <strong>{stats.meetingsTotal ?? meetings.length}</strong>
          </div>
          <div className="arCard">
            <span>Cerradas</span>
            <strong>{stats.meetingsClosed ?? 0}</strong>
          </div>
          <div className="arCard">
            <span>Asistencias presentes</span>
            <strong>{stats.presentMarks ?? 0}</strong>
          </div>
          <div className="arCard">
            <span>Puntos aprobados</span>
            <strong>{stats.approvedPoints ?? 0}</strong>
          </div>
        </div>
      </header>

      {meetings.length === 0 && (
        <div className="arState">No se registraron reuniones en este período.</div>
      )}

      {meetings.map((meeting, index) => {
        const status = MEETING_STATUS[meeting.status] || { label: meeting.status, className: "" };
        const points = Array.isArray(meeting.agendaPoints) ? meeting.agendaPoints : [];
        const approvedCount = points.filter((p) => p.status === "APROBADO").length;
        const attendance = Array.isArray(meeting.attendance) ? meeting.attendance : [];
        return (
          <section className="arMeeting" key={meeting.id}>
            <div className="arMeetingHead">
              <h2>
                {index + 1}. {meeting.title}
              </h2>
              <span className={`arStatus ${status.className}`}>{status.label}</span>
            </div>
            <p className="arMeetingDesc">{meeting.description || "Sin descripción registrada."}</p>

            <div className="arMeta">
              <div>
                <span>Fecha</span>
                {formatDate(meeting.date)}
              </div>
              <div>
                <span>Categoría</span>
                {CATEGORY_LABELS[meeting.category] || meeting.category}
              </div>
              <div>
                <span>Modalidad</span>
                {MODALITY_LABELS[meeting.modality] || meeting.modality}
              </div>
              <div>
                <span>Lugar</span>
                {meeting.location || "No registrado"}
              </div>
              <div>
                <span>Organiza</span>
                {meeting.organizer?.name || "—"}
              </div>
              <div>
                <span>Quórum</span>
                {meeting.hasQuorum ? "Alcanzado" : "No alcanzado"}
              </div>
              <div>
                <span>Puntos aprobados</span>
                {approvedCount}
              </div>
            </div>

            {meeting.status === "CANCELADA" && (
              <div className="arNotice">
                <span>Motivo de cancelación</span>
                <p>{meeting.cancellationReason || "No se registró un motivo."}</p>
              </div>
            )}

            <div className="arBlock">
              <h3>Asistencia</h3>
              <div className="arTableWrap">
                <table className="arTable">
                  <thead>
                    <tr>
                      <th>Participante</th>
                      <th>Rol</th>
                      <th>Estado</th>
                      <th>Marcado</th>
                      <th>Observación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.length === 0 ? (
                      <tr>
                        <td colSpan={5}>Sin asistencias registradas.</td>
                      </tr>
                    ) : (
                      attendance.map((entry) => (
                        <tr key={entry.user?.id || entry.user?.email}>
                          <td>{entry.user?.name || "Sin nombre"}</td>
                          <td>{ROLE_LABELS[entry.user?.role] || entry.user?.role || "—"}</td>
                          <td>{ATTENDANCE_STATUS[entry.status] || entry.status}</td>
                          <td>{entry.markedAt ? formatDate(entry.markedAt) : "—"}</td>
                          <td>{entry.excuse || "—"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="arBlock">
              <h3>Agenda</h3>
              <div className="arTableWrap">
                <table className="arTable">
                  <thead>
                    <tr>
                      <th>Punto</th>
                      <th>Estado</th>
                      <th>Propuesto por</th>
                      <th>Base</th>
                      <th>Motivo de rechazo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {points.length === 0 ? (
                      <tr>
                        <td colSpan={5}>Sin puntos de agenda registrados.</td>
                      </tr>
                    ) : (
                      points.map((point) => {
                        const ps = POINT_STATUS[point.status] || {
                          label: point.status,
                          className: "",
                        };
                        return (
                          <tr key={point.id}>
                            <td>{point.title}</td>
                            <td>
                              <span className={`arBadge ${ps.className}`}>{ps.label}</span>
                            </td>
                            <td>{point.proposer?.name || "Coordinación"}</td>
                            <td>{point.isBasePoint ? "Sí" : "No"}</td>
                            <td>
                              {point.status === "RECHAZADO"
                                ? point.reviewComment || "No registrado"
                                : "—"}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="arBlock arBlock--compact">
              <p>
                <strong>Resumen final:</strong> {meeting.finalSummary || "No disponible"}
              </p>
              <p>
                <strong>Evidencia:</strong> {meeting.evidenceSignaturesUrl ? "Registrada" : "No registrada"}
              </p>
            </div>
          </section>
        );
      })}
      </div>
    </div>
  );
};

export default AnnualReport;
