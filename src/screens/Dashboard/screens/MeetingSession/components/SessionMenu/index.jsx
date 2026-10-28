import React, { useEffect, useRef, useState } from "react";
import { IconDotsVertical } from "@tabler/icons-react";

/** Menú de opciones (⋮) de la cabecera. items: [{ icon, label, onClick, tone, disabled, hint }]. */
const SessionMenu = ({ items }) => {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handlePointer = (event) => {
      if (!rootRef.current?.contains(event.target)) setIsOpen(false);
    };
    const handleKey = (event) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("pointerdown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("pointerdown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [isOpen]);

  if (items.length === 0) return null;

  return (
    <div className="msessionMenu" ref={rootRef}>
      <button
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label="Opciones de la reunión"
        className={`msessionHeaderBtn ${isOpen ? "isActive" : ""}`}
        onClick={() => setIsOpen((value) => !value)}
        type="button"
      >
        <IconDotsVertical size={20} />
      </button>
      {isOpen && (
        <div className="msessionMenuList" role="menu">
          {items.map(({ disabled, hint, icon: ItemIcon, label, onClick, tone }) => (
            <button
              className={`msessionMenuItem ${tone ? `msessionMenuItem--${tone}` : ""}`}
              disabled={disabled}
              key={label}
              onClick={() => {
                setIsOpen(false);
                onClick();
              }}
              role="menuitem"
              type="button"
            >
              <ItemIcon size={18} />
              <span>
                {label}
                {hint && <small>{hint}</small>}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SessionMenu;
