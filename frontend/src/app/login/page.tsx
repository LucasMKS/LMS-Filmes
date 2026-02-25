"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import AuthService from "../../lib/auth";
import { ErrorHandler } from "../../lib/errorHandler";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Film, User, Mail, Lock, Eye, EyeOff } from "lucide-react";

interface FormData {
  name?: string;
  email: string;
  nickname?: string;
  password: string;
  confirmPassword?: string;
}

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (AuthService.isAuthenticated()) {
      router.push("/dashboard");
    }
  }, [router]);

  const {
    register: registerForm,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>();

  const onSubmit = async (data: any) => {
    setLoading(true);

    try {
      if (isLogin) {
        await AuthService.login({
          email: data.email,
          password: data.password,
        });

        toast.success("Login realizado com sucesso!", {
          description: "Bem-vindo de volta!",
        });

        window.location.href = "/dashboard";
      } else {
        // Registro
        if (data.password !== data.confirmPassword) {
          toast.error("Erro de validação", {
            description: "As senhas não coincidem",
          });
          setLoading(false);
          return;
        }

        await AuthService.register({
          name: data.name,
          email: data.email,
          nickname: data.nickname,
          password: data.password,
        });

        toast.success("Usuário registrado com sucesso!", {
          description: "Faça login para continuar",
        });

        setIsLogin(true);
        reset();
      }
    } catch (error: any) {
      // Extrair mensagem de erro usando o ErrorHandler
      const errorMessage = ErrorHandler.extractErrorMessage(error);

      // Tratamento específico para diferentes tipos de erro
      if (ErrorHandler.isLoginError(error)) {
        toast.error("Erro de login", {
          description: errorMessage,
        });
      } else if (ErrorHandler.isValidationError(error)) {
        toast.error("Dados inválidos", {
          description: errorMessage,
        });
      } else if (ErrorHandler.isNetworkError(error)) {
        toast.error("Erro de conexão", {
          description: errorMessage,
        });
      } else {
        toast.error("Erro inesperado", {
          description: errorMessage,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    reset();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-3 sm:p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 " />

      <div className="relative w-full max-w-sm sm:max-w-md">
        <Card className="bg-gray-900 !border-gray-800 border-2 shadow-2xl shadow-zinc-950">
          <CardHeader className="text-center space-y-3 sm:space-y-4 pb-4 sm:pb-6 px-4 sm:px-6">
            <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-gray-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Film className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl sm:text-2xl font-bold text-white">
                {isLogin ? "Bem-vindo de volta!" : "Crie sua conta"}
              </CardTitle>
              <CardDescription className="text-slate-400 mt-2 text-sm">
                {isLogin
                  ? "Entre na sua conta do LMS Films"
                  : "Junte-se à nossa comunidade de cinéfilos"}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6">
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-3 sm:space-y-4"
            >
              {!isLogin && (
                <>
                  {/* Nome */}
                  <div className="space-y-1 sm:space-y-2">
                    <Label
                      htmlFor="name"
                      className="text-slate-300 text-sm font-medium"
                    >
                      Nome completo
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        id="name"
                        {...registerForm("name", {
                          required: "Nome é obrigatório",
                        })}
                        type="text"
                        placeholder="Seu nome completo"
                        className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-pink-500 focus:ring-pink-500/20 h-10 sm:h-11"
                      />
                    </div>
                    {errors.name && (
                      <p className="text-red-400 text-xs mt-1">
                        {errors.name.message}
                      </p>
                    )}
                  </div>

                  {/* Nickname */}
                  <div className="space-y-1 sm:space-y-2">
                    <Label
                      htmlFor="nickname"
                      className="text-slate-300 text-sm font-medium"
                    >
                      Nickname
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        id="nickname"
                        {...registerForm("nickname", {
                          required: "Nickname é obrigatório",
                        })}
                        type="text"
                        placeholder="Como quer ser chamado"
                        className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-pink-500 focus:ring-pink-500/20 h-10 sm:h-11"
                      />
                    </div>
                    {errors.nickname && (
                      <p className="text-red-400 text-xs mt-1">
                        {errors.nickname.message}
                      </p>
                    )}
                  </div>
                </>
              )}

              {/* Email */}
              <div className="space-y-1 sm:space-y-2">
                <Label
                  htmlFor="email"
                  className="text-slate-300 text-sm font-medium"
                >
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="email"
                    {...registerForm("email", {
                      required: "Email é obrigatório",
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: "Email inválido",
                      },
                    })}
                    type="email"
                    placeholder="seu@email.com"
                    className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-pink-500 focus:ring-pink-500/20"
                  />
                </div>
                {errors.email && (
                  <p className="text-red-400 text-xs mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Senha */}
              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-slate-300 text-sm font-medium"
                >
                  Senha
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="password"
                    {...registerForm("password", {
                      required: "Senha é obrigatória",
                      minLength: {
                        value: 4,
                        message: "Senha deve ter pelo menos 4 caracteres",
                      },
                    })}
                    type={showPassword ? "text" : "password"}
                    placeholder="Digite sua senha"
                    className="pl-10 pr-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-pink-500 focus:ring-pink-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-400 text-xs mt-1">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {!isLogin && (
                <div className="space-y-2">
                  <Label
                    htmlFor="confirmPassword"
                    className="text-slate-300 text-sm font-medium"
                  >
                    Confirmar senha
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="confirmPassword"
                      {...registerForm("confirmPassword", {
                        required: "Confirmação de senha é obrigatória",
                      })}
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirme sua senha"
                      className="pl-10 pr-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-pink-500 focus:ring-pink-500/20"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-red-400 text-xs mt-1">
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-2.5 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Carregando...</span>
                  </div>
                ) : isLogin ? (
                  "Entrar"
                ) : (
                  "Criar conta"
                )}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-600" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-slate-800/50 px-2 text-slate-400">ou</span>
              </div>
            </div>

            <Button
              type="button"
              variant="ghost"
              onClick={toggleMode}
              className="w-full text-slate-300 hover:text-white hover:bg-slate-700/50 transition-all duration-200"
            >
              {isLogin
                ? "Não tem uma conta? Registre-se"
                : "Já tem uma conta? Faça login"}
            </Button>

            {isLogin && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.push("/reset-password")}
                className="w-full text-slate-300 hover:text-white hover:bg-slate-700/50 transition-all duration-200"
              >
                Esqueci minha senha
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
