import Cookies from "js-cookie";
import { authApi, apiLmsFilmes } from "./api";
import { AuthDTO, User } from "./types";
import { cookieUtils } from "./cookieUtils";

class AuthService {
  private readonly USER_KEY = "user_data";
  private readonly TOKEN_KEY = "auth_token";
  private readonly SESSION_MARKER_KEY = "session_active";

  async login(payload: AuthDTO) {
    const response = await authApi.login(payload);

    if (!response.user && !response.token) {
      throw new Error("Resposta de login inválida do servidor.");
    }

    if (response.user && response.token) {
      this.setSession(response.user, response.token);
      return;
    }

    if (response.user) {
      cookieUtils.setUserData(response.user);
      this.setSessionMarker();
    }

    if (response.token) {
      cookieUtils.setAuthToken(response.token);
      this.setSessionMarker();
    }
  }

  async register(payload: AuthDTO) {
    return await authApi.register(payload);
  }

  async requestPasswordReset(email: string) {
    return await authApi.requestPasswordReset(email);
  }

  async resetPassword(token: string, newPassword: string) {
    return await authApi.resetPassword(token, newPassword);
  }

  setSession(user: User, token: string) {
    cookieUtils.setUserData(user);
    cookieUtils.setAuthToken(token);
    this.setSessionMarker();
  }

  async logout() {
    try {
      await apiLmsFilmes.post("/auth/logout");
    } catch (error) {
      console.error("Erro ao fazer logout no servidor:", error);
    } finally {
      this.clearTokens();
      window.location.href = "/filmes";
    }
  }

  clearTokens(): void {
    cookieUtils.clearAll();
    this.clearSessionMarker();
  }

  isAuthenticated(): boolean {
    const token = Cookies.get(this.TOKEN_KEY);

    if (!token) {
      this.clearTokens();
      return false;
    }

    return true;
  }

  getUser(): User | null {
    const token = Cookies.get(this.TOKEN_KEY);

    if (!token) {
      this.clearTokens();
      return null;
    }

    const userCookie = Cookies.get(this.USER_KEY);
    if (userCookie) {
      try {
        return JSON.parse(userCookie) as User;
      } catch (e) {
        console.error("Erro ao parsear cookie de usuário:", e);
        this.clearTokens();
        return null;
      }
    }
    return null;
  }

  private setSessionMarker() {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(this.SESSION_MARKER_KEY, "1");
    }
  }

  private clearSessionMarker() {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(this.SESSION_MARKER_KEY);
    }
  }

  private getSessionMarker(): boolean {
    if (typeof window === "undefined") {
      return false;
    }

    return window.localStorage.getItem(this.SESSION_MARKER_KEY) === "1";
  }
}

export default new AuthService();
