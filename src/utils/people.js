export const ROLE_LABELS = {
  ADMIN: "Coordinación",
  SECRETARIO: "Secretaría",
  DOCENTE: "Docente",
};

export const getInitials = (name = "") => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

const AVATAR_COLORS = [
  { bg: "#dbeafe", fg: "#1e40af" },
  { bg: "#dcfce7", fg: "#166534" },
  { bg: "#fef3c7", fg: "#92400e" },
  { bg: "#fce7f3", fg: "#9d174d" },
  { bg: "#ede9fe", fg: "#5b21b6" },
  { bg: "#cffafe", fg: "#155e75" },
  { bg: "#ffedd5", fg: "#9a3412" },
  { bg: "#e0e7ff", fg: "#3730a3" },
];

// Mismo color para la misma persona en todas las pantallas.
export const getAvatarColor = (seed = "") => {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};
