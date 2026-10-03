export const mockUsers = [
  { id: 1, name: "Coordinadora", role: "Administrador" },
  { id: 2, name: "Asistente", role: "Secretario" },
  { id: 3, name: "Profesor A", role: "Docente" },
  { id: 4, name: "Invitado X", role: "Invitado" },
];

export const mockAgenda = [
  { id: 1, type: "Informativo", title: "Calendario académico" },
  { id: 2, type: "A desarrollar", title: "Propuesta de curso" },
  { id: 3, type: "Pendiente", title: "Tema pendiente de reunión anterior" },
  { id: 4, type: "Acuerdo", title: "Votación sobre presupuesto", fulfilled: false },
];

export const mockAttendance = {
  totalDocentes: 11,
  present: [3, 1, 2, 4, 5, 6],
};

export const mockActas = [
  { id: 1, title: "Acta - Consejo de carrera 2025-01", date: "2025-03-01", type: "Consejo de carrera" },
  { id: 2, title: "Acta - SIP pedagógico 2025-02", date: "2025-04-12", type: "SIP pedagógico" },
  { id: 3, title: "Acta - Asambleas 2025-03", date: "2025-05-05", type: "Asambleas" },
];
