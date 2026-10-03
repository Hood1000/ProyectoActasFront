import React from "react";
import meetingsService from "../../../../api/services/meetingsService";
import "./styles.css";

const FILTERS = [
  { label: "Pendientes", value: "PENDIENTE" },
  { label: "Revisadas", value: "REVISADA" },
  { label: "Descartadas", value: "DESCARTADA" },
  { label: "Todas", value: "ALL" },
];

const formatDate = (value) => {
  if (!value) return "No disponible";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "No disponible";
  return parsed.toLocaleString("es-VE", { dateStyle: "medium", timeStyle: "short" });
};

const Sanctions = () => {
  const [alerts, setAlerts] = React.useState([]);
  const [filter, setFilter] = React.useState("PENDIENTE");
  const [notesById, setNotesById] = React.useState({});
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmittingId, setIsSubmittingId] = React.useState("");
  const [message, setMessage] = React.useState("");

  const loadAlerts = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await meetingsService.listAbsenceAlerts();
      setAlerts(Array.isArray(data) ? data : []);
      setMessage("");
    } catch {
      setMessage("No se pudo cargar el seguimiento de inasistencias.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  const filteredAlerts = React.useMemo(() => {
    if (filter === "ALL") return alerts;
    return alerts.filter((alert) => alert.reviewStatus === filter);
  }, [alerts, filter]);

  const handleNoteChange = (alertId, value) => {
    setNotesById((current) => ({ ...current, [alertId]: value }));
  };

  const handleReview = async (alertId, status) => {
    setIsSubmittingId(alertId);
    setMessage("");
    try {
      const updated = await meetingsService.reviewAbsenceAlert(alertId, {
        reviewNotes: notesById[alertId]?.trim() || undefined,
        status,
      });

      setAlerts((current) => current.map((item) => (item.id === alertId ? updated : item)));
      setMessage("La alerta fue actualizada correctamente.");
    } catch (err) {
      setMessage(err?.response?.data?.message || "No se pudo actualizar la alerta.");
    } finally {
      setIsSubmittingId("");
    }
  };

  return (
    <section className="sanctionsPage">
      <header className="sanctionsHeader">
        <div>
          <h2>Sanciones y Faltas</h2>
          <p>Revisión institucional de alertas por inasistencia docente.</p>
        </div>
        <div className="sanctionsFilters">
          {FILTERS.map((item) => (
            <button
              className={`sanctionsFilterBtn ${filter === item.value ? "active" : ""}`}
              key={item.value}
              onClick={() => setFilter(item.value)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </div>
      </header>

      {message && <div className="sanctionsMessage">{message}</div>}
      {isLoading && <div className="sanctionsMessage">Cargando alertas...</div>}

      {!isLoading && filteredAlerts.length === 0 && (
        <div className="sanctionsEmpty">No hay alertas para el filtro seleccionado.</div>
      )}

      {!isLoading && filteredAlerts.length > 0 && (
        <div className="sanctionsList">
          {filteredAlerts.map((alert) => {
            const isPending = alert.reviewStatus === "PENDIENTE";
            return (
              <article className="sanctionsCard" key={alert.id}>
                <div className="sanctionsCardHead">
                  <div>
                    <h3>{alert.teacher?.name || "Docente"}</h3>
                    <p>{alert.summary}</p>
                  </div>
                  <span className={`sanctionsStatus sanctionsStatus--${(alert.reviewStatus || "").toLowerCase()}`}>
                    {alert.reviewStatus}
                  </span>
                </div>

                <div className="sanctionsMetaGrid">
                  <span>Año: {alert.academicYear}</span>
                  <span>Inasistencias: {alert.absencesCount}</span>
                  <span>Notificada: {formatDate(alert.notifiedAt)}</span>
                  <span>Reunión: {alert.meeting?.title || "No disponible"}</span>
                  <span>Fecha reunión: {formatDate(alert.meeting?.date)}</span>
                  <span>Revisó: {alert.reviewedBy?.name || "Pendiente"}</span>
                </div>

                <textarea
                  className="sanctionsNotes"
                  disabled={!isPending}
                  onChange={(event) => handleNoteChange(alert.id, event.target.value)}
                  placeholder="Observación: reposo médico, causa mayor o nota de seguimiento"
                  rows={3}
                  value={isPending ? (notesById[alert.id] || "") : (alert.reviewNotes || "")}
                />

                {isPending ? (
                  <div className="sanctionsActions">
                    <button
                      className="sanctionsBtn sanctionsBtn--ghost"
                      disabled={isSubmittingId === alert.id}
                      onClick={() => handleReview(alert.id, "DESCARTADA")}
                      type="button"
                    >
                      {isSubmittingId === alert.id ? "Guardando..." : "Descartar"}
                    </button>
                    <button
                      className="sanctionsBtn sanctionsBtn--primary"
                      disabled={isSubmittingId === alert.id}
                      onClick={() => handleReview(alert.id, "REVISADA")}
                      type="button"
                    >
                      {isSubmittingId === alert.id ? "Guardando..." : "Marcar revisada"}
                    </button>
                  </div>
                ) : (
                  <p className="sanctionsReviewedText">
                    {alert.reviewedAt
                      ? `Actualizada el ${formatDate(alert.reviewedAt)}.`
                      : "Sin fecha de revisión registrada."}
                  </p>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default Sanctions;
