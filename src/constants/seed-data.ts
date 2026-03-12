import type { Application, ResumeVersion, RoadmapWeek, Question, Profile } from '../types'
import { getDomainPreset } from './domain-presets'
import type { DomainId } from './domain-presets'

let _id = 1000
const id = () => _id++

const DEFAULT_DOMAIN: DomainId = 'gen-ai'

export const DEMO_PROFILE: Profile = {
  fullName: 'Alex Chen',
  email: 'alex.chen@university.edu',
  education: "Master's",
  field: 'Generative AI & LLM Engineering',
  experienceYears: 1,
  currentStatus: 'Graduate Student',
  targetRoles: ['GenAI Engineer', 'LLM Engineer', 'AI Engineer', 'Prompt Engineer', 'Applied AI Scientist'],
  preferredIndustries: ['AI/ML', 'Tech', 'Healthcare AI', 'FinTech'],
  preferredLocations: ['San Francisco', 'New York', 'Seattle', 'Remote'],
  workMode: 'Hybrid',
  searchStartDate: '2024-02-15',
  weeklyAppTarget: 8,
  dreamCompanies: ['OpenAI', 'Anthropic', 'Google DeepMind', 'Cohere', 'Meta AI'],
  courses: ['LangChain Bootcamp', 'HuggingFace Transformers', 'Stanford CS224N', 'Fast.ai'],
  weeklyStudyHours: 15,
  skillsToImprove: ['RAG Architectures', 'Fine-tuning LLMs', 'Prompt Engineering', 'AI Agents', 'Vector Databases'],
  interviewConfidence: 55,
  resumeReadiness: 70,
  linkedIn: 'linkedin.com/in/alexchen',
  portfolio: 'alexchen.dev',
  github: 'github.com/alexchen',
  onboarded: true,
  activeDomain: DEFAULT_DOMAIN,
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

// Generate default Gen AI seed data
const defaultSeed = generateSeedFromDomain(DEFAULT_DOMAIN)

export const SEED_APPLICATIONS: Application[] = defaultSeed.applications
export const SEED_RESUME_VERSIONS: ResumeVersion[] = defaultSeed.resumeVersions
export const SEED_ROADMAP: RoadmapWeek[] = defaultSeed.roadmap
export const SEED_QUESTIONS: Question[] = defaultSeed.questions

export const nextId = (() => {
  let counter = 5000
  return () => counter++
})()
