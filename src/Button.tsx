import React from "react";
import { tv } from "tailwind-variants";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
  children: React.ReactNode;
}

const button = tv({
  base: "rounded font-medium px-4 py-1.5 transition focus:outline-none cursor-pointer",
  variants: {
    variant: {
      primary: "bg-blue-700 text-white hover:bg-blue-800",
      secondary: "bg-gray-100 text-gray-800 hover:bg-gray-200",
      danger: "bg-red-600 text-white hover:bg-red-700",
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
