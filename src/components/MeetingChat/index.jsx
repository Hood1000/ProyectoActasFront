import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { IconArrowDown, IconLock, IconMessages, IconSend } from "@tabler/icons-react";
import meetingsService from "../../api/services/meetingsService";
import { useSocket } from "../../context/SocketContext";
import useMeetingChatSocket from "../../hooks/useMeetingChatSocket";
import { getAvatarColor, getInitials, ROLE_LABELS } from "../../utils/people";
import "./styles.css";

const TIME_ZONE = "America/Caracas";
const MAX_LENGTH = 2000;
const COUNTER_FROM = 1800;
const GROUP_WINDOW_MS = 5 * 60 * 1000;
const NEAR_BOTTOM_PX = 80;
const CHAT_ROLES = ["ADMIN", "DOCENTE", "SECRETARIO"];

const dayKey = (value) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(new Date(value));

const formatDayLabel = (value) => {
  const key = dayKey(value);
  if (key === dayKey(Date.now())) return "Hoy";
  if (key === dayKey(Date.now() - 24 * 60 * 60 * 1000)) return "Ayer";
  return new Date(value).toLocaleDateString("es-VE", {
    day: "numeric",
    month: "long",
    timeZone: TIME_ZONE,
    weekday: "long",
  });
};

const formatTime = (value) =>
  new Date(value).toLocaleTimeString("es-VE", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TIME_ZONE,
  });

// Une mensajes sin duplicar por id (el emisor recibe su mensaje por el POST y por el socket).
const mergeChatMessages = (current, incoming) => {
  const byId = new Map(current.map((message) => [message.id, message]));
  incoming.forEach((message) => {
    if (message?.id) byId.set(message.id, message);
  });
  return [...byId.values()].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
};

const isSameGroup = (a, b) =>
  Boolean(a && b) &&
  a.author?.id === b.author?.id &&
  dayKey(a.createdAt) === dayKey(b.createdAt) &&
  Math.abs(new Date(b.createdAt) - new Date(a.createdAt)) < GROUP_WINDOW_MS;

const Avatar = ({ author }) => {
  const color = getAvatarColor(author?.id || author?.name || "");
  return (
    <span
      aria-hidden="true"
      className="mchatAvatar"
      style={{ background: color.bg, color: color.fg }}
    >
      {getInitials(author?.name)}
    </span>
  );
};

/**
 * Chat en vivo de una reunión. isActive indica si la pestaña está visible: mientras no lo
 * está, los mensajes ajenos se cuentan como no leídos y se informan con onUnreadChange.
 */
