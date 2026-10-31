import { useEffect, useRef } from "react";
import { IconPrinter, IconX } from "@tabler/icons-react";
import { formatDate } from "../../utils";
import "./styles.css";

const WarningDocument = ({ onClose, warning }) => {
  const dialog = useRef(null);
  const evidence = warning.evidence || {};
  const teacher = evidence.teacher || warning.teacher;
  const issuer = evidence.issuer || warning.issuedBy;
  useEffect(() => { dialog.current?.showModal(); }, []);

  return <dialog aria-labelledby="warning-document-title" className="warningDocument" onClose={onClose} ref={dialog}>
    <div className="warningDocumentTools">
      <button aria-label="Imprimir amonestación" className="attIconBtn" onClick={() => window.print()} title="Imprimir amonestación" type="button"><IconPrinter size={18} /></button>
      <button aria-label="Cerrar amonestación" className="attIconBtn" onClick={onClose} title="Cerrar" type="button"><IconX size={18} /></button>
    </div>
    <header className="warningDocumentHeader"><span>UPT José Félix Ribas</span><h2 id="warning-document-title">Amonestación por inasistencias injustificadas</h2><p>Año {warning.academicYear}</p></header>
    <dl className="warningDocumentMeta">
      <div><dt>Docente</dt><dd>{teacher?.name}</dd></div>
      <div><dt>Cédula</dt><dd>{teacher?.cedula || "No registrada"}</dd></div>
      <div><dt>Emitida</dt><dd>{formatDate(warning.issuedAt)}</dd></div>
      <div><dt>Responsable de Secretaría</dt><dd>{issuer?.name || "No disponible"}</dd></div>
    </dl>
    <h3>Motivo y acción realizada</h3><p className="warningDocumentContent">{warning.summary}</p>
    <h3>Inasistencias que sustentan la emisión ({warning.absencesCount})</h3>
    <ol className="warningDocumentEvidence">{(evidence.absences || []).map((absence) => <li key={absence.attendanceId}><strong>{absence.title}</strong><span>{formatDate(absence.date)}</span></li>)}</ol>
    <footer>Referencia: {warning.id}</footer>
  </dialog>;
};

export default WarningDocument;