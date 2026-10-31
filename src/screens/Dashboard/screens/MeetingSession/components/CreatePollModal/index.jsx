import React, { useMemo, useState } from "react";
import { IconBulb, IconCheck, IconGavel, IconThumbDown, IconThumbUp } from "@tabler/icons-react";
import meetingsService from "../../../../../../api/services/meetingsService";
import { getVotablePoints } from "../../../../../../utils/agenda";
import SessionModal from "../SessionModal";

/**
 * Ventana para abrir la votación de un punto del orden del día. Cada votación queda fijada a
 * un punto aprobado y cada punto se vota una sola vez: los que ya tienen votación no se ofrecen.
 * La lectura del acta anterior se aprueba sin votación.
 */
const CreatePollModal = ({ meeting, polls = [], onClose, onCreated }) => {
  const [selectedPointId, setSelectedPointId] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const agendaPoints = useMemo(
    () => getVotablePoints(meeting?.agendaPoints, polls),
    [meeting?.agendaPoints, polls],
  );

  const availablePoints = agendaPoints.filter((point) => !point.hasPoll);
  const selectedPoint = availablePoints.find((point) => point.id === selectedPointId);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedPoint) {
      setError("Selecciona el punto del orden del día que se va a votar.");
      return;
    }
    setIsSaving(true);
    setError("");
    try {
      onCreated(await meetingsService.createMeetingPoll(meeting.id, { agendaPointId: selectedPoint.id }));
    } catch (err) {
      setError(err?.response?.data?.message || "No se pudo abrir la votación.");
      setIsSaving(false);
    }
  };

  return (
    <SessionModal
      busy={isSaving}
      footer={
        <>
          <button className="msessionBtn msessionBtn--ghost" disabled={isSaving} onClick={onClose} type="button">
            Cancelar
          </button>
          <button
            className="msessionBtn msessionBtn--primary"
            disabled={isSaving || !selectedPoint}
            form="msession-create-poll"
            type="submit"
          >
            {isSaving ? "Abriendo…" : "Abrir votación"}
          </button>
        </>
      }
      icon={IconGavel}
      onClose={onClose}
      subtitle="Los participantes presentes podrán votar al instante."
      title="Nueva votación"
      wide
    >
      <form className="msessionForm" id="msession-create-poll" onSubmit={handleSubmit}>
        <div className="msessionSuggestions">
          <span className="msessionLabel">Punto del orden del día a votar</span>
          {availablePoints.length === 0 ? (
            <p className="msessionHintText">
              {agendaPoints.length === 0
                ? "La reunión no tiene puntos por votar: la lectura del acta anterior se aprueba sin votación."
                : "Todos los puntos del orden del día ya tienen su votación."}
            </p>
          ) : (
            <div className="msessionSuggestionList" role="radiogroup">
              {agendaPoints.map((point) => {
                const isActive = point.id === selectedPointId;
                return (
                  <button
                    aria-checked={isActive}
                    className={`msessionSuggestion ${isActive ? "isActive" : ""}`}
                    disabled={point.hasPoll}
                    key={point.id}
                    onClick={() => {
                      setSelectedPointId(point.id);
                      setError("");
                    }}
                    role="radio"
                    title={point.hasPoll ? "Este punto ya tiene su votación" : point.description}
                    type="button"
                  >
                    {isActive && <IconCheck size={14} />}
                    Punto {point.number}: {point.title}
                    {point.hasPoll && " · ya votado"}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {selectedPoint && (
          <div className="msessionFormMeta">
            <span>
              Se preguntará: <strong>¿Se aprueba el punto "{selectedPoint.title}"?</strong>
            </span>
          </div>
        )}

        <div className="msessionHelp">
          <div className="msessionHelpTitle">
            <IconBulb size={16} /> Cómo funciona
          </div>
          <ul>
            <li>
              Cada participante elige una opción:
              <span className="msessionOptionTag msessionOptionTag--favor">
                <IconThumbUp size={13} /> A favor
              </span>
              <span className="msessionOptionTag msessionOptionTag--contra">
                <IconThumbDown size={13} /> En contra
              </span>
            </li>
            <li>Cada punto del orden del día se vota una sola vez. La lectura del acta anterior se aprueba sin votación.</li>
            <li>Los puntos que no se voten antes de finalizar la reunión quedan diferidos para la próxima.</li>
            <li>Solo votan los convocados con asistencia presente; pueden cambiar su voto mientras siga abierta.</li>
            <li>Ciérrala desde su tarjeta en el chat cuando termine la discusión. Al finalizar la reunión se cierran todas.</li>
          </ul>
        </div>

        {error && <p className="msessionMsg msessionMsg--bad">{error}</p>}
      </form>
    </SessionModal>
  );
};

export default CreatePollModal;
