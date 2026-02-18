"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { motion, useScroll, useSpring, useTransform, useInView, AnimatePresence, type Variants } from "framer-motion"
import useSWR from "swr"
import { getColleges } from "@/lib/api"
import type { College } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/components/auth-provider"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    ArrowRight,
    GraduationCap,
    Scale,
    Search,
    BookOpen,
    Trophy,
    Users,
    MapPin,
    CheckCircle,
    Star,
    Sparkles,
    Globe,
    Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"

// --- Animation Variants ---
const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "circOut" } }
}

const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.3
        }
    }
}

const scaleIn: Variants = {
    hidden: { scale: 0.9, opacity: 0 },
    visible: { scale: 1, opacity: 1, transition: { duration: 0.5, ease: "backOut" } }
}

// --- Components ---

function ScrollProgress() {
    const { scrollYProgress } = useScroll()
    const scaleX = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    })

    return (
        <motion.div
            className="fixed top-0 left-0 right-0 h-1 bg-primary origin-left z-50"
            style={{ scaleX }}
        />
    )
}

function RevealOnScroll({ children, delay = 0 }: { children: React.ReactNode, delay?: number }) {
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true, margin: "-100px" })

    return (
        <motion.div
            ref={ref}
            variants={fadeInUp}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            transition={{ delay }}
        >
            {children}
        </motion.div>
    )
}

function FloatingElement({ children, className, delay = 0, duration = 5 }: { children: React.ReactNode, className?: string, delay?: number, duration?: number }) {
    return (
        <motion.div
            className={className}
            animate={{
                y: [0, -20, 0],
                rotate: [0, 5, -5, 0],
            }}
            transition={{
                duration,
                repeat: Infinity,
                ease: "easeInOut",
                delay
            }}
        >
            {children}
        </motion.div>
    )
}

