import type { Application, ResumeVersion, RoadmapWeek, Question, Profile } from '../types'
import { getDomainPreset } from './domain-presets'
import type { DomainId } from './domain-presets'

/** Empty default profile — filled in during onboarding */
export const EMPTY_PROFILE: Profile = {
  fullName: '',
  email: '',
  education: '',
  field: '',
  experienceYears: 0,
  currentStatus: '',
  targetRoles: [],
  preferredIndustries: [],
  preferredLocations: [],
  workMode: '',
  searchStartDate: '',
  weeklyAppTarget: 50,
  dreamCompanies: [],
  courses: [],
  weeklyStudyHours: 10,
  skillsToImprove: [],
  interviewConfidence: 50,
  resumeReadiness: 50,
  linkedIn: '',
  portfolio: '',
  github: '',
  onboarded: false,
}

/** Generate full seed data from a domain preset (used when switching domains) */
export function generateSeedFromDomain(domainId: DomainId) {
  const preset = getDomainPreset(domainId)
  let seedId = 2000
  const nid = () => seedId++
  return {
    applications: preset.applications.map(a => ({ ...a, id: nid() })) as Application[],
    resumeVersions: preset.resumeVersions.map(r => ({ ...r, id: nid() })) as ResumeVersion[],
    roadmap: preset.roadmap.map(r => ({ ...r, id: nid() })) as RoadmapWeek[],
    questions: preset.questions.map(q => ({ ...q, id: nid() })) as Question[],
  }
}

export const nextId = (() => {
  let counter = 5000
  return () => counter++
})()
