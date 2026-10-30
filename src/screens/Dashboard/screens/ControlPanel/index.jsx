import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../../context/AuthContext";
import { useNotifications } from "../../../../context/NotificationsContext";
import meetingsService from "../../../../api/services/meetingsService";
import { downloadBlob } from "../../../../utils/download";
import {
  IconChecklist,
  IconDownload,
  IconEye,
  IconFileText,
  IconHandStop,
  IconPencil,
  IconUser,
  IconUsers,
} from "@tabler/icons-react";

import "./styles.css";

const ControlPanel = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [meetings, setMeetings] = React.useState([]);
  const [isStatsLoading, setIsStatsLoading] = React.useState(true);
  const { addNotification } = useNotifications();
  const [annualArchives, setAnnualArchives] = React.useState([]);
  const [annualCloseYear, setAnnualCloseYear] = React.useState(String(new Date().getFullYear()));
  const [annualMsg, setAnnualMsg] = React.useState("");
  const [isAnnualCloseModalOpen, setIsAnnualCloseModalOpen] = React.useState(false);
  const [isClosingYear, setIsClosingYear] = React.useState(false);

  const roleLabel = (r) => {
    if (!r) return "";
    const map = {
      ADMIN: "Coordinadora",
      SECRETARIO: "Secretario",
      DOCENTE: "Docente",
    };
    return map[r] || r;
  };

  const quickAccessByRole = {
    ADMIN: {
      actions: [
        {
          description: "Crea y publica reuniones.",
          href: "/dashboard/controlreuniones",
          icon: IconFileText,
          title: "Gestion de Reuniones",
        },
        {
          description: "Controla roles y accesos.",
          href: "/dashboard/users",
          icon: IconUsers,
          title: "Gestión de Usuarios",
        },
        {
          description: "Da seguimiento a decisiones.",
          href: "/dashboard/voting",
          icon: IconChecklist,
          title: "Control de Acuerdos",
        },
      ],
    },
    SECRETARIO: {
      actions: [
        {
          description: "Coordina reuniones rapidamente.",
          href: "/dashboard/controlreuniones",
          icon: IconPencil,
          title: "Coordinacion de Reuniones",
        },
        {
          description: "Registra acuerdos clave.",
          href: "/dashboard/voting",
          icon: IconChecklist,
          title: "Registro de Acuerdos",
        },
        {
          description: "Revisa pendientes del día.",
          href: "/dashboard/attendance",
          icon: IconEye,
          title: "Seguimiento Diario",
        },
      ],
    },
    DOCENTE: {
      actions: [
        {
          description: "Propón hasta 2 puntos.",
          href: "/dashboard/agenda",
          icon: IconHandStop,
          title: "Propuesta de Puntos",
        },
        {
          description: "Consulta acuerdos aprobados.",
          href: "/dashboard/voting",
          icon: IconEye,
          title: "Consulta de Acuerdos",
        },
        {
          description: "Consulta reuniones vigentes.",
          href: "/dashboard/reuniones",
          icon: IconFileText,
          title: "Estado de Reuniones",
        },
      ],
    },
  };

  const quickAccessCards =
    quickAccessByRole[user?.role]?.actions || quickAccessByRole.DOCENTE.actions;

  React.useEffect(() => {
    meetingsService
      .list()
      .then((list) => setMeetings(Array.isArray(list) ? list : []))
      .catch(() => setMeetings([]))
      .finally(() => setIsStatsLoading(false));
  }, []);

  const stats = React.useMemo(() => {
    const points = meetings.flatMap((meeting) => meeting.agendaPoints || []);
    return {
      activeMeetings: meetings.filter((meeting) => ["PROGRAMADA", "EN_CURSO"].includes(meeting.status)).length,
      agreements: meetings
        .filter((meeting) => meeting.status === "FINALIZADA")
        .flatMap((meeting) => meeting.agendaPoints || [])
        .filter((point) => point.status === "APROBADO" && !point.isBasePoint).length,
      pendingPoints: points.filter((point) => point.status === "PENDIENTE").length,
      totalMeetings: meetings.length,
    };
  }, [meetings]);

  const formatStat = (value) => (isStatsLoading ? "—" : value);

  React.useEffect(() => {
    const loadArchives = async () => {
      if (user?.role !== "ADMIN") return;
      try {
        const data = await meetingsService.listAnnualArchives();
        setAnnualArchives(Array.isArray(data) ? data : []);
      } catch {
        setAnnualMsg("No se pudo cargar el historial de cierres anuales.");
      }
    };

    loadArchives();
  }, [user?.role]);

  const handleAnnualClose = async () => {
    const year = Number(annualCloseYear);
    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      setAnnualMsg("Año inválido. Debe estar entre 2000 y 2100.");
      addNotification({
        message: "El año indicado para el cierre anual no es válido.",
        title: "Cierre anual no válido",
        type: "error",
      });
      return;
    }

    setIsClosingYear(true);
    setAnnualMsg("");
    try {
      await meetingsService.closeAnnualYear(year);
      const data = await meetingsService.listAnnualArchives();
      setAnnualArchives(Array.isArray(data) ? data : []);
      setAnnualMsg(`Cierre anual ${year} generado correctamente.`);
      setIsAnnualCloseModalOpen(false);
      addNotification({
        actionHref: "/dashboard/controlpanel",
        actionLabel: "Ver cierre",
        message: `Se generó el cierre anual ${year} con su reporte institucional y respaldo técnico.`,
        title: "Cierre anual completado",
        type: "success",
      });
    } catch (err) {
      const nextMessage =
        err?.response?.data?.message ||
        "No se pudo generar el cierre anual. Intenta nuevamente.";
      setAnnualMsg(nextMessage);
      addNotification({
        message: nextMessage,
        title: "Error al cerrar el año",
        type: "error",
      });
    } finally {
      setIsClosingYear(false);
    }
  };

  const handleDownloadAnnualPdf = async (year) => {
    setAnnualMsg("Generando PDF...");
    try {
      const blob = await meetingsService.downloadAnnualReportPdf(year);
      downloadBlob(blob, `Cierre-anual-${year}.pdf`);
      setAnnualMsg("");
    } catch {
      setAnnualMsg("No se pudo generar el PDF del cierre anual.");
    }
  };

  return (
    <div className="contenDashboard">
      <header className="cp-header">
        <div>
          <h2 className="cp-title">Panel de Control</h2>
          {user && (
            <div className="cp-profile">
              <div className="cp-profile-icon">
                <IconUser size={24} />
              </div>
              <div className="cp-profile-info">
                <span className="cp-welcome">Bienvenido, {user.name || user.email}</span>
                <span className="cp-roleTag">Perfil: {roleLabel(user.role)}</span>
              </div>
            </div>
          )}
        </div>
        {user?.role === "ADMIN" && (
          <div className="cp-adminActions">
            <button
              type="button"
              className="cp-manageUsersBtn"
              disabled={isClosingYear}
              onClick={() => {
                setAnnualCloseYear(String(new Date().getFullYear()));
                setIsAnnualCloseModalOpen(true);
              }}
            >
              <IconFileText size={18} />
              {isClosingYear ? "Cerrando año..." : "Ejecutar Cierre Anual"}
            </button>
            <button
              type="button"
              className="cp-manageUsersBtn"
              onClick={() => navigate("/dashboard/users")}
            >
              <IconUsers size={18} />
              Administrar Usuarios
            </button>
          </div>
        )}
      </header>

      {user?.role === "ADMIN" && (
        <section className="cp-section">
          <div className="cp-card">
            <h4 className="cp-subtitle">Cierres anuales</h4>
            <p className="cp-cardText">
              Cada cierre genera un archivo comprimido con el consolidado del año y bloquea ese año en modo lectura.
            </p>
            {annualMsg && <p className="cp-cardText">{annualMsg}</p>}
            {annualArchives.length === 0 ? (
              <p className="cp-cardText">Aún no hay cierres anuales registrados.</p>
            ) : (
              <div className="cp-annualList">
                {annualArchives.map((item) => (
                  <div className="cp-annualItem" key={item.fileName}>
                    <div>
                      <strong>Cierre {item.year}</strong>
                      <p className="cp-cardText">{item.meetingsCount} reuniones consolidadas.</p>
                    </div>
                    <div className="cp-annualLinks">
                      <Link className="cp-annualDownload" to={`/annual-report/${item.year}`}>
                        <IconEye size={16} />
                        Ver reporte
                      </Link>
                      <button
                        className="cp-annualDownload"
                        onClick={() => handleDownloadAnnualPdf(item.year)}
                        type="button"
                      >
                        <IconFileText size={16} />
                        Descargar PDF
                      </button>
                      <a
                        className="cp-annualDownload"
                        href={`${import.meta.env.VITE_API_URL || "http://localhost:5000"}${item.backupUrl || item.fileUrl}`}
                        rel="noreferrer"
                        target="_blank"
                      >
                        <IconDownload size={16} />
                        Respaldo
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {user?.role === "ADMIN" && isAnnualCloseModalOpen && (
        <>
          <div className="cp-modalBackdrop" onClick={() => setIsAnnualCloseModalOpen(false)} />
          <div className="cp-modalCard" role="dialog" aria-modal="true">
            <h3 className="cp-subtitle">Confirmar cierre anual</h3>
            <p className="cp-cardText">
              Esta acción consolidará el año en un reporte institucional y dejará ese período en modo solo lectura.
            </p>
            <label className="cp-modalLabel" htmlFor="annual-close-year">Año lectivo</label>
            <input
              className="cp-modalInput"
              id="annual-close-year"
              max="2100"
              min="2000"
              onChange={(event) => setAnnualCloseYear(event.target.value)}
              type="number"
              value={annualCloseYear}
            />
            <div className="cp-modalActions">
              <button className="cp-modalBtn cp-modalBtn--secondary" onClick={() => setIsAnnualCloseModalOpen(false)} type="button">
                Cancelar
              </button>
              <button className="cp-modalBtn cp-modalBtn--primary" disabled={isClosingYear} onClick={handleAnnualClose} type="button">
                {isClosingYear ? "Procesando..." : "Confirmar cierre"}
              </button>
            </div>
          </div>
        </>
      )}

      <div className="cp-stats-grid">
        <div className="cp-stat-card">
          <span className="cp-stat-title">Total Reuniones</span>
          <span className="cp-stat-number">{formatStat(stats.totalMeetings)}</span>
        </div>
        <div className="cp-stat-card">
          <span className="cp-stat-title">Reuniones Activas</span>
          <span className="cp-stat-number">{formatStat(stats.activeMeetings)}</span>
        </div>
        <div className="cp-stat-card">
          <span className="cp-stat-title">Puntos Pendientes</span>
          <span className="cp-stat-number">{formatStat(stats.pendingPoints)}</span>
        </div>
        <div className="cp-stat-card">
          <span className="cp-stat-title">Acuerdos Cerrados</span>
          <span className="cp-stat-number">{formatStat(stats.agreements)}</span>
        </div>
      </div>

      <div className="cp-content">
        <section className="cp-section">
          <div className="cp-summary">
            <div className="cp-card cp-card--feature">
              <div className="cp-featureHeader">
                <h4 className="cp-subtitle">Lo que puedes hacer</h4>
              </div>
              <div className="cp-quickGrid">
                {quickAccessCards.map(({ description, href, icon: CardIcon, title }) => (
                  <button
                    className="cp-quickCard"
                    key={title}
                    onClick={() => navigate(href)}
                    type="button"
                  >
                    <div className="cp-quickIcon">
                      <CardIcon size={20} />
                    </div>
                    <div className="cp-quickBody">
                      <h5 className="cp-quickTitle">{title}</h5>
                      <p className="cp-quickDesc">{description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ControlPanel;
