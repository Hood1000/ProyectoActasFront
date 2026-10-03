import React from "react";
import { Link } from "react-router-dom";
import { IconCheck, IconX } from "@tabler/icons-react";
import { useNotifications } from "../../context/NotificationsContext";
import "./styles.css";

const NotificationsCenter = () => {
  const {
    isPanelOpen,
    markAllAsRead,
    markAsRead,
    notifications,
    removeNotification,
    setIsPanelOpen,
    unreadCount,
    visibleToasts,
  } = useNotifications();

  return (
    <>
      {isPanelOpen && <div className="notifyBackdrop" onClick={() => setIsPanelOpen(false)} />}

      <aside className={`notifyPanel ${isPanelOpen ? "open" : ""}`} role="dialog" aria-modal="true">
        <div className="notifyPanelHeader">
          <div>
            <h3>Notificaciones</h3>
            <p>
              {unreadCount > 0
                ? `${unreadCount} notificación${unreadCount === 1 ? "" : "es"} pendiente${unreadCount === 1 ? "" : "s"}.`
                : "Alertas internas de reuniones y acciones del sistema."}
            </p>
          </div>
          <button
            aria-label="Cerrar notificaciones"
            className="notifyIconBtn"
            onClick={() => setIsPanelOpen(false)}
            type="button"
          >
            <IconX size={18} />
          </button>
        </div>

        <div className="notifyPanelActions">
          <button className="notifyTextBtn" onClick={markAllAsRead} type="button">
            Marcar todo como leído
          </button>
        </div>

        <div className="notifyList">
          {notifications.length === 0 ? (
            <div className="notifyEmpty">No hay notificaciones por ahora.</div>
          ) : (
            notifications.map((item) => (
              <article
                className={`notifyItem notifyItem--${item.type} ${item.read ? "isRead" : ""}`}
                key={item.id}
              >
                <div className="notifyItemHead">
                  <strong>{item.title}</strong>
                  <button
                    aria-label="Eliminar notificación"
                    className="notifyIconBtn"
                    onClick={() => removeNotification(item.id)}
                    type="button"
                  >
                    <IconX size={16} />
                  </button>
                </div>
                <p>{item.message}</p>
                <div className="notifyItemActions">
                  {item.actionHref && (
                    <Link
                      className="notifyLinkBtn"
                      onClick={() => {
                        markAsRead(item.id);
                        setIsPanelOpen(false);
                      }}
                      to={item.actionHref}
                    >
                      {item.actionLabel || "Abrir"}
                    </Link>
                  )}
                  {!item.read && (
                    <button className="notifyTextBtn" onClick={() => markAsRead(item.id)} type="button">
                      <IconCheck size={14} />
                      Leído
                    </button>
                  )}
                </div>
              </article>
            ))
          )}
        </div>
      </aside>

      <div className="notifyToastStack">
        {visibleToasts.map((item) => (
          <article className={`notifyToast notifyToast--${item.type}`} key={item.id}>
            <div>
              <strong>{item.title}</strong>
              <p>{item.message}</p>
            </div>
            <button
              aria-label="Cerrar aviso"
              className="notifyIconBtn"
              onClick={() => removeNotification(item.id)}
              type="button"
            >
              <IconX size={16} />
            </button>
          </article>
        ))}
      </div>
    </>
  );
};

export default NotificationsCenter;