import { LogoIcon } from "@/components/Logo";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Star, Trash2, Edit2, LocateFixed, Loader2, Info } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { GeoError, GEO_MESSAGES, getCurrentPosition, isGeolocationSupported, reverseGeocode } from "@/lib/geolocation";

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
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [geoNotice, setGeoNotice] = useState<string | null>(null);
  const numberRef = useRef<HTMLInputElement>(null);
  const geoSupported = isGeolocationSupported();

  const handleUseLocation = async () => {
    setGeoError(null);
    setGeoNotice(null);
    setLocating(true);
    try {
      const { lat, lon } = await getCurrentPosition();
      const found = await reverseGeocode(lat, lon);
      const keys = ["street", "number", "neighborhood", "city", "zip_code"] as const;
      const skipped = keys.some((k) => found[k] && form[k].trim() && form[k] !== found[k]);
      setForm((prev) => {
        const next = { ...prev };
        keys.forEach((k) => { if (found[k] && !prev[k].trim()) next[k] = found[k]; });
        return next;
      });
      setGeoNotice(
        "Confira os dados e complete o número e o complemento." +
          (skipped ? " Campos já preenchidos foram mantidos." : ""),
      );
      setTimeout(() => numberRef.current?.focus(), 0);
    } catch (e) {
      setGeoError(e instanceof GeoError ? e.message : GEO_MESSAGES.unavailable);
    } finally {
      setLocating(false);
    }
  };

  const fetchAddresses = async () => {
    if (!user?.id) return;
    const { data } = await supabase.from("addresses").select("*").eq("user_id", user.id).order("is_default", { ascending: false });
    if (data) setAddresses(data as Address[]);
  };

  useEffect(() => { fetchAddresses(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [user?.id]);

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

  const resetGeo = () => { setGeoError(null); setGeoNotice(null); };

  const startEdit = (addr: Address) => {
    resetGeo();
    setForm({ street: addr.street, number: addr.number, neighborhood: addr.neighborhood, city: addr.city, complement: addr.complement || "", zip_code: addr.zip_code });
    setEditingId(addr.id);
    setShowForm(true);
  };

  return (
    <div className="min-h-screen bg-background pb-[calc(8rem+env(safe-area-inset-bottom))] md:pb-24">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate("/")} className="text-foreground hover:text-primary"><ArrowLeft className="h-5 w-5" /></button>
          <LogoIcon className="h-6 w-6 text-primary" />
          <span className="font-display font-bold text-lg text-foreground">Meus Endereços</span>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-lg space-y-4">
        {!showForm && (
          <Button onClick={() => { resetGeo(); setForm(emptyForm); setEditingId(null); setShowForm(true); }} className="w-full gap-2">
            <Plus className="h-4 w-4" /> Adicionar endereço
          </Button>
        )}

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-5 space-y-4">
            <h3 className="font-semibold text-foreground">{editingId ? "Editar" : "Novo"} endereço</h3>
            {geoSupported && (
              <div className="space-y-2">
                <Button type="button" variant="outline" className="w-full gap-2 whitespace-normal h-auto min-h-10" onClick={handleUseLocation} disabled={locating}>
                  {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
                  {locating ? "Buscando localização…" : "Usar minha localização"}
                </Button>
                {geoError && <p role="alert" className="text-xs text-destructive">{geoError}</p>}
                {geoNotice && !geoError && (
                  <p role="status" className="text-xs text-muted-foreground flex items-start gap-1.5">
                    <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" /> {geoNotice}
                  </p>
                )}
              </div>
            )}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-1">
                <Label>Rua</Label>
                <Input value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} required />
              </div>
              <div className="space-y-1">
                <Label>Número</Label>
                <Input ref={numberRef} value={form.number}onChange={(e) => setForm({ ...form, number: e.target.value })} required />
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
              <Button type="button" variant="outline" onClick={() => { resetGeo(); setShowForm(false); setEditingId(null); }}>Cancelar</Button>
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
      <BottomNav />
    </div>
  );
};

export default Addresses;
