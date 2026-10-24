import { useEffect, useRef } from "react";
import { useSocket } from "../context/SocketContext";
import meetingsService from "../api/services/meetingsService";
import { joinMeetingRoom, releaseMeetingRoom, retainMeetingRoom } from "./meetingRoom";

/**
 * Se une a la sala del chat de una reunión y entrega los mensajes nuevos a onMessages(lista).
 * Los callbacks se guardan en refs para que el efecto dependa solo de socket y meetingId
 * (si no, cada render volvería a unirse a la sala).
 */
const useMeetingChatSocket = (meetingId, onMessages, getLastCreatedAt) => {
  const socket = useSocket();
  const onMessagesRef = useRef(onMessages);
  const getLastCreatedAtRef = useRef(getLastCreatedAt);

  useEffect(() => {
    onMessagesRef.current = onMessages;
    getLastCreatedAtRef.current = getLastCreatedAt;
  });

  useEffect(() => {
    if (!socket || !meetingId) return undefined;

    let hasJoined = false;

    const join = () => {
      const isRejoin = hasJoined;
      joinMeetingRoom(socket, meetingId, (ack) => {
        if (!ack?.ok) return;
        hasJoined = true;

        // Al reconectar sin recuperación de estado, rellenar los mensajes perdidos.
        const after = getLastCreatedAtRef.current?.();
        if (isRejoin && !socket.recovered && after) {
          meetingsService
            .listMeetingChatMessages(meetingId, { after })
            .then((missed) => {
              if (Array.isArray(missed) && missed.length > 0) {
                onMessagesRef.current?.(missed);
              }
            })
            .catch(() => {});
        }
      });
    };

    const handleNewMessage = (message) => {
      if (message?.meetingId !== meetingId) return;
      onMessagesRef.current?.([message]);
    };

    retainMeetingRoom(socket, meetingId);
    socket.on("chat:new", handleNewMessage);
    socket.on("connect", join);
    if (socket.connected) join();

    return () => {
      socket.off("chat:new", handleNewMessage);
      socket.off("connect", join);
      releaseMeetingRoom(socket, meetingId);
    };
  }, [socket, meetingId]);
};

export default useMeetingChatSocket;
