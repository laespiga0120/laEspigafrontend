const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8080";

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    credentials: "include", // necesario si tu backend usa cookies o sesiones
    ...options,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Error en la solicitud");
  }

  // Read as text first to avoid response.json() throwing if server returns
  // invalid JSON (e.g., content-type misconfigured or plain text body).
  const text = await response.text();

  if (!text) {
    // Empty response body
    return {} as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    // Not JSON, return raw text as T (caller may expect a string)
    return text as unknown as T;
  }
}
