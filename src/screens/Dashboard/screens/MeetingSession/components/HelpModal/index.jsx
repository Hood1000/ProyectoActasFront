import React from "react";
import {
  IconBulb,
  IconChartBar,
  IconChecklist,
  IconFlag,
  IconHandFinger,
  IconHelpCircle,
  IconLock,
  IconMessages,
  IconPlayerPlay,
  IconUserCheck,
} from "@tabler/icons-react";
import SessionModal from "../SessionModal";

const MANAGER_STEPS = [
  { icon: IconMessages, title: "Modera la conversación", text: "El chat es el espacio de la reunión: todos los convocados pueden escribir." },
  { icon: IconPlayerPlay, title: "Inicia la votación", text: "Con la asistencia cerrada y quórum, abre la fase desde el menú ⋮." },
  { icon: IconChartBar, title: "Vota cada punto", text: "Usa el botón de votación junto al campo de texto y elige el punto del orden del día. Cada punto se vota una vez." },
  { icon: IconChecklist, title: "Cierra cada votación", text: "Desde la tarjeta de la pregunta, cuando termine la discusión." },
  { icon: IconFlag, title: "Finaliza la reunión", text: "Carga el acta firmada desde el menú ⋮. El chat quedará como registro." },
];

const PARTICIPANT_STEPS = [
  { icon: IconMessages, title: "Participa en el chat", text: "Escribe tus comentarios y dudas durante la reunión." },
  { icon: IconUserCheck, title: "Confirma tu asistencia", text: "Solo quienes están presentes pueden votar." },
  { icon: IconHandFinger, title: "Vota desde el chat", text: "Las votaciones aparecen como tarjetas: elige A favor o En contra." },
  { icon: IconLock, title: "Al finalizar", text: "Cuando Secretaría cierre la reunión, el chat queda en solo lectura." },
];

/** Guía de la sesión, con pasos distintos para Secretaría y para participantes. */
const HelpModal = ({ isManager, onClose }) => {
  const steps = isManager ? MANAGER_STEPS : PARTICIPANT_STEPS;

  return (
    <SessionModal
      icon={IconHelpCircle}
      onClose={onClose}
      subtitle={isManager ? "Guía para Secretaría y Coordinación" : "Guía para participantes"}
      title="¿Cómo funciona la sesión?"
    >
      <ol className="msessionGuide">
        {steps.map(({ icon: StepIcon, text, title }, index) => (
          <li key={title}>
            <span className="msessionGuideIcon">
              <StepIcon size={18} />
              <em>{index + 1}</em>
            </span>
            <div>
              <strong>{title}</strong>
              <p>{text}</p>
            </div>
          </li>
        ))}
      </ol>
      <div className="msessionTip">
        <IconBulb size={16} />
        <span>
          {isManager
            ? "Si alguien tiene una votación pendiente, verá un aviso fijo arriba del chat para ir a votar."
            : "Si tienes una votación pendiente, verás un aviso arriba del chat: tócalo para ir directo a votar."}
        </span>
      </div>
    </SessionModal>
  );
};

export default HelpModal;
