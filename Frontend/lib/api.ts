import type {
  AuthResponse,
  College,
  CollegeListParams,
  DashboardStats,
  PaginatedResponse,
} from "./types"
import { getToken } from "./auth"
import { mockColleges, mockDashboardStats, mockUsers } from "./mock-data"

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api"
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_DATA !== "false"

async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken()
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  }
  if (token) {
    ; (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`
  }
  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Request failed" }))
    throw new Error(error.message || `HTTP ${res.status}`)
  }
  return res.json()
}

// ---- AUTH ----

export async function login(
  email: string,
  password: string
): Promise<AuthResponse> {
  if (USE_MOCK) {
    await delay(500)
    const found = mockUsers.find(
      (u) => u.user.email === email && u.password === password
    )
    if (!found) throw new Error("Invalid email or password")
    return { token: "mock-jwt-token-" + found.user.id, user: found.user }
  }
  return apiFetch<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  })
}

export async function signup(data: {
  name: string
  email: string
  password: string
  role: string
}): Promise<AuthResponse> {
  if (USE_MOCK) {
    await delay(500)
    const newUser = {
      id: String(Date.now()),
      name: data.name,
      email: data.email,
      role: data.role as "admin" | "student",
    }
    return { token: "mock-jwt-token-" + newUser.id, user: newUser }
  }
  return apiFetch<AuthResponse>("/auth/signup", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

// ---- COLLEGES (Public) ----

export async function getColleges(
  params: CollegeListParams = {}
): Promise<PaginatedResponse<College>> {
  if (USE_MOCK) {
    await delay(300)
    let filtered = [...mockColleges].filter((c) => c.status === "published")

    if (params.search) {
      const q = params.search.toLowerCase()
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.city.toLowerCase().includes(q) ||
          c.state.toLowerCase().includes(q)
      )
    }
    if (params.city?.length) {
      filtered = filtered.filter((c) =>
        params.city!.some(
          (city) => c.city.toLowerCase() === city.toLowerCase()
        )
      )
    }
    if (params.type?.length) {
      filtered = filtered.filter((c) =>
        params.type!.some((t) => c.type.toLowerCase() === t.toLowerCase())
      )
    }
    if (params.minFee !== undefined) {
      filtered = filtered.filter((c) =>
        c.courses.some((course) => course.fees >= params.minFee!)
      )
    }
    if (params.maxFee !== undefined) {
      filtered = filtered.filter((c) =>
        c.courses.some((course) => course.fees <= params.maxFee!)
      )
    }

    switch (params.sort) {
      case "ranking":
        filtered.sort((a, b) => a.ranking - b.ranking)
        break
      case "fees-low":
        filtered.sort(
          (a, b) =>
            Math.min(...a.courses.map((c) => c.fees)) -
            Math.min(...b.courses.map((c) => c.fees))
        )
        break
      case "fees-high":
        filtered.sort(
          (a, b) =>
            Math.min(...b.courses.map((c) => c.fees)) -
            Math.min(...a.courses.map((c) => c.fees))
        )
        break
      case "placement":
        filtered.sort(
          (a, b) => b.placement.percentage - a.placement.percentage
        )
        break
      case "rating":
        filtered.sort((a, b) => b.rating - a.rating)
        break
      default:
        filtered.sort((a, b) => a.ranking - b.ranking)
    }

    const page = params.page || 1
    const limit = params.limit || 6
    const start = (page - 1) * limit
    const paged = filtered.slice(start, start + limit)

    return {
      data: paged,
      total: filtered.length,
      page,
      totalPages: Math.ceil(filtered.length / limit),
    }
  }

  const searchParams = new URLSearchParams()
  if (params.search) searchParams.set("search", params.search)
  if (params.city?.length) searchParams.set("city", params.city.join(","))
  if (params.type?.length) searchParams.set("type", params.type.join(","))
  if (params.minFee !== undefined)
    searchParams.set("minFee", String(params.minFee))
  if (params.maxFee !== undefined)
    searchParams.set("maxFee", String(params.maxFee))
  if (params.sort) searchParams.set("sort", params.sort)
  if (params.page) searchParams.set("page", String(params.page))
  if (params.limit) searchParams.set("limit", String(params.limit))

  return apiFetch<PaginatedResponse<College>>(
    `/colleges?${searchParams.toString()}`
  )
}

export async function getCollegeBySlug(
  slug: string
): Promise<College | null> {
  if (USE_MOCK) {
    await delay(300)
    return mockColleges.find((c) => c.slug === slug) || null
  }
  return apiFetch<College>(`/colleges/${slug}`)
}

// ---- COLLEGES (Admin) ----

export async function getAllCollegesAdmin(): Promise<College[]> {
  if (USE_MOCK) {
    await delay(300)
    return [...mockColleges]
  }
  return apiFetch<College[]>("/colleges/admin/all")
}

export async function getCollegeById(id: string): Promise<College | null> {
  if (USE_MOCK) {
    await delay(200)
    return mockColleges.find((c) => c.id === id) || null
  }
  return apiFetch<College>(`/colleges/admin/${id}`)
}

export async function createCollege(
  data: Partial<College>
): Promise<College> {
  if (USE_MOCK) {
    await delay(500)
    const newCollege: College = {
      id: String(Date.now()),
      slug: data.name?.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") || "new-college",
      name: data.name || "New College",
      description: data.description || "",
      shortDescription: data.shortDescription || "",
      image: data.image || "",
      logo: data.logo || "",
      location: data.location || "",
      city: data.city || "",
      state: data.state || "",
      established: data.established || 2024,
      type: data.type || "Private",
      accreditation: data.accreditation || "",
      rating: data.rating || 0,
      ranking: data.ranking || 0,
      status: data.status || "draft",
      facilities: data.facilities || [],
      courses: data.courses || [],
      feeStructure: data.feeStructure || [],
      placement: data.placement || {
        percentage: 0,
        averagePackage: 0,
        highestPackage: 0,
        topRecruiters: [],
        yearWiseData: [],
      },
      eligibility: data.eligibility || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    mockColleges.push(newCollege)
    return newCollege
  }
  return apiFetch<College>("/colleges", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function updateCollege(
  id: string,
  data: Partial<College>
): Promise<College> {
  if (USE_MOCK) {
    await delay(500)
    const idx = mockColleges.findIndex((c) => c.id === id)
    if (idx === -1) throw new Error("College not found")
    const updated = { ...mockColleges[idx], ...data, updatedAt: new Date().toISOString() }
    mockColleges[idx] = updated
    return updated
  }
  const targetId = id;
  return apiFetch<College>(`/colleges/${targetId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  })
}

