import { ELLIPSIS } from "./constants";

export const getTotalPages = (totalItems, pageSize) =>
  Math.max(1, Math.ceil(totalItems / pageSize));

export const clampPage = (page, totalItems, pageSize) =>
  Math.min(Math.max(1, page), getTotalPages(totalItems, pageSize));

export const paginate = (items, page, pageSize) => {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
};

export const getPageNumbers = (currentPage, totalPages) => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = [1];
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  if (start > 2) pages.push(ELLIPSIS);
  for (let page = start; page <= end; page += 1) pages.push(page);
  if (end < totalPages - 1) pages.push(ELLIPSIS);
  pages.push(totalPages);

  return pages;
};

// Caps the options at the total so the selector never offers more than exists.
export const getPageSizeOptions = (options, totalItems) => {
  const capped = options.filter((option) => option < totalItems);
  return [...capped, totalItems];
};
