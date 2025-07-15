import React from "react";
import { tv } from "tailwind-variants";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
  children: React.ReactNode;
}

const button = tv({
  base: "rounded font-semibold text-base px-4 py-1.5 transition focus:outline-none cursor-pointer",
  variants: {
    variant: {
      primary:
        "bg-blue-700 text-white hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white",
      secondary:
        "bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-100",
      danger:
        "bg-red-600 text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 dark:text-white",
    },
  },
  defaultVariants: {
    variant: "primary",
  },
});

const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  className = "",
  children,
  ...props
}) => (
  <button
    className={button({ variant, className })}
    data-variant={variant}
    {...props}
  >
    {children}
  </button>
);

export default Button;
