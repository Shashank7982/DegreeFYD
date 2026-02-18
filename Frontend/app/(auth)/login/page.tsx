"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { toast } from "sonner"
import Image from "next/image"
import { Eye, EyeOff, CheckCircle } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { login } = useAuth()
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) {
      toast.error("Please fill in all fields")
      return
    }
    setIsSubmitting(true)
    try {
      await login(email, password)
      toast.success("Welcome back!")
      setTimeout(() => {
        router.push("/")
      }, 100)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
      <div className="mb-12 flex flex-col items-center gap-4 relative">
        <Link href="/" className="group flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-primary/20 backdrop-blur-xl border border-border group-hover:scale-110 transition-transform text-primary font-black">
            <Image src="/logo.png" alt="Logo" width={40} height={40} className="object-contain" />
          </div>
          <span className="text-4xl font-black tracking-tighter text-foreground">
            DegreeFYD
          </span>
        </Link>
        <p className="text-muted-foreground font-medium tracking-wide uppercase text-[10px] tracking-[0.3em]">
          The Future of Academic Discovery
        </p>
      </div>

      <Card className="bg-card/50 border-border backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

        <CardHeader className="text-center pb-8 space-y-2">
          <CardTitle className="text-3xl font-bold text-foreground tracking-tight">Access Portal</CardTitle>
          <CardDescription className="text-muted-foreground">
            Sign in to continue your academic journey
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="flex flex-col gap-6">
            <div className="flex flex-col gap-2.5">
              <Label htmlFor="email" className="text-muted-foreground font-bold ml-1 text-xs uppercase tracking-wider">Email Identity</Label>
              <div className="relative group">
                <Input
                  id="email"
                  type="email"
                  placeholder="you@university.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                  className="bg-muted/50 border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary focus-visible:border-primary h-12 rounded-xl pl-4 transition-all"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <Label htmlFor="password" className="text-muted-foreground font-bold ml-1 text-xs uppercase tracking-wider">Security Key</Label>
              <div className="relative group">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  className="bg-muted/50 border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary focus-visible:border-primary h-12 rounded-xl pl-4 pr-12 transition-all"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1 h-10 w-10 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </Button>
              </div>
            </div>

          </CardContent>

          <CardFooter className="flex flex-col gap-6 pt-6 pb-10">
            <Button
              type="submit"
              className="w-full h-14 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 font-black text-lg shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Authenticating..." : "Establish Connection"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              New to DegreeFYD?{" "}
              <Link
                href="/signup"
                className="font-bold text-primary hover:text-foreground transition-colors"
              >
                Create your account
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>

      <div className="mt-8 flex justify-center gap-8 text-[10px] text-muted-foreground font-black tracking-[0.2em] uppercase">
        <Link href="/" className="hover:text-foreground transition-colors">Privacy Cloud</Link>
        <Link href="/" className="hover:text-foreground transition-colors">Terms of Flow</Link>
        <Link href="/" className="hover:text-foreground transition-colors">Security Pod</Link>
      </div>
    </div>
  )
}
