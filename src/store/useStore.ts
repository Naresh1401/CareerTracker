import { create } from 'zustand'
import type { Application, ResumeVersion, RoadmapWeek, Question, Profile, TabId, TimetableBlock, SavedJobDescription, TailoringSession, DashboardFilter } from '../types'
import { DEMO_PROFILE, SEED_APPLICATIONS, SEED_RESUME_VERSIONS, SEED_ROADMAP, SEED_QUESTIONS, nextId, generateSeedFromDomain } from '../constants/seed-data'
import { getDomainPreset } from '../constants/domain-presets'
import type { DomainId } from '../constants/domain-presets'

interface AppState {
  theme: 'light' | 'dark'
  toggleTheme: () => void

  activeTab: TabId
  setActiveTab: (tab: TabId) => void

  profile: Profile
  updateProfile: (data: Partial<Profile>) => void

  applications: Application[]
  addApplication: (app: Omit<Application, 'id'>) => void
  updateApplication: (id: number, data: Partial<Application>) => void
  deleteApplication: (id: number) => void

  resumeVersions: ResumeVersion[]
  addResumeVersion: (rv: Omit<ResumeVersion, 'id'>) => void
  updateResumeVersion: (id: number, data: Partial<ResumeVersion>) => void
  deleteResumeVersion: (id: number) => void

  roadmap: RoadmapWeek[]
  toggleRoadmapComplete: (id: number) => void
  toggleRoadmapTask: (weekId: number, taskIndex: number) => void

  questions: Question[]
  addQuestion: (q: Omit<Question, 'id'>) => void
  addQuestions: (qs: Omit<Question, 'id'>[]) => void
  cycleQuestionStatus: (id: number) => void
  markQuestionConfident: (id: number) => void
  updateQuestionNotes: (id: number, notes: string) => void
  toggleStarQuestion: (id: number) => void

  timetable: Record<string, TimetableBlock[]>
  updateTimetable: (day: string, blocks: TimetableBlock[]) => void

  showProfile: boolean
  setShowProfile: (v: boolean) => void
  showOnboarding: boolean
  setShowOnboarding: (v: boolean) => void
  applicationsView: 'table' | 'kanban'
  setApplicationsView: (v: 'table' | 'kanban') => void

  savedJDs: SavedJobDescription[]
  addSavedJD: (jd: Omit<SavedJobDescription, 'id'>) => void
  deleteSavedJD: (id: number) => void

  tailoringSessions: TailoringSession[]
  addTailoringSession: (s: Omit<TailoringSession, 'id'>) => void
  updateTailoringSession: (id: number, data: Partial<TailoringSession>) => void
  deleteTailoringSession: (id: number) => void

  loadDomainPreset: (domainId: DomainId) => void

  dashboardFilter: DashboardFilter | null
  setDashboardFilter: (f: DashboardFilter | null) => void
}

