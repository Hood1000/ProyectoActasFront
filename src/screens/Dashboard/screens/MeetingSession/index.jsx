import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  IconArrowLeft,
  IconChartBar,
  IconCheck,
  IconCircleCheck,
  IconFileText,
  IconFlag,
  IconGavel,
  IconHelpCircle,
  IconPlayerPlay,
  IconUsersGroup,
  IconX,
} from "@tabler/icons-react";
import meetingsService from "../../../../api/services/meetingsService";
import MeetingChat from "../../../../components/MeetingChat";
import { PollCard } from "../../../../components/MeetingPolls";
import { getVoteState, sortPolls, upsertPoll } from "../../../../components/MeetingPolls/utils";
import { useAuth } from "../../../../context/AuthContext";
import useMeetingPollsSocket from "../../../../hooks/useMeetingPollsSocket";
import useMeetingStatusSocket from "../../../../hooks/useMeetingStatusSocket";
import { openMeetingEvidence } from "../../../../utils/evidence";
import CloseMeetingModal from "./components/CloseMeetingModal";
import CreatePollModal from "./components/CreatePollModal";
import HelpModal from "./components/HelpModal";
import SessionMenu from "./components/SessionMenu";
import SessionGate from "./components/SessionGate";
import SessionModal from "./components/SessionModal";
import { getChatAccess, MANAGER_ROLES } from "./utils";
import "./styles.css";

const LIVE_REFRESH_MS = 30 * 1000;
const TOAST_MS = 4000;

const scrollToPoll = (pollId) => {
  const node = document.getElementById(`poll-${pollId}`);
  if (!node) return;
  node.scrollIntoView({ behavior: "smooth", block: "center" });
  node.classList.remove("msessionFlash");
  // Fuerza el reinicio de la animación si se pulsa dos veces seguidas.
  void node.offsetWidth;
  node.classList.add("msessionFlash");
};

const getVotingChecklist = (meeting) => [
  { done: meeting.status === "EN_CURSO" && !meeting.isClosed, label: "La reunión está en curso" },
  { done: Boolean(meeting.attendanceFinalized), label: "La asistencia fue finalizada" },
  {
    done: Boolean(meeting.hasQuorum),
    label: `Hay quórum (${meeting.quorumFormula?.toLowerCase() || "mínimo requerido"})`,
  },
];

