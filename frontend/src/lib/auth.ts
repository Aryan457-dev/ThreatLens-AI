const TOKEN_KEY = "threatlens_access_token";
const USER_KEY = "threatlens_user";

export type UserRole = "admin" | "analyst" | "viewer";

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  created_at?: string;
}

export function saveToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem(TOKEN_KEY);
}

export function saveUser(user: AuthUser) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getUser(): AuthUser | null {
  if (typeof window === "undefined") {
    return null;
  }

  const user = localStorage.getItem(USER_KEY);

  if (!user) {
    return null;
  }

  try {
    return JSON.parse(user) as AuthUser;
  } catch {
    return null;
  }
}

export function getUserRole(): UserRole | null {
  const user = getUser();

  return user?.role ?? null;
}

export function isAdmin(): boolean {
  return getUserRole() === "admin";
}

export function isAnalyst(): boolean {
  const role = getUserRole();

  return role === "admin" || role === "analyst";
}

export function isViewer(): boolean {
  return ["admin", "analyst", "viewer"].includes(
    getUserRole() ?? ""
  );
}

export function removeToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function isAuthenticated(): boolean {
  return getToken() !== null;
}