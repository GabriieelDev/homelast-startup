import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Plus, Power, PowerOff, Trash2, Megaphone, Upload, X } from "lucide-react";
import { toast } from "sonner";

type AnnType = "cupom" | "promocao";

interface Banner {
  id: string;
  image_url: string;
  type: AnnType;
  coupon_code: string | null;
  link_url: string | null;
  title: string | null;
  active: boolean;
  sort_order: number;
  created_at: string;
}

const emptyForm = {
  image_url: "",
  type: "cupom" as AnnType,
  coupon_code: "",
  link_url: "",
  title: "",
  sort_order: "0",
};

const AnnouncementsManager = () => {
  const [items, setItems] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("announcement_banners" as any)
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) toast.error("Erro ao carregar anúncios");
    setItems((data as any) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) return toast.error("Selecione uma imagem");
    if (file.size > 5 * 1024 * 1024) return toast.error("Máx. 5MB");
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `anuncios/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from("banners").upload(path, file, {
        cacheControl: "3600", upsert: false, contentType: file.type,
      });
      if (error) throw error;
      const { data } = supabase.storage.from("banners").getPublicUrl(path);
      setForm((f) => ({ ...f, image_url: data.publicUrl }));
      toast.success("Imagem enviada");
    } catch (e: any) {
      toast.error(e?.message || "Falha no upload");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleCreate = useCallback(async () => {
    if (!form.image_url) return toast.error("Envie uma imagem");
    if (form.type === "cupom" && !form.coupon_code.trim()) return toast.error("Código do cupom é obrigatório");
    setSaving(true);
    const payload = {
      image_url: form.image_url,
      type: form.type,
      coupon_code: form.type === "cupom" ? form.coupon_code.trim().toUpperCase() : null,
      link_url: form.link_url.trim() || null,
      title: form.title.trim() || null,
      sort_order: Number(form.sort_order) || 0,
      active: true,
    };
    const { error } = await supabase.from("announcement_banners" as any).insert(payload as any);
    setSaving(false);
    if (error) return toast.error("Erro ao criar anúncio");
    toast.success("Anúncio criado!");
    setForm(emptyForm);
    setOpen(false);
    load();
  }, [form, load]);

  const toggleActive = useCallback(async (b: Banner) => {
    const { error } = await supabase.from("announcement_banners" as any).update({ active: !b.active }).eq("id", b.id);
    if (error) return toast.error("Erro ao atualizar");
    toast.success(b.active ? "Anúncio desativado" : "Anúncio ativado");
    load();
  }, [load]);

  const remove = useCallback(async (id: string) => {
    const { error } = await supabase.from("announcement_banners" as any).delete().eq("id", id);
    if (error) return toast.error("Erro ao excluir");
    toast.success("Anúncio excluído");
    load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-primary" /> Anúncios
          </h2>
          <p className="text-sm text-muted-foreground">Banners promocionais exibidos para o cliente</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 transition-transform hover:scale-[1.03] active:scale-[0.97]">
              <Plus className="h-4 w-4" /> Novo anúncio
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo anúncio</DialogTitle>
              <DialogDescription className="sr-only">Formulário para criar um novo anúncio promocional.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Imagem do banner</Label>
                {form.image_url ? (
                  <div className="relative w-full h-40 rounded-md overflow-hidden border border-border bg-muted">
                    <img src={form.image_url} alt="Pré-visualização" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, image_url: "" })}
                      className="absolute top-2 right-2 bg-background/90 rounded-full p-1"
                      aria-label="Remover imagem"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <Button
                    type="button" variant="outline" disabled={uploading}
                    onClick={() => fileRef.current?.click()}
                    className="w-full gap-2"
                  >
                    <Upload className="h-4 w-4" /> {uploading ? "Enviando..." : "Enviar imagem"}
                  </Button>
                )}
                <input
                  ref={fileRef} type="file" accept="image/*" className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Tipo</Label>
                  <Select value={form.type} onValueChange={(v: AnnType) => setForm({ ...form, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cupom">Cupom</SelectItem>
                      <SelectItem value="promocao">Promoção</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Ordem</Label>
                  <Input
                    type="number" value={form.sort_order}
                    onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>Título (opcional)</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Ex: Mega Promoção da Semana"
                />
              </div>
              {form.type === "cupom" ? (
                <div>
                  <Label>Código do cupom</Label>
                  <Input
                    value={form.coupon_code}
                    onChange={(e) => setForm({ ...form, coupon_code: e.target.value.toUpperCase() })}
                    placeholder="PROMO10"
                    className="uppercase font-mono"
                  />
                </div>
              ) : (
                <div>
                  <Label>Link / categoria (opcional)</Label>
                  <Input
                    value={form.link_url}
                    onChange={(e) => setForm({ ...form, link_url: e.target.value })}
                    placeholder="/?categoria=promocoes"
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreate} disabled={saving}>{saving ? "Salvando..." : "Criar"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-xl border border-border overflow-x-auto bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr className="text-left">
              <th className="p-3">Imagem</th>
              <th className="p-3">Tipo</th>
              <th className="p-3">Título / Código</th>
              <th className="p-3">Ordem</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Carregando...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Nenhum anúncio cadastrado</td></tr>
            ) : items.map((b) => (
              <tr key={b.id} className="border-t border-border">
                <td className="p-3">
                  <img src={b.image_url} alt="" className="h-12 w-20 object-cover rounded" />
                </td>
                <td className="p-3 capitalize">{b.type}</td>
                <td className="p-3">
                  <div className="font-medium">{b.title || "—"}</div>
                  {b.coupon_code && <div className="text-xs font-mono text-muted-foreground">{b.coupon_code}</div>}
                </td>
                <td className="p-3">{b.sort_order}</td>
                <td className="p-3">
                  {b.active
                    ? <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">Ativo</span>
                    : <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">Inativo</span>}
                </td>
                <td className="p-3 text-right">
                  <div className="inline-flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => toggleActive(b)} title={b.active ? "Desativar" : "Ativar"}>
                      {b.active ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir anúncio?</AlertDialogTitle>
                          <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => remove(b.id)}>Excluir</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AnnouncementsManager;
