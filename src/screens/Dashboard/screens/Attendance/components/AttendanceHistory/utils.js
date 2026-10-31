export const currentPeriod = () => {
  const parts = new Intl.DateTimeFormat("en-US", { month: "numeric", timeZone: "America/Caracas", year: "numeric" }).formatToParts(new Date());
  return { month: Number(parts.find((part) => part.type === "month").value), year: Number(parts.find((part) => part.type === "year").value) };
};

export const formatAttendanceDate = (value) => value ? new Date(value).toLocaleString("es-VE", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Caracas" }) : "Sin fecha";
export const formatPercentage = (value) => value == null ? "Sin datos" : `${value.toLocaleString("es-VE", { maximumFractionDigits: 2 })} %`;
export const attendanceError = (error) => {
  const message = error?.response?.data?.message;
  return Array.isArray(message) ? message.join(". ") : message || "No se pudo cargar la información. Intenta nuevamente.";
};