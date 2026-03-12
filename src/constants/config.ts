import type { ApplicationStatus, TabId, ApplicationSource, CompanyType, TargetType } from '../types'

export const STATUS_LIST: ApplicationStatus[] = [
  'Saved', 'Preparing', 'Applied', 'OA', 'Recruiter Screen', 'Phone Screen',
  'Hiring Manager', 'Technical Interview', 'Case Study', 'Panel Interview',
  'Final Round', 'Offer', 'Accepted', 'Rejected', 'Ghosted', 'Withdrawn'
]

export const STATUS_COLORS: Record<ApplicationStatus, { bg: string; text: string; dot: string; darkBg: string; darkText: string }> = {
  Saved:                { bg: 'bg-slate-100',    text: 'text-slate-700',   dot: 'bg-slate-400',    darkBg: 'dark:bg-slate-800',       darkText: 'dark:text-slate-300' },
  Preparing:            { bg: 'bg-indigo-50',    text: 'text-indigo-700',  dot: 'bg-indigo-400',   darkBg: 'dark:bg-indigo-900/40',   darkText: 'dark:text-indigo-300' },
  Applied:              { bg: 'bg-blue-50',      text: 'text-blue-700',    dot: 'bg-blue-500',     darkBg: 'dark:bg-blue-900/40',     darkText: 'dark:text-blue-300' },
  OA:                   { bg: 'bg-violet-50',    text: 'text-violet-700',  dot: 'bg-violet-500',   darkBg: 'dark:bg-violet-900/40',   darkText: 'dark:text-violet-300' },
  'Recruiter Screen':   { bg: 'bg-cyan-50',      text: 'text-cyan-700',    dot: 'bg-cyan-500',     darkBg: 'dark:bg-cyan-900/40',     darkText: 'dark:text-cyan-300' },
  'Phone Screen':       { bg: 'bg-yellow-50',    text: 'text-yellow-700',  dot: 'bg-yellow-500',   darkBg: 'dark:bg-yellow-900/40',   darkText: 'dark:text-yellow-300' },
  'Hiring Manager':     { bg: 'bg-amber-50',     text: 'text-amber-700',   dot: 'bg-amber-500',    darkBg: 'dark:bg-amber-900/40',    darkText: 'dark:text-amber-300' },
  'Technical Interview':{ bg: 'bg-orange-50',    text: 'text-orange-700',  dot: 'bg-orange-500',   darkBg: 'dark:bg-orange-900/40',   darkText: 'dark:text-orange-300' },
  'Case Study':         { bg: 'bg-rose-50',      text: 'text-rose-700',    dot: 'bg-rose-500',     darkBg: 'dark:bg-rose-900/40',     darkText: 'dark:text-rose-300' },
  'Panel Interview':    { bg: 'bg-fuchsia-50',   text: 'text-fuchsia-700', dot: 'bg-fuchsia-500',  darkBg: 'dark:bg-fuchsia-900/40',  darkText: 'dark:text-fuchsia-300' },
  'Final Round':        { bg: 'bg-pink-50',      text: 'text-pink-700',    dot: 'bg-pink-500',     darkBg: 'dark:bg-pink-900/40',     darkText: 'dark:text-pink-300' },
  Offer:                { bg: 'bg-emerald-50',   text: 'text-emerald-700', dot: 'bg-emerald-500',  darkBg: 'dark:bg-emerald-900/40',  darkText: 'dark:text-emerald-300' },
  Accepted:             { bg: 'bg-green-50',     text: 'text-green-700',   dot: 'bg-green-600',    darkBg: 'dark:bg-green-900/40',    darkText: 'dark:text-green-300' },
  Rejected:             { bg: 'bg-red-50',       text: 'text-red-700',     dot: 'bg-red-400',      darkBg: 'dark:bg-red-900/40',      darkText: 'dark:text-red-300' },
  Ghosted:              { bg: 'bg-gray-50',      text: 'text-gray-500',    dot: 'bg-gray-300',     darkBg: 'dark:bg-gray-800',        darkText: 'dark:text-gray-400' },
  Withdrawn:            { bg: 'bg-stone-50',     text: 'text-stone-600',   dot: 'bg-stone-400',    darkBg: 'dark:bg-stone-800',       darkText: 'dark:text-stone-300' },
}

export const PIPELINE_STAGES: ApplicationStatus[] = [
  'Applied', 'OA', 'Recruiter Screen', 'Phone Screen', 'Hiring Manager',
  'Technical Interview', 'Case Study', 'Panel Interview', 'Final Round', 'Offer'
]

export const INTERVIEW_STAGES: ApplicationStatus[] = [
  'Phone Screen', 'Hiring Manager', 'Technical Interview', 'Case Study',
  'Panel Interview', 'Final Round'
]

export const TERMINAL_STATUSES: ApplicationStatus[] = ['Accepted', 'Rejected', 'Ghosted', 'Withdrawn']

export const SOURCE_LIST: ApplicationSource[] = [
  'LinkedIn', 'Company Site', 'Indeed', 'Referral', 'Recruiter', 'Handshake', 'AngelList', 'Glassdoor', 'Other'
]

