import React, { useCallback, useEffect, useState } from "react";
import {
  IconChevronDown,
  IconChevronUp,
  IconGavel,
  IconInfoCircle,
  IconLock,
  IconMinus,
  IconPlus,
  IconThumbDown,
  IconThumbUp,
} from "@tabler/icons-react";
import meetingsService from "../../api/services/meetingsService";
import useMeetingPollsSocket from "../../hooks/useMeetingPollsSocket";
import { getVoteState, sortPolls, upsertPoll } from "./utils";
import { getAvatarColor, getInitials } from "../../utils/people";
import "./styles.css";

const TIME_ZONE = "America/Caracas";
const MANAGER_ROLES = ["ADMIN", "SECRETARIO"];

const OPTIONS = [
  { icon: IconThumbUp, key: "aFavor", label: "A favor", value: "A_FAVOR" },
  { icon: IconThumbDown, key: "enContra", label: "En contra", value: "EN_CONTRA" },
  { icon: IconMinus, key: "abstencion", label: "Abstención", value: "ABSTENCION" },
];

const OPTION_LABELS = Object.fromEntries(OPTIONS.map((option) => [option.value, option.label]));

const formatTime = (value) =>
  value
    ? new Date(value).toLocaleString("es-VE", {
        dateStyle: "short",
        timeStyle: "short",
        timeZone: TIME_ZONE,
      })
    : "";

const getVerdict = ({ aFavor = 0, enContra = 0, total = 0 }) => {
  if (total === 0) return { label: "Sin votos", tone: "neutral" };
  if (aFavor > enContra) return { label: "Aprobada", tone: "ok" };
  if (enContra > aFavor) return { label: "Rechazada", tone: "bad" };
  return { label: "Empate", tone: "neutral" };
};

