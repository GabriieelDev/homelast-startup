import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { categories, type Product } from "@/data/products";
import { toast } from "sonner";
import { Upload, Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Existing product (edit mode) — when undefined, dialog creates a new one. */
  product?: Product;
}

const SECTIONS = [
  { id: "mais-comprados", label: "Mais comprados" },
  { id: "promocoes", label: "Promoções" },
  { id: "recomendados", label: "Recomendados" },
  { id: "frequentes", label: "Frequentes" },
];

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
    }
  }, [open, product]);

  const priceNum = parseFloat(price) || 0;
  const costNum = parseFloat(costPrice) || 0;
  const margin = priceNum > 0 && costNum > 0 ? ((priceNum - costNum) / priceNum) * 100 : null;

  const toggleSection = (id: string) => {
    setSections((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price) { toast.error("Preencha nome e preço"); return; }
    if (isNaN(priceNum) || priceNum < 0) { toast.error("Preço inválido"); return; }
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
          <div className="space-y-1"><Label>URL da imagem</Label><Input value={image} onChange={(e) => setImage(e.target.value)} placeholder="https://..." /></div>
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
