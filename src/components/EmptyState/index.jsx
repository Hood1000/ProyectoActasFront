import React from "react";
import "./styles.css";

const EmptyState = ({
  action,
  description,
  fill = false,
  icon,
  title,
  tone = "default",
}) => {
  return (
    <div
      className={`emptyState emptyState--${tone}${fill ? " emptyState--fill" : ""}`}
    >
      {icon && <div className="emptyStateIcon">{icon}</div>}
      {title && <p className="emptyStateTitle">{title}</p>}
      {description && <p className="emptyStateDescription">{description}</p>}
      {action && (
        <button
          className="emptyStateAction"
          onClick={action.onClick}
          type="button"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
