export const currentYear = () => Number(new Intl.DateTimeFormat("en-US", { timeZone: "America/Caracas", year: "numeric" }).format(new Date()));
export const formatDate = (value) => value ? new Date(value).toLocaleString("es-VE", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Caracas" }) : "Sin fecha";
export const requestError = (error) => {
  const message = error?.response?.data?.message;
  return Array.isArray(message) ? message.join(". ") : message || "No se pudo completar la operación. Intenta nuevamente.";
};