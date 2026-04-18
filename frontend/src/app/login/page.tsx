"use client";

import { useState, useEffect, Suspense } from "react";
import { useForm } from "react-hook-form";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import Cookies from "js-cookie";
import { cookieUtils } from "../../lib/cookieUtils";
import AuthService from "../../lib/auth";
import { ErrorHandler } from "../../lib/errorHandler";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Play, User, Mail, Lock, Eye, EyeOff } from "lucide-react";

interface FormData {
  name?: string;
  email: string;
  nickname?: string;
  password: string;
  confirmPassword?: string;
}

const ALLOWED_CALLBACK_ORIGINS = ["https://lifeos.lucasmks.com.br"];

function isAllowedCallback(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ALLOWED_CALLBACK_ORIGINS.includes(parsed.origin);
  } catch {
    return false;
  }
}

function LoginContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const action = searchParams.get("action");

  const [isLogin, setIsLogin] = useState(action !== "register");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (AuthService.isAuthenticated()) {
      if (callbackUrl && isAllowedCallback(callbackUrl)) {
        const token = Cookies.get("auth_token");
        if (token) {
          const redirectUrl = new URL(callbackUrl);
          redirectUrl.searchParams.set("token", token);
          window.location.href = redirectUrl.toString();
          return;
        }
      }
      router.push("/filmes");
    }
  }, [router, callbackUrl]);

  const {
    register: registerForm,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>();

  const redirectToCallback = (token: string) => {
    if (callbackUrl && isAllowedCallback(callbackUrl) && token) {
      const redirectUrl = new URL(callbackUrl);
      redirectUrl.searchParams.set("token", token);
      window.location.href = redirectUrl.toString();
      return true;
    }
    return false;
  };

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      if (isLogin) {
        await AuthService.login({ email: data.email, password: data.password });
        const token = Cookies.get("auth_token");
        if (token && redirectToCallback(token)) return;
        toast.success("Login realizado com sucesso!", { description: "Bem-vindo de volta!" });
        router.push("/filmes");
      } else {
        if (data.password !== data.confirmPassword) {
          toast.error("Erro de validação", { description: "As senhas não coincidem" });
          setLoading(false);
          return;
        }
        const response = await AuthService.register({
          name: data.name,
          email: data.email,
          nickname: data.nickname,
          password: data.password,
        });
        if (response?.token && response?.user && redirectToCallback(response.token)) {
          AuthService.setSession(response.user, response.token);
          return;
        }
        toast.success("Usuário registrado com sucesso!", { description: "Faça login para continuar" });
        setIsLogin(true);
        reset();
      }
    } catch (error: any) {
      const errorMessage = ErrorHandler.extractErrorMessage(error);
      if (ErrorHandler.isLoginError(error)) {
        toast.error("Erro de login", { description: errorMessage });
      } else if (ErrorHandler.isValidationError(error)) {
        toast.error("Dados inválidos", { description: errorMessage });
      } else if (ErrorHandler.isNetworkError(error)) {
        toast.error("Erro de conexão", { description: errorMessage });
      } else {
        toast.error("Erro inesperado", { description: errorMessage });
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    reset();
  };

  const inputClass =
    "pl-10 bg-[#0a0a0f]/60 border-white/10 text-white/90 placeholder:text-white/25 focus:border-purple-500/50 focus:ring-purple-500/20 rounded-xl h-11";

  return (
    <div className="min-h-screen flex items-center justify-center p-3 sm:p-4 bg-[#0a0a0f] relative overflow-hidden">
      {/* Orbs */}
      <div className="pointer-events-none absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[140px]" />
      <div className="pointer-events-none absolute bottom-[-15%] right-[-5%] w-[400px] h-[400px] bg-violet-600/8 rounded-full blur-[140px]" />

      <div className="relative w-full max-w-sm sm:max-w-md">
        <div className="bg-[#14141c] border border-white/[0.06] rounded-2xl shadow-2xl shadow-black/50 overflow-hidden">
          {/* Header do card */}
          <div className="px-6 pt-8 pb-6 text-center border-b border-white/[0.05]">
            <div className="mx-auto w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-700 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/25 mb-5">
              <Play className="w-5 h-5 text-white fill-current" />
            </div>
            <h1 className="text-xl font-black text-white">
              {isLogin ? "Bem-vindo de volta!" : "Crie sua conta"}
            </h1>
            <p className="text-white/35 mt-1.5 text-sm">
              {isLogin
                ? "Entre na sua conta do LMS Filmes"
                : "Junte-se à nossa comunidade de cinéfilos"}
            </p>
            {callbackUrl && isAllowedCallback(callbackUrl) && (
              <p className="text-xs text-purple-400/70 mt-2">
                Você será redirecionado de volta após {isLogin ? "o login" : "o cadastro"}.
              </p>
            )}
          </div>

          {/* Formulário */}
          <div className="px-6 py-6 space-y-4">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {!isLogin && (
                <>
                  <div className="space-y-1.5">
                    <Label className="text-white/50 text-xs font-semibold uppercase tracking-wide">Nome completo</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                      <Input
                        {...registerForm("name", { required: "Nome é obrigatório" })}
                        type="text"
                        placeholder="Seu nome completo"
                        className={inputClass}
                      />
                    </div>
                    {errors.name && <p className="text-red-400 text-xs">{errors.name.message}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-white/50 text-xs font-semibold uppercase tracking-wide">Nickname</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                      <Input
                        {...registerForm("nickname", { required: "Nickname é obrigatório" })}
                        type="text"
                        placeholder="Como quer ser chamado"
                        className={inputClass}
                      />
                    </div>
                    {errors.nickname && <p className="text-red-400 text-xs">{errors.nickname.message}</p>}
                  </div>
                </>
              )}

              <div className="space-y-1.5">
                <Label className="text-white/50 text-xs font-semibold uppercase tracking-wide">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                  <Input
                    {...registerForm("email", {
                      required: "Email é obrigatório",
                      pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: "Email inválido" },
                    })}
                    type="email"
                    placeholder="seu@email.com"
                    className={inputClass}
                  />
                </div>
                {errors.email && <p className="text-red-400 text-xs">{errors.email.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label className="text-white/50 text-xs font-semibold uppercase tracking-wide">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                  <Input
                    {...registerForm("password", {
                      required: "Senha é obrigatória",
                      minLength: { value: 4, message: "Senha deve ter pelo menos 4 caracteres" },
                    })}
                    type={showPassword ? "text" : "password"}
                    placeholder="Digite sua senha"
                    className={`${inputClass} pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-red-400 text-xs">{errors.password.message}</p>}
              </div>

              {!isLogin && (
                <div className="space-y-1.5">
                  <Label className="text-white/50 text-xs font-semibold uppercase tracking-wide">Confirmar senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                    <Input
                      {...registerForm("confirmPassword", { required: "Confirmação de senha é obrigatória" })}
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirme sua senha"
                      className={`${inputClass} pr-10`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-red-400 text-xs">{errors.confirmPassword.message}</p>}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl transition-all duration-200 shadow-lg shadow-purple-900/30 mt-2"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Carregando...
                  </span>
                ) : isLogin ? "Entrar" : "Criar conta"}
              </button>
            </form>

            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/[0.06]" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-[#14141c] px-3 text-white/25">ou</span>
              </div>
            </div>

            <button
              type="button"
              onClick={toggleMode}
              className="w-full text-white/40 hover:text-white/70 text-sm py-2 rounded-xl hover:bg-white/5 transition-all duration-200"
            >
              {isLogin ? "Não tem uma conta? Registre-se" : "Já tem uma conta? Faça login"}
            </button>

            {isLogin && (
              <button
                type="button"
                onClick={() => router.push("/reset-password")}
                className="w-full text-white/25 hover:text-white/50 text-xs py-1.5 rounded-xl transition-all duration-200"
              >
                Esqueci minha senha
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
