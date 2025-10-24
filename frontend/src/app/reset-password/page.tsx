"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import AuthService from "@/lib/auth";
import { toast } from "sonner";
import { useState, Suspense, useEffect } from "react";

// Esquema para SOLICITAR a redefinição de senha
const requestResetSchema = z.object({
  email: z.string().email("Por favor, insira um e-mail válido."),
});
type RequestResetData = z.infer<typeof requestResetSchema>;

// Esquema para REDEFINIR a senha
const resetPasswordSchema = z
  .object({
    password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });
type ResetPasswordData = z.infer<typeof resetPasswordSchema>;

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [isTokenChecked, setIsTokenChecked] = useState(false);

  useEffect(() => {
    const tokenFromParams = searchParams.get("token");
    setToken(tokenFromParams);
    setIsTokenChecked(true);
  }, [searchParams]);

  // Formulário para REDEFINIR a senha
  const resetForm = useForm<ResetPasswordData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  // Formulário para SOLICITAR o reset
  const requestForm = useForm<RequestResetData>({
    resolver: zodResolver(requestResetSchema),
  });

  // Função de submit para REDEFINIR
  const onResetSubmit = async (data: ResetPasswordData) => {
    setLoading(true);
    try {
      await AuthService.resetPassword(token!, data.password);
      toast.success("Senha redefinida com sucesso!");
      router.push("/login");
    } catch (err: any) {
      toast.error(err.message || "Erro ao redefinir senha", {
        description: err.details || "O link pode ter expirado ou é inválido.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Função de submit para SOLICITAR
  const onRequestSubmit = async (data: RequestResetData) => {
    setLoading(true);
    try {
      await AuthService.requestPasswordReset(data.email);
      setRequestSent(true);
    } catch (err: any) {
      toast.error(err.message || "Erro ao solicitar redefinição", {
        description:
          err.details ||
          "Não foi possível processar a solicitação. Tente novamente.",
      });
    } finally {
      setLoading(false);
    }
  };

  // --- Renderização Condicional ---

  // Estado de loading inicial enquanto verifica o token
  if (!isTokenChecked) {
    return (
      <div className="w-full max-w-md text-center">
        <p className="text-muted-foreground">Verificando...</p>
      </div>
    );
  }

  // CENÁRIO 1: Token EXISTE. Mostrar formulário de redefinição.
  if (token) {
    return (
      <div className="w-full max-w-md space-y-6 bg-card p-6 rounded-xl shadow-lg">
        <h1 className="text-2xl font-semibold text-center">Redefinir senha</h1>

        <form
          onSubmit={resetForm.handleSubmit(onResetSubmit)}
          className="space-y-4"
        >
          <Input
            type="password"
            placeholder="Nova senha"
            {...resetForm.register("password")}
            className="bg-background"
          />
          {resetForm.formState.errors.password && (
            <p className="text-sm text-red-500">
              {resetForm.formState.errors.password.message}
            </p>
          )}

          <Input
            type="password"
            placeholder="Confirmar nova senha"
            {...resetForm.register("confirmPassword")}
            className="bg-background"
          />
          {resetForm.formState.errors.confirmPassword && (
            <p className="text-sm text-red-500">
              {resetForm.formState.errors.confirmPassword.message}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Redefinindo..." : "Redefinir senha"}
          </Button>
        </form>
      </div>
    );
  }

  // CENÁRIO 2: Token NÃO existe, e a solicitação JÁ FOI ENVIADA.
  if (requestSent) {
    return (
      <div className="w-full max-w-md space-y-4 bg-card p-6 rounded-xl shadow-lg text-center">
        <h1 className="text-2xl font-semibold">Verifique seu e-mail</h1>
        <p className="text-muted-foreground">
          Se uma conta com este e-mail existir, enviamos um link para
          redefinição de senha.
        </p>
      </div>
    );
  }

  // CENÁRIO 3: Token NÃO existe. Mostrar formulário de solicitação.
  return (
    <div className="w-full max-w-md space-y-6 bg-card p-6 rounded-xl shadow-lg">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold">Esqueceu sua senha?</h1>
        <p className="text-muted-foreground text-sm">
          Sem problemas. Insira seu e-mail abaixo para receber um link de
          redefinição.
        </p>
      </div>

      <form
        onSubmit={requestForm.handleSubmit(onRequestSubmit)}
        className="space-y-4"
      >
        <Input
          type="email"
          placeholder="seu.email@exemplo.com"
          {...requestForm.register("email")}
          className="bg-background"
        />
        {requestForm.formState.errors.email && (
          <p className="text-sm text-red-500">
            {requestForm.formState.errors.email.message}
          </p>
        )}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Enviando..." : "Enviar link de redefinição"}
        </Button>
      </form>
    </div>
  );
}

// Componente principal (wrapper)
export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center p-6">
          Carregando...
        </div>
      }
    >
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <ResetPasswordForm />
      </div>
    </Suspense>
  );
}
