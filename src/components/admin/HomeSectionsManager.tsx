import { useEffect, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowDown, ArrowUp, Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import {
  useStoreSettings,
  DEFAULT_HOME_SECTIONS,
  type HomeSection,
} from "@/hooks/useStoreSettings";

const SOURCE_HINT: Record<HomeSection["key"], string> = {
  top_sellers: "Os mais vendidos da loja",
  recently_viewed: "O que o cliente viu há pouco (só logado)",
  promocoes: "Produtos marcados como Promoções",
  recomendados: "Produtos marcados como Recomendados",
  frequentes: "Produtos marcados como Frequentes",
  "mais-comprados": "Produtos marcados como Mais comprados",
};

export default function HomeSectionsManager() {
  const { settings, save } = useStoreSettings();
  const [draft, setDraft] = useState<HomeSection[]>(settings.home_sections);
  const [saving, setSaving] = useState(false);
  const baseId = useId();

  useEffect(() => { setDraft(settings.home_sections); }, [settings.home_sections]);

  const update = (index: number, patch: Partial<HomeSection>) =>
    setDraft((cur) => cur.map((s, i) => (i === index ? { ...s, ...patch } : s)));

  const move = (index: number, dir: -1 | 1) =>
    setDraft((cur) => {
      const target = index + dir;
      if (target < 0 || target >= cur.length) return cur;
      const next = [...cur];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });

  const onSave = async () => {
    setSaving(true);
    const err = await save({ home_sections: draft });
    setSaving(false);
    if (err) toast.error("Erro ao salvar as seções");
    else toast.success("Seções da home atualizadas");
  };

  return (
    <section className="space-y-4 max-w-3xl" aria-labelledby={`${baseId}-title`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id={`${baseId}-title`} className="text-2xl font-bold text-foreground">Seções da home</h2>
        <Button
          type="button"
          variant="outline"
          className="min-h-11 gap-2"
          onClick={() => setDraft(DEFAULT_HOME_SECTIONS.map((s) => ({ ...s })))}
        >
          <RotateCcw className="h-4 w-4" /> Restaurar padrão
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        Um produto que já apareceu em uma seção acima não se repete nas seguintes.
      </p>

      <ul className="space-y-3">
        {draft.map((s, i) => {
          const id = `${baseId}-${s.key}`;
          return (
            <li
              key={s.key}
              className={`rounded-lg border border-border p-3 md:p-4 space-y-3 ${s.enabled ? "" : "bg-muted/40"}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-foreground truncate">{s.title || "Sem título"}</p>
                  <p className="text-xs text-muted-foreground">{SOURCE_HINT[s.key]}</p>
                </div>
                <label htmlFor={`${id}-on`} className="flex items-center gap-2 min-h-11 shrink-0 cursor-pointer text-sm">
                  <input
                    id={`${id}-on`}
                    type="checkbox"
                    className="h-5 w-5 accent-[hsl(var(--primary))]"
                    checked={s.enabled}
                    onChange={(e) => update(i, { enabled: e.target.checked })}
                  />
                  Exibir
                </label>
              </div>

              <div className="grid grid-cols-[4.5rem_1fr] sm:grid-cols-[4.5rem_1fr_7rem] gap-3">
                <div className="space-y-1">
                  <label htmlFor={`${id}-emoji`} className="text-xs text-muted-foreground">Emoji</label>
                  <Input
                    id={`${id}-emoji`}
                    className="h-11 text-center"
                    maxLength={8}
                    value={s.emoji}
                    onChange={(e) => update(i, { emoji: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor={`${id}-title`} className="text-xs text-muted-foreground">Título</label>
                  <Input
                    id={`${id}-title`}
                    className="h-11"
                    maxLength={60}
                    value={s.title}
                    onChange={(e) => update(i, { title: e.target.value })}
                  />
                </div>
                <div className="space-y-1 col-span-2 sm:col-span-1">
                  <label htmlFor={`${id}-limit`} className="text-xs text-muted-foreground">Limite de itens</label>
                  <Input
                    id={`${id}-limit`}
                    className="h-11"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    placeholder="Sem limite"
                    value={s.limit ?? ""}
                    onChange={(e) => {
                      const n = parseInt(e.target.value, 10);
                      update(i, { limit: Number.isFinite(n) && n >= 1 ? n : null });
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-11 w-11"
                  aria-label={`Subir a seção ${s.title}`}
                  disabled={i === 0}
                  onClick={() => move(i, -1)}
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-11 w-11"
                  aria-label={`Descer a seção ${s.title}`}
                  disabled={i === draft.length - 1}
                  onClick={() => move(i, 1)}
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <span className="text-xs text-muted-foreground ml-1">Posição {i + 1}</span>
              </div>
            </li>
          );
        })}
      </ul>

      <Button type="button" className="min-h-11 w-full sm:w-auto gap-2" onClick={onSave} disabled={saving}>
        {saving && <Loader2 className="h-4 w-4 animate-spin" />} Salvar seções
      </Button>
    </section>
  );
}
