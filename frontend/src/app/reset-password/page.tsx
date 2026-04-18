"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import AuthService from "@/lib/auth";
import { toast } from "sonner";
import { useState, Suspense, useEffect } from "react";
import { ErrorHandler } from "@/lib/errorHandler";
import { KeyRound, Mail } from "lucide-react";

const requestResetSchema = z.object({
  email: z.string().email("Por favor, insira um e-mail válido."),
});
type RequestResetData = z.infer<typeof requestResetSchema>;

const resetPasswordSchema = z
  .object({
    password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });
type ResetPasswordData = z.infer<typeof resetPasswordSchema>;

const cardClass =
  "w-full max-w-md space-y-6 p-7 rounded-2xl bg-[#14141c] border border-white/[0.06] shadow-2xl shadow-black/50";
const inputClass =
  "bg-[#0a0a0f]/60 border-white/10 text-white/90 placeholder:text-white/25 focus:border-purple-500/50 rounded-xl h-11";
const btnPrimary =
  "w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-all duration-200 shadow-lg shadow-purple-900/30";
const btnGhost =
  "w-full text-white/35 hover:text-white/60 py-2 rounded-xl hover:bg-white/5 text-sm transition-all duration-200";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [isTokenChecked, setIsTokenChecked] = useState(false);

  useEffect(() => {
    setToken(searchParams.get("token"));
    setIsTokenChecked(true);
  }, [searchParams]);

  const resetForm = useForm<ResetPasswordData>({ resolver: zodResolver(resetPasswordSchema) });
  const requestForm = useForm<RequestResetData>({ resolver: zodResolver(requestResetSchema) });

  const onResetSubmit = async (data: ResetPasswordData) => {
    setLoading(true);
    try {
      await AuthService.resetPassword(token!, data.password);
      toast.success("Senha redefinida com sucesso!");
      router.push("/login");
    } catch (err: any) {
      const apiError = ErrorHandler.createApiError(err);
      if ([400, 401, 404].includes(apiError.status)) {
        toast.error("Link inválido ou expirado", { description: "Você será redirecionado para a tela de login." });
      } else {
        toast.error(apiError.message || "Erro ao redefinir senha");
      }
    } finally {
      setLoading(false);
      router.push("/login");
    }
  };

  const onRequestSubmit = async (data: RequestResetData) => {
    setLoading(true);
    try {
      await AuthService.requestPasswordReset(data.email);
      setRequestSent(true);
    } catch (err: any) {
      toast.error(err.message || "Erro ao solicitar redefinição");
    } finally {
      setLoading(false);
    }
  };

  if (!isTokenChecked) {
    return (
      <div className="w-full max-w-md text-center">
        <p className="text-white/30 text-sm">Verificando...</p>
      </div>
    );
  }

  if (token) {
    return (
      <div className={cardClass}>
        <div className="text-center space-y-2">
          <div className="mx-auto w-11 h-11 bg-purple-500/15 rounded-2xl flex items-center justify-center mb-4">
            <KeyRound className="w-5 h-5 text-purple-400" />
          </div>
          <h1 className="text-xl font-black text-white">Redefinir senha</h1>
          <p className="text-white/30 text-sm">Crie uma nova senha para a sua conta.</p>
        </div>
        <form onSubmit={resetForm.handleSubmit(onResetSubmit)} className="space-y-3">
          <Input type="password" placeholder="Nova senha" {...resetForm.register("password")} className={inputClass} />
          {resetForm.formState.errors.password && (
            <p className="text-red-400 text-xs">{resetForm.formState.errors.password.message}</p>
          )}
          <Input type="password" placeholder="Confirmar nova senha" {...resetForm.register("confirmPassword")} className={inputClass} />
          {resetForm.formState.errors.confirmPassword && (
            <p className="text-red-400 text-xs">{resetForm.formState.errors.confirmPassword.message}</p>
          )}
          <button type="submit" className={btnPrimary} disabled={loading}>
            {loading ? "Redefinindo..." : "Redefinir senha"}
          </button>
          <button type="button" onClick={() => router.push("/login")} className={btnGhost} disabled={loading}>
            Voltar
          </button>
        </form>
      </div>
    );
  }

  if (requestSent) {
    return (
      <div className={`${cardClass} text-center`}>
        <div className="mx-auto w-11 h-11 bg-emerald-500/15 rounded-2xl flex items-center justify-center mb-2">
          <Mail className="w-5 h-5 text-emerald-400" />
        </div>
        <h1 className="text-xl font-black text-white">Verifique seu e-mail</h1>
        <p className="text-white/30 text-sm">
          Se uma conta com este e-mail existir, enviamos um link para redefinição de senha.
        </p>
        <button type="button" onClick={() => router.push("/login")} className={btnGhost} disabled={loading}>
          Voltar
        </button>
      </div>
    );
  }

  return (
    <div className={cardClass}>
      <div className="text-center space-y-2">
        <div className="mx-auto w-11 h-11 bg-purple-500/15 rounded-2xl flex items-center justify-center mb-4">
          <KeyRound className="w-5 h-5 text-purple-400" />
        </div>
        <h1 className="text-xl font-black text-white">Esqueceu sua senha?</h1>
        <p className="text-white/30 text-sm">
          Sem problemas. Insira seu e-mail para receber um link de redefinição.
        </p>
      </div>
      <form onSubmit={requestForm.handleSubmit(onRequestSubmit)} className="space-y-3">
        <Input type="email" placeholder="seu.email@exemplo.com" {...requestForm.register("email")} className={inputClass} />
        {requestForm.formState.errors.email && (
          <p className="text-red-400 text-xs">{requestForm.formState.errors.email.message}</p>
        )}
        <button type="submit" className={btnPrimary} disabled={loading}>
          {loading ? "Enviando..." : "Enviar link de redefinição"}
        </button>
        <button type="button" onClick={() => router.push("/login")} className={btnGhost} disabled={loading}>
          Voltar
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" /></div>}>
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#0a0a0f] relative overflow-hidden">
        <div className="pointer-events-none absolute top-[-20%] left-[-10%] w-[400px] h-[400px] bg-purple-600/8 rounded-full blur-[140px]" />
        <ResetPasswordForm />
      </div>
    </Suspense>
  );
}
