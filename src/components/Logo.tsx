import { cn } from "@/lib/utils";

interface LogoIconProps {
  className?: string;
  color?: string;
}

/**
 * HomeLast Startup — stylized house containing an infinity symbol.
 * Pure SVG, currentColor-aware. Use `color` to force a hex (white on dark bg).
 */
export const LogoIcon = ({ className, color }: LogoIconProps) => (
  <svg
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("h-6 w-6", className)}
    style={color ? { color } : undefined}
    aria-hidden="true"
  >
    {/* House outline w/ slightly hexagonal right base */}
    <path
      d="M24 4 L42 18 L42 34 L36 42 L12 42 L6 34 L6 18 Z"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinejoin="round"
      fill="none"
    />
    {/* Infinity inside */}
    <path
      d="M16 28 C16 24.5 19 23 21 25 L27 31 C29 33 32 31.5 32 28 C32 24.5 29 23 27 25 L21 31 C19 33 16 31.5 16 28 Z"
      fill="currentColor"
    />
    {/* Dot on right of infinity */}
    <circle cx="35" cy="28" r="1.6" fill="currentColor" />
  </svg>
);

interface LogoProps {
  className?: string;
  variant?: "full" | "compact";
  /** Force color (e.g. "#fff" over dark panel). Defaults to currentColor. */
  color?: string;
  /** Show the small STARTUP tagline under the wordmark. */
  showTagline?: boolean;
}

const Logo = ({ className, variant = "full", color, showTagline = true }: LogoProps) => {
  if (variant === "compact") {
    return <LogoIcon className={className} color={color} />;
  }
  return (
    <div
      className={cn("flex items-center gap-2", className)}
      style={color ? { color } : undefined}
    >
      <LogoIcon className="h-7 w-7 shrink-0" />
      <div className="flex flex-col leading-none">
        <span className="font-display text-lg sm:text-xl tracking-tight">
          <span className="font-bold">Home</span>
          <span className="font-normal">Last</span>
        </span>
        {showTagline && (
          <span className="text-[9px] font-semibold tracking-[0.22em] opacity-80 mt-0.5">
            STARTUP
          </span>
        )}
      </div>
    </div>
  );
};

export default Logo;
