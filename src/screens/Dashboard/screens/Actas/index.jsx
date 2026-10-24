import React, { useCallback, useEffect, useMemo, useState } from "react";
import { IconGavel, IconInfoCircle, IconMessages, IconSearchOff, IconX } from "@tabler/icons-react";
import { useSearchParams } from "react-router-dom";
import meetingsService from "../../../../api/services/meetingsService";
import EmptyState from "../../../../components/EmptyState";
import MeetingsFilters from "../../../../components/MeetingsFilters";
import { EMPTY_MEETING_FILTERS } from "../../../../components/MeetingsFilters/constants";
import { filterMeetings, hasActiveFilters } from "../../../../components/MeetingsFilters/utils";
import Pagination from "../../../../components/Pagination";
import { DEFAULT_PAGE_SIZE } from "../../../../components/Pagination/constants";
import { clampPage, paginate } from "../../../../components/Pagination/utils";
import { useAuth } from "../../../../context/AuthContext";
import { useNotifications } from "../../../../context/NotificationsContext";
import MeetingChat from "../../../../components/MeetingChat";
import MeetingPolls from "../../../../components/MeetingPolls";
import "./styles.css";

const STATUS_TABS = [
  { label: "En proceso", value: "PROGRAMADA" },
  { label: "Activa", value: "EN_CURSO" },
  { label: "Cancelada", value: "CANCELADA" },
  { label: "Finalizada", value: "FINALIZADA" },
];

const STATUS_LABELS = {
  PROGRAMADA: "En proceso",
  EN_CURSO: "Activa",
  CANCELADA: "Cancelada",
  FINALIZADA: "Finalizada",
};

const EMPTY_POINT_FORM = { description: "", title: "" };

const formatDate = (value) => {
  if (!value) return "Sin fecha";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Sin fecha";
  return parsed.toLocaleString("es-VE", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Caracas",
  });
};

const DETAIL_TABS = [
  { icon: IconInfoCircle, label: "Detalle", value: "detalle" },
  { icon: IconMessages, label: "Chat", value: "chat" },
  { icon: IconGavel, label: "Votaciones", value: "votaciones" },
];

const PREVIOUS_MINUTE_TITLE = "lectura del acta anterior";

const isPreviousMinutePoint = (point) =>
  Boolean(point?.isBasePoint) &&
  (point?.title || "").trim().toLowerCase() === PREVIOUS_MINUTE_TITLE;

const canMeetingReceivePoints = (meeting) => {
  if (!meeting) return false;
  if (meeting.isClosed || meeting.agendaConsolidated) return false;
  return !["CANCELADA", "FINALIZADA"].includes(meeting.status);
};

const isInConfirmationWindow = (meeting) => {
  if (!meeting) return false;
  if (["CANCELADA", "FINALIZADA"].includes(meeting.status)) return false;
  const now = Date.now();
  const meetingTime = new Date(meeting.date).getTime();
  const windowStart = new Date(meeting.attendanceOpensAt || meetingTime - 15 * 60 * 1000).getTime();
  const windowEnd = new Date(meeting.attendanceClosesAt || meeting.date).getTime();
  return now >= windowStart && now <= windowEnd;
};