export async function deleteCollege(id: string): Promise<void> {
  if (USE_MOCK) {
    await delay(300)
    const idx = mockColleges.findIndex((c) => c.id === id)
    if (idx !== -1) mockColleges.splice(idx, 1)
    return
  }
  const targetId = id;
  await apiFetch(`/colleges/${targetId}`, { method: "DELETE" })
}

export async function toggleCollegeStatus(
  id: string
): Promise<College> {
  if (USE_MOCK) {
    await delay(300)
    const college = mockColleges.find((c) => c.id === id)
    if (!college) throw new Error("College not found")
    college.status = college.status === "published" ? "draft" : "published"
    return college
  }
  const targetId = id;
  return apiFetch<College>(`/colleges/${targetId}/status`, { method: "PATCH" })
}

// ---- DASHBOARD ----

export async function getDashboardStats(): Promise<DashboardStats> {
  if (USE_MOCK) {
    await delay(200)
    return {
      ...mockDashboardStats,
      totalColleges: mockColleges.length,
      published: mockColleges.filter((c) => c.status === "published").length,
      drafts: mockColleges.filter((c) => c.status === "draft").length,
      totalCourses: mockColleges.reduce((sum, c) => sum + c.courses.length, 0),
    }
  }
  return apiFetch<DashboardStats>("/dashboard/stats")
}

// ---- HELPERS ----

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
