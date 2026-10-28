import React, { useMemo, useState } from "react";
import { IconBulb, IconCheck, IconGavel, IconMinus, IconThumbDown, IconThumbUp } from "@tabler/icons-react";
import meetingsService from "../../../../../../api/services/meetingsService";
import SessionModal from "../SessionModal";

const MIN_LENGTH = 5;
const MAX_LENGTH = 500;

const GENERIC_SUGGESTIONS = [
  "¿Se aprueba el acta de la reunión anterior?",
  "¿Se aprueba el orden del día propuesto?",
];

/** Ventana para abrir una nueva pregunta, con ayuda y sugerencias del orden del día. */
const CreatePollModal = ({ meeting, onClose, onCreated }) => {
  const [question, setQuestion] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const suggestions = useMemo(() => {
    const fromAgenda = (meeting?.agendaPoints || [])
      .filter((point) => point.status === "APROBADO")
      .map((point) => `¿Se aprueba el punto "${point.title}"?`);
    return [...new Set([...fromAgenda, ...GENERIC_SUGGESTIONS])].slice(0, 6);
  }, [meeting?.agendaPoints]);

  const text = question.trim();
  const isValid = text.length >= MIN_LENGTH;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!isValid) {
      setError(`La pregunta debe tener al menos ${MIN_LENGTH} caracteres.`);
      return;
    }
    setIsSaving(true);
    setError("");
    try {
      onCreated(await meetingsService.createMeetingPoll(meeting.id, { question: text }));
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
            disabled={isSaving || !isValid}
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
        <label className="msessionLabel" htmlFor="msession-poll-question">
          Pregunta a votar
        </label>
        <textarea
          autoFocus
          className="msessionTextarea"
          id="msession-poll-question"
          maxLength={MAX_LENGTH}
          onChange={(event) => {
            setQuestion(event.target.value);
            setError("");
          }}
          placeholder="Ej: ¿Se aprueba el cronograma de evaluaciones del lapso?"
          rows={3}
          value={question}
        />
        <div className="msessionFormMeta">
          <span>Redáctala como una pregunta de sí o no.</span>
          <span>
            {question.length}/{MAX_LENGTH}
          </span>
        </div>

        {suggestions.length > 0 && (
          <div className="msessionSuggestions">
            <span className="msessionLabel">Sugerencias</span>
            <div className="msessionSuggestionList">
              {suggestions.map((suggestion) => (
                <button
                  className={`msessionSuggestion ${question === suggestion ? "isActive" : ""}`}
                  key={suggestion}
                  onClick={() => setQuestion(suggestion)}
                  type="button"
                >
                  {question === suggestion && <IconCheck size={14} />}
                  {suggestion}
                </button>
              ))}
            </div>
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
              <span className="msessionOptionTag">
                <IconMinus size={13} /> Abstención
              </span>
            </li>
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
