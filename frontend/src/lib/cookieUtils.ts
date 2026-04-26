import Cookies from "js-cookie";

const COOKIE_OPTIONS = {
  expires: 7,
  path: "/",
  domain: ".lucasmks.com.br",
  secure: process.env.NODE_ENV === "production",
  sameSite: "Lax" as const,
};

export const cookieUtils = {
  setAuthToken: (token: string) => {
    Cookies.set("auth_token", token, COOKIE_OPTIONS);
  },

  setUserData: (userData: any) => {
    Cookies.set("user_data", JSON.stringify(userData), COOKIE_OPTIONS);
  },

  removeAuthToken: () => {
    Cookies.remove("auth_token", { domain: ".lucasmks.com.br", path: "/" });
  },

  removeUserData: () => {
    Cookies.remove("user_data", { domain: ".lucasmks.com.br", path: "/" });
  },

  clearAll: () => {
    cookieUtils.removeAuthToken();
    cookieUtils.removeUserData();
  },
};
