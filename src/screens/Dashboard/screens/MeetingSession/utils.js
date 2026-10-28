export const MANAGER_ROLES = ["ADMIN", "SECRETARIO"];

export const isMeetingClosed = (meeting) =>
  Boolean(meeting?.isClosed) || ["CANCELADA", "FINALIZADA"].includes(meeting?.status);

/**
 * Quién puede entrar al chat de la reunión (mismo criterio que el backend):
 * - Secretaría y Coordinación siempre; con la reunión cerrada, solo en lectura.
 * - Un docente solo con la reunión abierta y su asistencia confirmada como presente.
 * Si no puede entrar, reason indica el caso para mostrar la pantalla de acceso.
 */
export const getChatAccess = (meeting, user, now = Date.now()) => {
  if (MANAGER_ROLES.includes(user?.role || "")) {
    return { allowed: true, reason: null };
  }
  if (isMeetingClosed(meeting)) {
    return { allowed: false, reason: meeting.status === "CANCELADA" ? "cancelled" : "closed" };
  }

  const entry = (meeting?.attendance || []).find((item) => item.userId === user?.id);
  if (!entry) return { allowed: false, reason: "notInvited" };
  if (entry.status === "PRESENTE") return { allowed: true, reason: null };
  if (entry.status === "AUSENTE" || entry.status === "JUSTIFICADA") {
    return { allowed: false, reason: "absent", attendanceStatus: entry.status };
  }

  const opensAt = meeting.attendanceOpensAt ? new Date(meeting.attendanceOpensAt).getTime() : null;
  const closesAt = meeting.attendanceClosesAt ? new Date(meeting.attendanceClosesAt).getTime() : null;
  if (opensAt && now < opensAt) return { allowed: false, reason: "notYet", opensAt };
  if (!meeting.attendanceFinalized && (!closesAt || now <= closesAt)) {
    return { allowed: false, reason: "canConfirm" };
  }
  return { allowed: false, reason: "windowClosed" };
};
