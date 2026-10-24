import React from "react";
import Select, { components } from "react-select";
import { IconSearch, IconX } from "@tabler/icons-react";
import { selectFields, selectStyles } from "./constants";
import "./styles.css";

const toSelectValue = (field, value) =>
  field.isMulti
    ? field.options.filter((option) => value.includes(option.value))
    : (field.options.find((option) => option.value === value) ?? null);

const toFilterValue = (field, selected) => {
  if (field.isMulti) return selected ? selected.map((option) => option.value) : [];
  return selected ? selected.value : "";
};

const CheckboxOption = (props) => (
  <components.Option {...props}>
    <input
      checked={props.isSelected}
      className="usersFilterCheck"
      onChange={() => null}
      type="checkbox"
    />
    <span className="usersFilterOptionLabel">{props.label}</span>
  </components.Option>
);

const SummaryValueContainer = ({ children, ...props }) => {
  const values = props.getValue();
  const childArray = React.Children.toArray(children);
  const input = childArray[childArray.length - 1];

  return (
    <components.ValueContainer {...props}>
      {values.length > 0 ? (
        <div className="usersFilterSummary">
          {values.map((option) => option.label).join(", ")}
        </div>
      ) : (
        <span className="usersFilterPlaceholder">{props.selectProps.placeholder}</span>
      )}
      {input}
    </components.ValueContainer>
  );
};

const multiComponents = {
  Option: CheckboxOption,
  ValueContainer: SummaryValueContainer,
};

const UsersFilters = ({ filters, onChange }) => {
  return (
    <div className="usersFilters">
      <div className="usersFiltersSearch">
        <IconSearch className="usersFiltersSearchIcon" size={18} />
        <input
          className="usersFiltersSearchInput"
          onChange={(event) => onChange("search", event.target.value)}
          placeholder="Buscar por nombre, correo o cédula"
          type="text"
          value={filters.search}
        />
        {filters.search && (
          <button
            aria-label="Limpiar búsqueda"
            className="usersFiltersSearchClear"
            onClick={() => onChange("search", "")}
            type="button"
          >
            <IconX size={16} />
          </button>
        )}
      </div>

      <div className="usersFiltersSelects">
        {selectFields.map((field) => (
          <div className="usersFiltersField" key={field.key}>
            <Select
              aria-label={`Filtrar por ${field.label}`}
              classNamePrefix="usersFilterSelect"
              closeMenuOnSelect={!field.isMulti}
              components={field.isMulti ? multiComponents : undefined}
              hideSelectedOptions={false}
              isClearable
              isMulti={field.isMulti}
              isSearchable={false}
              onChange={(selected) => onChange(field.key, toFilterValue(field, selected))}
              options={field.options}
              placeholder={field.label}
              styles={selectStyles}
              value={toSelectValue(field, filters[field.key])}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default UsersFilters;
