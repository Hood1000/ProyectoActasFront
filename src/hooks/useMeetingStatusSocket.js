import { useEffect, useRef } from "react";
import { useSocket } from "../context/SocketContext";
import { joinMeetingRoom, releaseMeetingRoom, retainMeetingRoom } from "./meetingRoom";

/**
 * Escucha los cambios de estado de una reunión (inicio de votación, cierre, cancelación).
 * onStatus(payload) recibe { meetingId, status, isClosed, votingOpen }. onReconnect() se
 * llama al volver a unirse sin recuperación de estado, para recargar la reunión.
 */
const useMeetingStatusSocket = (meetingId, onStatus, onReconnect) => {
  const socket = useSocket();
  const onStatusRef = useRef(onStatus);
  const onReconnectRef = useRef(onReconnect);

  useEffect(() => {
    onStatusRef.current = onStatus;
    onReconnectRef.current = onReconnect;
  });

  useEffect(() => {
    if (!socket || !meetingId) return undefined;

    let hasJoined = false;

    const join = () => {
      const isRejoin = hasJoined;
      joinMeetingRoom(socket, meetingId, (ack) => {
        if (!ack?.ok) return;
        hasJoined = true;
        if (isRejoin && !socket.recovered) onReconnectRef.current?.();
      });
    };

    const handleStatus = (payload) => {
      if (payload?.meetingId !== meetingId) return;
      onStatusRef.current?.(payload);
    };

    retainMeetingRoom(socket, meetingId);
    socket.on("meeting:status", handleStatus);
    socket.on("connect", join);
    if (socket.connected) join();

    return () => {
      socket.off("meeting:status", handleStatus);
      socket.off("connect", join);
      releaseMeetingRoom(socket, meetingId);
    };
  }, [socket, meetingId]);
};

export default useMeetingStatusSocket;
