import { useEffect, useRef } from "react";
import { useSocket } from "../context/SocketContext";
import { joinMeetingRoom, releaseMeetingRoom, retainMeetingRoom } from "./meetingRoom";

/**
 * Escucha las votaciones de una reunión en vivo: onPoll(poll) recibe cada votación creada,
 * votada o cerrada. onReconnect() se llama al volver a unirse sin recuperación de estado,
 * para recargar la lista completa.
 */
const useMeetingPollsSocket = (meetingId, onPoll, onReconnect) => {
  const socket = useSocket();
  const onPollRef = useRef(onPoll);
  const onReconnectRef = useRef(onReconnect);

  useEffect(() => {
    onPollRef.current = onPoll;
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

    const handlePollUpdate = (poll) => {
      if (poll?.meetingId !== meetingId) return;
      onPollRef.current?.(poll);
    };

    retainMeetingRoom(socket, meetingId);
    socket.on("poll:update", handlePollUpdate);
    socket.on("connect", join);
    if (socket.connected) join();

    return () => {
      socket.off("poll:update", handlePollUpdate);
      socket.off("connect", join);
      releaseMeetingRoom(socket, meetingId);
    };
  }, [socket, meetingId]);
};

export default useMeetingPollsSocket;
