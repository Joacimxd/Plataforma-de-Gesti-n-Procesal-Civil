import { cn } from "@/lib/utils";

interface LogoProps {
  /**
   * "full"      → the actual logo.svg wordmark (white, needs dark bg)
   * "icon"      → just the scale favicon icon
   * "stacked"   → icon above + wordmark below (good for hero sections)
   * "nav"       → icon + small wordmark side by side (for navbar)
   */
  variant?: "full" | "icon" | "stacked" | "nav";
  className?: string;
  /** Extra classNames for the <img> wordmark element */
  imgClassName?: string;
  iconSize?: "xs" | "sm" | "md" | "lg" | "xl";
}

/** The square scale-icon favicon as an <img> */


/** The white wordmark logo.svg */
function Wordmark({ className }: { className?: string }) {
  return (
    <img
      src="/logo.svg"
      alt="Gestión Procesal Civil"
      className={cn("h-auto invert dark:invert-0", className)}
      draggable={false}
    />
  );
}

export default function Logo({
  variant = "nav",
  className,
  imgClassName,
}: LogoProps) {
  /* ── full wordmark only ── */
  if (variant === "full") {
    return (
      <Wordmark className={cn("w-36", imgClassName, className)} />
    );
  }

  /* ── stacked: big icon + wordmark below (hero use) ── */
  if (variant === "stacked") {
    return (
      <div className={cn("flex flex-col items-center gap-4", className)}>
        <Wordmark className={cn("w-48", imgClassName)} />
      </div>
    );
  }

  /* ── nav: icon + text label side-by-side ── */
  return (
    <div className={cn("flex items-center gap-2.5 shrink-0", className)}>
      <div className="hidden sm:flex flex-col leading-none">
        <Wordmark className={cn("w-28", imgClassName)} />
      </div>
    </div>
  );
}