export const PollCard = ({
  canVote,
  isManager,
  meetingId,
  onPollChange,
  poll,
  presentCount,
  userId,
  voteBlockReason = "",
}) => {
  const [isVoting, setIsVoting] = useState("");
  const [isClosing, setIsClosing] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [showVoters, setShowVoters] = useState(false);
  const [error, setError] = useState("");

  const isOpen = poll.status === "OPEN";
  const results = poll.results || { aFavor: 0, abstencion: 0, enContra: 0, total: 0 };
  const myVote = poll.votes?.find((vote) => vote.voterId === userId)?.option || "";
  const verdict = getVerdict(results);

  const handleVote = async (option) => {
    if (!canVote || !isOpen || isVoting || option === myVote) return;
    setIsVoting(option);
    setError("");
    try {
      onPollChange(await meetingsService.voteMeetingPoll(meetingId, poll.id, option));
    } catch (err) {
      setError(err?.response?.data?.message || "No se pudo registrar tu voto.");
    } finally {
      setIsVoting("");
    }
  };

  const handleClose = async () => {
    setIsClosing(true);
    setError("");
    try {
      onPollChange(await meetingsService.closeMeetingPoll(meetingId, poll.id));
      setConfirmClose(false);
    } catch (err) {
      setError(err?.response?.data?.message || "No se pudo cerrar la votación.");
    } finally {
      setIsClosing(false);
    }
  };

  return (
    <article className={`mpollCard ${isOpen ? "mpollCard--open" : ""}`} id={`poll-${poll.id}`}>
      <header className="mpollCardHeader">
        <span className={`mpollState ${isOpen ? "mpollState--open" : ""}`}>
          {isOpen ? (
            <>
              <span className="mpollStateDot" /> Abierta
            </>
          ) : (
            <>
              <IconLock size={12} /> Cerrada
            </>
          )}
        </span>
        {!isOpen && (
          <span className={`mpollVerdict mpollVerdict--${verdict.tone}`}>{verdict.label}</span>
        )}
      </header>

      <h4 className="mpollQuestion">{poll.question}</h4>
      <p className="mpollMeta">
        Propuesta por {poll.createdBy?.name || "Secretaría"} · {formatTime(poll.createdAt)}
        {!isOpen && poll.closedAt ? ` · cerrada ${formatTime(poll.closedAt)}` : ""}
      </p>

      {isOpen && canVote && (
        <div className="mpollVoteGrid" role="group" aria-label="Emitir voto">
          {OPTIONS.map(({ icon: OptionIcon, label, value }) => (
            <button
              aria-pressed={myVote === value}
              className={`mpollVoteBtn mpollVoteBtn--${value.toLowerCase()} ${myVote === value ? "isSelected" : ""}`}
              disabled={Boolean(isVoting)}
              key={value}
              onClick={() => handleVote(value)}
              type="button"
            >
              <OptionIcon size={20} />
              <span>{isVoting === value ? "Enviando…" : label}</span>
            </button>
          ))}
        </div>
      )}
      {isOpen && !canVote && voteBlockReason && (
        <p className="mpollMyVote">
          <IconInfoCircle size={14} /> {voteBlockReason}
        </p>
      )}
      {isOpen && canVote && (
        <p className="mpollMyVote">
          {myVote
            ? `Tu voto: ${OPTION_LABELS[myVote]}. Puedes cambiarlo mientras la votación siga abierta.`
            : "Aún no has votado."}
        </p>
      )}

      <div className="mpollResults">
        {OPTIONS.map(({ key, label, value }) => {
          const count = results[key] || 0;
          const percent = results.total ? Math.round((count / results.total) * 100) : 0;
          return (
            <div className="mpollResultRow" key={value}>
              <div className="mpollResultLabel">
                <span>{label}</span>
                <span className="mpollResultCount">
                  {count} <small>({percent}%)</small>
                </span>
              </div>
              <div className="mpollBar">
                <span
                  className={`mpollBarFill mpollBarFill--${value.toLowerCase()}`}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <footer className="mpollFooter">
        <span className="mpollTotal">
          {results.total} {results.total === 1 ? "voto" : "votos"}
          {presentCount > 0 ? ` de ${presentCount} presentes` : ""}
        </span>
        {results.total > 0 && (
          <button className="mpollLinkBtn" onClick={() => setShowVoters((value) => !value)} type="button">
            Quién votó {showVoters ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />}
          </button>
        )}
      </footer>

      {showVoters && (
        <ul className="mpollVoters">
          {(poll.votes || []).map((vote) => {
            const color = getAvatarColor(vote.voter?.id || vote.voterId);
            return (
              <li key={vote.id}>
                <span className="mpollVoterAvatar" style={{ background: color.bg, color: color.fg }}>
                  {getInitials(vote.voter?.name)}
                </span>
                <span className="mpollVoterName">{vote.voter?.name || "Participante"}</span>
                <span className={`mpollVoterOption mpollVoterOption--${vote.option.toLowerCase()}`}>
                  {OPTION_LABELS[vote.option]}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {isManager && isOpen && (
        <div className="mpollManage">
          {confirmClose ? (
            <>
              <span>¿Cerrar la votación? Ya no se podrán emitir ni cambiar votos.</span>
              <div className="mpollManageActions">
                <button className="mpollBtn mpollBtn--ghost" onClick={() => setConfirmClose(false)} type="button">
                  Cancelar
                </button>
                <button className="mpollBtn mpollBtn--danger" disabled={isClosing} onClick={handleClose} type="button">
                  {isClosing ? "Cerrando…" : "Sí, cerrar"}
                </button>
              </div>
            </>
          ) : (
            <button className="mpollBtn mpollBtn--ghost" onClick={() => setConfirmClose(true)} type="button">
              <IconLock size={14} /> Cerrar votación
            </button>
          )}
        </div>
      )}

      {error && <p className="mpollError">{error}</p>}
    </article>
  );
};

/**
 * Votaciones de una reunión con resultados en vivo. allowCreate=false oculta el formulario
 * para crear preguntas (la vista de sesión lo ofrece en su propia ventana). onPollsChange
 * recibe la lista cada vez que cambia, para mostrar contadores fuera del componente.
 */
const MeetingPolls = ({ meeting, user, allowCreate = true, onPollsChange }) => {
  const [polls, setPolls] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [question, setQuestion] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [showForm, setShowForm] = useState(false);

  const meetingId = meeting?.id;
  const isManager = MANAGER_ROLES.includes(user?.role || "");
  const canCreateHere = isManager && allowCreate;
  const votingOpen = Boolean(meeting?.votingOpen);
  const { canVote, isRunning, reason: voteBlockReason } = getVoteState(meeting, user);

  const createBlockReason = !isRunning
    ? "Solo se pueden abrir votaciones con la reunión en curso."
    : !votingOpen
      ? "Inicia la fase de votación para abrir preguntas."
      : !meeting?.hasQuorum
        ? `La reunión aún no tiene quórum (${meeting?.quorumFormula || "mínimo requerido"}).`
        : "";

  const loadPolls = useCallback(async () => {
    if (!meetingId) return;
    try {
      const list = await meetingsService.listMeetingPolls(meetingId);
      setPolls(sortPolls(Array.isArray(list) ? list : []));
      setLoadError("");
    } catch (err) {
      setLoadError(err?.response?.data?.message || "No se pudieron cargar las votaciones.");
    } finally {
      setIsLoading(false);
    }
  }, [meetingId]);

  useEffect(() => {
    setPolls([]);
    setIsLoading(true);
    loadPolls();
  }, [loadPolls]);

  const handlePollChange = useCallback((poll) => {
    if (poll?.id) setPolls((prev) => upsertPoll(prev, poll));
  }, []);

  useMeetingPollsSocket(meetingId, handlePollChange, loadPolls);

  useEffect(() => {
    onPollsChange?.(polls);
  }, [polls, onPollsChange]);

  const handleCreate = async (event) => {
    event.preventDefault();
    const text = question.trim();
    if (text.length < 5) {
      setCreateError("La pregunta debe tener al menos 5 caracteres.");
      return;
    }
    setIsCreating(true);
    setCreateError("");
    try {
      handlePollChange(await meetingsService.createMeetingPoll(meetingId, { question: text }));
      setQuestion("");
      setShowForm(false);
    } catch (err) {
      setCreateError(err?.response?.data?.message || "No se pudo abrir la votación.");
    } finally {
      setIsCreating(false);
    }
  };

  const openCount = polls.filter((poll) => poll.status === "OPEN").length;

  return (
    <div className="mpoll">
      <div className="mpollHeader">
        <div>
          <span className="mpollHeaderTitle">Votaciones</span>
          <span className="mpollHeaderMeta">
            {polls.length === 0
              ? "Sin votaciones registradas"
              : `${openCount} abierta${openCount === 1 ? "" : "s"} · ${polls.length} en total`}
          </span>
        </div>
        {canCreateHere && !showForm && (
          <button
            className="mpollBtn mpollBtn--primary"
            disabled={Boolean(createBlockReason)}
            onClick={() => setShowForm(true)}
            title={createBlockReason || "Abrir una nueva votación"}
            type="button"
          >
            <IconPlus size={16} /> Nueva votación
          </button>
        )}
      </div>

      {canCreateHere && createBlockReason && (
        <p className="mpollNotice">
          <IconInfoCircle size={16} /> {createBlockReason}
        </p>
      )}

      {canCreateHere && showForm && (
        <form className="mpollForm" onSubmit={handleCreate}>
          <label htmlFor={`poll-question-${meetingId}`}>Pregunta a votar</label>
          <textarea
            autoFocus
            id={`poll-question-${meetingId}`}
            maxLength={500}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Ej: ¿Se aprueba el cronograma de evaluaciones del lapso?"
            rows={3}
            value={question}
          />
          <div className="mpollFormFooter">
            <span className="mpollCounter">{question.length}/500</span>
            <div className="mpollManageActions">
              <button
                className="mpollBtn mpollBtn--ghost"
                onClick={() => {
                  setShowForm(false);
                  setCreateError("");
                }}
                type="button"
              >
                Cancelar
              </button>
              <button className="mpollBtn mpollBtn--primary" disabled={isCreating} type="submit">
                {isCreating ? "Abriendo…" : "Abrir votación"}
              </button>
            </div>
          </div>
          {createError && <p className="mpollError">{createError}</p>}
        </form>
      )}

      {!isManager && voteBlockReason && (isRunning || polls.some((poll) => poll.status === "OPEN")) && (
        <p className="mpollNotice">
          <IconInfoCircle size={16} /> {voteBlockReason}
        </p>
      )}

      <div className="mpollList">
        {isLoading ? (
          <div className="mpollSkeleton" aria-label="Cargando votaciones">
            <span />
            <span />
          </div>
        ) : loadError ? (
          <p className="mpollError">{loadError}</p>
        ) : polls.length === 0 ? (
          <div className="mpollEmpty">
            <span className="mpollEmptyIcon">
              <IconGavel size={26} />
            </span>
            <strong>No hay votaciones todavía</strong>
            <p>
              {isManager
                ? "Abre una votación una vez iniciada la fase de votación."
                : "Cuando Secretaría abra una votación aparecerá aquí al instante."}
            </p>
          </div>
        ) : (
          polls.map((poll) => (
            <PollCard
              canVote={canVote}
              isManager={isManager}
              key={poll.id}
              meetingId={meetingId}
              onPollChange={handlePollChange}
              poll={poll}
              presentCount={meeting?.presentCount || 0}
              userId={user?.id}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default MeetingPolls;
