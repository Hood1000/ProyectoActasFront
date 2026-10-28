import React, { useEffect, useId } from "react";
import { IconX } from "@tabler/icons-react";

/** Ventana modal de la sesión. Escape o clic afuera la cierran, salvo mientras busy. */
const SessionModal = ({ busy = false, children, footer, icon: Icon, onClose, subtitle, title, wide = false }) => {
  const titleId = useId();

  useEffect(() => {
    const handleKey = (event) => {
      if (event.key === "Escape" && !busy) onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [busy, onClose]);

  return (
    <>
      <div className="msessionBackdrop" onClick={() => !busy && onClose()} />
      <div
        aria-labelledby={titleId}
        aria-modal="true"
        className={`msessionModal ${wide ? "msessionModal--wide" : ""}`}
        role="dialog"
      >
        <header className="msessionModalHeader">
          {Icon && (
            <span className="msessionModalIcon">
              <Icon size={20} />
            </span>
          )}
          <div className="msessionModalHeading">
            <h3 id={titleId}>{title}</h3>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button aria-label="Cerrar" className="msessionModalClose" disabled={busy} onClick={onClose} type="button">
            <IconX size={18} />
          </button>
        </header>
        <div className="msessionModalBody">{children}</div>
        {footer && <footer className="msessionModalActions">{footer}</footer>}
      </div>
    </>
  );
};

export default SessionModal;
