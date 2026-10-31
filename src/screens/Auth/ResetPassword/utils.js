export const readResetToken = () => {
  const token = new URLSearchParams(window.location.hash.slice(1)).get("token");
  return /^[A-Za-z0-9_-]{43}$/.test(token || "") ? token : "";
};

export const clearResetFragment = () => {
  window.history.replaceState(
    window.history.state,
    "",
    `${window.location.pathname}${window.location.search}`,
  );
};

export const protectResetPage = () => {
  clearResetFragment();

  const previousMeta = document.querySelector('meta[name="referrer"]');
  const meta = previousMeta || document.createElement("meta");
  const previousContent = meta.getAttribute("content");
  meta.setAttribute("name", "referrer");
  meta.setAttribute("content", "no-referrer");
  if (!previousMeta) document.head.appendChild(meta);

  return () => {
    if (!previousMeta) {
      meta.remove();
    } else if (previousContent === null) {
      meta.removeAttribute("content");
    } else {
      meta.setAttribute("content", previousContent);
    }
  };
};

export const validatePassword = (password, confirmation) => {
  if ([...password].length < 6) return "La contraseña debe tener al menos 6 caracteres.";
  if (new TextEncoder().encode(password).length > 72) {
    return "La contraseña no puede superar 72 bytes UTF-8. Las tildes y los emojis pueden ocupar varios bytes.";
  }
  if (password !== confirmation) return "Las contraseñas no coinciden.";
  return "";
};