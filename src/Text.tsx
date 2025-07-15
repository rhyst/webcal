import React, { type ElementType } from "react";
import { tv } from "tailwind-variants";

type TextSize = "sm" | "base" | "lg" | "xl";
type TextWeight = "normal" | "medium" | "semibold" | "bold";

interface TextProps extends React.HTMLAttributes<HTMLElement> {
  as?: ElementType;
  size?: TextSize;
  weight?: TextWeight;
  className?: string;
  children: React.ReactNode;
}

const text = tv({
  base: "font-sans text-neutral-900 dark:text-neutral-100",
  variants: {
    size: {
      sm: "text-sm",
      base: "text-base",
      lg: "text-lg",
      xl: "text-xl",
    },
    weight: {
      normal: "font-normal",
      medium: "font-medium",
      semibold: "font-semibold",
      bold: "font-bold",
    },
  },
  defaultVariants: {
    size: "base",
    weight: "normal",
  },
});

const Text: React.FC<TextProps> = ({
  as = "span",
  size = "base",
  weight = "normal",
  className = "",
  children,
  ...props
}) => {
  const Comp = as as any;
  return (
    <Comp className={text({ size, weight, className })} {...props}>
      {children}
    </Comp>
  );
};

export default Text;
