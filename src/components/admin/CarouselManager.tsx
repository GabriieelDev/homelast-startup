import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Power, PowerOff, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useStoreSettings, DEFAULT_CAROUSEL, type CarouselConfig } from "@/hooks/useStoreSettings";
import { useProducts } from "@/hooks/useProducts";
import HeroCarousel from "@/components/HeroCarousel";

export default function CarouselManager() {
  const { settings, save } = useStoreSettings();
  const { products } = useProducts();
  const [draft, setDraft] = useState<CarouselConfig>(settings.carousel_config ?? DEFAULT_CAROUSEL);
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setDraft(settings.carousel_config ?? DEFAULT_CAROUSEL); }, [settings.carousel_config]);

  const update1 = (patch: Partial<CarouselConfig["slide1"]>) =>
    setDraft({ ...draft, slide1: { ...draft.slide1, ...patch, enabled: true } });
  const update2 = (patch: Partial<CarouselConfig["slide2"]>) =>
    setDraft({ ...draft, slide2: { ...draft.slide2, ...patch } });
  const update3 = (patch: Partial<CarouselConfig["slide3"]>) =>
    setDraft({ ...draft, slide3: { ...draft.slide3, ...patch } });

  const toggleProduct = (id: string) => {
    const cur = draft.slide2.productIds;
    const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id].slice(0, 6);
    update2({ productIds: next });
  };

  const onSave = async () => {
    setSaving(true);
    const err = await save({ carousel_config: draft } as any);
    setSaving(false);
    if (err) toast.error("Erro ao salvar carrossel");
    else toast.success("Carrossel atualizado ✅");
  };

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Gerenciar carrossel</h2>
        <Button type="button" variant="outline" size="sm" onClick={() => setShowPreview((v) => !v)} className="gap-2">
          {showPreview ? <><EyeOff className="h-4 w-4" /> Ocultar preview</> : <><Eye className="h-4 w-4" /> Pré-visualizar</>}
        </Button>
      </div>

      {showPreview && (
        <div className="rounded-xl border border-border overflow-hidden">
          <PreviewBridge draft={draft} />
        </div>
      )}

      {/* SLIDE 1 */}
      <section className="space-y-3 p-4 rounded-lg border border-border">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground">Slide 1 — Apresentação</h3>
          <span className="text-xs text-muted-foreground">Sempre ativo (principal)</span>
        </div>
        <Field label="Badge"><Input value={draft.slide1.badge} onChange={(e) => update1({ badge: e.target.value })} /></Field>
        <Field label="Título"><Input value={draft.slide1.title} onChange={(e) => update1({ title: e.target.value })} /></Field>
        <Field label="Trecho destacado no título (palavra/frase)">
          <Input value={draft.slide1.highlight} onChange={(e) => update1({ highlight: e.target.value })} placeholder="em minutos" />
        </Field>
        <Field label="Subtítulo"><Textarea rows={2} value={draft.slide1.subtitle} onChange={(e) => update1({ subtitle: e.target.value })} /></Field>
        <Field label="Texto do botão"><Input value={draft.slide1.ctaText} onChange={(e) => update1({ ctaText: e.target.value })} /></Field>
        <Field label="URL da imagem (opcional)">
          <Input value={draft.slide1.image} onChange={(e) => update1({ image: e.target.value })} placeholder="https://..." />
        </Field>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {([1, 2, 3] as const).map((n) => (
            <div key={n} className="space-y-2 p-3 rounded-md bg-muted/40">
              <p className="text-xs font-semibold text-muted-foreground">Diferencial {n}</p>
              <Input
                value={(draft.slide1 as any)[`feature${n}Title`]}
                onChange={(e) => update1({ [`feature${n}Title`]: e.target.value } as any)}
                placeholder="Título"
              />
              <Input
                value={(draft.slide1 as any)[`feature${n}Text`]}
                onChange={(e) => update1({ [`feature${n}Text`]: e.target.value } as any)}
                placeholder="Descrição"
              />
            </div>
          ))}
        </div>
      </section>

      {/* SLIDE 2 */}
      <section className="space-y-3 p-4 rounded-lg border border-border">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground">Slide 2 — Ofertas</h3>
          <Button
            type="button" size="sm"
            variant={draft.slide2.enabled ? "default" : "outline"}
            className="gap-1.5"
            onClick={() => update2({ enabled: !draft.slide2.enabled })}
          >
            {draft.slide2.enabled ? <><Power className="h-3.5 w-3.5" /> Ativo</> : <><PowerOff className="h-3.5 w-3.5" /> Inativo</>}
          </Button>
        </div>
        <Field label="Badge"><Input value={draft.slide2.badge} onChange={(e) => update2({ badge: e.target.value })} /></Field>
        <Field label="Título"><Input value={draft.slide2.title} onChange={(e) => update2({ title: e.target.value })} /></Field>
        <Field label="Trecho destacado no título"><Input value={draft.slide2.highlight} onChange={(e) => update2({ highlight: e.target.value })} placeholder="30% OFF" /></Field>
        <Field label="Subtítulo"><Textarea rows={2} value={draft.slide2.subtitle} onChange={(e) => update2({ subtitle: e.target.value })} /></Field>
        <Field label="Texto do botão"><Input value={draft.slide2.ctaText} onChange={(e) => update2({ ctaText: e.target.value })} /></Field>
        <Field label="Contador regressivo termina em (opcional)">
          <Input
            type="datetime-local"
            value={draft.slide2.countdownEnd ? toLocalInput(draft.slide2.countdownEnd) : ""}
            onChange={(e) => update2({ countdownEnd: e.target.value ? new Date(e.target.value).toISOString() : null })}
          />
        </Field>
        <div className="space-y-2">
          <Label>Produtos em destaque (até 6 — se vazio, usa promoções ativas)</Label>
          <div className="max-h-64 overflow-auto rounded-md border border-border divide-y">
            {products.map((p) => {
              const selected = draft.slide2.productIds.includes(p.id);
              return (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => toggleProduct(p.id)}
                  className={`w-full flex items-center gap-3 p-2 text-left hover:bg-muted/50 transition ${selected ? "bg-primary/5" : ""}`}
                >
                  <input type="checkbox" readOnly checked={selected} className="pointer-events-none" />
                  <span className="flex-1 text-sm truncate">{p.name}</span>
                  <span className="text-xs text-muted-foreground">R$ {p.price.toFixed(2)}</span>
                </button>
              );
            })}
            {products.length === 0 && <p className="p-3 text-sm text-muted-foreground">Nenhum produto cadastrado.</p>}
          </div>
          {draft.slide2.productIds.length > 0 && (
            <p className="text-xs text-muted-foreground">{draft.slide2.productIds.length} selecionado(s)</p>
          )}
        </div>
      </section>

      {/* SLIDE 3 */}
      <section className="space-y-3 p-4 rounded-lg border border-border">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground">Slide 3 — Cupom</h3>
          <Button
            type="button" size="sm"
            variant={draft.slide3.enabled ? "default" : "outline"}
            className="gap-1.5"
            onClick={() => update3({ enabled: !draft.slide3.enabled })}
          >
            {draft.slide3.enabled ? <><Power className="h-3.5 w-3.5" /> Ativo</> : <><PowerOff className="h-3.5 w-3.5" /> Inativo</>}
          </Button>
        </div>
        <Field label="Badge"><Input value={draft.slide3.badge} onChange={(e) => update3({ badge: e.target.value })} /></Field>
        <Field label="Título da promoção"><Input value={draft.slide3.title} onChange={(e) => update3({ title: e.target.value })} /></Field>
        <Field label="Código do cupom"><Input value={draft.slide3.coupon} onChange={(e) => update3({ coupon: e.target.value.toUpperCase() })} /></Field>
        <Field label="Condições"><Textarea rows={2} value={draft.slide3.conditions} onChange={(e) => update3({ conditions: e.target.value })} /></Field>
        <Field label="Texto do botão"><Input value={draft.slide3.ctaText} onChange={(e) => update3({ ctaText: e.target.value })} /></Field>
      </section>

      <div className="flex gap-2 sticky bottom-0 bg-background py-3">
        <Button onClick={onSave} disabled={saving} className="flex-1">
          {saving ? "Salvando..." : "Salvar alterações"}
        </Button>
        <Button type="button" variant="outline" onClick={() => setDraft(settings.carousel_config ?? DEFAULT_CAROUSEL)} disabled={saving}>
          Descartar
        </Button>
      </div>
    </div>
  );
}

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1"><Label>{label}</Label>{children}</div>
);

function toLocalInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * The HeroCarousel reads from useStoreSettings live. To preview a draft without saving,
 * we render the saved version with a banner explaining behavior.
 */
const PreviewBridge = ({ draft }: { draft: CarouselConfig }) => {
  return (
    <div>
      <div className="px-3 py-2 text-xs bg-amber-50 text-amber-900 border-b border-amber-200">
        Pré-visualização do carrossel atual (publicado). Salve para ver suas alterações refletidas aqui e no site.
      </div>
      <HeroCarousel onStart={() => {}} />
      <div className="px-3 py-2 text-[11px] text-muted-foreground bg-muted/40 border-t border-border">
        Rascunho — Slide 2: {draft.slide2.enabled ? "ativo" : "inativo"} · Slide 3: {draft.slide3.enabled ? "ativo" : "inativo"} · Produtos selecionados: {draft.slide2.productIds.length}
      </div>
    </div>
  );
};
