import { useEffect, useState, useCallback, useTransition, startTransition } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Plus, Power, PowerOff, Trash2, Tag } from "lucide-react";
import { toast } from "sonner";

type DiscountType = "percentage" | "fixed" | "free_shipping" | "first_order";

interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discount_type: string;
  discount_value: number;
  min_order: number | null;
  expires_at: string | null;
  active: boolean;
  created_at: string;
}

const emptyForm = {
  code: "",
  description: "",
  discount_type: "percentage" as DiscountType,
  discount_value: "",
  min_order: "0",
  expires_at: "",
};

const typeLabel = (t: string) =>
  t === "percentage" ? "Percentual" :
  t === "fixed" ? "Valor fixo" :
  t === "free_shipping" ? "Frete grátis" :
  t === "first_order" ? "1ª compra" : t;

const CouponManager = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [, startListTransition] = useTransition();

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("coupons")
      .select("id,code,description,discount_type,discount_value,min_order,expires_at,active,created_at")
      .order("created_at", { ascending: false });
    if (error) toast.error("Erro ao carregar cupons");
    startListTransition(() => {
      setCoupons((data as any) ?? []);
      setLoading(false);
    });
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = useCallback(async () => {
    const code = form.code.trim().toUpperCase();
    const value = Number(form.discount_value);
    if (!code) return toast.error("Código é obrigatório");
    if (form.discount_type !== "free_shipping" && (!value || value <= 0)) {
      return toast.error("Valor do desconto inválido");
    }
    if (form.discount_type === "percentage" && value > 100) {
      return toast.error("Percentual máximo: 100%");
    }

    // Feedback visual imediato — não bloqueia a thread principal.
    setSaving(true);

    // Defer o trabalho assíncrono para fora do clique, liberando o paint.
    queueMicrotask(async () => {
      const payload = {
        code,
        description: form.description.trim() || null,
        discount_type: form.discount_type,
        discount_value: form.discount_type === "free_shipping" ? 0 : value,
        min_order: Number(form.min_order) || 0,
        expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
        active: true,
      };
      const { error } = await supabase.from("coupons").insert(payload as any);
      startTransition(() => {
        setSaving(false);
        if (error) {
          toast.error(error.code === "23505" ? "Já existe um cupom com esse código" : "Erro ao criar cupom");
          return;
        }
        toast.success("Cupom criado!");
        setForm(emptyForm);
        setOpen(false);
      });
      if (!error) load();
    });
  }, [form, load]);

  const toggleActive = useCallback(async (c: Coupon) => {
    const { error } = await supabase.from("coupons").update({ active: !c.active }).eq("id", c.id);
    if (error) return toast.error("Erro ao atualizar");
    toast.success(c.active ? "Cupom desativado" : "Cupom ativado");
    load();
  }, [load]);

  const remove = useCallback(async (id: string) => {
    const { error } = await supabase.from("coupons").delete().eq("id", id);
    if (error) return toast.error("Erro ao excluir");
    toast.success("Cupom excluído");
    load();
  }, [load]);

  const formatValue = (c: Coupon) =>
    c.discount_type === "percentage" ? `${c.discount_value}%` :
    c.discount_type === "fixed" ? `R$ ${Number(c.discount_value).toFixed(2)}` :
    c.discount_type === "free_shipping" ? "Frete grátis" :
    c.discount_type === "first_order" ? `${c.discount_value}% (1ª compra)` : "—";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2"><Tag className="h-5 w-5 text-primary" /> Cupons</h2>
          <p className="text-sm text-muted-foreground">Gerencie cupons de desconto</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 transition-transform hover:scale-[1.03] active:scale-[0.97]">
              <Plus className="h-4 w-4" /> Novo cupom
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo cupom</DialogTitle>
              <DialogDescription className="sr-only">Formulário para criar um novo cupom de desconto.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Código</Label>
                <Input
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="PROMO10"
                  className="uppercase font-mono"
                />
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Ex: 10% de desconto em toda a loja"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Tipo</Label>
                  <Select value={form.discount_type} onValueChange={(v: DiscountType) => setForm({ ...form, discount_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentual (%)</SelectItem>
                      <SelectItem value="fixed">Valor fixo (R$)</SelectItem>
                      <SelectItem value="free_shipping">Frete grátis</SelectItem>
                      <SelectItem value="first_order">1ª compra (%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Valor do desconto</Label>
                  <Input
                    type="number" min="0" step="0.01"
                    value={form.discount_value}
                    onChange={(e) => setForm({ ...form, discount_value: e.target.value })}
                    placeholder={form.discount_type === "percentage" || form.discount_type === "first_order" ? "10" : "5.00"}
                    disabled={form.discount_type === "free_shipping"}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Valor mínimo do pedido (R$)</Label>
                  <Input
                    type="number" min="0" step="0.01"
                    value={form.min_order}
                    onChange={(e) => setForm({ ...form, min_order: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Data de validade</Label>
                  <Input
                    type="datetime-local"
                    value={form.expires_at}
                    onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Deixe a validade em branco para não expirar.</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreate} disabled={saving}>{saving ? "Salvando..." : "Criar cupom"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-xl border border-border overflow-x-auto bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr className="text-left">
              <th className="p-3">Código</th>
              <th className="p-3">Descrição</th>
              <th className="p-3">Tipo</th>
              <th className="p-3">Valor</th>
              <th className="p-3">Mín. pedido</th>
              <th className="p-3">Validade</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="p-6 text-center text-muted-foreground">Carregando...</td></tr>
            ) : coupons.length === 0 ? (
              <tr><td colSpan={8} className="p-6 text-center text-muted-foreground">Nenhum cupom cadastrado</td></tr>
            ) : coupons.map((c) => {
              const expired = c.expires_at && new Date(c.expires_at) < new Date();
              return (
                <tr key={c.id} className="border-t border-border">
                  <td className="p-3 font-mono font-semibold">{c.code}</td>
                  <td className="p-3 max-w-[220px] truncate text-muted-foreground">{c.description || "—"}</td>
                  <td className="p-3">{typeLabel(c.discount_type)}</td>
                  <td className="p-3">{formatValue(c)}</td>
                  <td className="p-3">R$ {Number(c.min_order ?? 0).toFixed(2)}</td>
                  <td className="p-3">{c.expires_at ? new Date(c.expires_at).toLocaleString("pt-BR") : "—"}</td>
                  <td className="p-3">
                    {!c.active ? <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">Inativo</span>
                     : expired ? <span className="text-xs px-2 py-1 rounded-full bg-destructive/10 text-destructive">Expirado</span>
                     : <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">Ativo</span>}
                  </td>
                  <td className="p-3 text-right">
                    <div className="inline-flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => toggleActive(c)} title={c.active ? "Desativar" : "Ativar"}>
                        {c.active ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir cupom?</AlertDialogTitle>
                            <AlertDialogDescription>
                              O cupom <strong>{c.code}</strong> será excluído permanentemente.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => remove(c.id)}>Excluir</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CouponManager;
