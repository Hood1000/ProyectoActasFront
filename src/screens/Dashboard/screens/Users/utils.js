const DIACRITICS_REGEX = /[̀-ͯ]/g;

export const normalizeText = (value) =>
  (value ?? "")
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(DIACRITICS_REGEX, "");

export const filterUsers = (users, filters) => {
  const { search, role, dedicacion, condicion, status } = filters;
  const term = normalizeText(search).trim();

  return users.filter((u) => {
    if (term) {
      const haystack = normalizeText(`${u.nombreCompleto} ${u.email} ${u.cedula}`);
      if (!haystack.includes(term)) return false;
    }
    if (role.length && !role.includes(u.role)) return false;
    if (dedicacion.length && !dedicacion.includes(u.dedicacion)) return false;
    if (condicion.length && !condicion.includes(u.condicion)) return false;
    if (status === "ACTIVE" && !u.isActive) return false;
    if (status === "INACTIVE" && u.isActive) return false;
    return true;
  });
};
