import { cookies } from "next/headers";

const resolveApiGatewayUrl = (): string => {
  const envUrl =
    process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_GATEWAY_URL;

  if (envUrl && envUrl.trim()) {
    return envUrl.replace(/\/$/, "");
  }

  return "https://api-filmes.lucasmks.com.br";
};

const API_GATEWAY_URL = resolveApiGatewayUrl();

async function fetcher<T>(
  endpoint: string,
  service: "lms-filmes" | "lms-rating" | "lms-favorite",
  options: RequestInit = {}
): Promise<T> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const url = `${API_GATEWAY_URL}/${service}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      // In a real Server Action or Server Component, we might want to redirect
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Erro na requisição à API");
  }

  return response.json();
}

export const apiFetch = {
  get: <T>(service: any, endpoint: string, options?: RequestInit) =>
    fetcher<T>(endpoint, service, { ...options, method: "GET" }),
  post: <T>(service: any, endpoint: string, body?: any, options?: RequestInit) =>
    fetcher<T>(endpoint, service, {
      ...options,
      method: "POST",
      body: JSON.stringify(body),
    }),
};
