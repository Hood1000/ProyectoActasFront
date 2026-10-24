import React, { useEffect, useMemo, useState } from "react";
import meetingsService from "../../../../api/services/meetingsService";
import { useAuth } from "../../../../context/AuthContext";
import "./styles.css";

const EMPTY_POINT = {
  description: "",
  title: "",
};

const formatDate = (value) => {
  if (!value) return "Sin fecha";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Sin fecha";
  return parsed.toLocaleString("es-VE", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const Agenda = () => {
  const { user } = useAuth();
  const [agendaState, setAgendaState] = useState(null);
  const [form, setForm] = useState(EMPTY_POINT);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState("");

  const loadAvailableAgenda = async () => {
    setIsLoading(true);
    try {
      const response = await meetingsService.getAvailableAgenda();
      setAgendaState(response);
    } catch {
      setAgendaState({
        available: false,
        meeting: null,
        message: "No fue posible consultar la reunion disponible. Intenta nuevamente.",
        myProposalCount: 0,
        myProposals: [],
        remainingSlots: 0,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAvailableAgenda();
  }, []);

  const meeting = agendaState?.meeting;
  const maxPoints = agendaState?.maxPointsPerUser || 2;
  const myCount = agendaState?.myProposalCount || 0;
  const remainingSlots = agendaState?.remainingSlots || 0;

  const approvedPoints = useMemo(
    () => (meeting?.agendaPoints || []).filter((point) => point.status === "APROBADO"),
    [meeting?.agendaPoints],
  );

  const isPrivileged = ["ADMIN", "SECRETARIO"].includes(user?.role || "");
  const canSubmitPoint = Boolean(
    agendaState?.available && (isPrivileged || remainingSlots > 0),
  );

  const handleChange = (event) => {
    const { name, value } = event.currentTarget;
    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
    setFeedback("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!meeting?.id || !canSubmitPoint) return;

    setIsSubmitting(true);
    setFeedback("");

    try {
      await meetingsService.proposePoint(meeting.id, {
        description: form.description.trim(),
        title: form.title.trim(),
      });
      setForm(EMPTY_POINT);
      setFeedback("Punto enviado correctamente.");
      await loadAvailableAgenda();
    } catch (err) {
      setFeedback(
        err?.response?.data?.message ||
          "No se pudo registrar el punto. Verifica los datos e intenta nuevamente.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <section className="agendaPage">
        <div className="agendaMessageCard">Cargando reunion disponible...</div>
      </section>
    );
  }

  return (
    <section className="agendaPage">
      <header className="agendaHeader">
        <div>
          <h2 className="agendaTitle">Propuesta de puntos</h2>
          <p className="agendaSubtitle">
            Registra tus puntos individuales sobre la reunion abierta para agenda.
          </p>
        </div>
        {!isPrivileged && (
          <div className="agendaCounter">
            {myCount}/{maxPoints}
          </div>
        )}
      </header>

      {!agendaState?.available && (
        <div className="agendaMessageCard">{agendaState?.message || "No hay reunion disponible."}</div>
      )}

      {agendaState?.available && meeting && (
        <>
          <article className="agendaMeetingCard">
            <h3>{meeting.title}</h3>
            <p>{meeting.description || "Sin descripcion de convocatoria."}</p>
            <div className="agendaMeetingMeta">
              <span>Fecha: {formatDate(meeting.date)}</span>
              <span>Lugar: {meeting.location}</span>
              <span>Estado: {meeting.status}</span>
            </div>
          </article>

          {isPrivileged && (
            <div className="agendaMessageCard">
              Los puntos de agenda se agregan al crear o editar una reunion desde Control de Actas.
            </div>
          )}

          {!isPrivileged && <form className="agendaFormCard" onSubmit={handleSubmit}>
            <div className="agendaFormHeader">
              <h3>Enviar puntos</h3>
              <span>Disponibles: {remainingSlots}</span>
            </div>

            <div className="agendaFormGrid">
              <div className="agendaField agendaFieldFull">
                <label htmlFor="agenda-title">Titulo del punto</label>
                <input
                  id="agenda-title"
                  maxLength={120}
                  minLength={4}
                  name="title"
                  onChange={handleChange}
                  placeholder="Ej: Avance del Plan de Captacion 2026"
                  required
                  value={form.title}
                />
              </div>

              <div className="agendaField agendaFieldFull">
                <label htmlFor="agenda-description">Descripcion</label>
                <textarea
                  id="agenda-description"
                  maxLength={1500}
                  minLength={10}
                  name="description"
                  onChange={handleChange}
                  placeholder="Detalle del punto a discutir durante la reunion"
                  required
                  rows={4}
                  value={form.description}
                />
              </div>
            </div>

            {feedback && <div className="agendaFeedback">{feedback}</div>}

            <div className="agendaFormActions">
              <button disabled={isSubmitting || !canSubmitPoint} type="submit">
                {isSubmitting ? "Enviando..." : "Enviar puntos"}
              </button>
            </div>
          </form>}



          <section className="agendaListCard">
            <h3>Mis puntos registrados</h3>
            {agendaState.myProposals?.length ? (
              <ul className="agendaPointList">
                {agendaState.myProposals.map((point) => (
                  <li key={point.id}>
                    <div className="agendaPointHeader">
                      <strong>{point.title}</strong>
                      <span>{point.status}</span>
                    </div>
                    <p>{point.description}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p>Aun no has registrado puntos en esta convocatoria.</p>
            )}
          </section>

          <section className="agendaListCard">
            <h3>Puntos aprobados de la agenda</h3>
            {approvedPoints.length ? (
              <ul className="agendaPointList">
                {approvedPoints.map((point) => (
                  <li key={point.id}>
                    <div className="agendaPointHeader">
                      <strong>{point.title}</strong>
                      <span>{point.proposer?.name || "Coordinacion"}</span>
                    </div>
                    <p>{point.description}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p>Todavia no hay puntos aprobados en esta reunion.</p>
            )}
          </section>
        </>
      )}

      {!user && <div className="agendaMessageCard">Debes iniciar sesion para registrar puntos.</div>}
    </section>
  );
};

export default Agenda;
