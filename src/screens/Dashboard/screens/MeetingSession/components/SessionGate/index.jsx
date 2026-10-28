import React, { useEffect, useState } from "react";
import {
  IconArrowLeft,
  IconCalendarOff,
  IconClockHour4,
  IconFileText,
  IconLock,
  IconUserCheck,
  IconUserOff,
  IconUsersGroup,
} from "@tabler/icons-react";
import meetingsService from "../../../../../../api/services/meetingsService";

const formatTime = (value) =>
  new Date(value).toLocaleString("es-VE", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Caracas",
  });

const CONTENT = {
  closed: {
    icon: IconLock,
    title: "Esta reunión ya fue finalizada",
    text: "El chat queda archivado y solo Secretaría y Coordinación pueden consultarlo.",
  },
  cancelled: {
    icon: IconCalendarOff,
    title: "Esta reunión fue cancelada",
    text: "El chat no está disponible. Solo Secretaría y Coordinación pueden consultarlo.",
  },
  notInvited: {
    icon: IconUserOff,
    title: "No estás convocado a esta reunión",
    text: "Solo los participantes convocados que confirmen su asistencia pueden entrar al chat.",
  },
  absent: {
    icon: IconUserOff,
    title: "Tu asistencia no quedó registrada como presente",
    text: "Solo quienes están presentes pueden entrar al chat y votar. Si es un error, comunícate con Secretaría.",
  },
  windowClosed: {
    icon: IconClockHour4,
    title: "La confirmación de asistencia ya cerró",
    text: "No confirmaste tu asistencia a tiempo, por eso no puedes entrar al chat. Si llegaste tarde, Secretaría puede registrarte.",
  },
  notYet: {
    icon: IconClockHour4,
    title: "La sala aún no abre",
    text: "Podrás confirmar tu asistencia y entrar al chat 15 minutos antes del inicio.",
  },
  canConfirm: {
    icon: IconUserCheck,
    title: "Confirma tu asistencia para entrar",
    text: "Al confirmar quedarás registrado como presente y podrás participar en el chat y en las votaciones.",
  },
};

/** Pantalla previa al chat para quien todavía no puede (o ya no puede) entrar. */
const SessionGate = ({ access, meeting, onBack, onConfirmed, onOpenEvidence, onTick }) => {
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState("");
  const { icon: Icon, text, title } = CONTENT[access.reason] || CONTENT.notInvited;

  // Mientras espera que abra la sala, revisa el reloj para habilitar la confirmación sola.
  useEffect(() => {
    if (access.reason !== "notYet") return undefined;
    const timer = window.setInterval(onTick, 15 * 1000);
    return () => window.clearInterval(timer);
  }, [access.reason, onTick]);

  const handleConfirm = async () => {
    setIsConfirming(true);
    setError("");
    try {
      onConfirmed(await meetingsService.confirmAttendance(meeting.id));
    } catch (err) {
      setError(err?.response?.data?.message || "No se pudo confirmar tu asistencia.");
      setIsConfirming(false);
    }
  };

  const showEvidence = ["closed"].includes(access.reason) && meeting.evidenceSignaturesUrl;

  return (
    <>
      <header className="msessionHeader">
        <button aria-label="Volver" className="msessionHeaderBtn" onClick={onBack} type="button">
          <IconArrowLeft size={20} />
        </button>
        <span aria-hidden="true" className="msessionAvatar">
          <IconUsersGroup size={20} />
        </span>
        <div className="msessionHeaderInfo">
          <h2>{meeting.title}</h2>
          <span>{formatTime(meeting.date)}</span>
        </div>
      </header>

      <div className="msessionGate">
        <div className={`msessionGateCard msessionGateCard--${access.reason}`}>
          <span className="msessionGateIcon">
            <Icon size={30} />
          </span>
          <h3>{title}</h3>
          <p>{text}</p>
          {access.reason === "notYet" && access.opensAt && (
            <p className="msessionGateWhen">
              La sala abre el <strong>{formatTime(access.opensAt)}</strong>
            </p>
          )}

          <div className="msessionGateActions">
            {access.reason === "canConfirm" && (
              <button className="msessionBtn msessionBtn--primary msessionBtn--lg" disabled={isConfirming} onClick={handleConfirm} type="button">
                <IconUserCheck size={18} /> {isConfirming ? "Confirmando…" : "Confirmar asistencia y entrar"}
              </button>
            )}
            {showEvidence && (
              <button className="msessionBtn msessionBtn--ghost msessionBtn--lg" onClick={onOpenEvidence} type="button">
                <IconFileText size={18} /> Ver acta firmada
              </button>
            )}
            <button className="msessionBtn msessionBtn--ghost msessionBtn--lg" onClick={onBack} type="button">
              Volver
            </button>
          </div>
          {error && <p className="msessionMsg msessionMsg--bad">{error}</p>}
        </div>
      </div>
    </>
  );
};

export default SessionGate;
