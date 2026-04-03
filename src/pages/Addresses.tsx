import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Zap, ArrowLeft, Plus, Star, Trash2, Edit2 } from "lucide-react";

interface Address {
  id: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  complement: string;
  zip_code: string;
  is_default: boolean;
}

const emptyForm = { street: "", number: "", neighborhood: "", city: "", complement: "", zip_code: "" };

const Addresses = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  const fetchAddresses = async () => {
    if (!user) return;
    const { data } = await supabase.from("addresses").select("*").eq("user_id", user.id).order("is_default", { ascending: false });
    if (data) setAddresses(data as Address[]);
  };

  useEffect(() => { fetchAddresses(); }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    if (editingId) {
      await supabase.from("addresses").update({ ...form }).eq("id", editingId);
      toast({ title: "Endereço atualizado!" });
    } else {
      const isFirst = addresses.length === 0;
      await supabase.from("addresses").insert({ ...form, user_id: user.id, is_default: isFirst });
      toast({ title: "Endereço adicionado!" });
    }

    setLoading(false);
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    fetchAddresses();
  };

  const setDefault = async (id: string) => {
    if (!user) return;
    await supabase.from("addresses").update({ is_default: false }).eq("user_id", user.id);
    await supabase.from("addresses").update({ is_default: true }).eq("id", id);
    toast({ title: "Endereço principal atualizado!" });
    fetchAddresses();
  };

  const deleteAddress = async (id: string) => {
    await supabase.from("addresses").delete().eq("id", id);
    toast({ title: "Endereço removido!" });
    fetchAddresses();
  };

  const startEdit = (addr: Address) => {
    setForm({ street: addr.street, number: addr.number, neighborhood: addr.neighborhood, city: addr.city, complement: addr.complement || "", zip_code: addr.zip_code });
    setEditingId(addr.id);
    setShowForm(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate("/")} className="text-foreground hover:text-primary"><ArrowLeft className="h-5 w-5" /></button>
          <Zap className="h-6 w-6 text-primary" />
          <span className="font-display font-bold text-lg text-foreground">Meus Endereços</span>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-lg space-y-4">
        {!showForm && (
          <Button onClick={() => { setForm(emptyForm); setEditingId(null); setShowForm(true); }} className="w-full gap-2">
            <Plus className="h-4 w-4" /> Adicionar endereço
          </Button>
        )}

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-5 space-y-4">
            <h3 className="font-semibold text-foreground">{editingId ? "Editar" : "Novo"} endereço</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-1">
                <Label>Rua</Label>
                <Input value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} required />
              </div>
              <div className="space-y-1">
                <Label>Número</Label>
                <Input value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Bairro</Label>
                <Input value={form.neighborhood} onChange={(e) => setForm({ ...form, neighborhood: e.target.value })} required />
              </div>
              <div className="space-y-1">
                <Label>Cidade</Label>
                <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Complemento</Label>
                <Input value={form.complement} onChange={(e) => setForm({ ...form, complement: e.target.value })} placeholder="Opcional" />
              </div>
              <div className="space-y-1">
                <Label>CEP</Label>
                <Input value={form.zip_code} onChange={(e) => setForm({ ...form, zip_code: e.target.value })} required placeholder="00000-000" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="flex-1" disabled={loading}>{loading ? "Salvando..." : "Salvar"}</Button>
              <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditingId(null); }}>Cancelar</Button>
            </div>
          </form>
        )}

        {addresses.map((addr) => (
          <div key={addr.id} className={`bg-card border rounded-xl p-4 space-y-2 ${addr.is_default ? "border-primary" : "border-border"}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-foreground">{addr.street}, {addr.number}</p>
                <p className="text-sm text-muted-foreground">{addr.neighborhood} - {addr.city}</p>
                {addr.complement && <p className="text-sm text-muted-foreground">{addr.complement}</p>}
                <p className="text-sm text-muted-foreground">CEP: {addr.zip_code}</p>
              </div>
              {addr.is_default && <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium flex items-center gap-1"><Star className="h-3 w-3" /> Principal</span>}
            </div>
            <div className="flex gap-2">
              {!addr.is_default && <Button size="sm" variant="outline" onClick={() => setDefault(addr.id)} className="gap-1"><Star className="h-3 w-3" /> Definir como principal</Button>}
              <Button size="sm" variant="ghost" onClick={() => startEdit(addr)}><Edit2 className="h-3 w-3" /></Button>
              <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteAddress(addr.id)}><Trash2 className="h-3 w-3" /></Button>
            </div>
          </div>
        ))}

        {addresses.length === 0 && !showForm && (
          <p className="text-center text-muted-foreground py-8">Nenhum endereço cadastrado</p>
        )}
      </div>
    </div>
  );
};

export default Addresses;
