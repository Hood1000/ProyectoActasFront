import React, { useEffect, useMemo, useRef, useState } from "react";
import { IconListCheck, IconSearchOff, IconUpload, IconX } from "@tabler/icons-react";
import { useAuth } from "../../../../context/AuthContext";
import meetingsService from "../../../../api/services/meetingsService";
import EmptyState from "../../../../components/EmptyState";
import MeetingsFilters from "../../../../components/MeetingsFilters";
import { EMPTY_MEETING_FILTERS } from "../../../../components/MeetingsFilters/constants";
import { filterMeetings, hasActiveFilters } from "../../../../components/MeetingsFilters/utils";
import Pagination from "../../../../components/Pagination";
import { DEFAULT_PAGE_SIZE } from "../../../../components/Pagination/constants";
import { clampPage, paginate } from "../../../../components/Pagination/utils";
import "./styles.css";

const meetingTypes = ["Consejo de carrera", "SIP pedagógico", "Asambleas"];

const modalityOptions = [
  { label: "Presencial", value: "PRESENCIAL" },
  { label: "Virtual", value: "VIRTUAL" },
  { label: "Híbrida", value: "HIBRIDA" },
];

const initialMeetingForm = {
  date: "",
  description: "",
  location: "",
  meetingCategory: "CONSEJO_CARRERA",
  modality: "PRESENCIAL",
  title: "",
};

const initialPointDraft = { description: "", title: "" };

const PREVIOUS_MINUTE_POINT = {
  description:
    "Lectura, revisión y consideración del acta de la reunión anterior como primer punto obligatorio del orden del día.",
  title: "Lectura del acta anterior",
};

const categoryMap = {
  "Consejo de carrera": "CONSEJO_CARRERA",
  "SIP pedagógico": "CID_PEDAGOGICO",
  Asambleas: "ASAMBLEA",
};

const categoryOptions = [
  { label: "Consejo de carrera", value: "CONSEJO_CARRERA" },
  { label: "SIP pedagógico", value: "CID_PEDAGOGICO" },
  { label: "Asambleas", value: "ASAMBLEA" },
];

const STATUS_LABELS = {
  PROGRAMADA: "Programada",
  EN_CURSO: "En curso",
  FINALIZADA: "Finalizada",
  CANCELADA: "Cancelada",
};

const WORK_HOURS = { start: 7, end: 18 };

const MIN_CANCEL_REASON_LENGTH = 10;

const CATEGORY_TO_TYPE = {
  CONSEJO_CARRERA: "Consejo de carrera",
  CID_PEDAGOGICO: "SIP pedagógico",
  ASAMBLEA: "Asambleas",
};

const resolveMeetingType = (meeting) =>
  CATEGORY_TO_TYPE[meeting?.meetingCategory] || "Consejo de carrera";

const formatMeetingDate = (value) => {
  if (!value) return "Sin fecha";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Sin fecha";
  return parsed.toLocaleString("es-VE", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Caracas",
  });
};

const isMeetingEditable = (meeting) => {
  if (!meeting) return false;
  if (meeting.isClosed) return false;
  if (["EN_CURSO", "CANCELADA", "FINALIZADA"].includes(meeting.status)) return false;
  const now = Date.now();
  const attendanceOpenAt = new Date(
    meeting.attendanceOpensAt || new Date(meeting.date).getTime() - 15 * 60 * 1000,
  ).getTime();
  return now < attendanceOpenAt;
};

const canCancelMeeting = (meeting) => {
  if (!meeting) return false;
  if (meeting.isClosed) return false;
  return !["FINALIZADA", "CANCELADA"].includes(meeting.status);
};

const validateMeetingSchedule = (dateValue) => {
  if (!dateValue) return "Indica la fecha y hora de la reunión.";
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return "La fecha de la reunión no es válida.";
  if (parsed.getTime() <= Date.now()) {
    return "La reunión debe programarse a una fecha y hora futura.";
  }
  const hour = parsed.getHours();
  if (hour < WORK_HOURS.start || hour >= WORK_HOURS.end) {
    return `La reunión debe programarse dentro del horario institucional (${WORK_HOURS.start}:00 a ${WORK_HOURS.end}:00).`;
  }
  return "";
};