export const useStore = create<AppState>((set) => ({
  theme: (typeof window !== 'undefined' && localStorage.getItem('ct-theme') === 'dark') ? 'dark' : 'light',
  toggleTheme: () => set(s => {
    const next = s.theme === 'light' ? 'dark' : 'light'
    localStorage.setItem('ct-theme', next)
    document.documentElement.classList.toggle('dark', next === 'dark')
    return { theme: next }
  }),

  activeTab: 'dashboard',
  setActiveTab: (tab) => set({ activeTab: tab }),

  profile: DEMO_PROFILE,
  updateProfile: (data) => set(s => ({ profile: { ...s.profile, ...data } })),

  applications: SEED_APPLICATIONS,
  addApplication: (app) => set(s => {
    const now = new Date().toISOString().split('T')[0]
    const newApp: Application = {
      ...app,
      id: nextId(),
      dateSaved: app.dateSaved || now,
      lastStatusUpdate: app.lastStatusUpdate || now,
      statusHistory: app.statusHistory?.length ? app.statusHistory : [{ status: app.status, date: now }],
    }
    return { applications: [newApp, ...s.applications] }
  }),
  updateApplication: (id, data) => set(s => ({
    applications: s.applications.map(a => {
      if (a.id !== id) return a
      const updated = { ...a, ...data }
      if (data.status && data.status !== a.status) {
        const now = new Date().toISOString().split('T')[0]
        updated.lastStatusUpdate = now
        updated.statusHistory = [...(a.statusHistory || []), { status: data.status, date: now }]
      }
      return updated
    })
  })),
  deleteApplication: (id) => set(s => ({
    applications: s.applications.filter(a => a.id !== id)
  })),

  resumeVersions: SEED_RESUME_VERSIONS,
  addResumeVersion: (rv) => set(s => ({
    resumeVersions: [...s.resumeVersions, { ...rv, id: nextId() }]
  })),
  updateResumeVersion: (id, data) => set(s => ({
    resumeVersions: s.resumeVersions.map(r => r.id === id ? { ...r, ...data } : r)
  })),
  deleteResumeVersion: (id) => set(s => ({
    resumeVersions: s.resumeVersions.filter(r => r.id !== id)
  })),

  roadmap: SEED_ROADMAP,
  toggleRoadmapComplete: (id) => set(s => ({
    roadmap: s.roadmap.map(r => r.id === id ? { ...r, completed: !r.completed } : r)
  })),
  toggleRoadmapTask: (weekId, taskIndex) => set(s => ({
    roadmap: s.roadmap.map(r => {
      if (r.id !== weekId) return r
      const completedTasks = new Set(r.completedTasks || [])
      if (completedTasks.has(taskIndex)) completedTasks.delete(taskIndex)
      else completedTasks.add(taskIndex)
      return { ...r, completedTasks: [...completedTasks] }
    })
  })),

  questions: SEED_QUESTIONS,
  addQuestion: (q) => set(s => ({ questions: [...s.questions, { ...q, id: nextId() }] })),
  addQuestions: (qs) => set(s => ({ questions: [...s.questions, ...qs.map(q => ({ ...q, id: nextId() }))] })),
  cycleQuestionStatus: (id) => set(s => ({
    questions: s.questions.map(q => {
      if (q.id !== id) return q
      const order = ['Not Started', 'Needs Work', 'In Progress', 'Confident'] as const
      const idx = order.indexOf(q.status as typeof order[number])
      return { ...q, status: order[(idx + 1) % 4], lastPracticed: new Date().toISOString().split('T')[0] }
    })
  })),
  markQuestionConfident: (id) => set(s => ({
    questions: s.questions.map(q =>
      q.id === id ? { ...q, status: 'Confident' as const, lastPracticed: new Date().toISOString().split('T')[0] } : q
    )
  })),
  updateQuestionNotes: (id, notes) => set(s => ({
    questions: s.questions.map(q => q.id === id ? { ...q, notes } : q)
  })),
  toggleStarQuestion: (id) => set(s => ({
    questions: s.questions.map(q => q.id === id ? { ...q, starred: !q.starred } : q)
  })),

  timetable: {},
  updateTimetable: (day, blocks) => set(s => ({
    timetable: { ...s.timetable, [day]: blocks }
  })),

  showProfile: false,
  setShowProfile: (v) => set({ showProfile: v }),
  showOnboarding: false,
  setShowOnboarding: (v) => set({ showOnboarding: v }),
  applicationsView: 'table',
  setApplicationsView: (v) => set({ applicationsView: v }),

  savedJDs: [],
  addSavedJD: (jd) => set(s => ({ savedJDs: [...s.savedJDs, { ...jd, id: nextId() }] })),
  deleteSavedJD: (id) => set(s => ({ savedJDs: s.savedJDs.filter(j => j.id !== id) })),

  tailoringSessions: [],
  addTailoringSession: (session) => set(s => ({
    tailoringSessions: [...s.tailoringSessions, { ...session, id: nextId() }],
  })),
  updateTailoringSession: (id, data) => set(s => ({
    tailoringSessions: s.tailoringSessions.map(t => t.id === id ? { ...t, ...data } : t),
  })),
  deleteTailoringSession: (id) => set(s => ({
    tailoringSessions: s.tailoringSessions.filter(t => t.id !== id),
  })),

  loadDomainPreset: (domainId) => set(s => {
    const preset = getDomainPreset(domainId)
    const seed = generateSeedFromDomain(domainId)
    return {
      applications: seed.applications,
      resumeVersions: seed.resumeVersions,
      roadmap: seed.roadmap,
      questions: seed.questions,
      timetable: {},
      savedJDs: [],
      tailoringSessions: [],
      profile: {
        ...s.profile,
        ...preset.profile,
        activeDomain: domainId,
      },
    }
  }),

  dashboardFilter: null,
  setDashboardFilter: (f) => set({ dashboardFilter: f }),
}))
