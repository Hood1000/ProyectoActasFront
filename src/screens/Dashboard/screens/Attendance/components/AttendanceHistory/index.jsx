import { useDeferredValue, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { IconArrowLeft, IconChevronRight, IconRefresh } from "@tabler/icons-react";
import meetingsService from "../../../../../../api/services/meetingsService";
import Pagination from "../../../../../../components/Pagination";
import { CATEGORY_LABELS, MONTHS, STATUS_LABELS } from "./constants";
import { attendanceError, currentPeriod, formatAttendanceDate, formatPercentage } from "./utils";
import "./styles.css";

const AttendanceHistory = () => {
  const [params, setParams] = useSearchParams();
  const teacherId = params.get("teacherId") || "";
  const [year, setYear] = useState(() => params.get("year") || currentPeriod().year);
  const [month, setMonth] = useState(() => params.has("teacherId") ? "" : currentPeriod().month);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const query = { page, limit: 20, ...(year ? { year } : {}), ...(year && month ? { month } : {}), ...(!teacherId && deferredSearch.trim() ? { search: deferredSearch.trim() } : {}) };
    setLoading(true);
    setData(null);
    setError("");
    const load = teacherId
      ? meetingsService.getTeacherAttendanceHistory(teacherId, query, { signal: controller.signal })
      : meetingsService.getAttendanceSummary(query, { signal: controller.signal });
    load.then((result) => { if (!controller.signal.aborted) setData(result); })
      .catch((failure) => { if (!controller.signal.aborted) setError(attendanceError(failure)); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [teacherId, year, month, page, deferredSearch, revision]);

  const selectTeacher = (id) => {
    setPage(1);
    setParams((previous) => {
      const next = new URLSearchParams(previous);
      if (id) next.set("teacherId", id); else next.delete("teacherId");
      next.set("view", "history");
      return next;
    });
  };

  return (
    <section aria-busy={loading} className="attendanceHistory">
      <header className="attendanceHistoryHeader">
        <div className="attendanceHistoryTitle">
          {teacherId && <button aria-label="Volver a docentes" className="attIconBtn" onClick={() => selectTeacher("")} title="Volver a docentes" type="button"><IconArrowLeft size={18} /></button>}
          <div><h2>{data?.teacher?.name || "Historial por docente"}</h2>{data?.teacher && <span>Cédula: {data.teacher.cedula || "No registrada"}{!data.teacher.isActive ? " · Inactivo" : ""}</span>}</div>
        </div>
        <button aria-label="Actualizar historial" className="attIconBtn" onClick={() => setRevision((value) => value + 1)} title="Actualizar historial" type="button"><IconRefresh size={18} /></button>
      </header>

      <div className="attendanceHistoryFilters">
        <label>Año<select onChange={(event) => { setYear(event.target.value); setMonth(""); setPage(1); }} value={year}>
          <option value="">Todo el histórico</option>
          {Array.from({ length: currentPeriod().year - 1999 }, (_, index) => currentPeriod().year - index).map((value) => <option key={value} value={value}>{value}</option>)}
        </select></label>
        <label>Mes<select disabled={!year} onChange={(event) => { setMonth(event.target.value); setPage(1); }} value={month}>
          <option value="">Todos los meses</option>{MONTHS.map((label, index) => <option key={label} value={index + 1}>{label}</option>)}
        </select></label>
        {!teacherId && <label className="attendanceHistorySearch">Docente<input maxLength={120} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Nombre o cédula" type="search" value={search} /></label>}
      </div>

      {error && <div className="attMessage attMessage--error" role="alert">{error}</div>}
      {loading && <p role="status">Cargando historial...</p>}
      {!loading && data && <>
        {teacherId && <dl className="attendanceHistoryTotals">
          <div><dt>Presentes</dt><dd>{data.present}</dd></div>
          <div><dt>Injustificadas</dt><dd>{data.absent}</dd></div>
          <div><dt>Justificadas</dt><dd>{data.justified}</dd></div>
          <div><dt>Total evaluado</dt><dd>{data.total}</dd></div>
          <div><dt>Asistencia</dt><dd>{formatPercentage(data.percentage)}</dd></div>
        </dl>}
        {data.items.length === 0 ? <p className="attEmpty">{teacherId ? "No hay asistencias consolidadas en este período." : "No se encontraron docentes."}</p> : <div className="attendanceHistoryTableWrap">
          <table className="attendanceHistoryTable">
            <thead><tr>{(teacherId ? ["Reunión", "Fecha", "Asistencia", "Justificativo"] : ["Docente", "Presentes", "Injustificadas", "Justificadas", "Asistencia", "Detalle"]).map((label) => <th key={label} scope="col">{label}</th>)}</tr></thead>
            <tbody>{data.items.map((row) => teacherId ? <tr key={row.id}>
              <td><strong>{row.meeting.title}</strong><small>{CATEGORY_LABELS[row.meeting.meetingCategory]}</small></td>
              <td>{formatAttendanceDate(row.meeting.date)}</td>
              <td><span className={`attChip attChip--${row.status.toLowerCase()}`}>{STATUS_LABELS[row.status]}</span></td>
              <td>{row.excuse || "—"}</td>
            </tr> : <tr key={row.teacher.id}>
              <td><strong>{row.teacher.name}</strong><small>{row.teacher.cedula || "Sin cédula"}{!row.teacher.isActive ? " · Inactivo" : ""}</small></td>
              <td>{row.present}</td><td>{row.absent}</td><td>{row.justified}</td><td>{formatPercentage(row.percentage)}</td>
              <td><button aria-label={`Ver historial de ${row.teacher.name}`} className="attIconBtn" onClick={() => selectTeacher(row.teacher.id)} title="Ver historial" type="button"><IconChevronRight size={18} /></button></td>
            </tr>)}</tbody>
          </table>
        </div>}
        <Pagination currentPage={page} itemLabel={teacherId ? "registros" : "docentes"} onPageChange={setPage} pageSize={20} totalItems={data.total} />
      </>}
    </section>
  );
};

export default AttendanceHistory;