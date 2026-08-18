import React from "react";

interface LogoProps {
  /** Rendered size of the logo image via preset. */
  size?: "sm" | "md" | "lg";
  /** Extra classes for the outer chip (e.g. margins/centering). */
  className?: string;
}

const IMAGE_SIZE: Record<NonNullable<LogoProps["size"]>, string> = {
  sm: "h-8 w-8", // 32px — headers/nav
  md: "h-12 w-12", // 48px — auth cards
  lg: "h-16 w-16", // 64px — hero
};

const CHIP_PADDING: Record<NonNullable<LogoProps["size"]>, string> = {
  sm: "p-1",
  md: "p-1.5",
  lg: "p-2",
};

/**
 * App logo wrapped in a rounded white "chip". The source PNG has a light
 * background, which looks like a stray white box on dark/warm surfaces. The
 * chip turns that into an intentional badge that reads well in every theme,
 * with a subtle border and shadow for depth.
 */
const Logo: React.FC<LogoProps> = ({ size = "sm", className = "" }) => (
  <span
    className={`inline-flex items-center justify-center rounded-full bg-white ring-1 ring-black/5 dark:ring-white/10 shadow-sm ${CHIP_PADDING[size]} ${className}`}
  >
    <img
      src="/logo.png"
      alt="Inkuthazo Social Club"
      className={`${IMAGE_SIZE[size]} object-contain`}
    />
  </span>
);

export default Logo;
