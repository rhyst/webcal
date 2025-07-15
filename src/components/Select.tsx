import React from "react";
import ReactSelect from "react-select";
import type { Props as ReactSelectProps } from "react-select";

export type Option = { value: string; label: string };

export interface SelectProps
  extends Omit<
    ReactSelectProps<Option, false>,
    "options" | "value" | "onChange"
  > {
  options: Option[];
  value: Option | null;
  onChange: (option: Option | null) => void;
  isDisabled?: boolean;
  className?: string;
}

const customStyles = {
  control: (provided: any, state: any) => ({
    ...provided,
    backgroundColor: state.isDisabled ? "#f3f3f3" : "white",
    borderColor: state.isFocused ? "#2b6cb0" : "#ccc",
    boxShadow: state.isFocused ? "0 0 0 2px #90cdf4" : undefined,
    minHeight: 36,
    color: "#222",
    fontSize: 14,
    borderRadius: 6,
    transition: "border-color 0.2s",
  }),
  menu: (provided: any) => ({
    ...provided,
    zIndex: 20,
    borderRadius: 6,
    fontSize: 14,
  }),
  option: (provided: any, state: any) => ({
    ...provided,
    backgroundColor: state.isSelected
      ? "#2b6cb0"
      : state.isFocused
        ? "#ebf8ff"
        : "white",
    color: state.isSelected ? "white" : "#222",
    cursor: "pointer",
  }),
  singleValue: (provided: any) => ({
    ...provided,
    color: "#222",
  }),
};

const darkStyles = {
  control: (provided: any, state: any) => ({
    ...provided,
    backgroundColor: state.isDisabled ? "#222" : "#18181b",
    borderColor: state.isFocused ? "#60a5fa" : "#444",
    boxShadow: state.isFocused ? "0 0 0 2px #2563eb" : undefined,
    color: "#f3f3f3",
  }),
  menu: (provided: any) => ({
    ...provided,
    backgroundColor: "#18181b",
    color: "#f3f3f3",
  }),
  option: (provided: any, state: any) => ({
    ...provided,
    backgroundColor: state.isSelected
      ? "#2563eb"
      : state.isFocused
        ? "#1e293b"
        : "#18181b",
    color: state.isSelected ? "white" : "#f3f3f3",
    cursor: "pointer",
  }),
  singleValue: (provided: any) => ({
    ...provided,
    color: "#f3f3f3",
  }),
};

const Select: React.FC<SelectProps> = ({
  options,
  value,
  onChange,
  isDisabled,
  className,
}) => {
  const isDark =
    typeof window !== "undefined" &&
    document.documentElement.classList.contains("dark");
  return (
    <ReactSelect
      options={options}
      value={value}
      onChange={onChange}
      isDisabled={isDisabled}
      className={className}
      styles={isDark ? { ...customStyles, ...darkStyles } : customStyles}
      theme={(theme) => ({
        ...theme,
        borderRadius: 6,
        colors: {
          ...theme.colors,
          primary: "#2b6cb0",
          primary25: "#ebf8ff",
          neutral0: isDark ? "#18181b" : "white",
          neutral80: isDark ? "#f3f3f3" : "#222",
        },
      })}
    />
  );
};

export default Select;
