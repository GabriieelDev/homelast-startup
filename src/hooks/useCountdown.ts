import { useEffect, useState } from "react";

export function useCountdown(end: string | Date | null | undefined) {
  const target = end ? new Date(end).getTime() : null;
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!target) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [target]);

  if (!target) return { expired: false, hours: 0, minutes: 0, seconds: 0, totalMs: 0, enabled: false };
  const diff = target - now;
  if (diff <= 0) return { expired: true, hours: 0, minutes: 0, seconds: 0, totalMs: 0, enabled: true };
  const totalSec = Math.floor(diff / 1000);
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  return { expired: false, hours, minutes, seconds, totalMs: diff, enabled: true };
}

const pad = (n: number) => String(n).padStart(2, "0");
export function formatCountdown(c: ReturnType<typeof useCountdown>): string {
  return `${pad(c.hours)}:${pad(c.minutes)}:${pad(c.seconds)}`;
}
