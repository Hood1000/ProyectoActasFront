import React, { useRef, useState } from "react";
import { IconAlertTriangle, IconFileText, IconFlag, IconUpload } from "@tabler/icons-react";
import meetingsService from "../../../../../../api/services/meetingsService";
import { MAX_EVIDENCE_BYTES } from "../../../../../../utils/evidence";
import SessionModal from "../SessionModal";

/** Ventana para cargar el acta firmada y finalizar la reunión. */
const CloseMeetingModal = ({ meeting, onClose, onClosed, onOpenEvidence, openPollsCount }) => {
  const fileInputRef = useRef(null);
  const [actaFile, setActaFile] = useState(null);
  const [isClosing, setIsClosing] = useState(false);
  const [error, setError] = useState("");

  const hasEvidence = Boolean(meeting.evidenceSignaturesUrl);
  const canClose = hasEvidence || Boolean(actaFile);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    if (file && file.size > MAX_EVIDENCE_BYTES) {
      setActaFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setError("El archivo supera el máximo de 15 MB.");
      return;
    }
    setActaFile(file);
    setError("");
  };

  const handleClose = async () => {
    setIsClosing(true);
    setError("");
    try {
      if (actaFile) {
        await meetingsService.uploadEvidenceFile(meeting.id, actaFile);
      }
      onClosed(await meetingsService.closeMeeting(meeting.id));
    } catch (err) {
      setError(err?.response?.data?.message || "No se pudo finalizar la reunión.");
      setIsClosing(false);
    }
  };

  return (
    <SessionModal
      busy={isClosing}
      footer={
        <>
          <button className="msessionBtn msessionBtn--ghost" disabled={isClosing} onClick={onClose} type="button">
            Cancelar
          </button>
          <button
            className="msessionBtn msessionBtn--danger"
            disabled={isClosing || !canClose}
            onClick={handleClose}
            type="button"
          >
            {isClosing ? "Finalizando…" : "Finalizar reunión"}
          </button>
        </>
      }
      icon={IconFlag}
      onClose={onClose}
      subtitle="Carga el acta firmada para cerrar oficialmente la sesión."
      title="Finalizar reunión"
      wide
    >
      <div className="msessionForm">
        <span className="msessionLabel">Acta firmada</span>
        {hasEvidence && (
          <button className="msessionLink" onClick={onOpenEvidence} type="button">
            <IconFileText size={15} /> Ver acta ya cargada
          </button>
        )}
        <label className="msessionDropzone" htmlFor="msession-acta-input">
          <IconUpload size={20} />
          <span>
            {actaFile ? actaFile.name : hasEvidence ? "Reemplazar acta (opcional)" : "Seleccionar acta firmada"}
            <small>PDF, Word o imagen JPG/PNG/WebP · máx. 15 MB</small>
          </span>
          <input
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
            id="msession-acta-input"
            onChange={handleFileChange}
            ref={fileInputRef}
            type="file"
          />
        </label>

        <div className="msessionWarning">
          <IconAlertTriangle size={18} />
          <div>
            <strong>Esta acción no se puede deshacer.</strong>
            <ul>
              <li>
                {openPollsCount > 0
                  ? `Se cerrarán ${openPollsCount} votación${openPollsCount === 1 ? "" : "es"} abierta${openPollsCount === 1 ? "" : "s"}.`
                  : "No hay votaciones abiertas."}
              </li>
              <li>El chat quedará como registro de solo lectura.</li>
              <li>Ya no se podrán registrar votos ni cambios de asistencia.</li>
            </ul>
          </div>
        </div>

        {error && <p className="msessionMsg msessionMsg--bad">{error}</p>}
      </div>
    </SessionModal>
  );
};

export default CloseMeetingModal;
