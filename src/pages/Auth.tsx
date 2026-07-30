import { useState, useEffect, useRef, useDeferredValue, useTransition, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Eye, EyeOff, Mail, Lock, Lock as LockSmall, Truck, Leaf, MousePointerClick } from "lucide-react";
import Logo, { LogoIcon } from "@/components/Logo";

type Mode = "login" | "signup" | "forgot";

const getPasswordStrength = (pwd: string) => {
  let score = 0;
  if (pwd.length >= 6) score++;
  if (pwd.length >= 10) score++;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
  if (/\d/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  return Math.min(score, 4);
};

const Auth = () => {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const emailRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const [, startTransition] = useTransition();
  // Defer mode swap & password-strength recompute so keystrokes/clicks stay <200ms (INP).
  const switchMode = useCallback((next: Mode) => {
    setErrors({});
    startTransition(() => setMode(next));
  }, []);
  const deferredPassword = useDeferredValue(password);

  useEffect(() => {
    emailRef.current?.focus();
  }, [mode]);

  const clearErrors = () => setErrors({});

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();
    const newErrors: Record<string, string> = {};
    if (!email) newErrors.email = "Informe seu e-mail.";
    if (!password) newErrors.password = "Informe sua senha.";
    if (Object.keys(newErrors).length) { setErrors(newErrors); return; }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      const msg = error.message.includes("Invalid login credentials")
        ? "E-mail ou senha incorretos."
        : error.message;
      setErrors({ password: msg });
      toast.error(msg);
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
    if (!email) newErrors.email = "Informe seu e-mail.";
    if (!phone) newErrors.phone = "Informe seu telefone.";
    if (!password) newErrors.password = "Informe uma senha.";
    if (password.length > 0 && (password.length < 8 || !/\d/.test(password))) newErrors.password = "A senha deve ter pelo menos 8 caracteres e conter ao menos 1 número.";
    if (password !== confirmPassword) newErrors.confirmPassword = "As senhas não coincidem.";
    if (Object.keys(newErrors).length) { setErrors(newErrors); return; }

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName, phone } },
    });
    setLoading(false);

    if (error) {
      const msg = error.message.includes("already registered") || error.message.includes("already been registered")
        ? "Este e-mail já está em uso."
        : error.message;
      toast.error(msg);
      return;
    }
    if (data.session) {
      toast.success("Conta criada com sucesso!");
      navigate("/");
    } else {
      toast.success("Conta criada! Verifique seu e-mail para confirmar.");
      setMode("login");
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();
    if (!email) { setErrors({ email: "Informe seu e-mail." }); return; }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else {
      toast.success("E-mail enviado! Verifique sua caixa de entrada.");
      setMode("login");
    }
  };

  const FieldError = ({ field }: { field: string }) =>
    errors[field] ? <p className="text-xs text-destructive mt-1">{errors[field]}</p> : null;

  const strength = getPasswordStrength(deferredPassword);
  const strengthLabels = ["Muito fraca", "Fraca", "Razoável", "Boa", "Forte"];
  const strengthColors = ["bg-red-400", "bg-orange-400", "bg-yellow-400", "bg-lime-500", "bg-green-500"];

  // Field styling: gray border default, soft blue on focus, gray icons
  const fieldWrapper = "relative";
  const iconLeft = "absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#1D2D50]/65 pointer-events-none";
  const iconRight = "absolute right-5 top-1/2 -translate-y-1/2 text-[#1D2D50]/65 hover:text-[#1D2D50] transition-colors";
  const focusRing = "focus-visible:outline-none focus-visible:ring-0 focus-visible:border-[#00B894] focus-visible:shadow-[inset_0_1px_3px_rgba(29,45,80,0.06),0_0_0_4px_rgba(0,184,148,0.15)] transition-all duration-200";
  const inputBase = `h-12 pl-12 pr-5 rounded-full border-[#E0E0E0] bg-white text-[#212121] placeholder:text-[#BDBDBD] shadow-[inset_0_1px_3px_rgba(29,45,80,0.06)] ${focusRing}`;
  const plainInput = `h-12 px-5 rounded-full border-[#E0E0E0] bg-white shadow-[inset_0_1px_3px_rgba(29,45,80,0.06)] ${focusRing}`;
  const labelBase = "text-sm font-medium text-[#424242] pl-1";
  const primaryBtn = "w-full h-12 bg-[#00B894] hover:bg-[#E65100] text-white font-semibold rounded-full shadow-[0_8px_20px_rgba(0,184,148,0.35)] hover:shadow-[0_10px_24px_rgba(0,184,148,0.42)] active:scale-[0.98] transition-all duration-200 auth-rise auth-d5";

  return (
    <div className="min-h-screen flex bg-white">
      {/* LEFT PANEL — desktop only */}
      <aside className="hidden lg:flex lg:w-3/5 relative overflow-hidden bg-gradient-to-br from-[#1D2D50] to-[#2A4373] text-white flex-col justify-between p-12">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute bottom-0 -left-32 w-[28rem] h-[28rem] rounded-full bg-white/5 blur-3xl" />

        <div className="relative z-10">
          <Logo color="#FFFFFF" />
        </div>

        <div className="relative z-10 max-w-md space-y-10">
          <div className="space-y-3">
            <h1 className="font-display font-bold text-4xl leading-tight">
              Tudo que você precisa,<br />entregue na sua porta.
            </h1>
            <p className="text-white/80 text-base">Seu supermercado digital, rápido e seguro.</p>
          </div>

          <ul className="space-y-5">
            {[
              { Icon: Truck, title: "Entrega rápida", text: "Receba em minutos" },
              { Icon: Leaf, title: "Produtos frescos", text: "Qualidade garantida" },
              { Icon: MousePointerClick, title: "Facilidade", text: "Compre em poucos cliques" },
            ].map(({ Icon, title, text }) => (
              <li key={title} className="flex items-start gap-4">
                <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                  <Icon className="h-5 w-5 text-[#00B894]" />
                </div>
                <div>
                  <p className="font-semibold">{title}</p>
                  <p className="text-sm text-white/75">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-xs text-white/60">HomeLast Startup © 2025</p>
      </aside>

      {/* RIGHT — FORM */}
      <main className="relative flex-1 lg:w-2/5 flex items-stretch lg:items-center justify-center px-0 pt-0 pb-0 lg:p-10 bg-[#16213E] lg:bg-white">
        {/* Mobile brand band with organic blurred blobs */}
        <div className="lg:hidden absolute inset-x-0 top-0 h-[46vh] overflow-hidden bg-[#16213E]">
          <div className="absolute -top-16 -left-16 w-56 h-56 rounded-full bg-[#00B894] opacity-40 blur-[32px]" />
          <div className="absolute bottom-4 -right-12 w-44 h-44 rounded-full bg-[#1D2D50] opacity-50 blur-[30px]" />
          <div className="absolute top-1/2 right-10 w-24 h-24 rounded-full bg-[#00B894] opacity-25 blur-[28px]" />
        </div>

        <div key={mode} className="relative z-10 w-full max-w-md flex flex-col lg:block lg:space-y-8">
          {/* Mobile brand header area (~42% of viewport) */}
          <div className="min-h-[42vh] lg:min-h-0 flex flex-col justify-center gap-5 px-4 lg:px-0 lg:gap-0 lg:space-y-8">
            {/* Logo */}
            <div className="flex flex-col items-center gap-2 auth-rise auth-d1">
              <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-[10px] border border-white/30 shadow-[0_8px_24px_rgba(0,0,0,0.18),0_0_40px_rgba(0,184,148,0.25)] lg:bg-white/60 lg:border-[#1D2D50]/10 flex items-center justify-center">
                <LogoIcon className="h-7 w-7" />
              </div>
              <span className="lg:hidden font-display font-bold text-lg text-white">HomeLast Startup</span>
            </div>

            {/* Heading */}
            <div className="text-center space-y-1">
              <h2 className="font-display font-bold text-2xl sm:text-3xl text-white lg:text-[#212121] auth-rise auth-d2">
                {mode === "login" && "Bem-vindo!"}
                {mode === "signup" && "Crie sua conta"}
                {mode === "forgot" && "Recupere sua senha"}
              </h2>
              <p className="text-sm text-white/75 lg:text-[#757575] auth-rise auth-d3">
                {mode === "login" && "Entre na sua conta para continuar comprando"}
                {mode === "signup" && "Cadastre-se e comece a comprar agora"}
                {mode === "forgot" && "Enviaremos um link para redefinir sua senha"}
              </p>
            </div>
          </div>

          {/* Form card */}
          <div className="flex-1 bg-white rounded-t-3xl shadow-[0_-8px_40px_-12px_rgba(0,0,0,0.35)] px-5 pt-7 pb-8 sm:px-6 space-y-6 lg:bg-transparent lg:rounded-none lg:shadow-none lg:p-0">



          {/* LOGIN */}
          {mode === "login" && (
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-1.5 auth-rise auth-d4">
                <Label htmlFor="email" className={labelBase}>E-mail</Label>
                <div className={fieldWrapper}>
                  <Mail className={iconLeft} />
                  <Input ref={emailRef} id="email" type="email" autoComplete="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className={inputBase} />
                </div>
                <FieldError field="email" />
              </div>

              <div className="space-y-1.5 auth-rise auth-d4">
                <Label htmlFor="password" className={labelBase}>Senha</Label>
                <div className={fieldWrapper}>
                  <Lock className={iconLeft} />
                  <Input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className={`${inputBase} pr-10`} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className={iconRight} aria-label="Mostrar senha">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <FieldError field="password" />
              </div>

              <div className="flex items-center gap-2 auth-rise auth-d5">
                <Checkbox id="remember" checked={remember} onCheckedChange={(v) => setRemember(!!v)} />
                <Label htmlFor="remember" className="text-sm text-[#424242] cursor-pointer">Lembrar de mim neste dispositivo</Label>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className={primaryBtn}
              >
                {loading ? "Entrando..." : "Entrar"}
              </Button>

              <button type="button" onClick={() => switchMode("forgot")} className="block mx-auto auth-rise auth-d6 text-sm text-[#1D2D50] hover:underline">
                Esqueci minha senha
              </button>

              <div className="relative my-6 auth-rise auth-d6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-[#F0F0F0]" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-3 text-[#9E9E9E]">ou</span>
                </div>
              </div>


              <p className="text-center text-sm text-[#616161] auth-rise auth-d6">
                Não tem conta?{" "}
                <button type="button" onClick={() => switchMode("signup")} className="text-[#00B894] hover:text-[#E65100] font-bold">
                  Criar conta
                </button>
              </p>
            </form>
          )}

          {/* SIGNUP */}
          {mode === "signup" && (
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-1.5 auth-rise auth-d4">
                <Label htmlFor="fullName" className={labelBase}>Nome completo</Label>
                <Input id="fullName" placeholder="Seu nome" value={fullName} onChange={(e) => setFullName(e.target.value)} className={plainInput} />
                <FieldError field="fullName" />
              </div>
              <div className="space-y-1.5 auth-rise auth-d4">
                <Label htmlFor="signupEmail" className={labelBase}>E-mail</Label>
                <div className={fieldWrapper}>
                  <Mail className={iconLeft} />
                  <Input ref={emailRef} id="signupEmail" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className={inputBase} />
                </div>
                <FieldError field="email" />
              </div>
              <div className="space-y-1.5 auth-rise auth-d4">
                <Label htmlFor="phone" className={labelBase}>Telefone</Label>
                <Input id="phone" type="tel" placeholder="(11) 99999-9999" value={phone} onChange={(e) => setPhone(e.target.value)} className={plainInput} />
                <FieldError field="phone" />
              </div>
              <div className="space-y-1.5 auth-rise auth-d5">
                <Label htmlFor="signupPassword" className={labelBase}>Senha</Label>
                <div className={fieldWrapper}>
                  <Lock className={iconLeft} />
                  <Input id="signupPassword" type={showPassword ? "text" : "password"} placeholder="Mínimo 8 caracteres, com 1 número" value={password} onChange={(e) => setPassword(e.target.value)} className={`${inputBase} pr-10`} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className={iconRight}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {password && (
                  <div className="space-y-1 pt-1">
                    <div className="flex gap-1">
                      {[0,1,2,3].map(i => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i < strength ? strengthColors[strength] : "bg-[#EEEEEE]"}`} />
                      ))}
                    </div>
                    <p className="text-xs text-[#757575]">Força: {strengthLabels[strength]}</p>
                  </div>
                )}
                <FieldError field="password" />
              </div>
              <div className="space-y-1.5 auth-rise auth-d5">
                <Label htmlFor="confirmPassword" className={labelBase}>Confirmar senha</Label>
                <div className={fieldWrapper}>
                  <Lock className={iconLeft} />
                  <Input id="confirmPassword" type={showPassword ? "text" : "password"} placeholder="Repita a senha" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={inputBase} />
                </div>
                <FieldError field="confirmPassword" />
              </div>

              <Button type="submit" disabled={loading} className={primaryBtn}>
                {loading ? "Criando conta..." : "Criar conta"}
              </Button>

              <p className="text-center text-sm text-[#616161] auth-rise auth-d6">
                Já tem conta?{" "}
                <button type="button" onClick={() => switchMode("login")} className="text-[#1D2D50] hover:underline font-medium">
                  Entrar
                </button>
              </p>
            </form>
          )}

          {/* FORGOT */}
          {mode === "forgot" && (
            <form onSubmit={handleForgotPassword} className="space-y-5">
              <div className="space-y-1.5 auth-rise auth-d4">
                <Label htmlFor="forgotEmail" className={labelBase}>E-mail</Label>
                <div className={fieldWrapper}>
                  <Mail className={iconLeft} />
                  <Input ref={emailRef} id="forgotEmail" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className={inputBase} />
                </div>
                <FieldError field="email" />
              </div>
              <Button type="submit" disabled={loading} className={primaryBtn}>
                {loading ? "Enviando..." : "Enviar link de recuperação"}
              </Button>
              <p className="text-center text-sm text-[#616161] auth-rise auth-d6">
                Lembrou a senha?{" "}
                <button type="button" onClick={() => switchMode("login")} className="text-[#1D2D50] hover:underline font-medium">
                  Voltar ao login
                </button>
              </p>
            </form>
          )}

            {/* Security footer */}
            <div className="flex items-start justify-center gap-2 auth-rise auth-d6">
              <LockSmall className="h-4 w-4 mt-0.5 text-[#00B894]" />
              <div className="text-center leading-tight">
                <p className="text-xs font-semibold text-[#616161]">Conexão segura</p>
                <p className="text-[11px] text-[#BDBDBD]">Seus dados são protegidos por criptografia</p>
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
};

export default Auth;
