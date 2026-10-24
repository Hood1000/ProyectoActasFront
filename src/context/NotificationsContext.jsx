import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import meetingsService from "../api/services/meetingsService";
import { useAuth } from "./AuthContext";

const NotificationsContext = createContext(null);

const STORAGE_KEY_PREFIX = "app_notifications_seen_keys";
const INTERNAL_ROLES = ["ADMIN", "DOCENTE", "SECRETARIO"];

const getStorageKey = (userId) => `${STORAGE_KEY_PREFIX}:${userId || "anonymous"}`;

const loadSeenKeys = (userId) => {
  try {
    const raw = JSON.parse(localStorage.getItem(getStorageKey(userId)) || "[]");
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
};

const persistSeenKey = (userId, key) => {
  if (!key) return;
  const current = loadSeenKeys(userId);
  if (current.includes(key)) return;
  localStorage.setItem(getStorageKey(userId), JSON.stringify([...current, key].slice(-200)));
};

const isAttendanceWindowOpen = (meeting) => {
  if (!meeting) return false;
  if (["CANCELADA", "FINALIZADA"].includes(meeting.status)) return false;
  const now = Date.now();
  const opensAt = new Date(
    meeting.attendanceOpensAt || new Date(meeting.date).getTime() - 15 * 60 * 1000,
  ).getTime();
  const closesAt = new Date(meeting.attendanceClosesAt || meeting.date).getTime();
  return now >= opensAt && now <= closesAt;
};

const isUpcomingMeeting = (meeting) => {
  if (!meeting) return false;
  if (["CANCELADA", "FINALIZADA"].includes(meeting.status)) return false;
  const meetingTime = new Date(meeting.date).getTime();
  return Number.isFinite(meetingTime) && meetingTime > Date.now();
};

export const NotificationsProvider = ({ children }) => {
  const { token, user } = useAuth();
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [localNotifications, setLocalNotifications] = useState([]);
  const [serverNotifications, setServerNotifications] = useState([]);
  const [visibleToastIds, setVisibleToastIds] = useState([]);
  const timersRef = useRef(new Map());
  const surfacedServerNotificationsRef = useRef(new Set());

  const notifications = useMemo(
    () => [...serverNotifications, ...localNotifications]
      .sort((left, right) => new Date(right.createdAt || 0) - new Date(left.createdAt || 0)),
    [localNotifications, serverNotifications],
  );

  const hideToast = (id) => {
    setVisibleToastIds((current) => current.filter((item) => item !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      window.clearTimeout(timer);
      timersRef.current.delete(id);
    }
  };

  const addNotification = ({ actionHref, actionLabel, key, message, title, type = "info" }) => {
    if (key && loadSeenKeys(user?.id).includes(key)) {
      return null;
    }

    const id = `local-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const nextNotification = {
      actionHref: actionHref || null,
      actionLabel: actionLabel || null,
      createdAt: new Date().toISOString(),
      id,
      key: key || null,
      message,
      read: false,
      source: "local",
      title,
      type,
    };

    if (key) {
      persistSeenKey(user?.id, key);
    }

    setLocalNotifications((current) => [nextNotification, ...current].slice(0, 40));
    setVisibleToastIds((current) => [id, ...current].slice(0, 3));

    const timer = window.setTimeout(() => hideToast(id), 6500);
    timersRef.current.set(id, timer);
    return id;
  };

  const syncServerNotifications = async (currentUser) => {
    if (!["ADMIN", "DOCENTE", "SECRETARIO"].includes(currentUser?.role || "")) {
      setServerNotifications([]);
      return;
    }

    const data = await meetingsService.listNotifications();
    const normalized = (Array.isArray(data) ? data : []).map((item) => ({
      ...item,
      actionLabel: item.actionLabel || "Abrir",
      source: "server",
    }));

    normalized.forEach((item) => {
      if (!item.read && !surfacedServerNotificationsRef.current.has(item.id)) {
        surfacedServerNotificationsRef.current.add(item.id);
        setVisibleToastIds((current) => [item.id, ...current.filter((entry) => entry !== item.id)].slice(0, 3));
        const timer = window.setTimeout(() => hideToast(item.id), 6500);
        timersRef.current.set(item.id, timer);
      }
    });

    setServerNotifications(normalized);
  };

  const markAsRead = async (id) => {
    const target = notifications.find((item) => item.id === id);
    if (!target) return;

    if (target.source === "server") {
      await meetingsService.markNotificationAsRead(id);
      setServerNotifications((current) =>
        current.map((item) => (item.id === id ? { ...item, read: true, readAt: new Date().toISOString() } : item)),
      );
      return;
    }

    setLocalNotifications((current) =>
      current.map((item) => (item.id === id ? { ...item, read: true } : item)),
    );
  };

  const markAllAsRead = async () => {
    await meetingsService.markAllNotificationsAsRead();
    setServerNotifications((current) =>
      current.map((item) => ({ ...item, read: true, readAt: item.readAt || new Date().toISOString() })),
    );
    setLocalNotifications((current) => current.map((item) => ({ ...item, read: true })));
  };

  const removeNotification = async (id) => {
    hideToast(id);
    const target = notifications.find((item) => item.id === id);
    if (!target) return;

    if (target.source === "server") {
      await meetingsService.dismissNotification(id);
      setServerNotifications((current) => current.filter((item) => item.id !== id));
      return;
    }

    setLocalNotifications((current) => current.filter((item) => item.id !== id));
  };

  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => window.clearTimeout(timer));
      timersRef.current.clear();
    };
  }, []);

  useEffect(() => {
    if (!token || !user || !INTERNAL_ROLES.includes(user.role || "")) return undefined;

    let isCancelled = false;

    const checkMeetingNotifications = async () => {
      try {
        const meetings = await meetingsService.list();
        if (isCancelled || !Array.isArray(meetings)) return;

        meetings
          .filter((meeting) => isUpcomingMeeting(meeting))
          .forEach((meeting) => {
            addNotification({
              actionHref: `/dashboard/reuniones?meeting=${meeting.id}`,
              actionLabel: "Ver detalle",
              key: `meeting-scheduled:${meeting.id}:${meeting.date}`,
              message: `Se agendó la reunión "${meeting.title}" para ${new Date(meeting.date).toLocaleString("es-VE", { dateStyle: "medium", timeStyle: "short" })}. Revisa los detalles y mantente atento a la asistencia.`,
              title: "Nueva reunión agendada",
              type: "info",
            });
          });

        meetings
          .filter((meeting) => isAttendanceWindowOpen(meeting))
          .forEach((meeting) => {
            addNotification({
              actionHref: `/dashboard/reuniones?meeting=${meeting.id}`,
              actionLabel: "Confirmar asistencia",
              key: `attendance-window:${meeting.id}:${meeting.attendanceClosesAt}`,
              message: `La reunión "${meeting.title}" está dentro de la ventana de asistencia. Puedes confirmarla desde el detalle.`,
              title: "Asistencia abierta",
              type: "warning",
            });
          });

        await syncServerNotifications(user);
      } catch {
        // Silent fail to avoid interrupting session bootstrap.
      }
    };

    checkMeetingNotifications();
    const interval = window.setInterval(checkMeetingNotifications, 60000);

    return () => {
      isCancelled = true;
      window.clearInterval(interval);
    };
  }, [token, user]);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.read).length,
    [notifications],
  );

  const visibleToasts = useMemo(
    () => visibleToastIds
      .map((id) => notifications.find((item) => item.id === id))
      .filter(Boolean),
    [notifications, visibleToastIds],
  );

  return (
    <NotificationsContext.Provider
      value={{
        addNotification,
        isPanelOpen,
        markAllAsRead,
        markAsRead,
        notifications,
        removeNotification,
        setIsPanelOpen,
        unreadCount,
        visibleToasts,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationsContext);

export default NotificationsContext;