import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { IconFileDescription, IconHistory, IconRefresh } from "@tabler/icons-react";
import meetingsService from "../../../../api/services/meetingsService";
import Pagination from "../../../../components/Pagination";
import { useAuth } from "../../../../context/AuthContext";
import WarningDocument from "./components/WarningDocument";
import { currentYear, formatDate, requestError } from "./utils";
import "./styles.css";

const Sanctions = () => {
  const { user } = useAuth();
  const isTeacher = user?.role === "DOCENTE";
  const canIssue = user?.role === "SECRETARIO";
  const [tab, setTab] = useState(isTeacher ? "warnings" : "cases");
  const [year, setYear] = useState(currentYear);
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const [selectedCase, setSelectedCase] = useState("");
  const [content, setContent] = useState("");
  const [issuing, setIssuing] = useState(false);
  const [document, setDocument] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setData(null);
    setError("");
    const params = { page, limit: 20, ...(year ? { year } : {}) };
    const load = tab === "cases" && !isTeacher
      ? meetingsService.listAbsenceCases(params, { signal: controller.signal })
      : meetingsService.listWarnings(params, { signal: controller.signal });
    load.then((result) => { if (!controller.signal.aborted) setData(result); })
      .catch((failure) => { if (!controller.signal.aborted) setError(requestError(failure)); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [tab, year, page, revision, isTeacher]);

  const changeTab = (next) => {
    setTab(next); setPage(1); setSelectedCase(""); setContent("");
    if (next === "cases" && !year) setYear(currentYear());
  };

  const issue = async (event, item) => {
    event.preventDefault();
    if (issuing) return;
    setIssuing(true);
    setError("");
    try {
      const result = await meetingsService.issueWarning(item.teacher.id, { year: Number(year), content: content.trim() });
      setDocument(result); setSelectedCase(""); setContent(""); setRevision((value) => value + 1);
    } catch (failure) { setError(requestError(failure)); }
    finally { setIssuing(false); }
  };

  return (
    <section aria-busy={loading} className="sanctionsPage">
      <header className="sanctionsHeader">
        <h2>{isTeacher ? "Mis amonestaciones" : "Inasistencias"}</h2>
        <button aria-label="Actualizar inasistencias" className="attIconBtn" disabled={issuing} onClick={() => setRevision((value) => value + 1)} title="Actualizar" type="button"><IconRefresh size={18} /></button>
      </header>
      {!isTeacher && <div aria-label="Seguimiento de inasistencias" className="sanctionsTabs" role="tablist">
        <button aria-selected={tab === "cases"} disabled={issuing} onClick={() => changeTab("cases")} role="tab" type="button">Casos con 3 faltas o más</button>
        <button aria-selected={tab === "warnings"} disabled={issuing} onClick={() => changeTab("warnings")} role="tab" type="button">Amonestaciones emitidas</button>
      </div>}
      <label className="sanctionsYear">Año
        <select disabled={issuing} onChange={(event) => { setYear(event.target.value); setPage(1); setSelectedCase(""); }} value={year}>
          {tab === "warnings" && <option value="">Todos los años</option>}
          {Array.from({ length: currentYear() - 1999 }, (_, index) => currentYear() - index).map((value) => <option key={value} value={value}>{value}</option>)}
        </select>
      </label>
      {error && <div className="attMessage attMessage--error" role="alert">{error}</div>}
      {loading && <p role="status">Cargando registros...</p>}
      {!loading && data?.items.length === 0 && <p className="sanctionsEmpty">{tab === "cases" ? "No hay docentes con tres faltas injustificadas en este año." : "No hay amonestaciones emitidas para este período."}</p>}
      {!loading && data && <>
        <div className="sanctionsList">
          {data.items.map((item) => tab === "cases" ? <article className="sanctionsCard" key={item.teacher.id}>
            <header className="sanctionsCardHead"><div><h3>{item.teacher.name}</h3><p>{item.absencesCount} inasistencias injustificadas · {year}{!item.teacher.isActive ? " · Docente inactivo" : ""}</p></div>
              <span className={`sanctionsStatus ${item.warning ? "sanctionsStatus--revisada" : "sanctionsStatus--pendiente"}`}>{item.warning ? "Emitida" : "Sin amonestación"}</span>
            </header>
            <ul className="sanctionsAbsences">{item.absences.map((absence) => <li key={absence.id}><strong>{absence.meeting.title}</strong><time dateTime={absence.meeting.date}>{formatDate(absence.meeting.date)}</time></li>)}</ul>
            <div className="sanctionsActions">
              {user?.role === "ADMIN" && <Link className="sanctionsBtn sanctionsBtn--ghost" to={`/dashboard/attendance?view=history&teacherId=${item.teacher.id}&year=${year}`}><IconHistory size={17} />Ver historial</Link>}
              {item.warning ? <button className="sanctionsBtn sanctionsBtn--ghost" onClick={() => setDocument(item.warning)} type="button"><IconFileDescription size={17} />Ver amonestación</button>
                : canIssue && <button className="sanctionsBtn sanctionsBtn--primary" disabled={issuing} onClick={() => { setSelectedCase(item.teacher.id); setContent(""); }} type="button"><IconFileDescription size={17} />Preparar amonestación</button>}
            </div>
            {canIssue && !item.warning && selectedCase === item.teacher.id && <form className="sanctionsIssueForm" onSubmit={(event) => issue(event, item)}>
              <label htmlFor={`warning-${item.teacher.id}`}>Motivo y acción realizada</label>
              <textarea className="sanctionsNotes" disabled={issuing} id={`warning-${item.teacher.id}`} maxLength={4000} minLength={20} onChange={(event) => setContent(event.target.value)} required rows={5} value={content} />
              <div className="sanctionsActions">
                <button className="sanctionsBtn sanctionsBtn--ghost" disabled={issuing} onClick={() => setSelectedCase("")} type="button">Cancelar</button>
                <button className="sanctionsBtn sanctionsBtn--primary" disabled={issuing || content.trim().length < 20} type="submit"><IconFileDescription size={17} />{issuing ? "Emitiendo..." : "Emitir y guardar"}</button>
              </div>
            </form>}
          </article> : <article className="sanctionsCard" key={item.id}>
            <header className="sanctionsCardHead"><div><h3>{item.evidence?.teacher?.name || item.teacher.name}</h3><p>{item.academicYear} · {item.absencesCount} faltas al emitir · {formatDate(item.issuedAt)}</p></div><span className="sanctionsStatus sanctionsStatus--revisada">Emitida</span></header>
            <p className="sanctionsPreview">{item.summary}</p>
            <div className="sanctionsActions"><button className="sanctionsBtn sanctionsBtn--ghost" onClick={() => setDocument(item)} type="button"><IconFileDescription size={17} />Ver amonestación</button></div>
          </article>)}
        </div>
        <Pagination currentPage={page} itemLabel={tab === "cases" ? "casos" : "amonestaciones"} onPageChange={setPage} pageSize={20} totalItems={data.total} />
      </>}
      {document && <WarningDocument onClose={() => setDocument(null)} warning={document} />}
    </section>
  );
};

export default Sanctions;
