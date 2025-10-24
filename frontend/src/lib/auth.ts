import axios from "axios";
import Cookies from "js-cookie";
import { authApi } from "./api";
import { AuthDTO, User } from "./types";
import { ErrorHandler } from "./errorHandler";

const TOKEN_KEY = "auth_token";
const USER_KEY = "user_data";

class AuthService {
  private readonly TOKEN_KEY = "auth_token";
  private readonly USER_KEY = "user_data";

  // Fazer login
  async login(payload: AuthDTO) {
    const response = await authApi.login(payload);
    if (response.token && response.user) {
      this.setSession(response.token, response.user);
    } else {
      throw new Error("Resposta de login inválida do servidor.");
    }
  }

  // Fazer registro
  async register(payload: AuthDTO) {
    const response = await authApi.register(payload);
    return response;
  }

  async requestPasswordReset(email: string) {
    const response = await authApi.requestPasswordReset(email);
    return response;
  }

  async resetPassword(token: string, newPassword: string) {
    const response = await authApi.resetPassword(token, newPassword);
    return response;
  }

  setSession(token: string, user: User) {
    Cookies.set(TOKEN_KEY, token, {
      expires: 1,
      secure: true,
      sameSite: "Lax",
    });
    Cookies.set(USER_KEY, JSON.stringify(user), {
      expires: 1,
      secure: true,
      sameSite: "Lax",
    });
  }

  // Fazer logout
  logout(): void {
    Cookies.remove(TOKEN_KEY);
    Cookies.remove(USER_KEY);

    window.location.href = "/login";
  }

  clearTokens(): void {
    Cookies.remove(this.TOKEN_KEY);
    Cookies.remove(this.USER_KEY);
  }

  isAuthenticated(): boolean {
    const token = Cookies.get(TOKEN_KEY);
    return !!token;
  }

  getUser(): User | null {
    const userCookie = Cookies.get(USER_KEY);
    if (userCookie) {
      try {
        return JSON.parse(userCookie) as User;
      } catch (e) {
        console.error("Erro ao parsear cookie de usuário:", e);
        this.logout();
        return null;
      }
    }
    return null;
  }
}

export default new AuthService();
