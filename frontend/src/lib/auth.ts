import Cookies from "js-cookie";
import { authApi, apiLmsFilmes } from "./api";
import { AuthDTO, User } from "./types";

const USER_KEY = "user_data";

class AuthService {
  private readonly USER_KEY = "user_data";

  async login(payload: AuthDTO) {
    const response = await authApi.login(payload);

    if (response.user) {
      this.setSession(response.user);
    } else {
      throw new Error("Resposta de login inválida do servidor.");
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

  setSession(user: User) {
    Cookies.set(this.USER_KEY, JSON.stringify(user), {
      expires: 1,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
    });
  }

  async logout() {
    try {
      await apiLmsFilmes.post("/auth/logout");
    } catch (error) {
      console.error("Erro ao fazer logout no servidor:", error);
    } finally {
      this.clearTokens();
      window.location.href = "/login";
    }
  }

  clearTokens(): void {
    Cookies.remove(this.USER_KEY);
  }

  isAuthenticated(): boolean {
    const userCookie = Cookies.get(this.USER_KEY);
    return !!userCookie;
  }

  getUser(): User | null {
    const userCookie = Cookies.get(this.USER_KEY);
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