export const COMPANY_TYPES: CompanyType[] = ['Startup', 'Mid-size', 'Enterprise', 'Government', 'Nonprofit']
export const TARGET_TYPES: TargetType[] = ['Dream', 'Stretch', 'Realistic', 'Backup']

/** Maps of role titles → normalized category */
export const ROLE_CATEGORY_MAP: Record<string, string> = {
  'data analyst': 'Data Analyst', 'business data analyst': 'Data Analyst', 'analytics engineer': 'Data Analyst',
  'data scientist': 'Data Scientist', 'applied scientist': 'Data Scientist', 'research scientist': 'Data Scientist', 'quantitative researcher': 'Data Scientist',
  'ml engineer': 'ML Engineer', 'machine learning engineer': 'ML Engineer', 'ai engineer': 'ML Engineer',
  'genai engineer': 'GenAI Engineer', 'llm engineer': 'GenAI Engineer', 'prompt engineer': 'GenAI Engineer', 'applied ai scientist': 'GenAI Engineer', 'ai safety engineer': 'GenAI Engineer',
  'software engineer': 'Software Engineer', 'sde': 'Software Engineer', 'software developer': 'Software Engineer',
  'frontend engineer': 'Frontend Engineer', 'ui engineer': 'Frontend Engineer', 'react developer': 'Frontend Engineer',
  'backend engineer': 'Backend Engineer', 'systems engineer': 'Backend Engineer', 'platform engineer': 'Backend Engineer', 'infrastructure engineer': 'Backend Engineer',
  'full-stack engineer': 'Full-Stack Engineer', 'full stack engineer': 'Full-Stack Engineer', 'product engineer': 'Full-Stack Engineer', 'full-stack developer': 'Full-Stack Engineer',
  'devops engineer': 'DevOps/SRE', 'sre': 'DevOps/SRE', 'cloud engineer': 'DevOps/SRE', 'site reliability engineer': 'DevOps/SRE',
  'security engineer': 'Security Engineer', 'appsec engineer': 'Security Engineer', 'penetration tester': 'Security Engineer', 'security analyst': 'Security Engineer',
  'product manager': 'Product Manager', 'senior pm': 'Product Manager', 'technical pm': 'Product Manager', 'growth pm': 'Product Manager',
  'business analyst': 'Business Analyst', 'product analyst': 'Business Analyst',
}

export const ROLE_CATEGORIES = [
  'Data Analyst', 'Data Scientist', 'ML Engineer', 'GenAI Engineer',
  'Software Engineer', 'Frontend Engineer', 'Backend Engineer', 'Full-Stack Engineer',
  'DevOps/SRE', 'Security Engineer', 'Product Manager', 'Business Analyst', 'Other',
]

/** Normalize a role title to a category */
export function normalizeRoleCategory(role: string): string {
  const lower = role.toLowerCase().trim()
  // Direct match
  if (ROLE_CATEGORY_MAP[lower]) return ROLE_CATEGORY_MAP[lower]
  // Partial match
  for (const [key, cat] of Object.entries(ROLE_CATEGORY_MAP)) {
    if (lower.includes(key) || key.includes(lower)) return cat
  }
  return 'Other'
}

export const QUESTION_STATUS_STYLES: Record<string, string> = {
  'Not Started': 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
  'Needs Work':  'bg-red-50 text-red-600 dark:bg-red-900/40 dark:text-red-400',
  'In Progress': 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  'Confident':   'bg-green-50 text-green-700 dark:bg-green-900/40 dark:text-green-300',
}

export const DIFFICULTY_STYLES: Record<string, string> = {
  Easy:   'bg-green-50 text-green-600 dark:bg-green-900/40 dark:text-green-400',
  Medium: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/40 dark:text-yellow-400',
  Hard:   'bg-red-50 text-red-600 dark:bg-red-900/40 dark:text-red-400',
}

export const PRIORITY_STYLES: Record<string, { card: string; badge: string }> = {
  high:   { card: 'border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-900/20', badge: 'bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-300' },
  medium: { card: 'border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-900/20', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300' },
  low:    { card: 'border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-900/20', badge: 'bg-green-100 text-green-700 dark:bg-green-900/60 dark:text-green-300' },
}

export interface NavItem {
  id: TabId
  label: string
  icon: string
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard',    label: 'Dashboard',    icon: 'LayoutDashboard' },
  { id: 'applications', label: 'Applications', icon: 'Briefcase' },
  { id: 'resumes',      label: 'Resumes',      icon: 'FileText' },
  { id: 'roadmap',      label: 'Roadmap',      icon: 'Map' },
  { id: 'questions',    label: 'Questions',     icon: 'HelpCircle' },
  { id: 'timetable',    label: 'Timetable',     icon: 'Calendar' },
  { id: 'suggestions',  label: 'Insights',      icon: 'Lightbulb' },
]

export const EDUCATION_OPTIONS = ['High School', "Bachelor's", "Master's", 'Graduate Student', 'PhD', 'Bootcamp', 'Self-taught']
export const STATUS_OPTIONS = ['Student', 'New Graduate', 'Employed', 'Unemployed', 'Career Switcher']
export const WORK_MODES = ['Remote', 'Hybrid', 'Onsite', 'Any']
