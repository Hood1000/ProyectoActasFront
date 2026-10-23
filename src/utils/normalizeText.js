const DIACRITICS_REGEX = /[̀-ͯ]/g;

export const normalizeText = (value) =>
  (value ?? "")
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(DIACRITICS_REGEX, "");