function FeaturedHorizontalScroll() {
    const featuredColleges = [
        { name: "Indian Institute of Technology", city: "Bombay", type: "Technical", image: "https://images.unsplash.com/photo-1562774053-701939374585?w=800&q=80", slug: "indian-institute-of-technology-bombay-1773" },
        { name: "Delhi Technological Univ", city: "Delhi", type: "State", image: "https://images.unsplash.com/photo-1592280771190-3e2e4d571952?w=800&q=80", slug: "delhi-technological-university-788" },
        { name: "Amity University", city: "Noida", type: "Global", image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&q=80", slug: "vellore-institute-of-technology-4314" },
    ]

    // Duplicate list for infinite scroll
    const allColleges = [...featuredColleges, ...featuredColleges]

    return (
        <section className="relative py-20 bg-neutral-950/5 overflow-hidden">
            <div className="mx-auto max-w-7xl px-4 lg:px-8 mb-12">
                <RevealOnScroll>
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="space-y-4">
                            <Badge variant="secondary" className="px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em]">Featured Selection</Badge>
                            <h2 className="text-4xl font-black tracking-tighter text-foreground sm:text-6xl uppercase italic">Elite <span className="text-primary italic">Institutions</span></h2>
                        </div>
                        <p className="max-w-md text-muted-foreground font-medium">Explore hand-picked premium colleges with exceptional academic records and global recognition.</p>
                    </div>
                </RevealOnScroll>
            </div>

            <div className="relative flex overflow-hidden group">
                {/* Gradient Fades for Marquee */}
                <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
                <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

                <motion.div
                    animate={{ x: ["0%", "-50%"] }}
                    transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                    className="flex gap-8 px-8"
                >
                    {allColleges.map((college, i) => (
                        <motion.div
                            key={i}
                            className="group relative h-[450px] w-[350px] md:h-[500px] md:w-[450px] overflow-hidden rounded-[3rem] bg-card border border-border/50 shadow-2xl shrink-0"
                        >
                            <div className="absolute inset-0 z-0 transition-transform duration-500 group-hover:scale-110">
                                <Image
                                    src={college.image}
                                    alt={college.name}
                                    fill
                                    className="object-cover opacity-60 grayscale group-hover:grayscale-0 transition-all duration-700"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                            </div>
                            <div className="absolute inset-0 z-10 flex flex-col justify-end p-10">
                                <Badge variant="secondary" className="w-fit mb-4 bg-primary/20 backdrop-blur-md text-primary font-black uppercase tracking-widest border-none">
                                    {college.type}
                                </Badge>
                                <h3 className="text-3xl font-black text-white tracking-tighter uppercase italic line-clamp-2">
                                    {college.name}
                                </h3>
                                <p className="mt-2 text-sm font-bold text-white/60 flex items-center gap-2">
                                    <MapPin className="h-4 w-4" /> {college.city}
                                </p>
                                <Button className="mt-6 w-full rounded-2xl bg-white text-black hover:bg-white/90 font-black uppercase tracking-tighter" asChild>
                                    <Link href={`/colleges/${college.slug}`}>
                                        View Details
                                    </Link>
                                </Button>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    )
}

export default function HomePage() {
    const router = useRouter()
    const [searchQuery, setSearchQuery] = useState("")
    const [open, setOpen] = useState(false)
    const [isMounted, setIsMounted] = useState(false)
    const { isAuthenticated } = useAuth()

    useEffect(() => {
        setIsMounted(true)
    }, [])

    // Parallax values for hero
    const { scrollY } = useScroll()
    const y1 = useTransform(scrollY, [0, 500], [0, 200])
    const y2 = useTransform(scrollY, [0, 500], [0, -150])
    const rotate1 = useTransform(scrollY, [0, 500], [0, 45])

    // Use SWR to fetch colleges for suggestions
    const { data: collegesData } = useSWR(
        searchQuery.length >= 2 ? ["college-suggestions", searchQuery] : null,
        () => getColleges({ search: searchQuery, limit: 5 })
    )
    const suggestions = collegesData?.data || []

    const handleSearch = (e?: React.FormEvent) => {
        e?.preventDefault()
        if (searchQuery.trim()) {
            router.push(`/colleges?search=${encodeURIComponent(searchQuery)}`)
            setOpen(false)
        }
    }

    const handleSelect = (college: College) => {
        router.push(`/colleges/${college.slug}`)
        setOpen(false)
    }

    return (
        <div className="relative min-h-[calc(100vh-64px)] flex flex-col bg-background text-foreground selection:bg-primary/20 selection:text-primary overflow-x-hidden">
            <ScrollProgress />

            {/* Background Gradients & Decorative elements */}
            <div className="fixed inset-0 -z-10 h-full w-full bg-slate-50/50 dark:bg-[#020817] overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

                {/* Parallax Background Elements */}
                <motion.div
                    style={{ y: y1, rotate: rotate1 }}
                    className="absolute -left-20 top-40 h-72 w-72 rounded-full border border-primary/20 bg-primary/5 blur-3xl opacity-50"
                />
                <motion.div
                    style={{ y: y2 }}
                    className="absolute -right-20 bottom-40 h-96 w-96 rounded-[3rem] border border-blue-500/20 bg-blue-500/5 blur-3xl opacity-50"
                />

                {/* Floating Props Managed by Framer */}
                <FloatingElement className="absolute left-[5%] top-[15%] text-primary/10" duration={8}>
                    <GraduationCap className="h-48 w-48" strokeWidth={1} />
                </FloatingElement>
                <FloatingElement className="absolute right-[10%] top-[25%] text-blue-500/10" delay={1} duration={10}>
                    <Trophy className="h-40 w-40" strokeWidth={1} />
                </FloatingElement>
                <FloatingElement className="absolute left-[15%] bottom-[20%] text-purple-500/10" delay={2} duration={12}>
                    <BookOpen className="h-44 w-44" strokeWidth={1} />
                </FloatingElement>
                <FloatingElement className="absolute right-[15%] bottom-[15%] text-emerald-500/10" delay={3} duration={9}>
                    <Users className="h-36 w-36" strokeWidth={1} />
                </FloatingElement>

                {/* Animated Gradient Washes */}
                <motion.div
                    animate={{
                        scale: [1, 1.1, 1],
                        opacity: [0.3, 0.5, 0.3],
                    }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute left-1/4 top-0 h-[800px] w-[800px] rounded-full bg-primary/10 blur-[120px]"
                />

                {/* Floating Particles - Client Only to avoid hydration mismatch */}
                {isMounted && [...Array(20)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute h-1 w-1 bg-primary/20 rounded-full"
                        style={{
                            left: (Math.random() * 100).toFixed(2) + "%",
                            top: (Math.random() * 100).toFixed(2) + "%",
                        }}
                        animate={{
                            y: [0, -100],
                            opacity: [0, 0.4, 0]
                        }}
                        transition={{
                            duration: 10 + Math.random() * 10,
                            repeat: Infinity,
                            ease: "linear",
                            delay: Math.random() * 10
                        }}
                    />
                ))}
            </div>

            <main className="flex-1">
                {/* Hero Section */}
                <section className="relative overflow-hidden pt-12 md:pt-20 pb-12">
                    <div className="mx-auto max-w-7xl px-4 text-center lg:px-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <Badge variant="outline" className="mb-6 rounded-full border-primary/30 bg-primary/10 px-6 py-1.5 text-xs font-bold uppercase tracking-widest text-primary backdrop-blur-md shadow-lg shadow-primary/5">
                                <Sparkles className="mr-2 h-3.5 w-3.5 animate-pulse" />
                                India's Premium College Discovery Platform
                            </Badge>
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="mx-auto max-w-5xl text-4xl font-black tracking-tight text-foreground sm:text-6xl lg:text-7xl italic leading-[1.1]"
                        >
                            Elevate Your <span className="inline-block px-4 text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-500 to-purple-500 pb-2">Academic Potential</span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="mx-auto mt-8 max-w-2xl text-lg text-muted-foreground md:text-xl font-medium leading-[1.6]"
                        >
                            Your future deserves more than guesswork. Explore, compare, and choose from the world’s most distinguished institutions—because excellence begins with the right decision.
                        </motion.p>

                        {/* Search Bar */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.6, delay: 0.3 }}
                            className="mx-auto mt-12 max-w-2xl w-full px-4 group"
                        >
                            <Popover open={open} onOpenChange={setOpen}>
                                <PopoverTrigger asChild>
                                    <div className="relative flex items-center shadow-[0_20px_50px_rgba(var(--primary),0.15)] rounded-3xl overflow-hidden ring-1 ring-border group-focus-within:ring-primary/50 transition-all">
                                        <div className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center gap-2 text-muted-foreground z-10">
                                            <Search className="h-5 w-5" />
                                        </div>
                                        <Input
                                            type="text"
                                            placeholder="Explore institutions, courses, destinations..."
                                            className="pl-14 h-20 w-full border-none bg-background/80 backdrop-blur-xl text-lg !ring-0 rounded-none placeholder:text-muted-foreground/60 transition-all"
                                            value={searchQuery}
                                            onChange={(e) => {
                                                setSearchQuery(e.target.value)
                                                if (e.target.value.length >= 2) setOpen(true)
                                            }}
                                            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                                        />
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10">
                                            <Button
                                                onClick={() => handleSearch()}
                                                className="rounded-2xl h-14 px-10 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-tighter text-sm shadow-xl shadow-primary/25 transition-transform hover:scale-105"
                                            >
                                                Search
                                            </Button>
                                        </div>
                                    </div>
                                </PopoverTrigger>
                                <PopoverContent
                                    className="p-0 w-[var(--radix-popover-trigger-width)] mt-4 overflow-hidden border-border/50 bg-background/80 backdrop-blur-2xl shadow-2xl rounded-3xl"
                                    align="start"
                                    onOpenAutoFocus={(e) => e.preventDefault()}
                                >
                                    <Command className="bg-transparent">
                                        <CommandList className="max-h-[300px]">
                                            <AnimatePresence>
                                                {suggestions.length === 0 && searchQuery.length >= 2 ? (
                                                    <CommandEmpty className="py-6 text-sm italic opacity-60">No colleges found for "{searchQuery}"</CommandEmpty>
                                                ) : null}
                                                {suggestions.length > 0 && (
                                                    <CommandGroup heading="Search Results" className="px-2">
                                                        {suggestions.map((college) => (
                                                            <CommandItem
                                                                key={college._id || college.id}
                                                                onSelect={() => handleSelect(college)}
                                                                className="cursor-pointer py-4 px-4 rounded-2xl hover:bg-primary/5 aria-selected:bg-primary/5 transition-all mb-1"
                                                            >
                                                                <div className="flex items-center gap-4">
                                                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary font-black text-lg">
                                                                        {college.name.charAt(0)}
                                                                    </div>
                                                                    <div className="flex flex-col">
                                                                        <span className="font-bold text-foreground">{college.name}</span>
                                                                        <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                                                            <MapPin className="h-3 w-3" /> {college.city}, {college.state}
                                                                        </span>
                                                                    </div>
                                                                    <div className="ml-auto">
                                                                        <Zap className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                                                                    </div>
                                                                </div>
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                )}
                                            </AnimatePresence>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.4 }}
                            className="mt-12 flex flex-wrap items-center justify-center gap-6"
                        >
                            {isAuthenticated ? (
                                <>
                                    <Button size="lg" className="h-14 px-10 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-black text-sm uppercase tracking-widest shadow-2xl shadow-primary/20 transition-all hover:scale-110 active:scale-95 group" asChild>
                                        <Link href="/colleges">
                                            Start Discovery
                                            <ArrowRight className="ml-3 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                        </Link>
                                    </Button>
                                    <Button size="lg" variant="ghost" className="h-14 px-10 rounded-2xl border border-border bg-background/50 backdrop-blur-sm hover:bg-accent text-foreground font-bold group" asChild>
                                        <Link href="/compare">
                                            Comparison Tool
                                            <Scale className="ml-3 h-5 w-5 group-hover:rotate-12 transition-transform" />
                                        </Link>
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button size="lg" className="h-14 px-10 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-black text-sm uppercase tracking-widest shadow-2xl shadow-primary/20 transition-all hover:scale-110 active:scale-95 group" asChild>
                                        <Link href="/signup">
                                            Initialize Profile
                                            <ArrowRight className="ml-3 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                        </Link>
                                    </Button>
                                    <Button size="lg" variant="outline" className="h-14 px-10 rounded-2xl border-border bg-background/50 backdrop-blur-sm hover:bg-accent text-foreground font-bold group" asChild>
                                        <Link href="/login">
                                            Account Access
                                        </Link>
                                    </Button>
                                </>
                            )}
                        </motion.div>

                        {/* Stats - Staggered entrance */}
                        <motion.div
                            variants={staggerContainer}
                            initial="hidden"
                            animate="visible"
                            className="mt-12 grid grid-cols-2 gap-4 border-t border-border/50 pt-8 text-center sm:grid-cols-4 md:gap-8"
                        >
                            {[
                                { icon: GraduationCap, val: "5000+", label: "Verified Colleges" },
                                { icon: Users, val: "1.2M", label: "Active Users" },
                                { icon: BookOpen, val: "250+", label: "Courses" },
                                { icon: Trophy, val: "A++", label: "Top Rankings" },
                            ].map((stat, i) => (
                                <motion.div key={i} variants={fadeInUp} className="flex flex-col items-center p-6 rounded-3xl bg-card/10 backdrop-blur-sm border border-border/30 hover:bg-card/20 transition-colors group">
                                    <div className="bg-primary/10 p-4 rounded-2xl mb-4 group-hover:scale-110 transition-transform">
                                        <stat.icon className="h-7 w-7 text-primary" />
                                    </div>
                                    <h3 className="text-4xl font-black text-foreground tracking-tighter">{stat.val}</h3>
                                    <p className="text-[10px] uppercase tracking-[0.3em] font-black text-muted-foreground mt-2">{stat.label}</p>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                </section>

                {/* Trust Registry Section */}
                <section className="py-8 border-y border-border/20 bg-muted/5">
                    <div className="mx-auto max-w-7xl px-4 lg:px-8">
                        <div className="flex flex-wrap justify-center items-center gap-12 opacity-50 grayscale hover:grayscale-0 transition-all duration-700">
                            {/* Placeholder for institution logos */}
                            {["IITB", "BITSP", "NID", "DTU", "AMITY", "MIT"].map(label => (
                                <span key={label} className="text-xl font-black tracking-widest uppercase italic text-muted-foreground">{label}</span>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Features Section - Reveal on Scroll */}
                <section className="py-20 relative overflow-hidden">
                    <div className="absolute inset-0 bg-primary/[0.02] -skew-y-3" />
                    <div className="mx-auto max-w-7xl px-4 lg:px-8 relative">
                        <RevealOnScroll>
                            <div className="text-center mb-12 space-y-4">
                                <Badge variant="secondary" className="px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em]">Our Services</Badge>
                                <h2 className="text-4xl font-black tracking-tighter text-foreground sm:text-6xl uppercase italic">Smart Discovery</h2>
                                <p className="mt-4 text-xl text-muted-foreground max-w-2xl mx-auto font-medium">Advanced tools helping you find the perfect institution.</p>
                            </div>
                        </RevealOnScroll>

                        <div className="grid gap-10 md:grid-cols-3">
                            {[
                                { icon: Search, title: "Smart Filters", desc: "Filter colleges using 50+ data points for a perfect match with your career profile.", color: "text-blue-500", xOffset: -50 },
                                { icon: Scale, title: "Compare Colleges", desc: "Live comparison engines to evaluate fees, ROI, and faculty infrastructure metrics.", color: "text-purple-500", xOffset: 0 },
                                { icon: Globe, title: "Verified Data", desc: "Analyze authenticity with verified NIRF data and global accreditation scores.", color: "text-emerald-500", xOffset: 50 }
                            ].map((feat, i) => (
                                <RevealOnScroll key={i} delay={i * 0.1}>
                                    <motion.div
                                        whileHover={{ y: -10, transition: { duration: 0.2 } }}
                                        className="h-full"
                                    >
                                        <Card className="group relative h-full overflow-hidden border-border/50 bg-card/50 backdrop-blur-md hover:border-primary/50 transition-all hover:shadow-[0_20px_40px_rgba(0,0,0,0.1)] rounded-[2.5rem] p-4">
                                            <CardContent className="flex flex-col items-start p-8">
                                                <div className={cn("mb-8 rounded-[1.5rem] bg-muted/50 p-5 ring-1 ring-border transition-all group-hover:bg-primary group-hover:text-white group-hover:scale-110 group-hover:rotate-6", feat.color)}>
                                                    <feat.icon className="h-10 w-10" />
                                                </div>
                                                <h3 className="mb-4 text-2xl font-black text-foreground tracking-tight">{feat.title}</h3>
                                                <p className="text-muted-foreground leading-relaxed font-medium">
                                                    {feat.desc}
                                                </p>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                </RevealOnScroll>
                            ))}
                        </div>
                    </div>
                </section>

                {/* New Horizontal Scroll Experience */}
                <FeaturedHorizontalScroll />

                {/* Popular Courses Marquee - Enhanced with Mask Fades */}
                <section className="py-12 border-y border-border/50 bg-background/50 overflow-hidden relative">
                    <RevealOnScroll>
                        <div className="mx-auto max-w-7xl px-4 lg:px-8 mb-8 text-center space-y-4">
                            <h2 className="text-4xl font-black text-foreground tracking-tighter uppercase italic">Trending <span className="text-primary underline decoration-primary/30 underline-offset-8">Courses</span></h2>
                        </div>
                    </RevealOnScroll>

                    <div className="relative flex overflow-x-hidden group">
                        {/* Gradient Fades for Marquee */}
                        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
                        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

                        <motion.div
                            animate={{ x: ["0%", "-50%"] }}
                            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                            className="whitespace-nowrap flex gap-8 py-10"
                        >
                            {[
                                "B.Tech Computer Science", "MBA Finance", "MBBS Clinical", "B.Arch Design", "BBA Analytics", "B.Com Honors",
                                "M.Tech Civil Eng", "BCA Systems", "MCA Masters", "B.Sc Nursing", "Law (LLB)", "Hotel Management",
                                "B.Tech Computer Science", "MBA Finance", "MBBS Clinical", "B.Arch Design", "BBA Analytics", "B.Com Honors",
                                "M.Tech Civil Eng", "BCA Systems", "MCA Masters", "B.Sc Nursing", "Law (LLB)", "Hotel Management"
                            ].map((course, i) => (
                                <div key={i} className="inline-flex items-center justify-center px-10 py-6 rounded-[2rem] bg-card border border-border shadow-2xl shadow-black/5 text-lg font-black text-foreground hover:border-primary hover:text-primary transition-all cursor-pointer hover:-translate-y-2">
                                    {course}
                                </div>
                            ))}
                        </motion.div>
                    </div>
                </section>

                {/* Top Cities Grid - Staggered Reveal */}
                <section className="py-20 relative">
                    <div className="mx-auto max-w-7xl px-4 lg:px-8">
                        <RevealOnScroll>
                            <div className="text-center mb-12 space-y-4">
                                <h2 className="text-4xl font-black tracking-tight text-foreground sm:text-6xl uppercase italic">Top Study <span className="text-primary italic">Destinations</span></h2>
                                <p className="mt-4 text-xl text-muted-foreground font-medium">Target the most successful academic hubs in the country.</p>
                            </div>
                        </RevealOnScroll>

                        <motion.div
                            variants={staggerContainer}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: "-50px" }}
                            className="grid grid-cols-2 md:grid-cols-4 gap-6"
                        >
                            {[
                                { name: "Bangalore", count: "180+ Colleges", color: "from-blue-500/10 to-transparent", icon: Zap },
                                { name: "Delhi NCR", count: "145+ Colleges", color: "from-purple-500/10 to-transparent", icon: Sparkles },
                                { name: "Mumbai", count: "98+ Colleges", color: "from-orange-500/10 to-transparent", icon: Trophy },
                                { name: "Pune", count: "82+ Colleges", color: "from-green-500/10 to-transparent", icon: GraduationCap },
                                { name: "Chennai", count: "78+ Colleges", color: "from-indigo-500/10 to-transparent", icon: Globe },
                                { name: "Hyderabad", count: "74+ Colleges", color: "from-yellow-500/10 to-transparent", icon: Users },
                                { name: "Kolkata", count: "65+ Colleges", color: "from-teal-500/10 to-transparent", icon: BookOpen },
                                { name: "Ahmedabad", count: "55+ Colleges", color: "from-rose-500/10 to-transparent", icon: MapPin },
                            ].map((city, i) => (
                                <motion.div key={city.name} variants={scaleIn}>
                                    <Link href={`/colleges?search=${city.name}`} className="group relative overflow-hidden rounded-[2.5rem] aspect-square flex flex-col items-center justify-center p-8 border border-border bg-card hover:border-primary/50 transition-all hover:shadow-[0_30px_60px_rgba(0,0,0,0.12)]">
                                        <div className={`absolute inset-0 bg-gradient-to-tr ${city.color} opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />
                                        <div className="relative mb-6 p-5 rounded-2xl bg-muted/50 group-hover:bg-primary group-hover:text-white transition-all group-hover:scale-125 group-hover:rotate-6">
                                            <city.icon className="h-8 w-8" />
                                        </div>
                                        <h3 className="text-2xl font-black text-foreground relative tracking-tighter">{city.name}</h3>
                                        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mt-2 relative opacity-60 group-hover:text-primary transition-colors">{city.count}</p>
                                    </Link>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                </section>

                {/* Student Testimonials */}
                <section className="py-20 relative overflow-hidden bg-primary/5">
                    <div className="mx-auto max-w-7xl px-4 lg:px-8">
                        <RevealOnScroll>
                            <div className="text-center mb-12 space-y-4">
                                <h2 className="text-4xl font-black tracking-tighter text-foreground uppercase italic px-4">Student <span className="text-primary">Reviews</span></h2>
                            </div>
                        </RevealOnScroll>

                        <div className="grid md:grid-cols-3 gap-8">
                            {[
                                { user: "Aditya R.", role: "B.Tech Student", text: "The Smart Filters helped me find a campus that aligns perfectly with my career goals. Great experience." },
                                { user: "Sarah K.", role: "MBA Student", text: "Comparison tools made evaluating colleges a breeze. I could find real value easily." },
                                { user: "Vikram S.", role: "Medical Student", text: "Official rankings were very helpful. Found a top-tier institution that had everything I needed." }
                            ].map((test, i) => (
                                <RevealOnScroll key={i} delay={i * 0.1}>
                                    <div className="p-8 rounded-[2rem] bg-card border border-border/50 relative group hover:border-primary/50 transition-all">
                                        <Star className="absolute top-8 right-8 h-6 w-6 text-primary/20 group-hover:text-primary transition-colors" />
                                        <p className="text-lg font-medium text-foreground/80 mb-6 italic">"{test.text}"</p>
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center font-black text-primary">
                                                {test.user.charAt(0)}
                                            </div>
                                            <div>
                                                <h4 className="font-black text-foreground uppercase tracking-tight">{test.user}</h4>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-primary/60">Verified User</p>
                                            </div>
                                        </div>
                                    </div>
                                </RevealOnScroll>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA Section - Advanced Glassmorphism */}
                <section className="relative py-20 overflow-hidden">
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
                    <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,rgba(var(--primary),0.05)_0%,transparent_100%)]" />

                    <div className="mx-auto max-w-5xl px-4 lg:px-8">
                        <RevealOnScroll>
                            <div className="relative rounded-[3.5rem] bg-card/40 border border-border/50 backdrop-blur-3xl overflow-hidden p-12 md:p-20 text-center">
                                {/* Decorative circle in CTA */}
                                <div className="absolute -right-20 -bottom-20 h-64 w-64 rounded-full bg-primary/10 blur-[80px]" />
                                <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-blue-500/10 blur-[80px]" />

                                <h2 className="text-5xl font-black tracking-tighter text-foreground sm:text-7xl uppercase italic relative">
                                    Start Your <span className="text-primary italic">Journey</span>
                                </h2>
                                <p className="mx-auto mt-8 max-w-xl text-xl text-muted-foreground font-medium relative leading-relaxed">
                                    Join the elite network of students leveraging real-time data to master their academic trajectory.
                                </p>
                                <div className="mt-12 relative flex justify-center">
                                    <Button size="lg" className="h-20 px-16 rounded-[2rem] bg-primary hover:bg-primary/90 text-primary-foreground font-black text-lg uppercase tracking-[0.2em] shadow-2xl shadow-primary/30 transition-all hover:scale-110 active:scale-95 group" asChild>
                                        <Link href={isAuthenticated ? "/colleges" : "/signup"}>
                                            Start Exploring
                                            <Zap className="ml-4 h-6 w-6 group-hover:animate-bounce" />
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </RevealOnScroll>
                    </div>
                </section>
            </main>

            {/* Simple Footer */}
            <footer className="border-t border-border bg-card/30 backdrop-blur-md py-16">
                <div className="mx-auto max-w-7xl px-4 lg:px-8">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div className="text-left space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-white border border-border shadow-md">
                                    <Image
                                        src="/logo.png"
                                        alt="DegreeFYD Logo"
                                        width={28}
                                        height={28}
                                        className="object-contain"
                                    />
                                </div>
                                <span className="text-2xl font-black tracking-tighter text-foreground uppercase italic">
                                    DegreeFYD
                                </span>
                            </div>
                            <p className="max-w-xs text-sm font-medium text-muted-foreground leading-relaxed italic">
                                India's most advanced college discovery platform. Precision data for the modern student.
                            </p>
                        </div>
                        <div className="flex flex-col md:items-end gap-6 text-sm">
                            <div className="flex gap-10 font-black uppercase tracking-widest text-[10px]">
                                <Link href="/colleges" className="hover:text-primary transition-colors">Colleges</Link>
                                <Link href="/compare" className="hover:text-primary transition-colors">Compare</Link>
                                <Link href="/login" className="hover:text-primary transition-colors">Login</Link>
                            </div>
                            <p className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">
                                &copy; 2024 DegreeFYD. ALL RIGHTS RESERVED.
                            </p>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    )
}
