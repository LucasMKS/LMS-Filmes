import axios from "axios";
import Cookies from "js-cookie";
import { AuthDTO, AuthResponse, User } from "./types";
import { ErrorHandler } from "./errorHandler";

const API_GATEWAY_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

const API_LMS_FILMES_BASE = `${API_GATEWAY_URL}/lms-filmes`;

const authApi = axios.create({
  baseURL: API_LMS_FILMES_BASE,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

class AuthService {
  private readonly TOKEN_KEY = "auth_token";
  private readonly USER_KEY = "user_data";

  // Fazer login
  async login(credentials: AuthDTO): Promise<AuthResponse> {
    try {
      const response = await authApi.post("/auth/login", credentials);

      const token = response.data;

      Cookies.set(this.TOKEN_KEY, token, { expires: 7 });

      const userData = this.parseJwt(token);
      Cookies.set(this.USER_KEY, JSON.stringify(userData), { expires: 7 });

      return {
        token,
        user: userData,
      };
    } catch (error: any) {
      const apiError = ErrorHandler.createApiError(error);
      ErrorHandler.logError(apiError, "AuthService.login");
      throw apiError;
    }
  }

  // Fazer registro
  async register(userData: AuthDTO): Promise<string> {
    try {
      const response = await authApi.post("/auth/register", userData);
      return response.data;
    } catch (error: any) {
      const apiError = ErrorHandler.createApiError(error);
      ErrorHandler.logError(apiError, "AuthService.register");
      throw apiError;
    }
  }

  // Solicitar redefinição de senha
  async requestPasswordReset(email: string): Promise<any> {
    try {
      const response = await authApi.post("/auth/forgot-password", { email });
      return response.data;
    } catch (error: any) {
      const apiError = ErrorHandler.createApiError(error);
      ErrorHandler.logError(apiError, "AuthService.requestPasswordReset");
      throw apiError;
    }
  }

  // Redefinir a senha
  async resetPassword(token: string, newPassword: string): Promise<any> {
    try {
      const response = await authApi.post("/auth/reset-password", {
        token,
        newPassword,
      });
      return response.data;
    } catch (error: any) {
      const apiError = ErrorHandler.createApiError(error);
      ErrorHandler.logError(apiError, "AuthService.resetPassword");
      throw apiError;
    }
  }

  // Fazer logout
  logout(): void {
    Cookies.remove(this.TOKEN_KEY);
    Cookies.remove(this.USER_KEY);

    if (!window.location.pathname.includes("/login")) {
      window.location.href = "/login";
    }
  }

  clearTokens(): void {
    Cookies.remove(this.TOKEN_KEY);
    Cookies.remove(this.USER_KEY);
  }

  isAuthenticated(): boolean {
    const token = Cookies.get(this.TOKEN_KEY);
    if (!token) return false;

    try {
      const payload = this.parseJwt(token);
      const currentTime = Date.now() / 1000;

      if (payload.exp <= currentTime) {
        this.clearTokens();
        return false;
      }

      return true;
    } catch {
      this.clearTokens();
      return false;
    }
  }

  //Obter token
  getToken(): string | undefined {
    return Cookies.get(this.TOKEN_KEY);
  }

  // Obter dados do usuário
  getCurrentUser(): User | null {
    try {
      const userData = Cookies.get(this.USER_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  }

  // Verificar se é admin
  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === "ADMIN";
  }

  // Função auxiliar para decodificar JWT
  private parseJwt(token: string): any {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      return JSON.parse(jsonPayload);
    } catch {
      throw new Error("Token inválido");
    }
  }
}

export default new AuthService();
