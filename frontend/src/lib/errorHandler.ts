import { ApiError } from "./types";

export class ErrorHandler {
  /**
   * Extrai a mensagem de erro de diferentes tipos de resposta da API
   */
  static extractErrorMessage(error: any): string {
    // Caso 1: Erro com response da API
    if (error.response?.data) {
      const data = error.response.data;

      // Se o backend retorna uma string direta
      if (typeof data === "string") {
        return data;
      }

      // Se o backend retorna um objeto com message
      if (data.message) {
        return data.message;
      }

      // Se o backend retorna um objeto com error
      if (data.error) {
        return data.error;
      }

      // Se o backend retorna um objeto com details
      if (data.details) {
        return data.details;
      }
    }

    // Caso 2: Erro de rede ou timeout
    if (error.code === "NETWORK_ERROR" || error.code === "ECONNABORTED") {
      return "Erro de conexão. Verifique sua internet e tente novamente.";
    }

    // Caso 3: Timeout
    if (error.code === "ECONNABORTED") {
      return "Tempo limite excedido. Tente novamente.";
    }

    // Caso 4: Erro padrão baseado no status HTTP
    const status = error.response?.status;
    switch (status) {
      case 400:
        return "Dados inválidos. Verifique as informações enviadas.";
      case 401:
        // Verificar se é erro de login ou token expirado
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

  /**
   * Cria um objeto ApiError padronizado
   */
  static createApiError(error: any): ApiError {
    return {
      message: this.extractErrorMessage(error),
      status: error.response?.status || 0,
      code: error.code || "UNKNOWN_ERROR",
      details: error.response?.data,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Determina se o erro é um erro de validação (4xx)
   */
  static isValidationError(error: any): boolean {
    const status = error.response?.status;
    return status >= 400 && status < 500;
  }

  /**
   * Determina se é um erro de login (401 em endpoint de login)
   */
  static isLoginError(error: any): boolean {
    const status = error.response?.status;
    const isLoginEndpoint = error.config?.url?.includes("/auth/login");
    return status === 401 && isLoginEndpoint;
  }

  /**
   * Determina se o erro é um erro do servidor (5xx)
   */
  static isServerError(error: any): boolean {
    const status = error.response?.status;
    return status >= 500;
  }

  /**
   * Determina se é um erro de rede/conexão
   */
  static isNetworkError(error: any): boolean {
    // Erro de rede real - sem resposta HTTP
    if (!error.response) {
      return true;
    }

    // Códigos específicos de erro de rede
    const networkCodes = [
      "NETWORK_ERROR",
      "ECONNREFUSED",
      "ECONNABORTED",
      "ETIMEDOUT",
    ];
    return networkCodes.includes(error.code);
  }

  /**
   * Logging de erros (pode ser expandido para enviar para serviços de monitoramento)
   */
  static logError(error: ApiError, context?: string): void {
    const logData = {
      ...error,
      context,
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    console.error("API Error:", logData);

    // Aqui você pode adicionar integração com serviços como Sentry, LogRocket, etc.
    // Example: Sentry.captureException(error);
  }
}
