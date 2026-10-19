import {
  conditionOptions,
  dedicationOptions,
  roleOptions,
  statusOptions,
} from "../../constants";

export const selectFields = [
  { isMulti: true, key: "role", label: "Rol", options: roleOptions },
  { isMulti: true, key: "dedicacion", label: "Dedicación", options: dedicationOptions },
  { isMulti: true, key: "condicion", label: "Condición", options: conditionOptions },
  { key: "status", label: "Estado", options: statusOptions },
];

export const selectStyles = {
  container: (base) => ({ ...base, width: "100%" }),
  control: (base, state) => ({
    ...base,
    backgroundColor: "#f8fafc",
    borderColor: state.isFocused ? "#bfdbfe" : "#dbe3ef",
    borderRadius: 10,
    boxShadow: state.isFocused ? "0 0 0 2px rgba(37, 99, 235, 0.15)" : "none",
    flexWrap: "nowrap",
    minHeight: 38,
    "&:hover": { borderColor: "#bfdbfe" },
  }),
  valueContainer: (base) => ({
    ...base,
    flexWrap: "nowrap",
    overflow: "hidden",
    padding: "0 10px",
    position: "relative",
  }),
  placeholder: (base) => ({ ...base, color: "#475569" }),
  singleValue: (base) => ({ ...base, color: "#0f172a" }),
  dropdownIndicator: (base) => ({ ...base, color: "#64748b", padding: "0 8px" }),
  clearIndicator: (base) => ({
    ...base,
    color: "#94a3b8",
    cursor: "pointer",
    padding: "0 4px",
    "&:hover": { color: "#b91c1c" },
  }),
  indicatorSeparator: (base) => ({ ...base, backgroundColor: "#dbe3ef" }),
  menu: (base) => ({
    ...base,
    border: "1px solid #e2e8f0",
    borderRadius: 10,
    boxShadow: "0 8px 24px rgba(16, 24, 40, 0.12)",
    overflow: "hidden",
    zIndex: 20,
  }),
  option: (base, state) => ({
    ...base,
    alignItems: "center",
    backgroundColor: state.isSelected
      ? "#eff6ff"
      : state.isFocused
        ? "#f7f9fc"
        : "#ffffff",
    color: state.isSelected ? "#1d4ed8" : "#0f172a",
    cursor: "pointer",
    display: "flex",
    gap: 8,
  }),
};
