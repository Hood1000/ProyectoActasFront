export const roleOptions = [
  { label: "Coordinadora", value: "ADMIN" },
  { label: "Secretario", value: "SECRETARIO" },
  { label: "Docente", value: "DOCENTE" },
];

export const dedicationOptions = [
  { label: "Exclusiva", value: "EXCLUSIVA" },
  { label: "Tiempo completo", value: "TIEMPO_COMPLETO" },
  { label: "Medio tiempo", value: "MEDIO_TIEMPO" },
  { label: "Tiempo convencional", value: "TIEMPO_CONVENCIONAL" },
];

export const conditionOptions = [
  { label: "Ordinario", value: "ORDINARIO" },
  { label: "Contratado", value: "CONTRATADO" },
  { label: "Interino", value: "INTERINO" },
];

export const statusOptions = [
  { label: "Activo", value: "ACTIVE" },
  { label: "Inactivo", value: "INACTIVE" },
];

export const EMPTY_FILTERS = {
  condicion: [],
  dedicacion: [],
  role: [],
  search: "",
  status: "",
};
