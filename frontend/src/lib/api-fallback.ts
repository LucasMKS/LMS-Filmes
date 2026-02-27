import axios from "axios";
import Cookies from "js-cookie";
import { ErrorHandler } from "./errorHandler";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

const showToast = (
  type: "success" | "error" | "warning" | "info",
  title: string,
  description?: string
) => {
  console.log(
    `${type.toUpperCase()}: ${title}${description ? " - " + description : ""}`
  );

  if (type === "error") {
    if (title.includes("Sessão") || title.includes("Acesso")) {
      alert(`${title}: ${description || ""}`);
    }
  }
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

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

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const apiError = ErrorHandler.createApiError(error);

    ErrorHandler.logError(apiError, "Response Interceptor");

    if (error.response?.status === 401) {
      Cookies.remove("auth_token");
      Cookies.remove("user_data");
      showToast(
        "error",
        "Sessão expirada",
        "Faça login novamente para continuar"
      );

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