const toDateTimeLocal = (value) => {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  const local = new Date(parsed.getTime() - parsed.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
};

const currentDateTimeLocal = () => {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
};

const ControlActas = () => {
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  const [meetings, setMeetings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedType, setSelectedType] = useState(meetingTypes[0]);
  const [listFilters, setListFilters] = useState(EMPTY_MEETING_FILTERS);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [detailMeetingId, setDetailMeetingId] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelError, setCancelError] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [meetingForm, setMeetingForm] = useState(initialMeetingForm);
  const [editingMeeting, setEditingMeeting] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formStep, setFormStep] = useState(1);
  const [pendingPoints, setPendingPoints] = useState([]);
  const [pointDraft, setPointDraft] = useState(initialPointDraft);
  const [pointDraftError, setPointDraftError] = useState("");

  const [actaFile, setActaFile] = useState(null);
  const [isFinalizingMeeting, setIsFinalizingMeeting] = useState(false);
  const [finalizeMsg, setFinalizeMsg] = useState({ text: "", type: "error" });
  const [isConfirmingConsolidate, setIsConfirmingConsolidate] = useState(false);
  const [isConsolidating, setIsConsolidating] = useState(false);
  const [consolidateMsg, setConsolidateMsg] = useState({ text: "", type: "error" });

  const detailMeeting = useMemo(
    () => meetings.find((m) => m.id === detailMeetingId) || null,
    [meetings, detailMeetingId],
  );

  const canCreateMeetings = ["ADMIN", "SECRETARIO"].includes(user?.role || "");
  const canEditMeetings = ["ADMIN", "SECRETARIO"].includes(user?.role || "");
  const canCancelMeetings = ["ADMIN", "SECRETARIO"].includes(user?.role || "");

  const hydrateData = async () => {
    setIsLoading(true);
    try {
      // Las reuniones vencidas las cancela el backend (tarea programada cada minuto).
      const meetingsResponse = await meetingsService.list();
      setMeetings(Array.isArray(meetingsResponse) ? meetingsResponse : []);
      setErrorMsg("");
    } catch {
      setErrorMsg("No fue posible cargar la información de reuniones. Intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    hydrateData();
  }, []);

  const searchedMeetings = useMemo(
    () => filterMeetings(meetings, listFilters),
    [meetings, listFilters],
  );

  const filteredMeetings = useMemo(
    () =>
      searchedMeetings.filter(
        (meeting) => resolveMeetingType(meeting) === selectedType,
      ),
    [searchedMeetings, selectedType],
  );

  const visiblePage = clampPage(currentPage, filteredMeetings.length, pageSize);

  const pagedMeetings = useMemo(
    () => paginate(filteredMeetings, visiblePage, pageSize),
    [filteredMeetings, pageSize, visiblePage],
  );

  const getCountByType = (type) =>
    searchedMeetings.filter((meeting) => resolveMeetingType(meeting) === type).length;

  const selectType = (type) => {
    setSelectedType(type);
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

  const resetFinalizeState = () => {
    setActaFile(null);
    setFinalizeMsg({ text: "", type: "error" });
    setIsConfirmingConsolidate(false);
    setConsolidateMsg({ text: "", type: "error" });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const resetFormStep = () => {
    setFormStep(1);
    setPendingPoints([]);
    setPointDraft(initialPointDraft);
    setPointDraftError("");
  };

  const openCreatePanel = () => {
    setDetailMeetingId(null);
    setEditingMeeting(null);
    setMeetingForm({
      ...initialMeetingForm,
      meetingCategory: categoryMap[selectedType] || "CONSEJO_CARRERA",
    });
    setErrorMsg("");
    resetFormStep();
    setIsFormOpen(true);
  };

  const openEditPanel = (meeting) => {
    setDetailMeetingId(null);
    resetFinalizeState();
    setEditingMeeting(meeting);
    setMeetingForm({
      date: toDateTimeLocal(meeting?.date),
      description: meeting?.description || "",
      location: meeting?.location || "",
      meetingCategory: meeting?.meetingCategory || "CONSEJO_CARRERA",
      modality: meeting?.modality || "PRESENCIAL",
      title: meeting?.title || "",
    });
    setErrorMsg("");
    resetFormStep();
    setIsFormOpen(true);
  };

  const openDetailPanel = (meeting) => {
    setIsFormOpen(false);
    setEditingMeeting(null);
    setErrorMsg("");
    resetFinalizeState();
    setDetailMeetingId(meeting.id);
  };

  const closeDetailPanel = () => {
    setDetailMeetingId(null);
    resetFinalizeState();
  };

  const closeFormPanel = () => {
    setIsFormOpen(false);
    setErrorMsg("");
    setEditingMeeting(null);
    setMeetingForm(initialMeetingForm);
    resetFormStep();
  };

  const addPendingPoint = () => {
    if (pointDraft.title.trim().length < 4) {
      setPointDraftError("El titulo debe tener al menos 4 caracteres.");
      return;
    }
    if (pointDraft.description.trim().length < 10) {
      setPointDraftError("La descripcion debe tener al menos 10 caracteres.");
      return;
    }
    if (pointDraft.title.trim().toLowerCase() === PREVIOUS_MINUTE_POINT.title.toLowerCase()) {
      setPointDraftError("Ese punto ya se agrega automáticamente como primer punto de la reunión.");
      return;
    }
    setPendingPoints((prev) => [
      ...prev,
      { description: pointDraft.description.trim(), title: pointDraft.title.trim() },
    ]);
    setPointDraft(initialPointDraft);
    setPointDraftError("");
  };

  const removePendingPoint = (index) => {
    setPendingPoints((prev) => prev.filter((_, i) => i !== index));
  };

  const openCancelModal = (meeting) => {
    if (!meeting?.id || !canCancelMeetings || !canCancelMeeting(meeting)) return;
    setCancelTarget(meeting);
    setCancelReason("");
    setCancelError("");
  };

  const closeCancelModal = () => {
    setCancelTarget(null);
    setCancelReason("");
    setCancelError("");
  };

  const confirmCancelMeeting = async () => {
    if (!cancelTarget?.id) return;
    const reason = cancelReason.trim();
    if (reason.length < MIN_CANCEL_REASON_LENGTH) {
      setCancelError(
        `Indica un motivo de al menos ${MIN_CANCEL_REASON_LENGTH} caracteres.`,
      );
      return;
    }

    setIsCancelling(true);
    setCancelError("");

    try {
      await meetingsService.cancel(cancelTarget.id, reason);
      if (detailMeetingId === cancelTarget.id) closeDetailPanel();
      closeCancelModal();
      await hydrateData();
    } catch (err) {
      setCancelError(
        err?.response?.data?.message || "No se pudo cancelar la reunión. Intenta nuevamente.",
      );
    } finally {
      setIsCancelling(false);
    }
  };

  const handleConsolidateAgenda = async () => {
    if (!detailMeetingId) return;
    setIsConsolidating(true);
    setConsolidateMsg({ text: "", type: "error" });
    try {
      const result = await meetingsService.consolidateAgenda(detailMeetingId);
      const pending = result?.pendingCount || 0;
      setConsolidateMsg({
        text:
          pending > 0
            ? `Agenda consolidada. ${pending} punto(s) pendiente(s) quedaron fuera del orden del día.`
            : "Agenda consolidada. Ya no se reciben nuevos puntos.",
        type: "success",
      });
      setIsConfirmingConsolidate(false);
      await hydrateData();
    } catch (err) {
      setConsolidateMsg({
        text: err?.response?.data?.message || "No se pudo consolidar la agenda.",
        type: "error",
      });
    } finally {
      setIsConsolidating(false);
    }
  };

  const handleFinalizeMeeting = async () => {
    if (!actaFile || !detailMeetingId) return;
    setIsFinalizingMeeting(true);
    setFinalizeMsg({ text: "", type: "error" });

    try {
      await meetingsService.uploadEvidenceFile(detailMeetingId, actaFile);
      await meetingsService.closeMeeting(detailMeetingId);
      resetFinalizeState();
      closeDetailPanel();
      await hydrateData();
    } catch (err) {
      setFinalizeMsg({
        text:
          err?.response?.data?.message ||
          "No se pudo finalizar la reunión. Intenta nuevamente.",
        type: "error",
      });
    } finally {
      setIsFinalizingMeeting(false);
    }
  };

  const handleSaveMeeting = async () => {
    setErrorMsg("");

    const scheduleError = validateMeetingSchedule(meetingForm.date);
    if (scheduleError) {
      setErrorMsg(scheduleError);
      return;
    }

    setIsSubmitting(true);

    try {
      let savedMeetingId;

      if (editingMeeting?.id) {
        if (!isMeetingEditable(editingMeeting)) {
          throw new Error("La reunión ya no se puede editar porque está finalizada o cerrada.");
        }
        await meetingsService.update(editingMeeting.id, {
          date: new Date(meetingForm.date).toISOString(),
          description: meetingForm.description.trim() || undefined,
          location: meetingForm.location.trim(),
          meetingCategory: meetingForm.meetingCategory,
          modality: meetingForm.modality,
          title: meetingForm.title.trim(),
        });
        savedMeetingId = editingMeeting.id;
      } else {
        const titlePrefix = `Reunion - ${selectedType}`;
        const rawTitle = meetingForm.title.trim();
        const normalizedTitle = rawTitle.toLowerCase().startsWith(titlePrefix.toLowerCase())
          ? rawTitle
          : `${titlePrefix} ${rawTitle}`;

        const created = await meetingsService.create({
          date: new Date(meetingForm.date).toISOString(),
          description: meetingForm.description.trim() || undefined,
          location: meetingForm.location.trim(),
          meetingCategory: meetingForm.meetingCategory,
          meetingType: "ORDINARIA",
          modality: meetingForm.modality,
          title: normalizedTitle,
        });
        savedMeetingId = created.id;
      }

      for (const point of pendingPoints) {
        await meetingsService.proposePoint(savedMeetingId, point);
      }

      await hydrateData();
      closeFormPanel();
    } catch (err) {
      setErrorMsg(
        err?.response?.data?.message ||
          err?.message ||
          "No se pudo guardar la reunión. Revisa los datos e intenta nuevamente.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!isFormOpen && !detailMeetingId && !cancelTarget) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [cancelTarget, detailMeetingId, isFormOpen]);

  return (
    <div className="controlActasContainer">
      <aside className="secondarySidebar">
        <div className="secondarySidebarHeader">
          <h3>Tipos de Reuniones</h3>
        </div>

        <ul className="actaTypesList">
          {meetingTypes.map((type) => (
            <li key={type} className="actaTypeItem">
              <button
                className={`actaTypeButton ${selectedType === type ? "active" : ""}`}
                onClick={() => selectType(type)}
                type="button"
              >
                <span>{type}</span>
                <span className="badge">{getCountByType(type)}</span>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <main className="mainContent">
        <header className="mainHeader controlActasHeader">
          <h2>Gestion de Reuniones {selectedType}</h2>
          {canCreateMeetings && (
            <button className="controlActasPrimaryBtn" onClick={openCreatePanel} type="button">
              Nueva Reunion
            </button>
          )}
        </header>

        <MeetingsFilters
          filters={listFilters}
          onChange={handleListFilterChange}
          onClear={clearListFilters}
        />

        {isFormOpen && (
          <>
            <div className="controlActasBackdrop" onClick={closeFormPanel} />
            <aside className="controlActasPanel" role="dialog" aria-modal="true">
              <div className="controlActasPanelHeader">
                <div>
                  <div className="controlActasPanelTitleRow">
                    <h3>{editingMeeting ? "Editar Reunion" : "Nueva Reunion"}</h3>
                    <span className="controlActasStepBadge">Paso {formStep} de 2</span>
                  </div>
                  <p>
                    {formStep === 1
                      ? (editingMeeting
                          ? "Corrige los datos mientras la reunion siga vigente."
                          : "Registra la convocatoria y los datos base.")
                      : "Agrega los puntos de agenda base. La lectura del acta anterior se incluye automáticamente como primer punto."}
                  </p>
                </div>
                <button
                  aria-label="Cerrar panel"
                  className="controlActasCloseBtn"
                  onClick={closeFormPanel}
                  type="button"
                >
                  <IconX size={18} />
                </button>
              </div>

              {formStep === 1 && (
                <form
                  className="controlActasForm"
                  onSubmit={(e) => {
                    e.preventDefault();
                    setFormStep(2);
                  }}
                >
                  <div className="controlActasField">
                    <label htmlFor="meeting-title">Titulo de la reunion</label>
                    <input
                      id="meeting-title"
                      onChange={(event) =>
                        setMeetingForm((previous) => ({ ...previous, title: event.target.value }))
                      }
                      placeholder={`Ej: Reunion - ${selectedType}`}
                      required
                      type="text"
                      value={meetingForm.title}
                    />
                  </div>

                  <div className="controlActasField">
                    <label htmlFor="meeting-description">Descripcion</label>
                    <textarea
                      id="meeting-description"
                      onChange={(event) =>
                        setMeetingForm((previous) => ({
                          ...previous,
                          description: event.target.value,
                        }))
                      }
                      placeholder="Convocatoria o contexto de la reunión"
                      rows={4}
                      value={meetingForm.description}
                    />
                  </div>

                  <div className="controlActasField">
                    <label htmlFor="meeting-date">Fecha y hora de inicio</label>
                    <input
                      id="meeting-date"
                      min={currentDateTimeLocal()}
                      onChange={(event) =>
                        setMeetingForm((previous) => ({ ...previous, date: event.target.value }))
                      }
                      required
                      type="datetime-local"
                      value={meetingForm.date}
                    />
                    <span className="controlActasFieldHint">
                      Horario institucional permitido: {WORK_HOURS.start}:00 a {WORK_HOURS.end}:00.
                    </span>
                  </div>

                  <div className="controlActasField">
                    <label htmlFor="meeting-location">Lugar</label>
                    <input
                      id="meeting-location"
                      onChange={(event) =>
                        setMeetingForm((previous) => ({
                          ...previous,
                          location: event.target.value,
                        }))
                      }
                      placeholder="Ej: Liceo Luis Agustín Daló / Batatuy"
                      required
                      type="text"
                      value={meetingForm.location}
                    />
                  </div>

                  <div className="controlActasField">
                    <label htmlFor="meeting-category">Categoría</label>
                    <select
                      id="meeting-category"
                      onChange={(event) =>
                        setMeetingForm((previous) => ({
                          ...previous,
                          meetingCategory: event.target.value,
                        }))
                      }
                      required
                      value={meetingForm.meetingCategory}
                    >
                      {categoryOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="controlActasField">
                    <label htmlFor="meeting-modality">Modalidad</label>
                    <select
                      id="meeting-modality"
                      onChange={(event) =>
                        setMeetingForm((previous) => ({
                          ...previous,
                          modality: event.target.value,
                        }))
                      }
                      required
                      value={meetingForm.modality}
                    >
                      {modalityOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="controlActasFormActions">
                    <button
                      className="controlActasSecondaryBtn"
                      onClick={closeFormPanel}
                      type="button"
                    >
                      Cancelar
                    </button>
                    <button className="controlActasPrimaryBtn" type="submit">
                      Siguiente
                    </button>
                  </div>
                </form>
              )}

              {formStep === 2 && (
                <div className="controlActasForm">
                  <div className="controlActasLockedPoint">
                    <span className="controlActasLockedPointBadge">Punto obligatorio</span>
                    <strong>{PREVIOUS_MINUTE_POINT.title}</strong>
                    <p>{PREVIOUS_MINUTE_POINT.description}</p>
                  </div>

                  <div className="controlActasField">
                    <label htmlFor="point-title">Titulo del punto</label>
                    <input
                      id="point-title"
                      maxLength={120}
                      onChange={(e) =>
                        setPointDraft((prev) => ({ ...prev, title: e.target.value }))
                      }
                      placeholder="Ej: Avance del Plan de Captacion 2026"
                      type="text"
                      value={pointDraft.title}
                    />
                  </div>

                  <div className="controlActasField">
                    <label htmlFor="point-description">Descripcion</label>
                    <textarea
                      id="point-description"
                      maxLength={1500}
                      onChange={(e) =>
                        setPointDraft((prev) => ({ ...prev, description: e.target.value }))
                      }
                      placeholder="Detalle del punto a discutir durante la reunion"
                      rows={3}
                      value={pointDraft.description}
                    />
                  </div>

                  {pointDraftError && (
                    <p className="controlActasError">{pointDraftError}</p>
                  )}

                  <button
                    className="controlActasSecondaryBtn"
                    onClick={addPendingPoint}
                    type="button"
                  >
                    + Agregar punto
                  </button>

                  {pendingPoints.length > 0 && (
                    <ul className="controlActasPendingPoints">
                      {pendingPoints.map((point, i) => (
                        <li key={i} className="controlActasPendingPoint">
                          <div>
                            <strong>{point.title}</strong>
                            <p>{point.description}</p>
                          </div>
                          <button
                            className="controlActasPendingPointRemove"
                            onClick={() => removePendingPoint(i)}
                            type="button"
                          >
                            <IconX size={14} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}

                  {errorMsg && <p className="controlActasError">{errorMsg}</p>}

                  <div className="controlActasFormActions">
                    <button
                      className="controlActasSecondaryBtn"
                      onClick={() => { setFormStep(1); setErrorMsg(""); }}
                      type="button"
                    >
                      Atrás
                    </button>
                    <button
                      className="controlActasPrimaryBtn"
                      disabled={isSubmitting}
                      onClick={handleSaveMeeting}
                      type="button"
                    >
                      {isSubmitting
                        ? "Guardando..."
                        : editingMeeting
                          ? "Actualizar Reunion"
                          : "Crear Reunion"}
                    </button>
                  </div>
                </div>
              )}
            </aside>
          </>
        )}

        {detailMeeting && (
          <>
            <div className="controlActasBackdrop" onClick={closeDetailPanel} />
            <aside className="controlActasPanel" role="dialog" aria-modal="true">
              <div className="controlActasPanelHeader">
                <div>
                  <div className="controlActasPanelTitleRow">
                    <h3>Detalle de la reunion</h3>
                    <span
                      className={`actaStatusBadge actaStatusBadge--${(detailMeeting.status || "").toLowerCase()}`}
                    >
                      {STATUS_LABELS[detailMeeting.status] || detailMeeting.status}
                    </span>
                  </div>
                  <p>{detailMeeting.title}</p>
                </div>
                <button
                  aria-label="Cerrar panel"
                  className="controlActasCloseBtn"
                  onClick={closeDetailPanel}
                  type="button"
                >
                  <IconX size={18} />
                </button>
              </div>

              <div className="controlActasInfoGrid">
                <div className="controlActasInfoItem">
                  <span className="controlActasInfoLabel">Fecha y hora</span>
                  <span className="controlActasInfoValue">{formatMeetingDate(detailMeeting.date)}</span>
                </div>
                <div className="controlActasInfoItem">
                  <span className="controlActasInfoLabel">Lugar</span>
                  <span className="controlActasInfoValue">{detailMeeting.location || "Sin lugar"}</span>
                </div>
                <div className="controlActasInfoItem">
                  <span className="controlActasInfoLabel">Modalidad</span>
                  <span className="controlActasInfoValue">{detailMeeting.modality || "—"}</span>
                </div>
                <div className="controlActasInfoItem">
                  <span className="controlActasInfoLabel">Agenda</span>
                  <span className="controlActasInfoValue">
                    {detailMeeting.agendaConsolidated ? "Consolidada" : "Abierta para puntos"}
                  </span>
                </div>
                <div className="controlActasInfoItem controlActasInfoItem--full">
                  <span className="controlActasInfoLabel">Descripcion</span>
                  <span className="controlActasInfoValue">
                    {detailMeeting.description || "Sin descripcion de convocatoria."}
                  </span>
                </div>
              </div>

              {detailMeeting.status === "CANCELADA" && (
                <div className="controlActasCancelledNotice">
                  <span className="controlActasInfoLabel">Motivo de cancelación</span>
                  <p className="controlActasCancelledReason">
                    {detailMeeting.cancellationReason || "No se registró un motivo."}
                  </p>
                  <p className="controlActasCancelledMeta">
                    Cancelada por {detailMeeting.cancelledBy?.name || "—"}
                    {detailMeeting.cancelledAt
                      ? ` · ${formatMeetingDate(detailMeeting.cancelledAt)}`
                      : ""}
                  </p>
                </div>
              )}

              {canEditMeetings &&
                ((isMeetingEditable(detailMeeting) && !detailMeeting.agendaConsolidated) ||
                  consolidateMsg.text) && (
                <>
                  <hr className="controlActasDivider" />
                  <div className="controlActasFinalizeSection">
                    <div className="controlActasFinalizeSectionHeader">
                      <IconListCheck size={18} />
                      <h4>Consolidar orden del día</h4>
                    </div>
                    {!detailMeeting.agendaConsolidated && (
                      <>
                        <p className="actaCardMeta">
                          Cierra la recepción de puntos y fija la agenda con los puntos aprobados (
                          {(detailMeeting.agendaPoints || []).filter((p) => p.status === "APROBADO").length}{" "}
                          aprobados,{" "}
                          {(detailMeeting.agendaPoints || []).filter((p) => p.status === "PENDIENTE").length}{" "}
                          pendientes de revisión). Los pendientes no entrarán en el orden del día.
                        </p>
                        {isConfirmingConsolidate ? (
                          <div className="controlActasFormActions">
                            <button
                              className="controlActasSecondaryBtn"
                              onClick={() => setIsConfirmingConsolidate(false)}
                              type="button"
                            >
                              Volver
                            </button>
                            <button
                              className="controlActasPrimaryBtn"
                              disabled={isConsolidating}
                              onClick={handleConsolidateAgenda}
                              type="button"
                            >
                              {isConsolidating ? "Consolidando..." : "Sí, consolidar agenda"}
                            </button>
                          </div>
                        ) : (
                          <button
                            className="controlActasFinalizeBtn"
                            onClick={() => setIsConfirmingConsolidate(true)}
                            type="button"
                          >
                            Consolidar agenda
                          </button>
                        )}
                      </>
                    )}
                    {consolidateMsg.text && (
                      <p
                        className={
                          consolidateMsg.type === "success" ? "controlActasSuccess" : "controlActasError"
                        }
                      >
                        {consolidateMsg.text}
                      </p>
                    )}
                  </div>
                </>
              )}

              {/* Se puede finalizar mientras la reunión no esté cerrada ni cancelada (también en curso). */}
              {canEditMeetings && canCancelMeeting(detailMeeting) && (
                <>
                  <hr className="controlActasDivider" />
                  <div className="controlActasFinalizeSection">
                    <div className="controlActasFinalizeSectionHeader">
                      <IconUpload size={18} />
                      <h4>Finalizar esta reunion</h4>
                    </div>

                    {detailMeeting.evidenceSignaturesUrl ? (
                      <p className="controlActasSuccess">
                        El acta ya fue cargada al sistema. La reunion esta lista para cierre.
                      </p>
                    ) : (
                      <>
                        <p className="actaCardMeta">
                          Sube el acta firmada, una hoja o una imagen con firmas de los participantes externos para cerrar el proceso (PDF, Word o imagen JPG/PNG/WebP, max. 15 MB). La confirmación de asistencia en el sistema sigue siendo solo para docentes y secretarios.
                        </p>

                        <label className="controlActasFileDropzone" htmlFor="acta-file-input">
                          <IconUpload size={20} />
                          <span>
                            {actaFile ? actaFile.name : "Seleccionar acta, hoja o imagen"}
                          </span>
                          <input
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,image/*"
                            id="acta-file-input"
                            onChange={(e) => {
                              setActaFile(e.target.files[0] || null);
                              setFinalizeMsg({ text: "", type: "error" });
                            }}
                            ref={fileInputRef}
                            style={{ display: "none" }}
                            type="file"
                          />
                        </label>

                        {actaFile && (
                          <button
                            className="controlActasFinalizeBtn"
                            disabled={isFinalizingMeeting}
                            onClick={handleFinalizeMeeting}
                            type="button"
                          >
                            {isFinalizingMeeting ? "Finalizando reunión..." : "Subir Acta y Finalizar Reunion"}
                          </button>
                        )}
                      </>
                    )}

                    {finalizeMsg.text && (
                      <p
                        className={
                          finalizeMsg.type === "success"
                            ? "controlActasSuccess"
                            : "controlActasError"
                        }
                      >
                        {finalizeMsg.text}
                      </p>
                    )}
                  </div>
                </>
              )}

              {detailMeeting.isClosed && detailMeeting.finalSummary && (
                <div className="controlActasSection">
                  <div className="controlActasField">
                    <label>Resumen final</label>
                    <p className="actaCardMeta">{detailMeeting.finalSummary}</p>
                  </div>
                </div>
              )}

              <div className="controlActasFormActions">
                <button className="controlActasSecondaryBtn" onClick={closeDetailPanel} type="button">
                  Cerrar
                </button>
              </div>
            </aside>
          </>
        )}

        {cancelTarget && (
          <>
            <div className="controlActasBackdrop" onClick={closeCancelModal} />
            <div className="controlActasModal" role="dialog" aria-modal="true">
              <div className="controlActasModalHeader">
                <h3>Cancelar reunión</h3>
                <button
                  aria-label="Cerrar"
                  className="controlActasCloseBtn"
                  onClick={closeCancelModal}
                  type="button"
                >
                  <IconX size={18} />
                </button>
              </div>
              <p className="actaCardMeta">{cancelTarget.title}</p>
              <div className="controlActasField">
                <label htmlFor="cancel-reason">Motivo de la cancelación</label>
                <textarea
                  id="cancel-reason"
                  maxLength={500}
                  onChange={(event) => setCancelReason(event.target.value)}
                  placeholder="Explica por qué no se realizará la reunión (mínimo 10 caracteres)."
                  rows={4}
                  value={cancelReason}
                />
              </div>
              {cancelError && <p className="controlActasError">{cancelError}</p>}
              <div className="controlActasFormActions">
                <button
                  className="controlActasSecondaryBtn"
                  onClick={closeCancelModal}
                  type="button"
                >
                  Volver
                </button>
                <button
                  className="controlActasCardBtn controlActasCardBtn--ghost"
                  disabled={isCancelling}
                  onClick={confirmCancelMeeting}
                  type="button"
                >
                  {isCancelling ? "Cancelando..." : "Confirmar cancelación"}
                </button>
              </div>
            </div>
          </>
        )}

        {isLoading && (
          <div className="emptyState">
            <p>Cargando reuniones...</p>
          </div>
        )}

        {!isLoading && errorMsg && !isFormOpen && (
          <p className="controlActasError">{errorMsg}</p>
        )}

        {!isLoading && filteredMeetings.length === 0 && hasActiveFilters(listFilters) ? (
          <EmptyState
            action={{ label: "Limpiar filtros", onClick: clearListFilters }}
            description="Ninguna reunión coincide con la búsqueda o el rango de fechas. Ajusta o limpia los filtros para ver más resultados."
            icon={<IconSearchOff size={28} />}
            title="Sin coincidencias"
          />
        ) : !isLoading && filteredMeetings.length === 0 ? (
          <div className="emptyState">
            <p>No se encontraron reuniones registradas.</p>
          </div>
        ) : (
          <ul className="actasList">
            {pagedMeetings.map((meeting) => (
              <li key={meeting.id} className="actaCard">
                <div className="actaCardStatusRow">
                  <span
                    className={`actaStatusBadge actaStatusBadge--${(meeting.status || "").toLowerCase()}`}
                  >
                    {STATUS_LABELS[meeting.status] || meeting.status}
                  </span>
                </div>
                <h3 className="actaCardTitle">{meeting.title}</h3>
                <span className="actaCardDate">Inicio: {formatMeetingDate(meeting.date)}</span>
                <p className="actaCardMeta">Lugar: {meeting.location || "Sin lugar"}</p>
                <p className="actaCardMeta">Modalidad: {meeting.modality || "Sin modalidad"}</p>
                <p className="actaCardMeta">
                  Agenda: {meeting.agendaConsolidated ? "Consolidada" : "Abierta para puntos"}
                </p>
                {meeting.status === "CANCELADA" && (
                  <p className="actaCardMeta actaCardMeta--cancelled">
                    Cancelada: {meeting.cancellationReason || "Sin motivo registrado"}
                    {meeting.cancelledBy?.name ? ` — ${meeting.cancelledBy.name}` : ""}
                  </p>
                )}
                <div className="actaCardActions">
                  <button
                    className="controlActasCardBtn controlActasCardBtn--ghost"
                    onClick={() => openDetailPanel(meeting)}
                    type="button"
                  >
                    Ver detalles
                  </button>
                  {canCancelMeetings && canCancelMeeting(meeting) && (
                    <button
                      className="controlActasCardBtn controlActasCardBtn--ghost"
                      disabled={isCancelling}
                      onClick={() => openCancelModal(meeting)}
                      type="button"
                    >
                      Cancelar Reunion
                    </button>
                  )}
                  {canEditMeetings && isMeetingEditable(meeting) && (
                    <>
                      <button
                        className="controlActasCardBtn controlActasCardBtn--primary"
                        onClick={() => openEditPanel(meeting)}
                        type="button"
                      >
                        Editar Reunion
                      </button>
                      <button
                        className="controlActasCardBtn controlActasCardBtn--finalize"
                        onClick={() => openDetailPanel(meeting)}
                        type="button"
                      >
                        Subir Acta
                      </button>
                    </>
                  )}
                </div>
              </li>
            ))}
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
    </div>
  );
};

export default ControlActas;
