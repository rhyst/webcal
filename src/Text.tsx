import React, { type ElementType } from "react";

type TextSize = "sm" | "base" | "lg" | "xl";
type TextWeight = "normal" | "medium" | "semibold" | "bold";
type TextColor =
  | "gray"
  | "blue"
  | "red"
  | "black"
  | "white"
  | "primary"
  | "secondary";

interface TextProps extends React.HTMLAttributes<HTMLElement> {
  as?: ElementType;
  size?: TextSize;
  weight?: TextWeight;
  color?: TextColor;
  className?: string;
  children: React.ReactNode;
}

const sizeMap = {
  sm: "text-sm",
  base: "text-base",
  lg: "text-lg",
  xl: "text-xl",
};
const weightMap = {
  normal: "font-normal",
  medium: "font-medium",
  semibold: "font-semibold",
  bold: "font-bold",
};
const colorMap = {
  gray: "text-gray-700",
  blue: "text-blue-700",
  red: "text-red-600",
  black: "text-black",
  white: "text-white",
  primary: "text-blue-700",
  secondary: "text-gray-500",
};

const Text: React.FC<TextProps> = ({
  as = "span",
  size = "base",
  weight = "normal",
  color = "gray",
  className = "",
  children,
  ...props
}) => {
  const Comp = as as any;
  const classes = [sizeMap[size], weightMap[weight], colorMap[color], className]
    .filter(Boolean)
    .join(" ");
  return (
    <Comp className={classes} {...props}>
      {children}
    </Comp>
  );
};

export default Text;
