import { LogoIcon } from "@/components/Logo";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, MapPin, LogOut, KeyRound, User, Moon, Camera } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "sonner";
import { useUserAvatar } from "@/hooks/useUserAvatar";
import { resizeImageToSquare } from "@/lib/avatar";

const Perfil = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setFullName(data.full_name ?? "");
          setPhone(data.phone ?? "");
        }
      });
  }, [user]);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSavingProfile(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName, phone })
      .eq("user_id", user.id);
    setSavingProfile(false);
    if (error) return toast.error("Erro ao salvar perfil");
    toast.success("Perfil atualizado ✅");
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) return toast.error("Senha deve ter ao menos 6 caracteres");
    setSavingPwd(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPwd(false);
    if (error) return toast.error(error.message);
    setNewPassword("");
    toast.success("Senha alterada ✅");
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate("/")} className="text-foreground"><ArrowLeft className="h-5 w-5" /></button>
          <LogoIcon className="h-5 w-5 text-primary" />
          <span className="font-display font-bold text-lg text-foreground">Meu Perfil</span>
        </div>
      </header>

      <div className="container mx-auto max-w-lg px-4 py-6 space-y-4">
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-foreground truncate">{fullName || "Usuário"}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
        </div>

        <form onSubmit={saveProfile} className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h3 className="font-semibold text-foreground">Dados pessoais</h3>
          <div className="space-y-1">
            <Label>Nome completo</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </div>
          <div className="space-y-1">
            <Label>Email</Label>
            <Input value={user?.email ?? ""} disabled />
          </div>
          <div className="space-y-1">
            <Label>Telefone</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(11) 99999-9999" />
          </div>
          <Button type="submit" className="w-full" disabled={savingProfile}>
            {savingProfile ? "Salvando..." : "Salvar alterações"}
          </Button>
        </form>

        <button
          onClick={() => navigate("/enderecos")}
          className="w-full bg-card border border-border rounded-xl p-4 flex items-center gap-3 hover:bg-secondary/50 transition-colors text-left"
        >
          <MapPin className="h-5 w-5 text-primary" />
          <div className="flex-1">
            <p className="font-medium text-foreground">Meus endereços</p>
            <p className="text-xs text-muted-foreground">Editar endereços de entrega</p>
          </div>
        </button>

        <div className="bg-card border border-border rounded-xl p-5 space-y-3">
          <h3 className="font-semibold text-foreground">Preferências</h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Moon className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium text-foreground">🌙 Modo escuro</p>
                <p className="text-xs text-muted-foreground">Ativar tema escuro em todo o app</p>
              </div>
            </div>
            <Switch
              checked={theme === "dark"}
              onCheckedChange={(v) => { toggleTheme(); toast.success(v ? "Modo escuro ativado 🌙" : "Modo claro ativado ☀️", { duration: 1500 }); }}
              aria-label="Alternar modo escuro"
            />
          </div>
        </div>



        <form onSubmit={changePassword} className="bg-card border border-border rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-foreground">Alterar senha</h3>
          </div>
          <div className="space-y-1">
            <Label>Nova senha</Label>
            <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Mín. 6 caracteres" />
          </div>
          <Button type="submit" variant="outline" className="w-full" disabled={savingPwd || !newPassword}>
            {savingPwd ? "Atualizando..." : "Alterar senha"}
          </Button>
        </form>

        <Button
          variant="destructive"
          className="w-full gap-2"
          onClick={async () => { await signOut(); navigate("/auth"); }}
        >
          <LogOut className="h-4 w-4" /> Sair da conta
        </Button>
      </div>
    </div>
  );
};

export default Perfil;
