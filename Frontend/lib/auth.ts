import type { User } from "./types"

const TOKEN_KEY = "degreefyd_token"
const USER_KEY = "degreefyd_user"

export function getToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null
  const userStr = localStorage.getItem(USER_KEY)
  if (!userStr) return null
  try {
    return JSON.parse(userStr) as User
  } catch {
    return null
  }
}

export function setCurrentUser(user: User): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function isAdmin(): boolean {
  const user = getCurrentUser()
  return user?.role === "admin"
}

export function isAuthenticated(): boolean {
  return !!getToken()
}
