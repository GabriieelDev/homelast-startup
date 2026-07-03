// Soft "ding" using Web Audio API — no external files.
let ctx: AudioContext | null = null;

export function playDing() {
  try {
    if (typeof window === "undefined") return;
    const AC: typeof AudioContext =
      (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AC) return;
    if (!ctx) ctx = new AC();
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);
    o.frequency.value = 880;
    o.type = "sine";
    g.gain.setValueAtTime(0.3, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    o.start(ctx.currentTime);
    o.stop(ctx.currentTime + 0.8);
  } catch {
    // ignore audio errors (autoplay policy, etc.)
  }
}
