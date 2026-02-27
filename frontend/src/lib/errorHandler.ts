import { ApiError } from "./types";

export class ErrorHandler {
  static extractErrorMessage(error: any): string {
    if (error.response?.data) {
      const data = error.response.data;

      if (typeof data === "string") {
        return data;
      }

      if (data.message) {
        return data.message;
      }

      if (data.error) {
        return data.error;
      }

      if (data.details) {
        return data.details;
      }
    }

    if (error.code === "ECONNABORTED") {
      return "Tempo limite excedido. Tente novamente.";
    }

    if (error.code === "NETWORK_ERROR" || error.code === "ERR_NETWORK") {
      return "Erro de conexão. Verifique sua internet e tente novamente.";
    }

    const status = error.response?.status;
    switch (status) {
      case 400:
        return "Dados inválidos. Verifique as informações enviadas.";
      case 401:
        const isLoginEndpoint = error.config?.url?.includes("/auth/login");
        if (isLoginEndpoint) {
          return "Credenciais inválidas. Verifique email e senha.";
        }
        return "Não autorizado. Faça login novamente.";
      case 403:
        return "Acesso negado. Você não tem permissão para esta ação.";
      case 404:
        return "Recurso não encontrado.";
      case 409:
        return "Conflito. O recurso já existe.";
      case 422:
        return "Dados inválidos. Verifique os campos obrigatórios.";
      case 429:
        return "Muitas tentativas. Aguarde alguns minutos e tente novamente.";
      case 500:
        return "Erro interno do servidor. Tente novamente mais tarde.";
      case 503:
        return "Serviço temporariamente indisponível. Tente novamente mais tarde.";
      default:
        return error.message || "Erro inesperado. Tente novamente.";
    }
  }

  static createApiError(error: any): ApiError {
    return {
      message: this.extractErrorMessage(error),
      status: error.response?.status || 0,
      code: error.code || "UNKNOWN_ERROR",
      details: error.response?.data,
      timestamp: new Date().toISOString(),
    };
  }

  static isValidationError(error: any): boolean {
    const status = error.response?.status;
    return status >= 400 && status < 500;
  }

  static isLoginError(error: any): boolean {
    const status = error.response?.status;
    const isLoginEndpoint = error.config?.url?.includes("/auth/login");
    return status === 401 && isLoginEndpoint;
  }

  static isServerError(error: any): boolean {
    const status = error.response?.status;
    return status >= 500;
  }

  static isNetworkError(error: any): boolean {
    if (!error.response) {
      return true;
    }

    const networkCodes = [
      "NETWORK_ERROR",
      "ERR_NETWORK",
      "ECONNREFUSED",
      "ECONNABORTED",
      "ETIMEDOUT",
    ];
    return networkCodes.includes(error.code);
  }

  static logError(error: any, p0: string): void {
    if (error.response) {
      console.error("API Error [Response]:", {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers,
      });
    } else if (error.request) {
      console.error("API Error [Request]:", error.request);
    } else {
      console.error("API Error [General]:", error.message);
    }
  }
}
