import React from "react";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { ELLIPSIS, PAGE_SIZE_OPTIONS } from "./constants";
import { getPageNumbers, getPageSizeOptions, getTotalPages } from "./utils";
import "./styles.css";

const Pagination = ({
  currentPage,
  itemLabel = "resultados",
  onPageChange,
  onPageSizeChange,
  pageSize,
  totalItems,
}) => {
  const totalPages = getTotalPages(totalItems, pageSize);
  if (totalItems === 0) return null;

  return (
    <nav aria-label="Paginación" className="pagination">
      <div className="paginationSummary">
        {onPageSizeChange && (
          <select
            aria-label="Elementos por página"
            className="paginationSizeSelect"
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
            value={Math.min(pageSize, totalItems)}
          >
            {getPageSizeOptions(PAGE_SIZE_OPTIONS, totalItems).map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        )}
        <span>
          de {totalItems} {itemLabel}
        </span>
      </div>

      <div className="paginationControls">
        <button
          aria-label="Página anterior"
          className="paginationArrow"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          type="button"
        >
          <IconChevronLeft size={16} />
        </button>

        {getPageNumbers(currentPage, totalPages).map((page, index) =>
          page === ELLIPSIS ? (
            <span className="paginationEllipsis" key={`${ELLIPSIS}-${index}`}>
              …
            </span>
          ) : (
            <button
              aria-current={page === currentPage ? "page" : undefined}
              className={`paginationPage ${page === currentPage ? "active" : ""}`}
              key={page}
              onClick={() => onPageChange(page)}
              type="button"
            >
              {page}
            </button>
          ),
        )}

        <button
          aria-label="Página siguiente"
          className="paginationArrow"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          type="button"
        >
          <IconChevronRight size={16} />
        </button>
      </div>
    </nav>
  );
};

export default Pagination;
