import React from "react";

export interface RadioProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  color?: string;
  size?: number;
  label?: React.ReactNode;
}

const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  (
    {
      color = "#2b6cb0",
      size = 20,
      className = "",
      checked,
      disabled,
      label,
      ...props
    },
    ref,
  ) => {
    const labelClass = `relative inline-flex items-center ${disabled ? "cursor-not-allowed" : "cursor-pointer"} ${className}`;
    return (
      <label className={labelClass}>
        <span
          style={{
            width: size,
            height: size,
            minWidth: size,
            minHeight: size,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          <input
            type="radio"
            ref={ref}
            checked={checked}
            disabled={disabled}
            {...props}
            className="peer appearance-none w-full h-full m-0 p-0 rounded-full border border-gray-400 dark:border-gray-600 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-300 transition-colors align-middle cursor-pointer"
            style={{ width: size, height: size }}
          />
          <span
            className="pointer-events-none absolute w-full h-full top-0 left-0 rounded-full flex items-center justify-center border border-gray-400 dark:border-gray-600 bg-white dark:bg-gray-900 transition-colors peer-checked:border-transparent align-middle"
            style={{ width: size, height: size }}
          >
            {checked && (
              <span
                style={{
                  width: size * 0.5,
                  height: size * 0.5,
                  borderRadius: "50%",
                  background: color,
                  display: "block",
                }}
              />
            )}
          </span>
        </span>
        {label && (
          <span className="ml-2 select-none align-middle flex items-center text-neutral-900 text-sm dark:text-neutral-100">
            {label}
          </span>
        )}
      </label>
    );
  },
);

Radio.displayName = "Radio";

export default Radio;