/** Sesión en vivo de una reunión, a pantalla completa: el chat es la vista principal. */
const MeetingSession = () => {
  const { id: meetingId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [meeting, setMeeting] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [polls, setPolls] = useState([]);
  const [modal, setModal] = useState(null);
  const [isStartingVoting, setIsStartingVoting] = useState(false);
  const [startError, setStartError] = useState("");
  const [toast, setToast] = useState(null);
  const [clock, setClock] = useState(() => Date.now());

  const isManager = MANAGER_ROLES.includes(user?.role || "");

  const showToast = useCallback((text, type = "success") => setToast({ text, type }), []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), TOAST_MS);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const loadMeeting = useCallback(async () => {
    if (!meetingId) return;
    try {
      setMeeting(await meetingsService.getById(meetingId));
      setLoadError("");
    } catch (err) {
      setLoadError(
        err?.response?.status === 404
          ? "La reunión no existe o fue eliminada."
          : err?.response?.data?.message || "No se pudo cargar la reunión.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [meetingId]);

  const loadPolls = useCallback(async () => {
    if (!meetingId) return;
    try {
      const list = await meetingsService.listMeetingPolls(meetingId);
      setPolls(sortPolls(Array.isArray(list) ? list : []));
    } catch {
      // Sin votaciones el chat sigue funcionando; se reintenta al reconectar.
    }
  }, [meetingId]);

  useEffect(() => {
    setIsLoading(true);
    setMeeting(null);
    loadMeeting();
  }, [loadMeeting]);

  // Solo quien puede entrar al chat carga las votaciones y se une a la sala en vivo.
  const access = useMemo(
    () => (meeting ? getChatAccess(meeting, user, clock) : { allowed: false, reason: null }),
    [meeting, user, clock],
  );
  const chatAllowed = access.allowed;
  const liveMeetingId = chatAllowed ? meetingId : null;

  useEffect(() => {
    if (chatAllowed) {
      loadPolls();
    } else {
      setPolls([]);
    }
  }, [chatAllowed, loadPolls]);

  const tick = useCallback(() => setClock(Date.now()), []);

  const handlePollChange = useCallback((poll) => {
    if (poll?.id) setPolls((prev) => upsertPoll(prev, poll));
  }, []);

  useMeetingPollsSocket(liveMeetingId, handlePollChange, loadPolls);

  // El estado llega por socket al instante; se recarga la reunión para traer quórum y asistencia.
  const handleStatus = useCallback(
    (payload) => {
      setMeeting((prev) => (prev ? { ...prev, ...payload, id: prev.id } : prev));
      loadMeeting();
    },
    [loadMeeting],
  );

  useMeetingStatusSocket(liveMeetingId, handleStatus, loadMeeting);

  // La asistencia y el quórum no se emiten por socket: mientras la reunión está activa se
  // refrescan periódicamente.
  const isLive = meeting?.status === "EN_CURSO" && !meeting?.isClosed;
  useEffect(() => {
    if (!isLive) return undefined;
    const timer = window.setInterval(loadMeeting, LIVE_REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [isLive, loadMeeting]);

  const voteState = useMemo(() => getVoteState(meeting, user), [meeting, user]);

  const timelineItems = useMemo(
    () =>
      polls.map((poll) => ({
        id: poll.id,
        createdAt: poll.createdAt,
        content: (
          <PollCard
            canVote={voteState.canVote}
            isManager={isManager}
            meetingId={meetingId}
            onPollChange={handlePollChange}
            poll={poll}
            presentCount={meeting?.presentCount || 0}
            userId={user?.id}
            voteBlockReason={voteState.reason}
          />
        ),
      })),
    [polls, voteState, isManager, meetingId, handlePollChange, meeting?.presentCount, user?.id],
  );

  const handleStartVoting = async () => {
    setIsStartingVoting(true);
    setStartError("");
    try {
      setMeeting(await meetingsService.startVoting(meetingId));
      setModal(null);
      showToast("Fase de votación iniciada. Ya puedes abrir preguntas.");
    } catch (err) {
      setStartError(err?.response?.data?.message || "No se pudo iniciar la votación.");
      loadMeeting();
    } finally {
      setIsStartingVoting(false);
    }
  };

  const handlePollCreated = (poll) => {
    handlePollChange(poll);
    setModal(null);
    showToast("Votación abierta. Ya aparece en el chat.");
    window.setTimeout(() => scrollToPoll(poll.id), 150);
  };

  const handleMeetingClosed = (closed) => {
    setMeeting(closed);
    setModal(null);
    loadPolls();
    showToast("La reunión fue finalizada.");
  };

  const goBack = () =>
    // Si se llegó desde la app, vuelve a la pantalla anterior; con enlace directo, al detalle.
    location.key !== "default"
      ? navigate(-1)
      : navigate(`/dashboard/reuniones?meeting=${meetingId}`, { replace: true });

  const handleAttendanceConfirmed = (updated) => {
    setMeeting(updated);
    setClock(Date.now());
    showToast("Asistencia confirmada. Ya puedes participar en el chat.");
  };

  const handleOpenEvidence = () =>
    openMeetingEvidence(meetingId).catch((err) =>
      showToast(err?.response?.data?.message || "No se pudo abrir el acta firmada.", "error"),
    );

  if (isLoading) {
    return (
      <section className="msession">
        <div className="msessionState">Cargando sesión…</div>
      </section>
    );
  }

  if (loadError || !meeting) {
    return (
      <section className="msession">
        <div className="msessionState msessionState--error">
          <p>{loadError || "No se pudo cargar la reunión."}</p>
          <button className="msessionBtn msessionBtn--ghost" onClick={() => navigate("/dashboard/reuniones")} type="button">
            <IconArrowLeft size={16} /> Volver a reuniones
          </button>
        </div>
      </section>
    );
  }

  if (!chatAllowed) {
    return (
      <section className="msession">
        <SessionGate
          access={access}
          meeting={meeting}
          onBack={goBack}
          onConfirmed={handleAttendanceConfirmed}
          onOpenEvidence={handleOpenEvidence}
          onTick={tick}
        />
        {toast && (
          <div className={`msessionToast msessionToast--${toast.type}`} role="status">
            {toast.text}
          </div>
        )}
      </section>
    );
  }

  const checklist = getVotingChecklist(meeting);
  const canStartVoting = checklist.every((item) => item.done) && !meeting.votingOpen;
  const openPolls = polls.filter((poll) => poll.status === "OPEN");
  const pendingPoll = voteState.canVote
    ? openPolls.find((poll) => !poll.votes?.some((vote) => vote.voterId === user?.id))
    : null;

  const menuItems = [];
  if (isManager && isLive) {
    if (meeting.votingOpen) {
      menuItems.push({ icon: IconChartBar, label: "Nueva votación", onClick: () => setModal("create") });
    } else {
      menuItems.push({
        icon: IconPlayerPlay,
        label: "Iniciar votación",
        hint: canStartVoting ? "" : "Faltan requisitos",
        onClick: () => {
          setStartError("");
          setModal("start");
        },
      });
    }
    menuItems.push({ icon: IconFlag, label: "Finalizar reunión", onClick: () => setModal("close"), tone: "danger" });
  }
  if (meeting.evidenceSignaturesUrl && (isManager || !isLive)) {
    menuItems.push({ icon: IconFileText, label: "Ver acta firmada", onClick: handleOpenEvidence });
  }

  const renderHeader = (isConnected) => {
    let subtitle = isConnected ? "En vivo" : "Reconectando…";
    if (meeting.status === "CANCELADA") subtitle = "Reunión cancelada";
    else if (meeting.isClosed || meeting.status === "FINALIZADA") subtitle = "Reunión finalizada";
    else if (meeting.status === "PROGRAMADA") subtitle = "Aún no inicia";
    else if (meeting.votingOpen && isConnected) subtitle = "En vivo · votación abierta";
    const isOnline = isLive && isConnected;

    return (
      <header className="msessionHeader">
        <button
          aria-label="Volver"
          className="msessionHeaderBtn"
          onClick={goBack}
          type="button"
        >
          <IconArrowLeft size={20} />
        </button>
        <span className="msessionAvatar" aria-hidden="true">
          <IconUsersGroup size={20} />
        </span>
        <div className="msessionHeaderInfo">
          <h2>{meeting.title}</h2>
          <span className={isOnline ? "isOnline" : ""}>
            {isOnline && <i className="msessionOnlineDot" />}
            {subtitle}
          </span>
        </div>
        <button aria-label="Ayuda" className="msessionHeaderBtn" onClick={() => setModal("help")} title="¿Cómo funciona?" type="button">
          <IconHelpCircle size={20} />
        </button>
        <SessionMenu items={menuItems} />
      </header>
    );
  };

  // Aviso fijo bajo la cabecera, como un mensaje anclado.
  let banner = null;
  if (meeting.status === "CANCELADA") {
    banner = (
      <div className="msessionPinned msessionPinned--bad">
        <IconX size={16} />
        <span>
          <strong>Cancelada:</strong> {meeting.cancellationReason || "No se registró un motivo."}
        </span>
      </div>
    );
  } else if (meeting.isClosed) {
    banner = (
      <div className="msessionPinned msessionPinned--ok">
        <IconCircleCheck size={16} />
        <span>{meeting.finalSummary || "Reunión finalizada."}</span>
      </div>
    );
  } else if (pendingPoll) {
    banner = (
      <button className="msessionPinned msessionPinned--action" onClick={() => scrollToPoll(pendingPoll.id)} type="button">
        <IconGavel size={16} />
        <span>
          <strong>Votación pendiente:</strong> {pendingPoll.question}
        </span>
        <em>Votar</em>
      </button>
    );
  } else if (isManager && openPolls.length > 0) {
    banner = (
      <button className="msessionPinned msessionPinned--action" onClick={() => scrollToPoll(openPolls[0].id)} type="button">
        <IconGavel size={16} />
        <span>
          <strong>
            {openPolls.length} votación{openPolls.length === 1 ? "" : "es"} abierta{openPolls.length === 1 ? "" : "s"}
          </strong>{" "}
          · {openPolls[0].question}
        </span>
        <em>Ver</em>
      </button>
    );
  }

  const composerActions =
    isManager && isLive ? (
      <button
        aria-label="Nueva votación"
        className="msessionComposerBtn"
        disabled={!meeting.votingOpen}
        onClick={() => setModal("create")}
        title={meeting.votingOpen ? "Nueva votación" : "Inicia la votación desde el menú ⋮ para abrir preguntas"}
        type="button"
      >
        <IconChartBar size={20} />
      </button>
    ) : null;

  return (
    <section className="msession">
      <MeetingChat
        banner={banner}
        composerActions={composerActions}
        key={meeting.id}
        meeting={meeting}
        renderHeader={renderHeader}
        timelineItems={timelineItems}
        user={user}
      />

      {toast && (
        <div className={`msessionToast msessionToast--${toast.type}`} role="status">
          {toast.text}
        </div>
      )}

      {modal === "help" && <HelpModal isManager={isManager} onClose={() => setModal(null)} />}

      {modal === "start" && (
        <SessionModal
          busy={isStartingVoting}
          footer={
            <>
              <button className="msessionBtn msessionBtn--ghost" disabled={isStartingVoting} onClick={() => setModal(null)} type="button">
                Cancelar
              </button>
              <button
                className="msessionBtn msessionBtn--primary"
                disabled={!canStartVoting || isStartingVoting}
                onClick={handleStartVoting}
                type="button"
              >
                {isStartingVoting ? "Iniciando…" : "Iniciar votación"}
              </button>
            </>
          }
          icon={IconPlayerPlay}
          onClose={() => setModal(null)}
          subtitle="A partir de aquí podrás abrir preguntas y los presentes votarán desde el chat."
          title="Iniciar fase de votación"
        >
          <ul className="msessionChecklist">
            {checklist.map((item) => (
              <li className={item.done ? "isDone" : ""} key={item.label}>
                <span className="msessionCheck">{item.done ? <IconCheck size={14} /> : <IconX size={14} />}</span>
                {item.label}
              </li>
            ))}
          </ul>
          {!canStartVoting && (
            <p className="msessionHintText">Completa los requisitos pendientes para poder iniciar la votación.</p>
          )}
          {startError && <p className="msessionMsg msessionMsg--bad">{startError}</p>}
        </SessionModal>
      )}

      {modal === "create" && (
        <CreatePollModal meeting={meeting} polls={polls} onClose={() => setModal(null)} onCreated={handlePollCreated} />
      )}

      {modal === "close" && (
        <CloseMeetingModal
          meeting={meeting}
          onClose={() => setModal(null)}
          onClosed={handleMeetingClosed}
          onOpenEvidence={handleOpenEvidence}
          polls={polls}
        />
      )}
    </section>
  );
};

export default MeetingSession;
