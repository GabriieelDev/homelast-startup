import { cn } from "@/lib/utils";
import logoFull from "@/assets/homelast-logo.webp";
import logoIcon from "@/assets/homelast-icon.webp";

interface LogoIconProps {
  className?: string;
  /** Kept for API compat — image is a fixed-color raster, color prop is ignored. */
  color?: string;
}

/**
 * HomeLast Startup — official icon (house + infinity).
 * Rendered from the brand image asset so it stays pixel-faithful to the source.
 */
export const LogoIcon = ({ className }: LogoIconProps) => (
  <img
    src={logoIcon}
    alt="HomeLast Startup"
    width={128}
    height={128}
    fetchPriority="high"
    decoding="async"
    className={cn("h-6 w-6 object-contain select-none", className)}
    draggable={false}
  />
);

interface LogoProps {
  className?: string;
  variant?: "full" | "compact";
  /** Kept for API compat — image is a fixed-color raster, color prop is ignored. */
  color?: string;
  /** Unused — tagline is part of the brand image. Kept for API compat. */
  showTagline?: boolean;
}

const Logo = ({ className, variant = "full" }: LogoProps) => {
  if (variant === "compact") {
    return <LogoIcon className={className} />;
  }
  return (
    <img
      src={logoFull}
      alt="HomeLast Startup"
      width={373}
      height={320}
      fetchPriority="high"
      decoding="async"
      className={cn("h-20 w-auto object-contain select-none", className)}
      draggable={false}
    />
  );
};

export default Logo;