const MeetingChat = ({ meeting, user, isActive = true, onUnreadChange }) => {
  const socket = useSocket();
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isConnected, setIsConnected] = useState(Boolean(socket?.connected));
  const [hasNewBelow, setHasNewBelow] = useState(false);
  const [unread, setUnread] = useState(0);

  const scrollRef = useRef(null);
  const textareaRef = useRef(null);
  const isNearBottomRef = useRef(true);
  const forceScrollRef = useRef(true);
  const isActiveRef = useRef(isActive);
  const messagesRef = useRef([]);

  const meetingId = meeting?.id;
  const isReadOnly =
    Boolean(meeting?.isClosed) || ["CANCELADA", "FINALIZADA"].includes(meeting?.status);
  const canPost = CHAT_ROLES.includes(user?.role || "") && !isReadOnly;

  useEffect(() => {
    isActiveRef.current = isActive;
    if (isActive) {
      setUnread(0);
      forceScrollRef.current = true;
    }
  }, [isActive]);

  useEffect(() => {
    onUnreadChange?.(unread);
  }, [unread, onUnreadChange]);

  useEffect(() => {
    if (!socket) return undefined;
    const update = () => setIsConnected(socket.connected);
    update();
    socket.on("connect", update);
    socket.on("disconnect", update);
    return () => {
      socket.off("connect", update);
      socket.off("disconnect", update);
    };
  }, [socket]);

  useEffect(() => {
    if (!meetingId) return undefined;
    let isCancelled = false;
    setMessages([]);
    setError("");
    setUnread(0);
    setIsLoading(true);
    forceScrollRef.current = true;

    meetingsService
      .listMeetingChatMessages(meetingId)
      .then((list) => {
        if (isCancelled) return;
        setMessages((prev) => mergeChatMessages(prev, Array.isArray(list) ? list : []));
      })
      .catch((err) => {
        if (isCancelled) return;
        setError(err?.response?.data?.message || "No se pudo cargar el chat de esta reunión.");
      })
      .finally(() => {
        if (!isCancelled) setIsLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [meetingId]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const handleIncoming = useCallback(
    (incoming) => {
      const known = new Set(messagesRef.current.map((message) => message.id));
      const fresh = incoming.filter(
        (message) => !known.has(message.id) && message?.author?.id !== user?.id,
      );
      if (fresh.length > 0) {
        if (!isActiveRef.current) {
          setUnread((count) => count + fresh.length);
        } else if (!isNearBottomRef.current) {
          setHasNewBelow(true);
        }
      }
      setMessages((prev) => mergeChatMessages(prev, incoming));
    },
    [user?.id],
  );

  useMeetingChatSocket(
    meetingId,
    handleIncoming,
    () => messagesRef.current[messagesRef.current.length - 1]?.createdAt,
  );

  const scrollToBottom = (behavior = "auto") => {
    const node = scrollRef.current;
    if (!node) return;
    node.scrollTo({ top: node.scrollHeight, behavior });
    setHasNewBelow(false);
  };

  useLayoutEffect(() => {
    if (!isActive) return;
    if (forceScrollRef.current || isNearBottomRef.current) {
      scrollToBottom(forceScrollRef.current ? "auto" : "smooth");
      forceScrollRef.current = false;
    }
  }, [messages, isActive, isLoading]);

  const handleScroll = () => {
    const node = scrollRef.current;
    if (!node) return;
    const distance = node.scrollHeight - node.scrollTop - node.clientHeight;
    isNearBottomRef.current = distance < NEAR_BOTTOM_PX;
    if (isNearBottomRef.current) setHasNewBelow(false);
  };

  const resizeTextarea = () => {
    const node = textareaRef.current;
    if (!node) return;
    node.style.height = "auto";
    node.style.height = `${Math.min(node.scrollHeight, 132)}px`;
  };

  useEffect(resizeTextarea, [draft]);

  const sendMessage = async () => {
    const content = draft.trim();
    if (!meetingId || !canPost || !content || isSending) return;

    setIsSending(true);
    setError("");
    try {
      const created = await meetingsService.postMeetingChatMessage(meetingId, { content });
      forceScrollRef.current = true;
      setMessages((prev) => mergeChatMessages(prev, [created]));
      setDraft("");
    } catch (err) {
      setError(err?.response?.data?.message || "No se pudo enviar el mensaje.");
    } finally {
      setIsSending(false);
      textareaRef.current?.focus();
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    sendMessage();
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      sendMessage();
    }
  };

  const items = useMemo(
    () =>
      messages.map((message, index) => {
        const prev = messages[index - 1];
        const next = messages[index + 1];
        return {
          isGroupEnd: !isSameGroup(message, next),
          isGroupStart: !isSameGroup(prev, message),
          isNewDay: !prev || dayKey(prev.createdAt) !== dayKey(message.createdAt),
          message,
        };
      }),
    [messages],
  );

  const participants = useMemo(
    () => new Set(messages.map((message) => message.author?.id).filter(Boolean)).size,
    [messages],
  );

  return (
    <div className="mchat">
      <div className="mchatHeader">
        <div className="mchatHeaderInfo">
          <span className="mchatHeaderTitle">Conversación de la reunión</span>
          <span className="mchatHeaderMeta">
            {messages.length} {messages.length === 1 ? "mensaje" : "mensajes"} · {participants}{" "}
            {participants === 1 ? "participante" : "participantes"}
          </span>
        </div>
        <span className={`mchatStatus ${isConnected ? "mchatStatus--live" : ""}`}>
          <span className="mchatStatusDot" />
          {isConnected ? "En vivo" : "Reconectando…"}
        </span>
      </div>

      <div className="mchatScroll" onScroll={handleScroll} ref={scrollRef}>
        {isLoading ? (
          <div aria-label="Cargando conversación" className="mchatSkeleton">
            <span className="mchatSkeletonBubble" />
            <span className="mchatSkeletonBubble mchatSkeletonBubble--own" />
            <span className="mchatSkeletonBubble mchatSkeletonBubble--short" />
          </div>
        ) : messages.length === 0 ? (
          <div className="mchatEmpty">
            <span className="mchatEmptyIcon">
              <IconMessages size={28} />
            </span>
            <strong>Aún no hay mensajes</strong>
            <p>
              {canPost
                ? "Inicia la conversación: comparte dudas, avisos o comentarios sobre la reunión."
                : "Cuando los participantes escriban, los mensajes aparecerán aquí."}
            </p>
          </div>
        ) : (
          <ol className="mchatList">
            {items.map(({ isGroupEnd, isGroupStart, isNewDay, message }) => {
              const isOwn = message?.author?.id === user?.id;
              return (
                <React.Fragment key={message.id}>
                  {isNewDay && (
                    <li className="mchatDay">
                      <span>{formatDayLabel(message.createdAt)}</span>
                    </li>
                  )}
                  <li
                    className={[
                      "mchatRow",
                      isOwn ? "mchatRow--own" : "",
                      isGroupStart ? "mchatRow--groupStart" : "",
                    ].join(" ")}
                  >
                    {!isOwn && (
                      <div className="mchatAvatarSlot">
                        {isGroupStart && <Avatar author={message.author} />}
                      </div>
                    )}
                    <div className="mchatBubbleWrap">
                      {!isOwn && isGroupStart && (
                        <div className="mchatAuthor">
                          <strong>{message?.author?.name || "Usuario"}</strong>
                          {message?.author?.role && (
                            <span className={`mchatRole mchatRole--${message.author.role.toLowerCase()}`}>
                              {ROLE_LABELS[message.author.role] || message.author.role}
                            </span>
                          )}
                        </div>
                      )}
                      <div
                        className={[
                          "mchatBubble",
                          isGroupStart ? "mchatBubble--first" : "",
                          isGroupEnd ? "mchatBubble--last" : "",
                        ].join(" ")}
                      >
                        <p>{message?.content || ""}</p>
                        <time dateTime={message.createdAt}>{formatTime(message.createdAt)}</time>
                      </div>
                    </div>
                  </li>
                </React.Fragment>
              );
            })}
          </ol>
        )}
      </div>

      {hasNewBelow && (
        <button className="mchatNewPill" onClick={() => scrollToBottom("smooth")} type="button">
          Nuevos mensajes <IconArrowDown size={14} />
        </button>
      )}

      {error && <p className="mchatError">{error}</p>}

      {canPost ? (
        <form className="mchatComposer" onSubmit={handleSubmit}>
          <div className="mchatInputWrap">
            <textarea
              aria-label="Escribe un mensaje"
              maxLength={MAX_LENGTH}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe un mensaje…"
              ref={textareaRef}
              rows={1}
              value={draft}
            />
            {draft.length >= COUNTER_FROM && (
              <span className={`mchatCounter ${draft.length >= MAX_LENGTH ? "mchatCounter--max" : ""}`}>
                {draft.length}/{MAX_LENGTH}
              </span>
            )}
          </div>
          <button
            aria-label="Enviar mensaje"
            className="mchatSend"
            disabled={isSending || !draft.trim()}
            type="submit"
          >
            <IconSend size={18} />
          </button>
        </form>
      ) : (
        <div className="mchatReadOnly">
          <IconLock size={16} />
          {isReadOnly
            ? "Esta reunión ya terminó: el chat queda como registro de solo lectura."
            : "Tu rol no puede escribir en este chat."}
        </div>
      )}
      {canPost && <p className="mchatHint">Enter para enviar · Shift + Enter para nueva línea</p>}
    </div>
  );
};

export default MeetingChat;
