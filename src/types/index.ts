export type ApplicationStatus =
  | 'Saved' | 'Preparing' | 'Applied' | 'OA' | 'Recruiter Screen' | 'Phone Screen'
  | 'Hiring Manager' | 'Technical Interview' | 'Case Study' | 'Panel Interview'
  | 'Final Round' | 'Offer' | 'Accepted' | 'Rejected' | 'Ghosted' | 'Withdrawn'

export type QuestionStatus = 'Not Started' | 'Needs Work' | 'In Progress' | 'Confident'
export type Priority = 'Low' | 'Medium' | 'High'
export type WorkMode = 'Remote' | 'Hybrid' | 'Onsite'
export type Difficulty = 'Easy' | 'Medium' | 'Hard'
export type TabId = 'dashboard' | 'applications' | 'resumes' | 'roadmap' | 'questions' | 'timetable' | 'suggestions' | 'admin'
export type ApplicationSource = 'LinkedIn' | 'Company Site' | 'Indeed' | 'Referral' | 'Recruiter' | 'Handshake' | 'AngelList' | 'Glassdoor' | 'Other'
export type CompanyType = 'Startup' | 'Mid-size' | 'Enterprise' | 'Government' | 'Nonprofit'
export type TargetType = 'Dream' | 'Stretch' | 'Realistic' | 'Backup'

export interface DashboardFilter {
  status?: string
  priority?: string
  source?: string
  needsAttention?: boolean
  openForm?: boolean
}

export interface StatusHistoryEntry {
  status: ApplicationStatus
  date: string
  note?: string
}

export interface Application {
  id: number
  company: string
  role: string
  roleCategory: string
  customRoleTag: string
  department: string
  jobLink: string
  source: ApplicationSource
  location: string
  workMode: WorkMode
  salaryRange: string
  dateSaved: string
  dateApplied: string
  lastStatusUpdate: string
  status: ApplicationStatus
  resumeVersion: string
  coverLetter: string
  contactName: string
  contactEmail: string
  referral: boolean
  referralStatus: string
  priority: Priority
  followUpDate: string
  interviewDate: string
  rejectionReason: string
  notes: string
  outcomeNotes: string
  confidenceLevel: number
  companyType: CompanyType
  targetType: TargetType
  statusHistory: StatusHistoryEntry[]
}

export interface ResumeVersion {
  id: number
  name: string
  targetAudience: string
  description: string
  skillsEmphasized: string[]
  roleType: string
  link: string
  createdAt: string
  /** Resume Intelligence additions */
  resumeText?: string
  atsScore?: number
  isTailored?: boolean
  sourceVersionId?: number
  jobDescriptionId?: number
}

/* ── Resume Intelligence Types ── */

export interface SavedJobDescription {
  id: number
  title: string
  company: string
  location: string
  workMode: string
  rawText: string
  salaryRange: string
  yearsRequired: number | null
  requiredSkills: string[]
  preferredSkills: string[]
  tools: string[]
  createdAt: string
}

export type TailoringStatus = 'draft' | 'applied' | 'saved'

export interface TailoringSession {
  id: number
  originalResumeId: number
  jobDescriptionId: number
  originalText: string
  tailoredText: string
  originalScore: number
  tailoredScore: number
  status: TailoringStatus
  applicationId?: number
  createdAt: string
  name: string
}

export interface RoadmapWeek {
  id: number
  week: number
  title: string
  theme: string
  topics: string
  tasks: string[]
  completedTasks: number[]
  estimatedHours: number
  completed: boolean
  notes: string
}

export interface Question {
  id: number
  category: string
  difficulty: Difficulty
  question: string
  sampleAnswer: string
  notes: string
  status: QuestionStatus
  lastPracticed: string | null
  starred: boolean
}

export interface Profile {
  fullName: string
  email: string
  education: string
  field: string
  experienceYears: number
  currentStatus: string
  targetRoles: string[]
  preferredIndustries: string[]
  preferredLocations: string[]
  workMode: string
  searchStartDate: string
  weeklyAppTarget: number
  monthlyInterviewTarget: number
  dreamCompanies: string[]
  courses: string[]
  weeklyStudyHours: number
  skillsToImprove: string[]
  interviewConfidence: number
  resumeReadiness: number
  linkedIn: string
  portfolio: string
  github: string
  onboarded: boolean
  activeDomain?: string
}

export interface TimetableBlock {
  type: string
  time: string
  task: string
  hours: [number, number]
}

export interface SuggestionTip {
  priority: 'high' | 'medium' | 'low'
  icon: string
  title: string
  body: string
  action?: string
}
