import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { categories, type Product } from "@/data/products";
import { toast } from "sonner";
import { Upload, Loader2, Tag, AlertTriangle } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  product?: Product;
}

const SECTIONS = [
  { id: "mais-comprados", label: "Mais comprados" },
  { id: "promocoes", label: "Promoções" },
  { id: "recomendados", label: "Recomendados" },
  { id: "frequentes", label: "Frequentes" },
];

// datetime-local helpers
const toLocal = (iso?: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const fromLocal = (v: string) => (v ? new Date(v).toISOString() : null);

const ProductFormDialog = ({ open, onOpenChange, product }: Props) => {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [image, setImage] = useState("");
  const [category, setCategory] = useState("mercearia");
  const [unit, setUnit] = useState("un");
  const [description, setDescription] = useState("");
  const [stock, setStock] = useState("50");
  const [sections, setSections] = useState<string[]>(["mais-comprados"]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Promotion state
  const [onSale, setOnSale] = useState(false);
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [saleStart, setSaleStart] = useState("");
  const [saleEnd, setSaleEnd] = useState("");
  const [saleLabel, setSaleLabel] = useState("");
  const [variantGroup, setVariantGroup] = useState("");


  const handleUpload = async (file: File) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Imagem maior que 5MB"); return; }
    setUploading(true);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from("produtos").upload(path, file, { upsert: false });
    if (error) { setUploading(false); toast.error("Erro ao enviar imagem"); return; }
    const { data } = supabase.storage.from("produtos").getPublicUrl(path);
    setImage(data.publicUrl);
    setUploading(false);
    toast.success("Imagem enviada ✅");
  };

  useEffect(() => {
    if (open) {
      setName(product?.name ?? "");
      setPrice(product ? String(product.price) : "");
      setCostPrice(product?.costPrice ? String(product.costPrice) : "");
      setOriginalPrice(product?.originalPrice ? String(product.originalPrice) : "");
      setImage(product?.image ?? "");
      setCategory(product?.category ?? "mercearia");
      setUnit(product?.unit ?? "un");
      setDescription(product?.description ?? "");
      setSections(product?.section?.length ? product.section : ["mais-comprados"]);
      setStock("50");
      setOnSale(product?.onSale ?? false);
      setDiscountType((product?.discountType as any) ?? "percentage");
      setDiscountValue(product?.discountValue ? String(product.discountValue) : "");
      setSaleStart(toLocal(product?.saleStart ?? null));
      setSaleEnd(toLocal(product?.saleEnd ?? null));
      setSaleLabel(product?.saleLabel ?? "");
    }
  }, [open, product]);

  const priceNum = parseFloat(price) || 0;
  const costNum = parseFloat(costPrice) || 0;
  const discNum = parseFloat(discountValue) || 0;
  const margin = priceNum > 0 && costNum > 0 ? ((priceNum - costNum) / priceNum) * 100 : null;

  const computedSalePrice = useMemo(() => {
    if (!onSale || discNum <= 0 || priceNum <= 0) return null;
    const sp = discountType === "percentage"
      ? priceNum * (1 - Math.min(discNum, 100) / 100)
      : priceNum - discNum;
    return Math.max(0, Math.round(sp * 100) / 100);
  }, [onSale, discNum, priceNum, discountType]);

  const negativeMargin = computedSalePrice !== null && costNum > 0 && computedSalePrice < costNum;
  const discountExceedsPrice =
    onSale && ((discountType === "fixed" && discNum >= priceNum) || (discountType === "percentage" && discNum >= 100));

  const toggleSection = (id: string) => {
    setSections((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  };

  const clearPromotion = () => {
    setOnSale(false);
    setDiscountValue("");
    setSaleStart("");
    setSaleEnd("");
    setSaleLabel("");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price) { toast.error("Preencha nome e preço"); return; }
    if (isNaN(priceNum) || priceNum < 0) { toast.error("Preço inválido"); return; }

    if (onSale) {
      if (discNum <= 0) { toast.error("Informe um valor de desconto válido"); return; }
      if (discountExceedsPrice) { toast.error("Desconto não pode ser maior ou igual ao preço"); return; }
      if (saleStart && saleEnd && new Date(saleEnd) <= new Date(saleStart)) {
        toast.error("Data de término deve ser posterior à data de início"); return;
      }
    }

    setSaving(true);
    const payload: any = {
      name: name.trim(),
      price: priceNum,
      cost_price: costNum,
      original_price: originalPrice ? parseFloat(originalPrice) : null,
      image: image.trim() || "/placeholder.svg",
      category,
      unit,
      description: description.trim(),
      sections: sections.length ? sections : ["mais-comprados"],
      active: true,
      on_sale: onSale,
      discount_type: discountType,
      discount_value: onSale ? discNum : 0,
      sale_start: onSale ? (fromLocal(saleStart) ?? new Date().toISOString()) : null,
      sale_end: onSale ? fromLocal(saleEnd) : null,
      sale_label: onSale && saleLabel.trim() ? saleLabel.trim() : null,
    };
    if (product) {
      const { error } = await supabase.from("products").update(payload).eq("id", product.id);
      setSaving(false);
      if (error) return toast.error("Erro ao atualizar produto");
      toast.success("Produto atualizado ✅");
    } else {
      const id = `p${Date.now()}`;
      const { error } = await supabase.from("products").insert({ ...payload, id });
      if (!error) {
        const stockNum = parseInt(stock, 10);
        if (!isNaN(stockNum) && stockNum >= 0) {
          await supabase.from("product_stock").upsert({ product_id: id, stock: stockNum }, { onConflict: "product_id" });
        }
      }
      setSaving(false);
      if (error) return toast.error("Erro ao criar produto");
      toast.success("Produto adicionado ✅");
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product ? "Editar produto" : "Adicionar produto"}</DialogTitle>
          <DialogDescription className="sr-only">Formulário para {product ? "editar" : "adicionar"} um produto do catálogo.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1"><Label>Nome</Label><Input value={name} onChange={(e) => setName(e.target.value)} required /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><Label>Preço (R$)</Label><Input type="number" step="0.01" min="0" value={price} onChange={(e) => setPrice(e.target.value)} required /></div>
            <div className="space-y-1"><Label>Preço original</Label><Input type="number" step="0.01" min="0" value={originalPrice} onChange={(e) => setOriginalPrice(e.target.value)} placeholder="opcional" /></div>
          </div>
          <div className="grid grid-cols-[1fr_auto] gap-3 items-end">
            <div className="space-y-1">
              <Label>Preço de custo (R$)</Label>
              <Input type="number" step="0.01" min="0" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} placeholder="0,00" />
            </div>
            <div className={`px-3 py-2 rounded-lg text-sm font-bold ${margin === null ? "bg-muted text-muted-foreground" : margin >= 30 ? "bg-primary/10 text-primary" : margin >= 0 ? "bg-orange-500/10 text-orange-600" : "bg-destructive/10 text-destructive"}`}>
              Margem: {margin === null ? "—" : `${margin.toFixed(1)}%`}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Categoria</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categories.filter((c) => c.id !== "all").map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.icon} {c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Unidade</Label><Input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="un, kg, pct..." /></div>
          </div>
          <div className="space-y-1">
            <Label>Imagem do produto</Label>
            <div className="flex items-center gap-3">
              <div className="h-16 w-16 rounded-lg bg-muted overflow-hidden flex-shrink-0 flex items-center justify-center">
                {image ? <img src={image} alt="" className="h-full w-full object-cover" /> : <span className="text-xs text-muted-foreground">sem foto</span>}
              </div>
              <label className="flex-1">
                <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])} />
                <div className="border border-dashed border-border rounded-lg px-3 py-2 text-sm text-center cursor-pointer hover:bg-secondary/50 flex items-center justify-center gap-2">
                  {uploading ? <><Loader2 className="h-4 w-4 animate-spin" /> Enviando...</> : <><Upload className="h-4 w-4" /> Enviar imagem</>}
                </div>
              </label>
            </div>
            <Input value={image} onChange={(e) => setImage(e.target.value)} placeholder="ou cole uma URL" className="mt-2" />
          </div>
          {!product && (
            <div className="space-y-1"><Label>Estoque inicial</Label><Input type="number" min="0" value={stock} onChange={(e) => setStock(e.target.value)} /></div>
          )}
          <div className="space-y-1"><Label>Descrição (opcional)</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} /></div>
          <div className="space-y-2">
            <Label>Seções de exibição</Label>
            <div className="grid grid-cols-2 gap-2">
              {SECTIONS.map((s) => (
                <label key={s.id} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox checked={sections.includes(s.id)} onCheckedChange={() => toggleSection(s.id)} />
                  {s.label}
                </label>
              ))}
            </div>
          </div>

          {/* PROMOTION SECTION */}
          <div className="space-y-3 p-3 rounded-lg border border-accent/30 bg-accent/5">
            <div className="flex items-center justify-between gap-2">
              <Label className="flex items-center gap-2 text-foreground">
                <Tag className="h-4 w-4 text-accent" />
                Produto em promoção
              </Label>
              <Switch checked={onSale} onCheckedChange={setOnSale} />
            </div>

            {onSale && (
              <>
                <div className="grid grid-cols-[1fr_120px] gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Tipo de desconto</Label>
                    <Select value={discountType} onValueChange={(v) => setDiscountType(v as any)}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentual (%)</SelectItem>
                        <SelectItem value="fixed">Valor fixo (R$)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Valor</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max={discountType === "percentage" ? 99 : undefined}
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
                      placeholder={discountType === "percentage" ? "20" : "5,00"}
                    />
                  </div>
                </div>

                {computedSalePrice !== null && (
                  <div className={`p-2 rounded-md text-sm font-semibold flex items-center justify-between ${discountExceedsPrice ? "bg-destructive/10 text-destructive" : "bg-accent/10 text-accent"}`}>
                    <span>Preço promocional:</span>
                    <span>R$ {computedSalePrice.toFixed(2)}</span>
                  </div>
                )}
                {negativeMargin && (
                  <div className="p-2 rounded-md text-xs bg-orange-500/10 text-orange-600 flex items-start gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    Atenção: o preço promocional ficou abaixo do custo (R$ {costNum.toFixed(2)}). Margem negativa.
                  </div>
                )}
                {discountExceedsPrice && (
                  <p className="text-xs text-destructive">O desconto não pode ser maior ou igual ao preço.</p>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Início</Label>
                    <Input type="datetime-local" value={saleStart} onChange={(e) => setSaleStart(e.target.value)} className="h-9" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Término (opcional)</Label>
                    <Input type="datetime-local" value={saleEnd} onChange={(e) => setSaleEnd(e.target.value)} className="h-9" />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Rótulo personalizado (opcional)</Label>
                  <Input
                    value={saleLabel}
                    onChange={(e) => setSaleLabel(e.target.value)}
                    placeholder='Ex.: "Oferta do dia", "Black Friday"'
                  />
                </div>

                <Button type="button" variant="outline" size="sm" onClick={clearPromotion} className="w-full">
                  Remover promoção
                </Button>
              </>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProductFormDialog;
