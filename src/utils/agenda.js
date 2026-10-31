const PREVIOUS_MINUTE_TITLE = "lectura del acta anterior";

/** Punto obligatorio de toda reunión: se aprueba sin votación. */
export const isPreviousMinutePoint = (point) =>
  Boolean(point?.isBasePoint) &&
  (point?.title || "").trim().toLowerCase() === PREVIOUS_MINUTE_TITLE;

/**
 * Puntos aprobados que se someten a votación, en el orden del día. `number` es su posición
 * entre los puntos aprobados (la lectura del acta anterior incluida) y `hasPoll` indica si ya
 * tienen su votación.
 */
export const getVotablePoints = (agendaPoints = [], polls = []) => {
  const votedPointIds = new Set(polls.map((poll) => poll.agendaPointId).filter(Boolean));
  return agendaPoints
    .filter((point) => point.status === "APROBADO")
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    .map((point, index) => ({ ...point, number: index + 1, hasPoll: votedPointIds.has(point.id) }))
    .filter((point) => !isPreviousMinutePoint(point));
};