const Actas = () => {
  const { user } = useAuth();
  const { setIsPanelOpen } = useNotifications();
  const [searchParams, setSearchParams] = useSearchParams();
  const [meetings, setMeetings] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState("PROGRAMADA");
  const [listFilters, setListFilters] = useState(EMPTY_MEETING_FILTERS);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [detailMeetingId, setDetailMeetingId] = useState(null);
  const [isPointPanelOpen, setIsPointPanelOpen] = useState(false);
  const [pointPanelMeetingId, setPointPanelMeetingId] = useState(null);
  const [pointForm, setPointForm] = useState(EMPTY_POINT_FORM);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pageMessage, setPageMessage] = useState("");
  const [panelMessage, setPanelMessage] = useState("");
  const [attendanceMsg, setAttendanceMsg] = useState("");
  const [activeTab, setActiveTab] = useState("detalle");
  const [chatUnread, setChatUnread] = useState(0);

  const canSubmitByRole = ["DOCENTE", "SECRETARIO"].includes(user?.role || "");
  const canReview = ["ADMIN", "SECRETARIO"].includes(user?.role || "");
  const canConfirmAttendanceForUser = ["ADMIN", "DOCENTE", "SECRETARIO"].includes(user?.role || "");

  const detailMeeting = useMemo(
    () => meetings.find((m) => m.id === detailMeetingId) || null,
    [meetings, detailMeetingId],
  );

  const handleChatUnreadChange = useCallback((count) => setChatUnread(count), []);

  const pointPanelMeeting = useMemo(
    () => meetings.find((m) => m.id === pointPanelMeetingId) || null,
    [meetings, pointPanelMeetingId],
  );

  const searchedMeetings = useMemo(
    () => filterMeetings(meetings, listFilters),
    [meetings, listFilters],
  );

  const filteredMeetings = useMemo(
    () => searchedMeetings.filter((m) => m.status === selectedStatus),
    [searchedMeetings, selectedStatus],
  );

  const visiblePage = clampPage(currentPage, filteredMeetings.length, pageSize);

  const pagedMeetings = useMemo(
    () => paginate(filteredMeetings, visiblePage, pageSize),
    [filteredMeetings, pageSize, visiblePage],
  );

  const getCountByStatus = (status) =>
    searchedMeetings.filter((m) => m.status === status).length;

  const selectStatus = (status) => {
    setSelectedStatus(status);
    setCurrentPage(1);
  };

  const handleListFilterChange = (key, value) => {
    setListFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const changePageSize = (size) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const clearListFilters = () => {
    setListFilters(EMPTY_MEETING_FILTERS);
    setCurrentPage(1);
  };

  const myPointsInMeeting = (meeting) => {
    if (!meeting?.agendaPoints) return [];
    return meeting.agendaPoints.filter((p) => p.proposerId === user?.id);
  };

  const loadMeetings = async () => {
    setIsLoading(true);
    try {
      const response = await meetingsService.list();
      const list = Array.isArray(response) ? response : [];
      setMeetings(
        [...list].sort(
          (a, b) => new Date(b?.date || 0) - new Date(a?.date || 0),
        ),
      );
    } catch {
      setPageMessage("No se pudo cargar la lista de reuniones.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMeetings();
  }, []);

  useEffect(() => {
    const meetingIdFromQuery = searchParams.get("meeting");
    if (!meetingIdFromQuery || meetings.length === 0) return;

    // Abrir desde una notificación (?meeting=id). No se reabre si ya está abierta,
    // para no perder la pestaña activa cuando se recarga la lista de reuniones.
    const targetMeeting = meetings.find((meeting) => meeting.id === meetingIdFromQuery);
    if (targetMeeting && targetMeeting.id !== detailMeetingId) {
      setDetailMeetingId(targetMeeting.id);
      setActiveTab("detalle");
      setChatUnread(0);
      setAttendanceMsg("");
      setIsPointPanelOpen(false);
      setPointPanelMeetingId(null);
      setIsPanelOpen(false);
    }
  }, [detailMeetingId, meetings, searchParams, setIsPanelOpen]);

  useEffect(() => {
    if (!isPointPanelOpen && !detailMeetingId) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [detailMeetingId, isPointPanelOpen]);

  const openDetail = (meeting) => {
    setDetailMeetingId(meeting.id);
    setActiveTab("detalle");
    setChatUnread(0);
    setAttendanceMsg("");
    setIsPointPanelOpen(false);
    setPointPanelMeetingId(null);
    setSearchParams({ meeting: meeting.id });
  };

  const closeDetail = () => {
    setDetailMeetingId(null);
    setAttendanceMsg("");
    setChatUnread(0);
    if (searchParams.get("meeting")) {
      setSearchParams({});
    }
  };

  const openPointPanel = (meetingId) => {
    setPointPanelMeetingId(meetingId);
    setPointForm(EMPTY_POINT_FORM);
    setPanelMessage("");
    setIsPointPanelOpen(true);
    setDetailMeetingId(null);
  };

  const closePointPanel = () => {
    setIsPointPanelOpen(false);
    setPanelMessage("");
  };

  const handleChange = (e) => {
    const { name, value } = e.currentTarget;
    setPointForm((prev) => ({ ...prev, [name]: value }));
    setPanelMessage("");
  };

  const handleSubmitPoint = async (e) => {
    e.preventDefault();
    if (!pointPanelMeeting?.id || !canSubmitByRole) return;
    if (!canMeetingReceivePoints(pointPanelMeeting)) {
      setPanelMessage("La reunión ya no admite nuevos puntos.");
      return;
    }
    const myPoints = myPointsInMeeting(pointPanelMeeting);
    if (myPoints.length >= 2) {
      setPanelMessage("Ya alcanzaste el máximo de 2 puntos para esta reunión.");
      return;
    }
    setIsSubmitting(true);
    setPanelMessage("");
    try {
      await meetingsService.proposePoint(pointPanelMeeting.id, {
        description: pointForm.description.trim(),
        title: pointForm.title.trim(),
      });
      setPointForm(EMPTY_POINT_FORM);
      setPanelMessage("Tu punto fue enviado a Secretaría para revisión.");
      await loadMeetings();
    } catch (err) {
      setPanelMessage(
        err?.response?.data?.message || "No se pudo enviar el punto.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReviewPoint = async (pointId, status) => {
    if (!detailMeeting?.id || !canReview) return;
    setIsSubmitting(true);
    try {
      await meetingsService.reviewPoint(detailMeeting.id, pointId, { status });
      await loadMeetings();
    } catch (err) {
      setAttendanceMsg(
        err?.response?.data?.message || "No se pudo completar la revisión.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmAttendance = async () => {
    if (!detailMeeting?.id) return;
    setIsSubmitting(true);
    setAttendanceMsg("");
    try {
      await meetingsService.confirmAttendance(detailMeeting.id);
      await loadMeetings();
      setAttendanceMsg("Tu asistencia ha sido confirmada y registrada como presente.");
    } catch (err) {
      setAttendanceMsg(
        err?.response?.data?.message ||
          "No se pudo confirmar la asistencia. Inténtalo de nuevo.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const detailApprovedPoints = useMemo(() => {
    if (!detailMeeting?.agendaPoints) return [];
    return detailMeeting.agendaPoints.filter((p) => p.status === "APROBADO");
  }, [detailMeeting]);

  const detailPendingPoints = useMemo(() => {
    if (!detailMeeting?.agendaPoints) return [];
    return detailMeeting.agendaPoints.filter(
      (p) => p.status === "PENDIENTE" && p.proposerId !== user?.id,
    );
  }, [detailMeeting, user?.id]);

  const getAttendanceStateForUser = (meeting, userId) => {
    if (!meeting?.attendance) return { isConfirmed: false, isInvited: false };
    const entry = meeting.attendance.find((item) => item?.userId === userId);
    return {
      isConfirmed: entry && ["PRESENTE", "JUSTIFICADA"].includes(entry?.status),
      isInvited: Boolean(entry),
    };
  };

  return (
    <div className="reunionesContainer">
      <aside className="reunionesSidebar">
        <div className="reunionesSidebarHeader">
          <h3>Estado</h3>
        </div>
        <ul className="reunionesStatusList">
          {STATUS_TABS.map((tab) => (
            <li key={tab.value} className="reunionesStatusItem">
              <button
                className={`reunionesStatusBtn ${selectedStatus === tab.value ? "active" : ""}`}
                onClick={() => selectStatus(tab.value)}
                type="button"
              >
                <span>{tab.label}</span>
                <span className="reunionesBadge">{getCountByStatus(tab.value)}</span>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <main className="reunionesMain">
        <header className="reunionesMainHeader">
          <div>
            <h2>Reuniones</h2>
            <p>
              {STATUS_LABELS[selectedStatus]} — {filteredMeetings.length}{" "}
              {filteredMeetings.length === 1 ? "reunión" : "reuniones"}
            </p>
          </div>
        </header>

        <MeetingsFilters
          filters={listFilters}
          onChange={handleListFilterChange}
          onClear={clearListFilters}
        />

        {pageMessage && <div className="reunionesMessage">{pageMessage}</div>}

        {isLoading && (
          <div className="reunionesMessage">Cargando reuniones...</div>
        )}

        {!isLoading && filteredMeetings.length === 0 && hasActiveFilters(listFilters) && (
          <EmptyState
            action={{ label: "Limpiar filtros", onClick: clearListFilters }}
            description="Ninguna reunión coincide con la búsqueda o el rango de fechas. Ajusta o limpia los filtros para ver más resultados."
            icon={<IconSearchOff size={28} />}
            title="Sin coincidencias"
          />
        )}

        {!isLoading && filteredMeetings.length === 0 && !hasActiveFilters(listFilters) && (
          <div className="reunionesEmpty">
            No hay reuniones en estado "{STATUS_LABELS[selectedStatus]}".
          </div>
        )}

        {!isLoading && filteredMeetings.length > 0 && (
          <ul className="reunionesList">
            {pagedMeetings.map((meeting) => {
              const myPoints = myPointsInMeeting(meeting);
              const canAddPoint =
                canSubmitByRole &&
                canMeetingReceivePoints(meeting) &&
                myPoints.length < 2;

              const attendanceState = getAttendanceStateForUser(meeting, user?.id);

              return (
                <li key={meeting.id} className="reunionCard">
                  <div className="reunionCardTop">
                    <span
                      className={`reunionStatusBadge reunionStatusBadge--${(meeting.status || "").toLowerCase()}`}
                    >
                      {STATUS_LABELS[meeting.status] || meeting.status}
                    </span>
                    {canConfirmAttendanceForUser && isInConfirmationWindow(meeting) && !attendanceState.isConfirmed && (
                      <span className="reunionWindowTag">Ventana de asistencia abierta</span>
                    )}
                  </div>
                  <h3 className="reunionCardTitle">{meeting.title}</h3>
                  <div className="reunionCardMeta">
                    <span>{formatDate(meeting.date)}</span>
                    <span>{meeting.location || "Sin lugar"}</span>
                    <span>{meeting.modality || "—"}</span>
                  </div>
                  {meeting.status === "CANCELADA" && (
                    <p className="reunionCardCancelled">
                      Cancelada: {meeting.cancellationReason || "Sin motivo registrado"}
                    </p>
                  )}
                  <div className="reunionCardActions">
                    {canAddPoint && (
                      <button
                        className="reunionBtn reunionBtn--secondary"
                        onClick={() => openPointPanel(meeting.id)}
                        type="button"
                      >
                        Agregar punto
                      </button>
                    )}
                    <button
                      className="reunionBtn reunionBtn--primary"
                      onClick={() => openDetail(meeting)}
                      type="button"
                    >
                      Ver detalle
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {!isLoading && (
          <Pagination
            currentPage={visiblePage}
            itemLabel="reuniones"
            onPageChange={setCurrentPage}
            onPageSizeChange={changePageSize}
            pageSize={pageSize}
            totalItems={filteredMeetings.length}
          />
        )}
      </main>

      {detailMeeting && (
        <>
          <div className="reunionesBackdrop" onClick={closeDetail} />
          <aside className="reunionesDetailPanel" role="dialog" aria-modal="true">
            <div className="reunionesDetailHeader">
              <div>
                <div className="reunionesDetailTitleRow">
                  <h3>{detailMeeting.title}</h3>
                  <span
                    className={`reunionStatusBadge reunionStatusBadge--${(detailMeeting.status || "").toLowerCase()}`}
                  >
                    {STATUS_LABELS[detailMeeting.status] || detailMeeting.status}
                  </span>
                </div>
              </div>
              <button
                aria-label="Cerrar detalle"
                className="reunionesCloseBtn"
                onClick={closeDetail}
                type="button"
              >
                <IconX size={18} />
              </button>
            </div>

            <div className="reunionesTabs" role="tablist">
              {DETAIL_TABS.map(({ icon: TabIcon, label, value }) => (
                <button
                  aria-selected={activeTab === value}
                  className={`reunionesTab ${activeTab === value ? "isActive" : ""}`}
                  key={value}
                  onClick={() => setActiveTab(value)}
                  role="tab"
                  type="button"
                >
                  <TabIcon size={16} />
                  {label}
                  {value === "chat" && chatUnread > 0 && (
                    <span className="reunionesTabBadge">{chatUnread > 99 ? "99+" : chatUnread}</span>
                  )}
                </button>
              ))}
            </div>

            {/* El chat queda montado al cambiar de pestaña para seguir contando los no leídos. */}
            <div className="reunionesTabPane reunionesTabPane--chat" hidden={activeTab !== "chat"}>
              <MeetingChat
                key={detailMeeting.id}
                isActive={activeTab === "chat"}
                meeting={detailMeeting}
                onUnreadChange={handleChatUnreadChange}
                user={user}
              />
            </div>

            {activeTab === "votaciones" && (
              <div className="reunionesTabPane reunionesDetailBody">
                <MeetingPolls key={detailMeeting.id} meeting={detailMeeting} user={user} />
              </div>
            )}

            <div className="reunionesDetailBody" hidden={activeTab !== "detalle"}>
              <div className="reunionesInfoGrid">
                <div className="reunionesInfoItem">
                  <span className="reunionesInfoLabel">Fecha y hora</span>
                  <span className="reunionesInfoValue">
                    {formatDate(detailMeeting.date)}
                  </span>
                </div>
                <div className="reunionesInfoItem">
                  <span className="reunionesInfoLabel">Lugar</span>
                  <span className="reunionesInfoValue">
                    {detailMeeting.location || "Sin lugar"}
                  </span>
                </div>
                <div className="reunionesInfoItem">
                  <span className="reunionesInfoLabel">Modalidad</span>
                  <span className="reunionesInfoValue">
                    {detailMeeting.modality || "—"}
                  </span>
                </div>
                <div className="reunionesInfoItem">
                  <span className="reunionesInfoLabel">Agenda</span>
                  <span className="reunionesInfoValue">
                    {detailMeeting.agendaConsolidated
                      ? "Consolidada"
                      : "Abierta para puntos"}
                  </span>
                </div>
                {detailMeeting.description && (
                  <div className="reunionesInfoItem reunionesInfoItem--full">
                    <span className="reunionesInfoLabel">Descripción</span>
                    <span className="reunionesInfoValue">
                      {detailMeeting.description}
                    </span>
                  </div>
                )}
              </div>

              {detailMeeting.status === "CANCELADA" && (
                <div className="reunionesCancelledNotice">
                  <span className="reunionesInfoLabel">Motivo de cancelación</span>
                  <p className="reunionesCancelledReason">
                    {detailMeeting.cancellationReason || "No se registró un motivo."}
                  </p>
                  <p className="reunionesCancelledMeta">
                    Cancelada por {detailMeeting.cancelledBy?.name || "—"}
                    {detailMeeting.cancelledAt
                      ? ` · ${formatDate(detailMeeting.cancelledAt)}`
                      : ""}
                  </p>
                </div>
              )}

              {detailApprovedPoints.length > 0 && (
                <section className="reunionesSection">
                  <h4 className="reunionesSectionTitle">Puntos de agenda aprobados</h4>
                  <ul className="reunionesPointsList">
                    {detailApprovedPoints.map((point) => (
                      <li key={point.id} className="reunionesPointItem">
                        <strong>{point.title}</strong>
                        <p>{point.description}</p>
                        {isPreviousMinutePoint(point) &&
                          detailMeeting.previousMinute &&
                          detailMeeting.previousMinute.points.length > 0 && (
                            <div className="reunionesPreviousMinute">
                              <span className="reunionesPreviousMinuteLabel">
                                Puntos pendientes del acta anterior
                                {detailMeeting.previousMinute.date
                                  ? ` (${formatDate(detailMeeting.previousMinute.date)})`
                                  : ""}
                                :
                              </span>
                              <ol className="reunionesPreviousMinuteList">
                                {detailMeeting.previousMinute.points.map((prev, index) => (
                                  <li key={index}>
                                    <strong>{prev.title}</strong>
                                    {prev.description ? <span> — {prev.description}</span> : null}
                                  </li>
                                ))}
                              </ol>
                            </div>
                          )}
                        <span className="reunionesPointAuthor">
                          {point.proposer?.name || "Coordinación"}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {canReview && detailPendingPoints.length > 0 && (
                <section className="reunionesSection">
                  <h4 className="reunionesSectionTitle">Puntos pendientes por revisar</h4>
                  <ul className="reunionesPointsList">
                    {detailPendingPoints.map((point) => (
                      <li key={point.id} className="reunionesPointItem">
                        <strong>{point.title}</strong>
                        <p>{point.description}</p>
                        <span className="reunionesPointAuthor">
                          {point.proposer?.name || "Sin autor"}
                        </span>
                        <div className="reunionesReviewActions">
                          <button
                            disabled={isSubmitting}
                            onClick={() => handleReviewPoint(point.id, "RECHAZADO")}
                            type="button"
                          >
                            Rechazar
                          </button>
                          <button
                            disabled={isSubmitting}
                            onClick={() => handleReviewPoint(point.id, "APROBADO")}
                            type="button"
                          >
                            Aprobar
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {(() => {
                const attendanceState = getAttendanceStateForUser(detailMeeting, user?.id);
                const attendanceOpened = isInConfirmationWindow(detailMeeting);
                if (!attendanceOpened && !detailMeeting?.attendanceFinalized) {
                  return null;
                }
                return (
                  <section className="reunionesSection reunionesAttendanceSection">
                    <h4 className="reunionesSectionTitle">Confirmar asistencia</h4>
                    <p className="reunionesAttendanceText">
                      {detailMeeting?.attendanceFinalized
                        ? "La ventana de asistencia ya cerró. Se registró la asistencia pendiente como ausente."
                        : detailMeeting.status === "EN_CURSO"
                          ? "La reunión está en curso. Confirma tu asistencia para registrar tu participación."
                          : "La reunión comenzará pronto. Puedes confirmar tu asistencia hasta 15 minutos antes."}
                    </p>
                    {!attendanceOpened && detailMeeting?.attendanceFinalized ? (
                      <div className="reunionesAttendanceError">
                        La asistencia ya no está abierta para nuevos registros.
                      </div>
                    ) : !canConfirmAttendanceForUser ? (
                      <div className="reunionesAttendanceError">
                        Solo los docentes y secretarios del sistema pueden confirmar asistencia desde aquí. Los participantes externos se registran en la hoja o imagen cargada al finalizar la reunión.
                      </div>
                    ) : attendanceState.isConfirmed ? (
                      <div className="reunionesAttendanceSuccess">
                        Asistencia confirmada correctamente.
                      </div>
                    ) : (
                      <button
                        className="reunionesConfirmBtn"
                        disabled={isSubmitting}
                        onClick={handleConfirmAttendance}
                        type="button"
                      >
                        {isSubmitting ? "Confirmando..." : "Confirmar mi asistencia"}
                      </button>
                    )}
                    {attendanceMsg && !attendanceState.isConfirmed && (
                      <p className="reunionesAttendanceError">{attendanceMsg}</p>
                    )}
                  </section>
                );
              })()}
            </div>

            <div className="reunionesDetailFooter" hidden={activeTab !== "detalle"}>
              <button
                className="reunionBtn reunionBtn--secondary"
                onClick={closeDetail}
                type="button"
              >
                Cerrar
              </button>
            </div>
          </aside>
        </>
      )}

      {isPointPanelOpen && pointPanelMeeting && (
        <>
          <div className="reunionesBackdrop" onClick={closePointPanel} />
          <aside className="reunionesPointPanel" role="dialog" aria-modal="true">
            <div className="reunionesDetailHeader">
              <div>
                <h3>Agregar punto</h3>
                <p>{pointPanelMeeting.title}</p>
              </div>
              <button
                aria-label="Cerrar panel"
                className="reunionesCloseBtn"
                onClick={closePointPanel}
                type="button"
              >
                <IconX size={18} />
              </button>
            </div>

            <form className="reunionesPointForm" onSubmit={handleSubmitPoint}>
              <div className="reunionesField">
                <label htmlFor="point-title">Título</label>
                <input
                  id="point-title"
                  maxLength={120}
                  minLength={4}
                  name="title"
                  onChange={handleChange}
                  placeholder="Ej: Seguimiento del Plan de Captación"
                  required
                  value={pointForm.title}
                />
              </div>
              <div className="reunionesField">
                <label htmlFor="point-description">Descripción</label>
                <textarea
                  id="point-description"
                  maxLength={1500}
                  minLength={10}
                  name="description"
                  onChange={handleChange}
                  placeholder="Detalla el punto que deseas discutir en la reunión"
                  required
                  rows={5}
                  value={pointForm.description}
                />
              </div>
              <span className="reunionesPointsCounter">
                Mis puntos: {myPointsInMeeting(pointPanelMeeting).length}/2
              </span>
              {panelMessage && (
                <div className="reunionesMessage">{panelMessage}</div>
              )}
              <div className="reunionesFormActions">
                <button
                  className="reunionBtn reunionBtn--primary"
                  disabled={isSubmitting}
                  type="submit"
                >
                  {isSubmitting ? "Enviando..." : "Enviar punto"}
                </button>
              </div>
            </form>
          </aside>
        </>
      )}
    </div>
  );
};

export default Actas;
