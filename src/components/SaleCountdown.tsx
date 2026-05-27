import { Clock } from "lucide-react";
import { useCountdown, formatCountdown } from "@/hooks/useCountdown";

interface Props {
  end: string | Date | null | undefined;
  className?: string;
  showIcon?: boolean;
  prefix?: string;
}

const SaleCountdown = ({ end, className = "", showIcon = true, prefix = "Termina em" }: Props) => {
  const c = useCountdown(end);
  if (!c.enabled || c.expired) return null;
  return (
    <div className={`inline-flex items-center gap-1 text-[11px] font-semibold text-accent ${className}`}>
      {showIcon && <Clock className="h-3 w-3" />}
      <span className="text-muted-foreground">{prefix}:</span>
      <span className="tabular-nums">{formatCountdown(c)}</span>
    </div>
  );
};

export default SaleCountdown;
