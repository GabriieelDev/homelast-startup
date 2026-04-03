import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Zap, Eye, EyeOff } from "lucide-react";

const Auth = () => {
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();

  const clearErrors = () => setErrors({});

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();
    const newErrors: Record<string, string> = {};
    if (!email) newErrors.email = "Informe seu email.";
    if (!password) newErrors.password = "Informe sua senha.";
    if (Object.keys(newErrors).length) { setErrors(newErrors); return; }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        toast.error("Email ou senha incorretos.");
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success("Login realizado com sucesso!");
      navigate("/");
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();
    const newErrors: Record<string, string> = {};
    if (!fullName) newErrors.fullName = "Informe seu nome completo.";
    if (!email) newErrors.email = "Informe seu email.";
    if (!phone) newErrors.phone = "Informe seu telefone.";
    if (!password) newErrors.password = "Informe uma senha.";
    if (password.length > 0 && password.length < 6) newErrors.password = "A senha deve ter pelo menos 6 caracteres.";
    if (password !== confirmPassword) newErrors.confirmPassword = "As senhas não coincidem.";
    if (Object.keys(newErrors).length) { setErrors(newErrors); return; }

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, phone },
      },
    });
    setLoading(false);

    if (error) {
      if (error.message.includes("already registered") || error.message.includes("already been registered")) {
        toast.error("Este email já está em uso.");
      } else {
        toast.error(error.message);
      }
      return;
    }

    // If auto-confirm is on, session will be present
    if (data.session) {
      toast.success("Conta criada com sucesso!");
      navigate("/");
    } else {
      toast.success("Conta criada! Verifique seu email para confirmar.");
      setMode("login");
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();
    if (!email) { setErrors({ email: "Informe seu email." }); return; }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Email enviado! Verifique sua caixa de entrada.");
      setMode("login");
    }
  };

  const FieldError = ({ field }: { field: string }) =>
    errors[field] ? <p className="text-sm text-destructive">{errors[field]}</p> : null;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Zap className="h-8 w-8 text-primary" />
            <span className="font-display font-bold text-2xl text-foreground">Mercado Flash</span>
          </div>
          <p className="text-muted-foreground">
            {mode === "login" && "Entre na sua conta"}
            {mode === "signup" && "Crie sua conta"}
            {mode === "forgot" && "Recupere sua senha"}
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-6">
          {mode === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                <FieldError field="email" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <FieldError field="password" />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Entrando..." : "Entrar"}
              </Button>
              <button type="button" onClick={() => { setMode("forgot"); clearErrors(); }} className="text-sm text-primary hover:underline w-full text-center block">
                Esqueci minha senha
              </button>
            </form>
          )}

          {mode === "signup" && (
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Nome completo</Label>
                <Input id="fullName" placeholder="Seu nome" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                <FieldError field="fullName" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signupEmail">Email</Label>
                <Input id="signupEmail" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                <FieldError field="email" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input id="phone" type="tel" placeholder="(11) 99999-9999" value={phone} onChange={(e) => setPhone(e.target.value)} />
                <FieldError field="phone" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signupPassword">Senha</Label>
                <div className="relative">
                  <Input id="signupPassword" type={showPassword ? "text" : "password"} placeholder="Mínimo 6 caracteres" value={password} onChange={(e) => setPassword(e.target.value)} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <FieldError field="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar senha</Label>
                <Input id="confirmPassword" type={showPassword ? "text" : "password"} placeholder="Repita a senha" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                <FieldError field="confirmPassword" />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Criando conta..." : "Criar conta"}
              </Button>
            </form>
          )}

          {mode === "forgot" && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="forgotEmail">Email</Label>
                <Input id="forgotEmail" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                <FieldError field="email" />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Enviando..." : "Enviar link de recuperação"}
              </Button>
            </form>
          )}

          <div className="text-center text-sm text-muted-foreground">
            {mode === "login" && (
              <p>Não tem conta?{" "}<button onClick={() => { setMode("signup"); clearErrors(); }} className="text-primary hover:underline font-medium">Criar conta</button></p>
            )}
            {(mode === "signup" || mode === "forgot") && (
              <p>Já tem conta?{" "}<button onClick={() => { setMode("login"); clearErrors(); }} className="text-primary hover:underline font-medium">Entrar</button></p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
