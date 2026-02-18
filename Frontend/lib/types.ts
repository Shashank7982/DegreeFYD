export type UserRole = "admin" | "student"

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
}

export interface AuthResponse {
  token: string
  user: User
}

export interface Course {
  id: string
  name: string
  duration: string
  fees: number
  seats: number
  description: string
  eligibility: string
}

export interface FeeStructure {
  courseId: string
  courseName: string
  tuition: number
  hostel: number
  other: number
  total: number
}

export interface PlacementStats {
  percentage: number
  averagePackage: number
  highestPackage: number
  topRecruiters: string[]
  yearWiseData: { year: string; percentage: number; avgPackage: number }[]
}

export interface EligibilityCriteria {
  courseId: string
  courseName: string
  entranceExams: string[]
  criteria: string
}

export interface College {
  id: string
  _id?: string
  slug: string
  name: string
  description: string
  shortDescription: string
  image: string
  logo: string
  location: string
  city: string
  state: string
  established: number
  type: "Public" | "Private" | "Deemed"
  accreditation: string
  rating: number
  ranking: number
  status: "published" | "draft"
  facilities: string[]
  courses: Course[]
  feeStructure: FeeStructure[]
  placement: PlacementStats
  eligibility: EligibilityCriteria[]
  createdAt: string
  updatedAt: string
}

export interface CollegeListParams {
  search?: string
  city?: string[]
  type?: string[]
  minFee?: number
  maxFee?: number
  sort?: "ranking" | "fees-low" | "fees-high" | "placement" | "rating"
  page?: number
  limit?: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  totalPages: number
}

export interface DashboardStats {
  totalColleges: number
  published: number
  drafts: number
  totalCourses: number
}
