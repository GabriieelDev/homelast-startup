import { useState, useEffect, useRef, useDeferredValue, useTransition, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { LogoIcon } from "@/components/Logo";

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

const socialProviders = [
  import.meta.env.VITE_ENABLE_GOOGLE_LOGIN === "true" && "google",
  import.meta.env.VITE_ENABLE_FACEBOOK_LOGIN === "true" && "facebook",
].filter(Boolean) as ("google" | "facebook")[];

const GoogleLogo = () => (
  <svg aria-hidden viewBox="0 0 48 48" className="h-5 w-5">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
  </svg>
);

const FacebookLogo = () => (
  <svg aria-hidden viewBox="0 0 24 24" className="h-6 w-6">
    <circle cx="12" cy="12" r="12" fill="#1877F2" />
    <path fill="#fff" d="M13.2 19.5v-6.3h2.1l.4-2.6h-2.5V9c0-.75.35-1.4 1.45-1.4h1.15V5.4s-1-.17-2-.17c-2.05 0-3.4 1.25-3.4 3.5v1.85H8.2v2.6h2.2v6.3h2.8z" />
  </svg>
);

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

  const handleOAuth = async (provider: "google" | "facebook") => {
    const label = provider === "google" ? "Google" : "Facebook";
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin },
    });
    if (error) toast.error(`Não foi possível entrar com o ${label}. Tente novamente em instantes.`);
  };

  const FieldError = ({ field }: { field: string }) =>
    errors[field] ? <p className="text-xs text-destructive mt-1 pl-4">{errors[field]}</p> : null;

  const strength = getPasswordStrength(deferredPassword);
  const strengthLabels = ["Muito fraca", "Fraca", "Razoável", "Boa", "Forte"];
  const strengthColors = ["bg-red-400", "bg-orange-400", "bg-yellow-400", "bg-lime-500", "bg-green-500"];

  const titles: Record<Mode, { title: string; subtitle: string }> = {
    login: { title: "Bem-vindo!", subtitle: "Entre na sua conta para continuar comprando" },
    signup: { title: "Crie sua conta", subtitle: "Cadastre-se e comece a comprar agora" },
    forgot: { title: "Recupere sua senha", subtitle: "Enviaremos um link para redefinir sua senha" },
  };
  const { title, subtitle } = titles[mode];

  const fieldWrapper = "relative";
  const iconLeft = "absolute left-5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-[#4A5670] dark:text-muted-foreground pointer-events-none";
  const iconRight = "absolute right-1 top-1/2 -translate-y-1/2 h-11 w-11 flex items-center justify-center rounded-full text-[#4A5670] dark:text-muted-foreground hover:text-[#1D2D50] dark:hover:text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#00B894]/30 dark:focus-visible:ring-accent/60 transition-colors";
  const inputCore = "h-[52px] rounded-full border border-[#D5DAE3] dark:border-border bg-[#F6F8FB] dark:bg-card text-[#1D2D50] dark:text-foreground placeholder:text-[#5F6B82] dark:placeholder:text-muted-foreground text-base ring-offset-0 shadow-none transition-[border-color,box-shadow] duration-150 focus-visible:ring-[3px] focus-visible:ring-[#00B894]/15 dark:focus-visible:ring-accent/50 focus-visible:ring-offset-0 focus-visible:border-[#00B894]";
  const inputBase = `${inputCore} pl-12 pr-5`;
  const inputPassword = `${inputCore} pl-12 pr-14`;
  const plainInput = `${inputCore} px-5`;
  const primaryBtn = "w-full h-[52px] rounded-full bg-[#00B894] hover:bg-[#00A383] text-[#06251E] text-base font-bold shadow-none focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#00B894]/30 dark:focus-visible:ring-accent dark:focus-visible:ring-offset-background focus-visible:ring-offset-2 active:scale-[0.99] transition-colors";
  const linkGreen = "text-[#087A62] dark:text-accent font-bold hover:underline focus-visible:outline-none focus-visible:underline";

  const PasswordToggle = () => (
    <button
      type="button"
      onClick={() => setShowPassword(!showPassword)}
      className={iconRight}
      aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
      aria-pressed={showPassword}
    >
      {showPassword ? <EyeOff className="h-[18px] w-[18px]" strokeWidth={1.8} /> : <Eye className="h-[18px] w-[18px]" strokeWidth={1.8} />}
    </button>
  );

  const socialBtn = "h-[52px] w-[84px] lg:w-auto lg:flex-1 rounded-2xl border border-[#D5DAE3] dark:border-border bg-white dark:bg-card text-[#1D2D50] dark:text-foreground font-semibold text-sm flex items-center justify-center gap-2.5 hover:bg-[#F6F8FB] dark:hover:bg-secondary focus-visible:outline-none focus-visible:border-[#00B894] focus-visible:ring-[3px] focus-visible:ring-[#00B894]/15 dark:focus-visible:ring-accent/50 transition-colors";

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white dark:bg-background">
      {/* BRAND PANEL — banner on mobile, left half on desktop */}
      <aside className="relative overflow-hidden text-white h-[310px] lg:h-auto lg:min-h-screen lg:w-1/2 shrink-0 bg-[linear-gradient(170deg,#1D2D50,#27407A)] hl-hero-bg">
        <span aria-hidden className="auth-dot absolute top-[34px] left-[22px] h-4 w-4 rounded-full bg-white/[0.14]" />
        <span aria-hidden className="auth-dot absolute top-[70px] right-[34px] h-2.5 w-2.5 rounded-full bg-[#00B894]" style={{ animationDelay: "-2s" }} />
        <span aria-hidden className="auth-dot absolute top-[150px] right-[18%] h-1.5 w-1.5 rounded-full bg-white/[0.22]" style={{ animationDelay: "-4s" }} />
        <span aria-hidden className="auth-dot absolute top-[120px] left-[12%] h-2 w-2 rounded-full bg-white/[0.18]" style={{ animationDelay: "-5.5s" }} />

        {/* Mobile content */}
        <div className="lg:hidden relative z-10 h-full flex flex-col items-center justify-center text-center px-6 pb-12">
          <div className="h-14 w-14 rounded-2xl bg-white flex items-center justify-center">
            <LogoIcon className="h-8 w-8" />
          </div>
          <h1 className="mt-4 font-display font-bold text-[28px] leading-tight">{title}</h1>
          <p className="mt-1.5 text-[15px] text-white/85 max-w-xs">{subtitle}</p>
        </div>

        {/* Desktop content */}
        <div className="hidden lg:flex relative z-10 min-h-screen flex-col justify-between p-14 pb-40">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center">
              <LogoIcon className="h-7 w-7" />
            </div>
            <span className="font-display font-bold text-2xl">HomeLast</span>
          </div>
          <div className="max-w-md">
            <h1 className="font-display font-bold text-[44px] leading-[1.1]">Mercado rápido e fácil.</h1>
            <p className="mt-4 text-lg text-white/85">Entre na sua conta e continue suas compras de onde parou.</p>
          </div>
        </div>

        {/* Waves */}
        <div aria-hidden className="absolute inset-x-0 -bottom-px h-[57px] lg:h-[111px] overflow-hidden pointer-events-none">
          <svg className="auth-wave-16 absolute bottom-0 left-0 h-full w-[200%]" viewBox="0 0 1200 100" preserveAspectRatio="none">
            <path d="M0 42 Q150 4 300 42 T600 42 T900 42 T1200 42 V100 H0Z" fill="#fff" fillOpacity="0.1" />
          </svg>
          <svg className="auth-wave-11 absolute bottom-0 left-0 h-full w-[200%]" viewBox="0 0 1200 100" preserveAspectRatio="none">
            <path d="M0 58 Q150 22 300 58 T600 58 T900 58 T1200 58 V100 H0Z" fill="#00B894" fillOpacity="0.22" />
          </svg>
          <svg className="auth-wave-22 absolute bottom-0 left-0 h-full w-[200%]" viewBox="0 0 1200 100" preserveAspectRatio="none">
            <path d="M0 76 Q150 46 300 76 T600 76 T900 76 T1200 76 V100 H0Z" fill="#fff" className="dark:fill-background" />
          </svg>
        </div>
      </aside>

      {/* FORM */}
      <main className="flex-1 lg:w-1/2 flex lg:items-center justify-center bg-white dark:bg-background px-6 pt-2 pb-10 lg:p-10">
        <div className="w-full max-w-[400px]">
          <div className="hidden lg:block mb-8">
            <h2 className="font-display font-bold text-3xl text-[#1D2D50] dark:text-foreground">
              {mode === "login" ? "Entrar" : title}
            </h2>
            <p className="mt-1.5 text-[#4A5670] dark:text-muted-foreground">
              {mode === "login" ? "Use seu e-mail e sua senha." : subtitle}
            </p>
          </div>

          {/* LOGIN */}
          {mode === "login" && (
            <form onSubmit={handleLogin} className="space-y-4" noValidate>
              <div>
                <Label htmlFor="email" className="sr-only">E-mail</Label>
                <div className={fieldWrapper}>
                  <Mail className={iconLeft} strokeWidth={1.8} />
                  <Input ref={emailRef} id="email" type="email" autoComplete="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!errors.email} className={inputBase} />
                </div>
                <FieldError field="email" />
              </div>

              <div>
                <Label htmlFor="password" className="sr-only">Senha</Label>
                <div className={fieldWrapper}>
                  <Lock className={iconLeft} strokeWidth={1.8} />
                  <Input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} aria-invalid={!!errors.password} className={inputPassword} />
                  <PasswordToggle />
                </div>
                <FieldError field="password" />
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Checkbox id="remember" checked={remember} onCheckedChange={(v) => setRemember(!!v)} />
                  <Label htmlFor="remember" className="text-[13px] text-[#4A5670] dark:text-muted-foreground cursor-pointer">Lembrar de mim</Label>
                </div>
                <button type="button" onClick={() => switchMode("forgot")} className="min-h-11 -my-2 text-[13px] font-semibold text-[#087A62] dark:text-accent hover:underline focus-visible:outline-none focus-visible:underline">
                  Esqueci minha senha
                </button>
              </div>

              <Button type="submit" disabled={loading} className={primaryBtn}>
                {loading ? "Entrando..." : "Entrar"}
              </Button>

              {socialProviders.length > 0 && (
                <>
                  <div className="flex items-center gap-3 pt-2" role="separator">
                    <span className="h-px flex-1 bg-[#D5DAE3]" />
                    <span className="text-[13px] text-[#4A5670] dark:text-muted-foreground">ou continue com</span>
                    <span className="h-px flex-1 bg-[#D5DAE3]" />
                  </div>
                  <div className="flex justify-center gap-3">
                    {socialProviders.includes("google") && (
                      <button type="button" onClick={() => handleOAuth("google")} aria-label="Continuar com Google" className={socialBtn}>
                        <GoogleLogo />
                        <span className="hidden lg:inline">Google</span>
                      </button>
                    )}
                    {socialProviders.includes("facebook") && (
                      <button type="button" onClick={() => handleOAuth("facebook")} aria-label="Continuar com Facebook" className={socialBtn}>
                        <FacebookLogo />
                        <span className="hidden lg:inline">Facebook</span>
                      </button>
                    )}
                  </div>
                </>
              )}

              <p className="text-center text-sm text-[#4A5670] dark:text-muted-foreground pt-2">
                Ainda não tem conta?{" "}
                <button type="button" onClick={() => switchMode("signup")} className={linkGreen}>
                  Cadastre-se
                </button>
              </p>
            </form>
          )}

          {/* SIGNUP */}
          {mode === "signup" && (
            <form onSubmit={handleSignup} className="space-y-4" noValidate>
              <div>
                <Label htmlFor="fullName" className="sr-only">Nome completo</Label>
                <Input id="fullName" autoComplete="name" placeholder="Nome completo" value={fullName} onChange={(e) => setFullName(e.target.value)} aria-invalid={!!errors.fullName} className={plainInput} />
                <FieldError field="fullName" />
              </div>
              <div>
                <Label htmlFor="signupEmail" className="sr-only">E-mail</Label>
                <div className={fieldWrapper}>
                  <Mail className={iconLeft} strokeWidth={1.8} />
                  <Input ref={emailRef} id="signupEmail" type="email" autoComplete="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!errors.email} className={inputBase} />
                </div>
                <FieldError field="email" />
              </div>
              <div>
                <Label htmlFor="phone" className="sr-only">Telefone</Label>
                <Input id="phone" type="tel" autoComplete="tel" placeholder="Telefone, ex.: (11) 99999-9999" value={phone} onChange={(e) => setPhone(e.target.value)} aria-invalid={!!errors.phone} className={plainInput} />
                <FieldError field="phone" />
              </div>
              <div>
                <Label htmlFor="signupPassword" className="sr-only">Senha</Label>
                <div className={fieldWrapper}>
                  <Lock className={iconLeft} strokeWidth={1.8} />
                  <Input id="signupPassword" type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder="Senha (8+ caracteres, 1 número)" value={password} onChange={(e) => setPassword(e.target.value)} aria-invalid={!!errors.password} className={inputPassword} />
                  <PasswordToggle />
                </div>
                {password && (
                  <div className="space-y-1 pt-2 px-4">
                    <div className="flex gap-1">
                      {[0, 1, 2, 3].map(i => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i < strength ? strengthColors[strength] : "bg-[#E4E8EF] dark:bg-border"}`} />
                      ))}
                    </div>
                    <p className="text-xs text-[#4A5670] dark:text-muted-foreground">Força: {strengthLabels[strength]}</p>
                  </div>
                )}
                <FieldError field="password" />
              </div>
              <div>
                <Label htmlFor="confirmPassword" className="sr-only">Confirmar senha</Label>
                <div className={fieldWrapper}>
                  <Lock className={iconLeft} strokeWidth={1.8} />
                  <Input id="confirmPassword" type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder="Confirmar senha" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} aria-invalid={!!errors.confirmPassword} className={inputBase} />
                </div>
                <FieldError field="confirmPassword" />
              </div>

              <Button type="submit" disabled={loading} className={primaryBtn}>
                {loading ? "Criando conta..." : "Criar conta"}
              </Button>

              <p className="text-center text-sm text-[#4A5670] dark:text-muted-foreground pt-2">
                Já tem conta?{" "}
                <button type="button" onClick={() => switchMode("login")} className={linkGreen}>
                  Entrar
                </button>
              </p>
            </form>
          )}

          {/* FORGOT */}
          {mode === "forgot" && (
            <form onSubmit={handleForgotPassword} className="space-y-4" noValidate>
              <div>
                <Label htmlFor="forgotEmail" className="sr-only">E-mail</Label>
                <div className={fieldWrapper}>
                  <Mail className={iconLeft} strokeWidth={1.8} />
                  <Input ref={emailRef} id="forgotEmail" type="email" autoComplete="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!errors.email} className={inputBase} />
                </div>
                <FieldError field="email" />
              </div>
              <Button type="submit" disabled={loading} className={primaryBtn}>
                {loading ? "Enviando..." : "Enviar link de recuperação"}
              </Button>
              <p className="text-center text-sm text-[#4A5670] dark:text-muted-foreground pt-2">
                Lembrou a senha?{" "}
                <button type="button" onClick={() => switchMode("login")} className={linkGreen}>
                  Voltar ao login
                </button>
              </p>
            </form>
          )}
        </div>
      </main>
    </div>
  );
};

export default Auth;
