"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"
import type { User } from "@/lib/types"
import {
  getToken,
  setToken,
  removeToken,
  getCurrentUser,
  setCurrentUser,
} from "@/lib/auth"
import { login as apiLogin, signup as apiSignup } from "@/lib/api"

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (data: {
    name: string
    email: string
    password: string
    role: string
  }) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = getToken()
    if (token) {
      const storedUser = getCurrentUser()
      if (storedUser) {
        setUser(storedUser)
      }
    }
    setIsLoading(false)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiLogin(email, password)
    setToken(res.token)
    setCurrentUser(res.user)
    setUser(res.user)
  }, [])

  const signup = useCallback(
    async (data: {
      name: string
      email: string
      password: string
      role: string
    }) => {
      const res = await apiSignup(data)
      setToken(res.token)
      setCurrentUser(res.user)
      setUser(res.user)
    },
    []
  )

  const logout = useCallback(() => {
    removeToken()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        signup,
        logout,
        isAuthenticated: !!user,
        isAdmin: user?.role === "admin",
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
