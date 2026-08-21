import { getToken, removeToken } from "./auth";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8000";

async function request(
  endpoint: string,
  options: RequestInit = {}
) {
  const token = getToken();

  const headers = new Headers(options.headers);

  headers.set("Content-Type", "application/json");

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(
    `${API_BASE_URL}${endpoint}`,
    {
      ...options,
      headers,
    }
  );

  if (response.status === 401) {
    removeToken();
  }

  const contentType =
    response.headers.get("content-type");

  const data =
    contentType?.includes("application/json")
      ? await response.json()
      : await response.text();

  if (!response.ok) {
    throw new Error(
      typeof data === "object" && data?.detail
        ? data.detail
        : `API request failed (${response.status})`
    );
  }

  return data;
}

export const api = {
  get(endpoint: string) {
    return request(endpoint, {
      method: "GET",
    });
  },

  post(endpoint: string, data?: unknown) {
    return request(endpoint, {
      method: "POST",
      body:
        data !== undefined
          ? JSON.stringify(data)
          : undefined,
    });
  },

  put(endpoint: string, data?: unknown) {
    return request(endpoint, {
      method: "PUT",
      body:
        data !== undefined
          ? JSON.stringify(data)
          : undefined,
    });
  },

  delete(endpoint: string) {
    return request(endpoint, {
      method: "DELETE",
    });
  },
};