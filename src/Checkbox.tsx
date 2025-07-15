import React from "react";

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  color?: string; // Tailwind color class, e.g. 'text-blue-700' or hex
  size?: number; // px
  label?: React.ReactNode;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  (
    { color = "blue-700", size = 20, className = "", checked, disabled, label, ...props },
    ref
  ) => {
    const styles = getComputedStyle(document.documentElement);
    const actualColor = color.startsWith('#') ? color : styles.getPropertyValue("--color-" + color);
    const labelClass = `relative inline-flex items-center ${disabled ? "cursor-not-allowed" : "cursor-pointer"} ${className}`;
    return (
      <label className={labelClass}>
        <span style={{ width: size, height: size, minWidth: size, minHeight: size, display: "inline-flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
          <input
            type="checkbox"
            ref={ref}
            checked={checked}
            disabled={disabled}
            {...props}
            className="peer appearance-none w-full h-full m-0 p-0 rounded border border-gray-400 dark:border-gray-600 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-300 transition-colors align-middle cursor-pointer"
            style={{ width: size, height: size }}
          />
          <span
            className="pointer-events-none absolute w-full h-full top-0 left-0 rounded flex items-center justify-center border border-gray-400 dark:border-gray-600 bg-white dark:bg-gray-900 transition-colors peer-checked:border-transparent align-middle"
            style={{ width: size, height: size }}
          >
            {checked && (
              <svg
                width={size}
                height={size}
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect width="20" height="20" rx="4" fill={actualColor} />
                <path
                  d="M6 10.5L9 13.5L14 8.5"
                  stroke="#fff"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </span>
        </span>
        {label && <span className="ml-2 select-none align-middle flex items-center text-neutral-900 text-sm dark:text-neutral-100">{label}</span>}
      </label>
    );
  }
);

Checkbox.displayName = "Checkbox";

export default Checkbox; 