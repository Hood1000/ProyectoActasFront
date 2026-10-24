/**
 * Varios hooks (chat, votaciones) pueden estar en la misma sala a la vez. Se lleva un
 * contador por socket y reunión para emitir "meeting:leave" solo cuando sale el último;
 * si no, cerrar una pestaña sacaría de la sala a la otra.
 */
const roomCounts = new WeakMap();

const countsFor = (socket) => {
  if (!roomCounts.has(socket)) roomCounts.set(socket, new Map());
  return roomCounts.get(socket);
};

export const retainMeetingRoom = (socket, meetingId) => {
  const counts = countsFor(socket);
  counts.set(meetingId, (counts.get(meetingId) || 0) + 1);
};

export const releaseMeetingRoom = (socket, meetingId) => {
  const counts = countsFor(socket);
  const next = (counts.get(meetingId) || 1) - 1;
  if (next > 0) {
    counts.set(meetingId, next);
    return;
  }
  counts.delete(meetingId);
  if (socket.connected) {
    socket.emit("meeting:leave", { meetingId });
  }
};

// Unirse es idempotente en el servidor, así que cada hook puede pedirlo por su cuenta.
export const joinMeetingRoom = (socket, meetingId, onAck) => {
  socket.emit("meeting:join", { meetingId }, (ack) => onAck?.(ack));
};
