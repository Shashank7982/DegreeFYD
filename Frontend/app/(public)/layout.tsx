import { PublicNavbar } from "@/components/public-navbar"

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative flex min-h-screen flex-col text-foreground selection:bg-primary/30">
      {/* BOLD Background with Visible Patterns - Global for Public Pages */}


      <PublicNavbar />
      <main className="relative z-10 flex-1">{children}</main>
    </div>
  )
}
