import React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const base =
  "w-full p-1.5 rounded border border-[#ccc] dark:border-gray-700 text-[#222] dark:text-gray-100 bg-[#fafbfc] dark:bg-gray-800 transition focus:outline-none focus:ring-2 focus:ring-blue-300";

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", ...props }, ref) => (
    <input ref={ref} className={`${base} ${className}`} {...props} />
  )
);

Input.displayName = "Input";

export default Input; 