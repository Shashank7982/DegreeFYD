"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/components/auth-provider"
import Image from "next/image"
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { toast } from "sonner"
import { Eye, EyeOff, ShieldCheck, BookOpen, Sparkles } from "lucide-react"

export default function SignupPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [role, setRole] = useState<string>("student")
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { signup } = useAuth()
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name || !email || !password || !confirmPassword) {
      toast.error("Please fill in all fields")
      return
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match")
      return
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters")
      return
    }
    setIsSubmitting(true)
    try {
      await signup({ name, email, password, role })
      toast.success("Account created successfully!")
      setTimeout(() => {
        router.push("/")
      }, 100)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Signup failed")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-lg mx-auto py-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-10 flex flex-col items-center gap-4 text-center">
        <Link href="/" className="group flex items-center gap-4 mb-2">
          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-primary/20 backdrop-blur-xl border border-border group-hover:rotate-12 transition-all">
            <Image src="/logo.png" alt="Logo" width={40} height={40} className="object-contain" />
          </div>
          <span className="text-4xl font-black tracking-tighter text-foreground">
            DegreeFYD
          </span>
        </Link>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted/50 border border-border text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
          <Sparkles className="h-3 w-3" />
          Join the Evolution
        </div>
      </div>

      <Card className="bg-card/50 border-border backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

        <CardHeader className="text-center pb-8 space-y-1">
          <CardTitle className="text-3xl font-black text-foreground tracking-tight">Create Identity</CardTitle>
          <CardDescription className="text-muted-foreground">
            Initialize your profile to start your academic odyssey
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="flex flex-col gap-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2.5">
                <Label htmlFor="name" className="text-muted-foreground font-bold ml-1 text-[10px] uppercase tracking-wider">Full Name</Label>
                <Input
                  id="name"
                  placeholder="Alex Mercer"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  required
                  className="bg-muted/50 border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary focus-visible:border-primary h-12 rounded-xl transition-all"
                />
              </div>
              <div className="flex flex-col gap-2.5">
                <Label htmlFor="email" className="text-muted-foreground font-bold ml-1 text-[10px] uppercase tracking-wider">Email Node</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="alex@nexus.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                  className="bg-muted/50 border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary focus-visible:border-primary h-12 rounded-xl transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2.5">
                <Label htmlFor="password" className="text-muted-foreground font-bold ml-1 text-[10px] uppercase tracking-wider">Security Key</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                    className="bg-muted/50 border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary focus-visible:border-primary h-12 rounded-xl pr-12 transition-all"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1 h-10 w-10 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="flex flex-col gap-2.5">
                <Label htmlFor="confirmPassword" className="text-muted-foreground font-bold ml-1 text-[10px] uppercase tracking-wider">Verify Key</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                  className="bg-muted/50 border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary focus-visible:border-primary h-12 rounded-xl transition-all"
                />
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-muted-foreground font-bold ml-1 text-[10px] uppercase tracking-wider">Select Your Path</Label>
              <RadioGroup
                value={role}
                onValueChange={setRole}
                className="grid grid-cols-2 gap-4"
              >
                <Label
                  htmlFor="role-student"
                  className={`flex cursor-pointer flex-col p-5 rounded-2xl border transition-all duration-300 group ${role === "student"
                    ? "bg-primary/10 border-primary text-foreground shadow-[0_0_30px_rgba(59,130,246,0.15)]"
                    : "bg-muted/50 border-border text-muted-foreground hover:bg-accent"
                    }`}
                >
                  <RadioGroupItem value="student" id="role-student" className="sr-only" />
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-2 rounded-xl transition-colors ${role === "student" ? "bg-primary text-white" : "bg-card text-muted-foreground"}`}>
                      <BookOpen className="h-6 w-6" />
                    </div>
                    {role === "student" && <div className="h-2 w-2 rounded-full bg-primary animate-ping" />}
                  </div>
                  <span className="text-lg font-black tracking-tight mb-1">Scholar</span>
                  <span className="text-[10px] uppercase tracking-widest font-medium opacity-60 italic">Academic Explorer</span>
                </Label>

                <Label
                  htmlFor="role-admin"
                  className={`flex cursor-pointer flex-col p-5 rounded-2xl border transition-all duration-300 group ${role === "admin"
                    ? "bg-primary/10 border-primary text-foreground shadow-[0_0_30px_rgba(59,130,246,0.15)]"
                    : "bg-muted/50 border-border text-muted-foreground hover:bg-accent"
                    }`}
                >
                  <RadioGroupItem value="admin" id="role-admin" className="sr-only" />
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-2 rounded-xl transition-colors ${role === "admin" ? "bg-primary text-white" : "bg-card text-muted-foreground"}`}>
                      <ShieldCheck className="h-6 w-6" />
                    </div>
                    {role === "admin" && <div className="h-2 w-2 rounded-full bg-primary animate-ping" />}
                  </div>
                  <span className="text-lg font-black tracking-tight mb-1">Guardian</span>
                  <span className="text-[10px] uppercase tracking-widest font-medium opacity-60 italic">System Architect</span>
                </Label>
              </RadioGroup>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-6 pt-10 pb-10">
            <Button
              type="submit"
              className="w-full h-16 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 font-black text-xl shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Generating Profile..." : "Initialize Identity"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Already initialized?{" "}
              <Link
                href="/login"
                className="font-black text-primary hover:text-foreground transition-colors"
              >
                Access Portal
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
