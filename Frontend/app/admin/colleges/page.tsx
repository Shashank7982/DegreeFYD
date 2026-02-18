"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import {
  PlusCircle,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  GraduationCap,
  Activity,
  Zap,
  Sparkles,
} from "lucide-react"
import {
  getAllCollegesAdmin,
  deleteCollege,
  toggleCollegeStatus,
} from "@/lib/api"
import type { College } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export default function AdminCollegesPage() {
  const [colleges, setColleges] = useState<College[]>([])
  const [filtered, setFiltered] = useState<College[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [deleteTarget, setDeleteTarget] = useState<College | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const load = useCallback(async () => {
    try {
      const data = await getAllCollegesAdmin()
      setColleges(data)
      setFiltered(data)
    } catch {
      toast.error("Failed to load colleges")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(colleges)
    } else {
      const q = search.toLowerCase()
      setFiltered(
        colleges.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.city.toLowerCase().includes(q) ||
            c.type.toLowerCase().includes(q)
        )
      )
    }
  }, [search, colleges])

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await deleteCollege(deleteTarget.id)
      setColleges((prev) => prev.filter((c) => (c._id || c.id) !== deleteTarget.id))
      toast.success(`"${deleteTarget.name}" deleted successfully`)
    } catch {
      toast.error("Failed to delete college")
    }
    setDeleteTarget(null)
  }

  async function handleToggleStatus(college: College) {
    try {
      const updated = await toggleCollegeStatus(college.id)
      setColleges((prev) =>
        prev.map((c) => ((c._id || c.id) === updated.id ? updated : c))
      )
      toast.success(
        `"${college.name}" ${updated.status === "published" ? "published" : "unpublished"}`
      )
    } catch {
      toast.error("Failed to update status")
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center animate-pulse">
          <Activity className="h-6 w-6 text-primary" />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 animate-pulse">Syncing Entity Ledger...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-bold uppercase tracking-[0.2em] text-primary mb-4">
            <Sparkles className="h-3 w-3" />
            Admin View
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-foreground mb-2 uppercase italic">College <span className="text-primary">List</span></h1>
          <p className="text-muted-foreground text-sm font-medium">Manage all colleges in the system.</p>
        </div>
        <Button asChild className="h-12 px-6 rounded-xl bg-primary text-primary-foreground font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.05] active:scale-[0.98] transition-all">
          <Link href="/admin/colleges/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add College
          </Link>
        </Button>
      </div>

      {/* College List Card */}
      <Card className="bg-card/50 border-border backdrop-blur-2xl rounded-[1.5rem] overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
        <CardHeader className="p-6 border-b border-border bg-muted/20">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg font-black text-foreground tracking-tight">Broadcast Registry</CardTitle>
              <CardDescription className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                {filtered.length} active nodes detected on network
              </CardDescription>
            </div>
            <div className="relative w-full lg:w-80 group">
              <div className="absolute inset-0 bg-primary/5 blur-xl group-hover:bg-primary/10 transition-colors opacity-0 group-focus-within:opacity-100 rounded-2xl" />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors z-10" />
              <Input
                placeholder="Scan for entities..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-12 h-11 bg-background border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:ring-0 transition-all z-10 text-sm"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center space-y-6">
              <div className="h-20 w-20 rounded-[2rem] bg-muted/50 border border-border flex items-center justify-center animate-pulse">
                <GraduationCap className="h-10 w-10 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-foreground tracking-tight">Zero Protocols Found</h3>
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground italic">
                  The search sequence returned no active data streams.
                </p>
              </div>
              {!search && (
                <Button className="h-12 px-8 rounded-xl bg-card border border-border text-foreground font-black text-[10px] uppercase tracking-widest hover:bg-accent" asChild>
                  <Link href="/admin/colleges/new">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Initialize Node
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border bg-muted/20 hover:bg-transparent">
                    <TableHead className="pl-8 py-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground">Identified Entity</TableHead>
                    <TableHead className="py-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground">Geographic Lock</TableHead>
                    <TableHead className="py-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground">Classification</TableHead>
                    <TableHead className="py-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground text-center">Modules</TableHead>
                    <TableHead className="py-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground">Status</TableHead>
                    <TableHead className="pr-8 py-5 text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((college, i) => (
                    <TableRow
                      key={college._id || college.id}
                      className={cn(
                        "border-border hover:bg-muted/50 transition-all group",
                        `animate-in fade-in slide-in-from-left-4 duration-500 delay-[${i * 30}ms]`
                      )}
                    >
                      <TableCell className="pl-8 py-4">
                        <div className="flex items-center gap-4">
                          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted/50 border border-border group-hover:scale-110 group-hover:rotate-3 transition-all overflow-hidden shadow-lg">
                            <div className="absolute inset-x-0 bottom-0 h-1 bg-primary/30" />
                            <span className="text-xs font-black text-foreground">{college.name.charAt(0)}</span>
                          </div>
                          <div className="space-y-0.5">
                            <p className="font-black text-foreground text-sm leading-none tracking-tight">
                              {college.name}
                            </p>
                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                              <Sparkles className="h-2.5 w-2.5 text-primary/60" />
                              Cycle {college.established}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs font-bold uppercase tracking-wider">
                        {college.city}, {college.state}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="rounded-lg bg-muted/50 border-border text-[9px] font-black uppercase tracking-widest text-muted-foreground px-2 py-1">
                          {college.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="inline-flex items-center justify-center h-8 w-12 rounded-lg bg-primary/5 border border-primary/20 text-[10px] font-black text-primary">
                          {college.courses.length}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            "rounded-lg px-3 py-1 text-[8px] font-black uppercase tracking-widest border transition-all",
                            college.status === "published"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]"
                              : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                          )}
                        >
                          {college.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="pr-8 text-right">
                        {isMounted && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-accent text-muted-foreground hover:text-foreground transition-all">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 p-2 bg-popover/90 backdrop-blur-2xl border-border rounded-2xl shadow-2xl">
                              <DropdownMenuItem asChild className="rounded-xl px-3 py-2.5 text-xs font-black uppercase tracking-widest focus:bg-accent cursor-pointer">
                                <Link href={`/admin/colleges/${college._id || college.id}`}>
                                  <Pencil className="mr-3 h-4 w-4 text-primary" />
                                  Modify Unit
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="rounded-xl px-3 py-2.5 text-xs font-black uppercase tracking-widest focus:bg-accent cursor-pointer"
                                onClick={() => handleToggleStatus(college)}
                              >
                                {college.status === "published" ? (
                                  <>
                                    <EyeOff className="mr-3 h-4 w-4 text-amber-500" />
                                    Suspend Node
                                  </>
                                ) : (
                                  <>
                                    <Eye className="mr-3 h-4 w-4 text-emerald-500" />
                                    Broadcast Node
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-border mx-2 my-2" />
                              <DropdownMenuItem
                                className="rounded-xl px-3 py-2.5 text-xs font-black uppercase tracking-widest text-red-400 focus:bg-red-500/10 focus:text-red-400 cursor-pointer"
                                onClick={() => setDeleteTarget(college)}
                              >
                                <Trash2 className="mr-3 h-4 w-4" />
                                Terminate Entity
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Alert Dialogs */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent className="bg-popover border-border rounded-[1.5rem] p-8 max-w-md">
          <AlertDialogHeader className="space-y-4">
            <div className="h-11 w-11 rounded-1xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-2 mx-auto">
              <Trash2 className="h-5 w-5 text-red-400" />
            </div>
            <AlertDialogTitle className="text-2xl font-black text-foreground tracking-tighter text-center uppercase">Delete College?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground text-center font-medium">
              You are about to permanently delete <span className="text-foreground font-black">&quot;{deleteTarget?.name}&quot;</span> from the system. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-3 pt-6">
            <AlertDialogCancel className="h-12 flex-1 rounded-xl bg-card border-border text-foreground font-black text-[10px] uppercase tracking-widest hover:bg-accent">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="h-12 flex-1 rounded-xl bg-red-500 text-white font-black text-[10px] uppercase tracking-widest hover:bg-red-600 shadow-xl shadow-red-500/20"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
