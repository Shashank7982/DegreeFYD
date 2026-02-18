"use client"

import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Spinner } from "@/components/ui/spinner"

export function ProtectedRoute({
  children,
  requireAdmin = false,
}: {
  children: React.ReactNode
  requireAdmin?: boolean
}) {
  const { isAuthenticated, isAdmin, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/login")
      } else if (requireAdmin && !isAdmin) {
        router.push("/colleges")
      }
    }
  }, [isAuthenticated, isAdmin, isLoading, requireAdmin, router])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Spinner className="h-8 w-8 text-primary" />
      </div>
    )
  }

  if (!isAuthenticated || (requireAdmin && !isAdmin)) {
    return null
  }

  return <>{children}</>
}
