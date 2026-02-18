import { PublicNavbar } from "@/components/public-navbar"

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="relative flex min-h-screen flex-col bg-background text-foreground selection:bg-primary/30">
            {/* Glassmorphism Background Elements */}
            <div className="fixed inset-0 -z-10 h-full w-full overflow-hidden pointer-events-none">
                {/* Animated Orbs */}
                <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-primary/10 blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-500/5 blur-[100px]" />
                <div className="absolute top-[20%] left-[5%] w-[300px] h-[300px] rounded-full bg-indigo-500/5 blur-[80px] animate-pulse" />

                {/* Subtle Grid */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(128,128,128,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(128,128,128,0.1)_1px,transparent_1px)] bg-[size:40px_40px]" />
            </div>

            <main className="relative z-10 flex flex-1 items-center justify-center p-4">
                {children}
            </main>
        </div>
    )
}
