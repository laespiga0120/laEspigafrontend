import { apiRequest } from "./apiClient";

export interface AuthResponse {
  token?: string;
  message?: string;
}

export const AuthService = {
  login: (username: string, password: string) =>
    apiRequest<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),

  register: (username: string, password: string) =>
    apiRequest<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),
};
