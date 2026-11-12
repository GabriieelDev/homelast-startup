import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  MapPin, LogOut, KeyRound, User, Moon, Sun, Camera, TicketPercent, ChevronRight,
  UserRound, Package, Bell, LifeBuoy,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "sonner";
import { useUserAvatar } from "@/hooks/useUserAvatar";
import { resizeImageToSquare } from "@/lib/avatar";
import { usePushToggle } from "@/components/PushNotificationsToggle";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { normalizeSocialUrl } from "@/components/SocialLinks";

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h2 className="px-1 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{children}</h2>
);

const Group = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-card rounded-2xl shadow-sm overflow-hidden divide-y divide-[#EDEFF3] dark:divide-border">
    {children}
  </div>
);

interface RowProps {
  icon: React.ElementType;
  label: string;
  value?: string;
  onClick?: () => void;
  disabled?: boolean;
  expanded?: boolean;
}

const Row = ({ icon: Icon, label, value, onClick, disabled, expanded }: RowProps) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-expanded={expanded}
    className="w-full min-h-[52px] px-4 flex items-center gap-3 text-left active:bg-gray-50 dark:active:bg-secondary/50 transition-colors disabled:opacity-60"
  >
    <Icon className="h-5 w-5 shrink-0 text-primary" />
    <span className="flex-1 text-[15px] font-medium text-foreground">{label}</span>
    {value && <span className="text-[13px] text-muted-foreground">{value}</span>}
    <ChevronRight className={`h-4 w-4 shrink-0 text-[#8A91A3] transition-transform ${expanded ? "rotate-90" : ""}`} />
  </button>
);

