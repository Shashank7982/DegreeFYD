"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Save, PlusCircle, X, ArrowLeft, Zap, Sparkles, Activity, Globe, BookOpen, GraduationCap, DollarSign, TrendingUp, ShieldCheck } from "lucide-react"
import type { College, Course, FeeStructure, EligibilityCriteria } from "@/lib/types"
import { createCollege, updateCollege } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface CollegeFormProps {
  college?: College | null
  mode: "create" | "edit"
}

const emptyFee: FeeStructure = {
  courseId: "",
  courseName: "",
  tuition: 0,
  hostel: 0,
  other: 0,
  total: 0,
}

const emptyCourse: Course = {
  id: "",
  name: "",
  duration: "",
  fees: 0,
  seats: 0,
  description: "",
  eligibility: "",
}

const emptyEligibility: EligibilityCriteria = {
  courseId: "",
  courseName: "",
  entranceExams: [],
  criteria: "",
}

export function CollegeForm({ college, mode }: CollegeFormProps) {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const isEdit = mode === "edit"

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Overview
  const [name, setName] = useState(college?.name || "")
  const [shortDescription, setShortDescription] = useState(
    college?.shortDescription || ""
  )
  const [description, setDescription] = useState(college?.description || "")
  const [city, setCity] = useState(college?.city || "")
  const [state, setState] = useState(college?.state || "")
  const [location, setLocation] = useState(college?.location || "")
  const [type, setType] = useState<"Public" | "Private" | "Deemed">(
    college?.type || "Private"
  )
  const [established, setEstablished] = useState(
    String(college?.established || new Date().getFullYear())
  )
  const [accreditation, setAccreditation] = useState(
    college?.accreditation || ""
  )
  const [rating, setRating] = useState(String(college?.rating || ""))
  const [ranking, setRanking] = useState(String(college?.ranking || ""))
  const [status, setStatus] = useState<"published" | "draft">(
    college?.status || "draft"
  )
  const [facilityInput, setFacilityInput] = useState("")
  const [facilities, setFacilities] = useState<string[]>(
    college?.facilities || []
  )
  const [image, setImage] = useState(college?.image || "")
  const [logo, setLogo] = useState(college?.logo || "")

  // Courses
  const [courses, setCourses] = useState<Course[]>(college?.courses || [])

  // Fees
  const [feeStructure, setFeeStructure] = useState<FeeStructure[]>(
    college?.feeStructure || []
  )

  // Placement
  const [placementPercentage, setPlacementPercentage] = useState(
    String(college?.placement?.percentage || "")
  )
  const [avgPackage, setAvgPackage] = useState(
    String(college?.placement?.averagePackage || "")
  )
  const [highestPackage, setHighestPackage] = useState(
    String(college?.placement?.highestPackage || "")
  )
  const [recruiterInput, setRecruiterInput] = useState("")
  const [topRecruiters, setTopRecruiters] = useState<string[]>(
    college?.placement?.topRecruiters || []
  )

  // Eligibility
  const [eligibility, setEligibility] = useState<EligibilityCriteria[]>(
    college?.eligibility || []
  )

  function addFacility() {
    if (facilityInput.trim()) {
      setFacilities([...facilities, facilityInput.trim()])
      setFacilityInput("")
    }
  }

  function removeFacility(idx: number) {
    setFacilities(facilities.filter((_, i) => i !== idx))
  }

  function addCourse() {
    setCourses([...courses, { ...emptyCourse, id: String(Date.now()) }])
  }

  function updateCourse(idx: number, field: keyof Course, value: string | number) {
    const updated = [...courses]
    updated[idx] = { ...updated[idx], [field]: value }
    setCourses(updated)
  }

  function removeCourse(idx: number) {
    setCourses(courses.filter((_, i) => i !== idx))
  }

  function addFee() {
    setFeeStructure([...feeStructure, { ...emptyFee }])
  }

  function updateFee(idx: number, field: keyof FeeStructure, value: string | number) {
    const updated = [...feeStructure]
    updated[idx] = { ...updated[idx], [field]: value }
    if (field === "tuition" || field === "hostel" || field === "other") {
      updated[idx].total =
        Number(updated[idx].tuition) +
        Number(updated[idx].hostel) +
        Number(updated[idx].other)
    }
    setFeeStructure(updated)
  }

  function removeFee(idx: number) {
    setFeeStructure(feeStructure.filter((_, i) => i !== idx))
  }

  function addRecruiter() {
    if (recruiterInput.trim()) {
      setTopRecruiters([...topRecruiters, recruiterInput.trim()])
      setRecruiterInput("")
    }
  }

  function removeRecruiter(idx: number) {
    setTopRecruiters(topRecruiters.filter((_, i) => i !== idx))
  }

  function addEligibility() {
    setEligibility([...eligibility, { ...emptyEligibility }])
  }

  function updateEligibility(
    idx: number,
    field: keyof EligibilityCriteria,
    value: string | string[]
  ) {
    const updated = [...eligibility]
    updated[idx] = { ...updated[idx], [field]: value }
    setEligibility(updated)
  }

  function removeEligibility(idx: number) {
    setEligibility(eligibility.filter((_, i) => i !== idx))
  }

  async function handleSave() {
    if (!name.trim()) {
      toast.error("College name is required")
      return
    }

    setIsSaving(true)
    try {
      const payload: Partial<College> = {
        name,
        shortDescription,
        description,
        city,
        state,
        location: location || `${city}, ${state}`,
        type,
        established: Number(established),
        accreditation,
        rating: Number(rating),
        ranking: Number(ranking),
        status,
        facilities,
        image,
        logo,
        courses,
        feeStructure,
        placement: {
          percentage: Number(placementPercentage),
          averagePackage: Number(avgPackage),
          highestPackage: Number(highestPackage),
          topRecruiters,
          yearWiseData: college?.placement?.yearWiseData || [],
        },
        eligibility,
      }

      if (mode === "create") {
        await createCollege(payload)
        toast.success("College created successfully!")
      } else {
        await updateCollege(college!.id, payload)
        toast.success("College updated successfully!")
      }
      router.push("/admin/colleges")
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save college"
      )
    } finally {
      setIsSaving(false)
    }
  }

  if (!isMounted) return null

  return (
    <div className="space-y-8 pb-16">
      {/* Configuration Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border/50">
        <div className="flex items-start gap-5">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/admin/colleges")}
            className="h-11 w-11 rounded-xl bg-accent/40 border border-border/50 text-muted-foreground hover:text-foreground hover:bg-accent transition-all shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[9px] font-black uppercase tracking-[0.2em] text-primary">
              <Zap className="h-3.5 w-3.5" />
              College Settings
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-foreground">
              {isEdit ? "Modify" : "Add"} <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">College</span>
            </h1>
            <p className="text-muted-foreground font-medium max-w-lg text-sm">
              {isEdit
                ? `Updating information for ${college?.name}.`
                : "Enter the details for a new college to be added to the directory."}
            </p>
          </div>
        </div>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="h-12 px-6 rounded-xl bg-primary text-primary-foreground font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.05] active:scale-[0.98] transition-all"
        >
          {isSaving ? (
            <Activity className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {isEdit ? "Save Changes" : "Add College"}
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-8">
        <TabsList className="h-auto p-1 bg-muted/30 border border-border/50 backdrop-blur-xl rounded-xl inline-flex gap-1 overflow-x-auto max-w-full no-scrollbar">
          {[
            { value: "overview", label: "Overview", icon: ShieldCheck },
            { value: "courses", label: "Courses", icon: BookOpen },
            { value: "fees", label: "Fees", icon: DollarSign },
            { value: "placement", label: "Placement", icon: TrendingUp },
            { value: "eligibility", label: "Eligibility", icon: GraduationCap },
          ].map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="px-4 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all flex items-center gap-2"
            >
              <tab.icon className="h-3 w-3" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="bg-card/40 border-border/50 backdrop-blur-2xl rounded-[1.5rem] overflow-hidden">
            <CardHeader className="p-6 border-b border-border/50 bg-muted/20">
              <CardTitle className="text-lg font-black text-foreground tracking-tight">Basic Information</CardTitle>
              <CardDescription className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                Core details and descriptions
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid gap-8 md:grid-cols-2">
                <div className="space-y-2.5 md:col-span-2">
                  <Label htmlFor="name" className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">College Name *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Imperial Science Academy"
                    className="h-11 bg-background border-input rounded-xl text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:ring-0 transition-all text-sm"
                  />
                </div>
                <div className="space-y-2.5 md:col-span-2">
                  <Label htmlFor="shortDesc" className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Short Description</Label>
                  <Input
                    id="shortDesc"
                    value={shortDescription}
                    onChange={(e) => setShortDescription(e.target.value)}
                    placeholder="Brief architectural summary"
                    className="h-11 bg-background border-input rounded-xl text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:ring-0 transition-all text-sm"
                  />
                </div>
                <div className="space-y-3 md:col-span-2">
                  <Label htmlFor="desc" className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Full Description</Label>
                  <Textarea
                    id="desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={6}
                    placeholder="Complete institutional documentation..."
                    className="bg-background border-input rounded-2xl text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:ring-0 transition-all resize-none p-4"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/40 border-border/50 backdrop-blur-2xl rounded-[1.5rem] overflow-hidden">
            <CardHeader className="p-6 border-b border-border/50 bg-muted/20">
              <CardTitle className="text-xl font-black text-foreground tracking-tight">Location & Type</CardTitle>
              <CardDescription className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Geographic details and institutional classification
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-3">
                  <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">City</Label>
                  <Input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Neo Tokyo"
                    className="h-11 bg-background border-input rounded-xl text-foreground focus:border-primary/50"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">State</Label>
                  <Input
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="e.g. Kanto Sector"
                    className="h-11 bg-white/5 border-white/10 rounded-xl text-white focus:border-primary/50"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Full Address</Label>
                  <Input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Complete Positional Data"
                    className="h-11 bg-white/5 border-white/10 rounded-xl text-white focus:border-primary/50"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">College Type</Label>
                  <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
                    <SelectTrigger className="h-11 bg-background border-input rounded-xl text-foreground focus:border-primary/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border text-popover-foreground">
                      <SelectItem value="Public">Public College</SelectItem>
                      <SelectItem value="Private">Private College</SelectItem>
                      <SelectItem value="Deemed">Deemed University</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Established Year</Label>
                  <Input
                    type="number"
                    value={established}
                    onChange={(e) => setEstablished(e.target.value)}
                    className="h-11 bg-white/5 border-white/10 rounded-xl text-white focus:border-primary/50"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Accreditation</Label>
                  <Input
                    value={accreditation}
                    onChange={(e) => setAccreditation(e.target.value)}
                    placeholder="NAAC Rank S"
                    className="h-11 bg-white/5 border-white/10 rounded-xl text-white focus:border-primary/50"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Rating (Max 5.0)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={rating}
                    onChange={(e) => setRating(e.target.value)}
                    className="h-11 bg-white/5 border-white/10 rounded-xl text-white focus:border-primary/50"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Ranking</Label>
                  <Input
                    type="number"
                    value={ranking}
                    onChange={(e) => setRanking(e.target.value)}
                    className="h-11 bg-white/5 border-white/10 rounded-xl text-white focus:border-primary/50"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Status</Label>
                  <Select
                    value={status}
                    onValueChange={(v) => setStatus(v as typeof status)}
                  >
                    <SelectTrigger className="h-11 bg-white/5 border-white/10 rounded-xl text-white focus:border-primary/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/10 text-white">
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/40 border-border/50 backdrop-blur-2xl rounded-[1.5rem] overflow-hidden">
            <CardHeader className="p-6 border-b border-border/50 bg-muted/20">
              <CardTitle className="text-xl font-black text-foreground tracking-tight">Visuals & Facilities</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid gap-8 sm:grid-cols-2">
                <div className="space-y-3">
                  <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Cover Image URL</Label>
                  <Input
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    placeholder="https://cloud.storage/env.jpg"
                    className="h-11 bg-white/5 border-white/10 rounded-xl text-white focus:border-primary/50"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Logo URL</Label>
                  <Input
                    value={logo}
                    onChange={(e) => setLogo(e.target.value)}
                    placeholder="https://cloud.storage/logo.png"
                    className="h-11 bg-white/5 border-white/10 rounded-xl text-white focus:border-primary/50"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Facilities</Label>
                <div className="flex gap-4">
                  <Input
                    value={facilityInput}
                    onChange={(e) => setFacilityInput(e.target.value)}
                    placeholder="Add facility..."
                    className="h-11 bg-white/5 border-white/10 rounded-xl text-white focus:border-primary/50"
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addFacility())}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addFacility}
                    className="h-11 w-11 rounded-xl bg-background border-input text-primary hover:bg-accent shrink-0"
                  >
                    <PlusCircle className="h-6 w-6" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  {facilities.map((f, i) => (
                    <Badge key={i} className="h-9 px-4 rounded-xl bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-all gap-2 group">
                      <span className="text-[10px] font-black uppercase tracking-widest">{f}</span>
                      <button onClick={() => removeFacility(i)} className="opacity-40 group-hover:opacity-100 transition-opacity">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* COURSES TAB */}
        <TabsContent value="courses" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between px-2">
            <div className="space-y-1">
              <h3 className="text-lg font-black text-foreground tracking-tight">Course List</h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                {courses.length} active courses
              </p>
            </div>
            <Button onClick={addCourse} className="h-12 px-6 rounded-xl bg-primary/10 border border-primary/20 text-primary font-black text-[10px] uppercase tracking-widest hover:bg-primary/20 transition-all">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Course
            </Button>
          </div>

          <div className="grid gap-6">
            {courses.map((course, idx) => (
              <Card key={course.id || idx} className="bg-card/40 border-border/50 backdrop-blur-2xl rounded-[1.5rem] overflow-hidden group">
                <CardHeader className="flex flex-row items-center justify-between p-6 border-b border-border/50 bg-muted/20">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                      <BookOpen className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-black text-foreground tracking-tight">
                        {course.name || `Unnamed Module ${idx + 1}`}
                      </CardTitle>
                      <CardDescription className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Course ID: {course.id || 'Pending'}</CardDescription>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-xl text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all"
                    onClick={() => removeCourse(idx)}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="space-y-3 sm:col-span-2 lg:col-span-3">
                      <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Course Name</Label>
                      <Input
                        value={course.name}
                        onChange={(e) => updateCourse(idx, "name", e.target.value)}
                        placeholder="e.g. B.Tech Computer Science"
                        className="h-12 bg-white/5 border-white/10 rounded-xl text-white focus:border-primary/50"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Duration</Label>
                      <Input
                        value={course.duration}
                        onChange={(e) => updateCourse(idx, "duration", e.target.value)}
                        placeholder="4 Years"
                        className="h-12 bg-white/5 border-white/10 rounded-xl text-white focus:border-primary/50"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Resource Value (Annual Fees)</Label>
                      <Input
                        type="number"
                        value={course.fees || ""}
                        onChange={(e) =>
                          updateCourse(idx, "fees", Number(e.target.value))
                        }
                        className="h-12 bg-white/5 border-white/10 rounded-xl text-white focus:border-primary/50"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Node Capacity (Seats)</Label>
                      <Input
                        type="number"
                        value={course.seats || ""}
                        onChange={(e) =>
                          updateCourse(idx, "seats", Number(e.target.value))
                        }
                        className="h-12 bg-white/5 border-white/10 rounded-xl text-white focus:border-primary/50"
                      />
                    </div>
                    <div className="space-y-3 sm:col-span-2 lg:col-span-3">
                      <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Description</Label>
                      <Textarea
                        value={course.description}
                        onChange={(e) =>
                          updateCourse(idx, "description", e.target.value)
                        }
                        rows={2}
                        className="bg-background border-input rounded-xl text-foreground focus:border-primary/50 resize-none p-3"
                      />
                    </div>
                    <div className="space-y-3 sm:col-span-2 lg:col-span-3">
                      <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Eligibility Criteria</Label>
                      <Input
                        value={course.eligibility}
                        onChange={(e) =>
                          updateCourse(idx, "eligibility", e.target.value)
                        }
                        placeholder="10+2 with 75% in PCM"
                        className="h-12 bg-white/5 border-white/10 rounded-xl text-white focus:border-primary/50"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {courses.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 bg-card/20 rounded-[2rem] border border-dashed border-border/50 text-center space-y-4">
              <Activity className="h-12 w-12 text-muted-foreground animate-pulse" />
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">No Courses Added</p>
              <Button variant="outline" className="h-12 px-8 rounded-xl bg-background border-input text-foreground font-black text-[10px] uppercase tracking-widest hover:bg-accent mt-4" onClick={addCourse}>
                Add First Course
              </Button>
            </div>
          )}
        </TabsContent>

        {/* FEES TAB */}
        <TabsContent value="fees" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between px-2">
            <div className="space-y-1">
              <h3 className="text-lg font-black text-foreground tracking-tight">Fee Structure</h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                {feeStructure.length} fee records listed
              </p>
            </div>
            <Button onClick={addFee} className="h-12 px-6 rounded-xl bg-primary/10 border border-primary/20 text-primary font-black text-[10px] uppercase tracking-widest hover:bg-primary/20 transition-all">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Fee Record
            </Button>
          </div>

          <div className="grid gap-6">
            {feeStructure.map((fee, idx) => (
              <Card key={idx} className="bg-card/40 border-border/50 backdrop-blur-2xl rounded-[2rem] overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between p-6 border-b border-border/50 bg-muted/20">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                      <DollarSign className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-base font-black text-foreground tracking-tight">
                      {fee.courseName || `Fee Record ${idx + 1}`}
                    </CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-xl text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all"
                    onClick={() => removeFee(idx)}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-3 sm:col-span-2 lg:col-span-4">
                      <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Course Name</Label>
                      <Input
                        value={fee.courseName}
                        onChange={(e) => updateFee(idx, "courseName", e.target.value)}
                        placeholder="B.Tech CS"
                        className="h-12 bg-white/5 border-white/10 rounded-xl text-white focus:border-primary/50"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Tuition Fees</Label>
                      <Input
                        type="number"
                        value={fee.tuition || ""}
                        onChange={(e) =>
                          updateFee(idx, "tuition", Number(e.target.value))
                        }
                        className="h-12 bg-white/5 border-white/10 rounded-xl text-white focus:border-primary/50"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Hostel Fees</Label>
                      <Input
                        type="number"
                        value={fee.hostel || ""}
                        onChange={(e) =>
                          updateFee(idx, "hostel", Number(e.target.value))
                        }
                        className="h-12 bg-white/5 border-white/10 rounded-xl text-white focus:border-primary/50"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Secondary Costs</Label>
                      <Input
                        type="number"
                        value={fee.other || ""}
                        onChange={(e) =>
                          updateFee(idx, "other", Number(e.target.value))
                        }
                        className="h-12 bg-white/5 border-white/10 rounded-xl text-white focus:border-primary/50"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Total Amount</Label>
                      <div className="h-12 bg-primary/10 border border-primary/30 rounded-xl flex items-center px-4 text-primary font-black text-sm">
                        {fee.total || 0}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {feeStructure.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 bg-card/20 rounded-[2rem] border border-dashed border-border/50 text-center space-y-4">
              <DollarSign className="h-12 w-12 text-muted-foreground animate-pulse" />
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">No Fee Records Added</p>
              <Button onClick={addFee} className="h-12 px-8 rounded-xl bg-background border-input text-foreground font-black text-[10px] uppercase tracking-widest hover:bg-accent mt-4">
                Add First Fee Record
              </Button>
            </div>
          )}
        </TabsContent>

        {/* PLACEMENT TAB */}
        <TabsContent value="placement" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="bg-card/40 border-border/50 backdrop-blur-2xl rounded-[1.5rem] overflow-hidden">
            <CardHeader className="p-6 border-b border-border/50 bg-muted/20">
              <CardTitle className="text-xl font-black text-foreground tracking-tight">Basic Terminologies</CardTitle>
              <CardDescription className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Core placement metrics and statistics
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid gap-8 sm:grid-cols-3">
                <div className="space-y-3">
                  <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Placement Percentage (%) </Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={placementPercentage}
                    onChange={(e) => setPlacementPercentage(e.target.value)}
                    placeholder="92"
                    className="h-11 bg-white/5 border-white/10 rounded-xl text-white focus:border-primary/50"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Average Package (LPA)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={avgPackage}
                    onChange={(e) => setAvgPackage(e.target.value)}
                    placeholder="12.5"
                    className="h-11 bg-white/5 border-white/10 rounded-xl text-white focus:border-primary/50"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Highest Package (LPA)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={highestPackage}
                    onChange={(e) => setHighestPackage(e.target.value)}
                    placeholder="42"
                    className="h-11 bg-white/5 border-white/10 rounded-xl text-white focus:border-primary/50"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/40 border-border/50 backdrop-blur-2xl rounded-[1.5rem] overflow-hidden">
            <CardHeader className="p-6 border-b border-border/50 bg-muted/20">
              <CardTitle className="text-xl font-black text-foreground tracking-tight">Top Recruiters</CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="flex gap-4">
                <Input
                  value={recruiterInput}
                  onChange={(e) => setRecruiterInput(e.target.value)}
                  placeholder="Add company name..."
                  className="h-11 bg-white/5 border-white/10 rounded-xl text-white focus:border-primary/50"
                  onKeyDown={(e) =>
                    e.key === "Enter" && (e.preventDefault(), addRecruiter())
                  }
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={addRecruiter}
                  className="h-11 w-11 rounded-xl bg-background border-input text-primary hover:bg-accent shrink-0"
                >
                  <PlusCircle className="h-6 w-6" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                {topRecruiters.map((r, i) => (
                  <Badge key={i} className="h-9 px-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-all gap-2 group">
                    <span className="text-[10px] font-black uppercase tracking-widest">{r}</span>
                    <button onClick={() => removeRecruiter(i)} className="opacity-40 group-hover:opacity-100 transition-opacity">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ELIGIBILITY TAB */}
        <TabsContent value="eligibility" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between px-2">
            <div className="space-y-1">
              <h3 className="text-lg font-black text-foreground tracking-tight">Eligibility Criteria</h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                {eligibility.length} eligibility records active
              </p>
            </div>
            <Button onClick={addEligibility} className="h-12 px-6 rounded-xl bg-primary/10 border border-primary/20 text-primary font-black text-[10px] uppercase tracking-widest hover:bg-primary/20 transition-all">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Eligibility
            </Button>
          </div>

          <div className="grid gap-6">
            {eligibility.map((elig, idx) => (
              <Card key={idx} className="bg-card/40 border-border/50 backdrop-blur-2xl rounded-[2rem] overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between p-6 border-b border-border/50 bg-muted/20">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                      <GraduationCap className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-base font-black text-foreground tracking-tight">
                      {elig.courseName || `Eligibility Record ${idx + 1}`}
                    </CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-xl text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all"
                    onClick={() => removeEligibility(idx)}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid gap-8 sm:grid-cols-2">
                    <div className="space-y-3">
                      <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Course Name</Label>
                      <Input
                        value={elig.courseName}
                        onChange={(e) =>
                          updateEligibility(idx, "courseName", e.target.value)
                        }
                        placeholder="B.Tech CS"
                        className="h-12 bg-white/5 border-white/10 rounded-xl text-white focus:border-primary/50"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Entrance Exams (Comma separated)</Label>
                      <Input
                        value={elig.entranceExams.join(", ")}
                        onChange={(e) =>
                          updateEligibility(
                            idx,
                            "entranceExams",
                            e.target.value.split(",").map((s) => s.trim())
                          )
                        }
                        placeholder="JEE Main, JEE Advanced"
                        className="h-12 bg-white/5 border-white/10 rounded-xl text-white focus:border-primary/50"
                      />
                    </div>
                    <div className="space-y-3 sm:col-span-2">
                      <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Criteria Description</Label>
                      <Textarea
                        value={elig.criteria}
                        onChange={(e) =>
                          updateEligibility(idx, "criteria", e.target.value)
                        }
                        rows={3}
                        placeholder="Minimum 75% system performance required..."
                        className="bg-background border-input rounded-xl text-foreground focus:border-primary/50 resize-none p-3"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {eligibility.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 bg-card/20 rounded-[2rem] border border-dashed border-border/50 text-center space-y-4">
              <GraduationCap className="h-12 w-12 text-muted-foreground animate-pulse" />
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">No Eligibility Rules Added</p>
              <Button onClick={addEligibility} className="h-12 px-8 rounded-xl bg-background border-input text-foreground font-black text-[10px] uppercase tracking-widest hover:bg-accent mt-4">
                Add First Eligibility
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
