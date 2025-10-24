import axios from "axios";
import Cookies from "js-cookie";
import { ErrorHandler } from "./errorHandler";

// Configuração base da API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// Função alternativa para toast até o Sonner ser instalado
const showToast = (
  type: "success" | "error" | "warning" | "info",
  title: string,
  description?: string
) => {
  // Fallback usando alert simples até o Sonner ser instalado
  console.log(
    `${type.toUpperCase()}: ${title}${description ? " - " + description : ""}`
  );

  // Você pode substituir por uma implementação de toast customizada
  if (type === "error") {
    // Apenas mostrar alerts para erros importantes
    if (title.includes("Sessão") || title.includes("Acesso")) {
      alert(`${title}: ${description || ""}`);
    }
  }
};

// Instância do axios
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, // 10 segundos
});

// Interceptor para adicionar token em todas as requisições
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    const apiError = ErrorHandler.createApiError(error);
    ErrorHandler.logError(apiError, "Request Interceptor");
    return Promise.reject(apiError);
  }
);

// Interceptor para tratar respostas e erros
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const apiError = ErrorHandler.createApiError(error);

    // Log do erro
    ErrorHandler.logError(apiError, "Response Interceptor");

    // Tratamento específico por tipo de erro
    if (error.response?.status === 401) {
      // Token expirado ou inválido
      Cookies.remove("auth_token");
      Cookies.remove("user_data");
      showToast(
        "error",
        "Sessão expirada",
        "Faça login novamente para continuar"
      );

      // Evitar redirecionamento em loop se já estiver na página de login
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    } else if (error.response?.status === 403) {
      showToast(
        "error",
        "Acesso negado",
        "Você não tem permissão para esta ação"
      );
    } else if (ErrorHandler.isNetworkError(error)) {
      showToast(
        "error",
        "Erro de conexão",
        "Verifique sua internet e tente novamente"
      );
    } else if (ErrorHandler.isServerError(error)) {
      showToast("error", "Erro do servidor", "Tente novamente mais tarde");
    }

    return Promise.reject(apiError);
  }
);

export default api;