const Perfil = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);
  const { url: avatarSrc } = useUserAvatar();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showData, setShowData] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const dataRef = useRef<HTMLFormElement>(null);
  const { push, reason: pushReason, toggle: togglePush } = usePushToggle("Notificações ativadas 🔔");
  const { settings } = useStoreSettings();
  const whatsappUrl = (() => {
    const link = settings.social_links.find((l) => l.platform === "whatsapp" && l.enabled);
    return link ? normalizeSocialUrl(link) : "";
  })();
  const initials = (fullName || user?.email || "U").trim().slice(0, 2).toUpperCase();
  const openData = () => {
    setShowData(true);
    setTimeout(() => dataRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user) return;
    if (!["image/jpeg", "image/png"].includes(file.type)) return toast.error("Use uma imagem JPG ou PNG");
    if (file.size > 2 * 1024 * 1024) return toast.error("Imagem máxima de 2MB");
    setUploadingAvatar(true);
    try {
      const blob = await resizeImageToSquare(file, 200);
      const path = `${user.id}/avatar.jpg`;
      const { error: upErr } = await supabase.storage.from("avatares").upload(path, blob, {
        cacheControl: "3600", upsert: true, contentType: "image/jpeg",
      });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("avatares").getPublicUrl(path);
      const publicUrl = `${pub.publicUrl}?v=${Date.now()}`;
      const { error: updErr } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("user_id", user.id);
      if (updErr) throw updErr;
      window.dispatchEvent(new CustomEvent("avatar-updated"));
      toast.success("Foto atualizada ✅");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao enviar foto");
    } finally {
      setUploadingAvatar(false);
    }
  };

  useEffect(() => {
    if (!user?.id) return;
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
  }, [user?.id]);

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
    <div className="min-h-screen bg-[#F4F6F9] dark:bg-background pb-[calc(8rem+env(safe-area-inset-bottom))] md:pb-24">
      <div className="mx-auto w-full max-w-[480px] px-4">
        <header className="py-4 text-center">
          <h1 className="text-[17px] font-semibold text-[#1D2D50] dark:text-foreground">Perfil</h1>
        </header>

        <div className="space-y-5">
          {/* Card do usuário */}
          <div className="bg-card rounded-2xl shadow-sm p-[14px] flex items-center gap-3">
            <div className="relative shrink-0">
              <div className="h-14 w-14 rounded-full bg-[#1D2D50] text-white flex items-center justify-center overflow-hidden font-semibold">
                {avatarSrc ? (
                  <img src={avatarSrc} alt="Foto de perfil" className="h-full w-full object-cover" />
                ) : (
                  <span aria-hidden="true">{initials || <User className="h-6 w-6" />}</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                aria-label="Trocar foto de perfil"
                className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-[#00B894] text-white flex items-center justify-center shadow-md active:scale-95 transition-transform disabled:opacity-60"
              >
                <Camera className="h-3 w-3" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
            <button type="button" onClick={openData} className="flex-1 min-w-0 flex items-center gap-2 text-left">
              <div className="flex-1 min-w-0">
                <p className="text-base font-semibold text-[#1D2D50] dark:text-foreground truncate">{fullName || "Usuário"}</p>
                <p className="text-[13px] text-muted-foreground truncate">{user?.email}</p>
                {uploadingAvatar && <p className="text-xs text-muted-foreground mt-0.5">Enviando foto...</p>}
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-[#8A91A3]" />
            </button>
          </div>

          {/* Minha conta */}
          <section>
            <SectionTitle>Minha conta</SectionTitle>
            <Group>
              <Row icon={UserRound} label="Meus dados" expanded={showData} onClick={() => setShowData((v) => !v)} />
              {showData && (
                <form ref={dataRef} onSubmit={saveProfile} className="p-4 space-y-4">
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
              )}
              <Row icon={MapPin} label="Endereços" onClick={() => navigate("/enderecos")} />
              <Row icon={Package} label="Meus pedidos" onClick={() => navigate("/pedidos")} />
              <Row icon={TicketPercent} label="Meus cupons" onClick={() => navigate("/meus-cupons")} />
              <Row icon={KeyRound} label="Alterar senha" expanded={showPwd} onClick={() => setShowPwd((v) => !v)} />
              {showPwd && (
                <form onSubmit={changePassword} className="p-4 space-y-4">
                  <div className="space-y-1">
                    <Label>Nova senha</Label>
                    <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Mín. 6 caracteres" />
                  </div>
                  <Button type="submit" variant="outline" className="w-full" disabled={savingPwd || !newPassword}>
                    {savingPwd ? "Atualizando..." : "Alterar senha"}
                  </Button>
                </form>
              )}
            </Group>
          </section>

          {/* Preferências */}
          <section>
            <SectionTitle>Preferências</SectionTitle>
            <Group>
              <Row
                icon={Bell}
                label="Notificações"
                value={push.subscribed ? "Ativadas" : "Desativadas"}
                disabled={push.loading || push.busy}
                onClick={() => (pushReason ? toast.info(pushReason) : togglePush())}
              />
              {pushReason && (
                <p className="px-4 py-3 text-xs text-muted-foreground">{pushReason}</p>
              )}
              <Row
                icon={theme === "dark" ? Moon : Sun}
                label="Tema"
                value={theme === "dark" ? "Escuro" : "Claro"}
                onClick={() => {
                  toggleTheme();
                  toast.success(theme !== "dark" ? "Modo escuro ativado 🌙" : "Modo claro ativado ☀️", { duration: 1500 });
                }}
              />
            </Group>
          </section>

          {/* Suporte */}
          <section>
            <SectionTitle>Suporte</SectionTitle>
            <Group>
              {whatsappUrl && (
                <Row icon={LifeBuoy} label="Central de ajuda" onClick={() => window.open(whatsappUrl, "_blank", "noopener,noreferrer")} />
              )}
              <button
                type="button"
                onClick={async () => { await signOut(); navigate("/auth"); }}
                className="w-full min-h-[52px] px-4 flex items-center gap-3 text-left text-[#C0392B] active:bg-gray-50 dark:active:bg-secondary/50 transition-colors"
              >
                <LogOut className="h-5 w-5 shrink-0" />
                <span className="text-[15px] font-medium">Sair</span>
              </button>
            </Group>
          </section>
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default Perfil;
