import React from "react";
import { IconSearch, IconX } from "@tabler/icons-react";
import { hasActiveFilters } from "./utils";
import "./styles.css";

const MeetingsFilters = ({ filters, onChange, onClear }) => {
  return (
    <div className="meetingsFilters">
      <div className="meetingsFiltersSearch">
        <IconSearch className="meetingsFiltersSearchIcon" size={18} />
        <input
          aria-label="Buscar reunión por nombre"
          className="meetingsFiltersSearchInput"
          onChange={(event) => onChange("search", event.target.value)}
          placeholder="Buscar por nombre de la reunión"
          type="text"
          value={filters.search}
        />
        {filters.search && (
          <button
            aria-label="Limpiar búsqueda"
            className="meetingsFiltersSearchClear"
            onClick={() => onChange("search", "")}
            type="button"
          >
            <IconX size={16} />
          </button>
        )}
      </div>

      <div className="meetingsFiltersDates">
        <label className="meetingsFiltersDateField">
          <span>Desde</span>
          <input
            max={filters.dateTo || undefined}
            onChange={(event) => onChange("dateFrom", event.target.value)}
            type="date"
            value={filters.dateFrom}
          />
        </label>
        <label className="meetingsFiltersDateField">
          <span>Hasta</span>
          <input
            min={filters.dateFrom || undefined}
            onChange={(event) => onChange("dateTo", event.target.value)}
            type="date"
            value={filters.dateTo}
          />
        </label>
      </div>

      {hasActiveFilters(filters) && (
        <button className="meetingsFiltersClearBtn" onClick={onClear} type="button">
          Limpiar filtros
        </button>
      )}
    </div>
  );
};

export default MeetingsFilters;
