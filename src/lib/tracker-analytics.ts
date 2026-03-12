/**
 * Tracker Analytics Engine
 * All dashboard metrics are derived from Application[] data.
 * No hardcoded values — every number is computed.
 */
import { differenceInDays, startOfWeek, format, subWeeks, subDays } from 'date-fns'
import type { Application, ApplicationStatus, WorkMode } from '../types'
import { INTERVIEW_STAGES, TERMINAL_STATUSES, PIPELINE_STAGES } from '../constants/config'

/* ────────────────────────────────────────────────────────── */
/*  Helpers                                                   */
/* ────────────────────────────────────────────────────────── */
const today = () => new Date().toISOString().split('T')[0]
const daysBetween = (a: string, b: string) => Math.max(0, differenceInDays(new Date(b), new Date(a)))
const isActiveStatus = (s: ApplicationStatus) => !TERMINAL_STATUSES.includes(s) && s !== 'Saved'
const isInterviewStatus = (s: ApplicationStatus) => INTERVIEW_STAGES.includes(s)
const hasResponse = (s: ApplicationStatus) => s !== 'Applied' && s !== 'Saved' && s !== 'Preparing' && s !== 'Ghosted'

/* ────────────────────────────────────────────────────────── */
/*  Funnel & Conversion Metrics                              */
/* ────────────────────────────────────────────────────────── */
export interface FunnelData {
  saved: number
  applied: number
  assessment: number
  interviewRounds: number
  finalRounds: number
  offers: number
  accepted: number
  rejected: number
  ghosted: number
  withdrawn: number
}

export function computeFunnel(apps: Application[]): FunnelData {
  return {
    saved: apps.filter(a => a.status === 'Saved' || a.status === 'Preparing').length,
    applied: apps.filter(a => a.status !== 'Saved' && a.status !== 'Preparing').length,
    assessment: apps.filter(a => a.status === 'OA').length,
    interviewRounds: apps.filter(a => isInterviewStatus(a.status) || a.status === 'Offer' || a.status === 'Accepted').length,
    finalRounds: apps.filter(a => a.status === 'Final Round' || a.status === 'Offer' || a.status === 'Accepted').length,
    offers: apps.filter(a => a.status === 'Offer' || a.status === 'Accepted').length,
    accepted: apps.filter(a => a.status === 'Accepted').length,
    rejected: apps.filter(a => a.status === 'Rejected').length,
    ghosted: apps.filter(a => a.status === 'Ghosted').length,
    withdrawn: apps.filter(a => a.status === 'Withdrawn').length,
  }
}

export interface ConversionRates {
  savedToApplied: number
  appliedToResponse: number
  responseToInterview: number
  interviewToFinal: number
  finalToOffer: number
  offerAcceptance: number
}

export function computeConversions(apps: Application[]): ConversionRates {
  const total = apps.length
  if (total === 0) return { savedToApplied: 0, appliedToResponse: 0, responseToInterview: 0, interviewToFinal: 0, finalToOffer: 0, offerAcceptance: 0 }

  const all = apps.length
  const applied = apps.filter(a => a.status !== 'Saved' && a.status !== 'Preparing').length
  const responded = apps.filter(a => hasResponse(a.status)).length
  const interviewed = apps.filter(a => isInterviewStatus(a.status) || a.status === 'Offer' || a.status === 'Accepted').length
  const finals = apps.filter(a => a.status === 'Final Round' || a.status === 'Offer' || a.status === 'Accepted').length
  const offers = apps.filter(a => a.status === 'Offer' || a.status === 'Accepted').length
  const accepted = apps.filter(a => a.status === 'Accepted').length

  const pct = (num: number, den: number) => den > 0 ? Math.round((num / den) * 100) : 0

  return {
    savedToApplied: pct(applied, all),
    appliedToResponse: pct(responded, applied),
    responseToInterview: pct(interviewed, responded),
    interviewToFinal: pct(finals, interviewed),
    finalToOffer: pct(offers, finals),
    offerAcceptance: pct(accepted, offers),
  }
}

/* ────────────────────────────────────────────────────────── */
/*  Role Intelligence                                        */
/* ────────────────────────────────────────────────────────── */
export interface RoleBreakdown {
  category: string
  total: number
  active: number
  interviews: number
  offers: number
  rejected: number
  successRate: number
}

export function computeRoleBreakdowns(apps: Application[]): RoleBreakdown[] {
  const byRole = new Map<string, Application[]>()
  for (const a of apps) {
    const cat = a.roleCategory || 'Other'
    if (!byRole.has(cat)) byRole.set(cat, [])
    byRole.get(cat)!.push(a)
  }

  return [...byRole.entries()]
    .map(([category, list]) => {
      const interviews = list.filter(a => isInterviewStatus(a.status) || a.status === 'Offer' || a.status === 'Accepted').length
      const offers = list.filter(a => a.status === 'Offer' || a.status === 'Accepted').length
      const rejected = list.filter(a => a.status === 'Rejected').length
      const active = list.filter(a => isActiveStatus(a.status)).length
      const resolved = interviews + rejected
      return {
        category,
        total: list.length,
        active,
        interviews,
        offers,
        rejected,
        successRate: resolved > 0 ? Math.round((interviews / resolved) * 100) : 0,
      }
    })
    .sort((a, b) => b.total - a.total)
}

export interface RoleStatusMatrix {
  category: string
  [status: string]: string | number
}
export function computeRoleStatusMatrix(apps: Application[]): RoleStatusMatrix[] {
  const byRole = new Map<string, Application[]>()
  for (const a of apps) {
    const cat = a.roleCategory || 'Other'
    if (!byRole.has(cat)) byRole.set(cat, [])
    byRole.get(cat)!.push(a)
  }
  const statuses = ['Applied', 'OA', 'Recruiter Screen', 'Phone Screen', 'Technical Interview', 'Final Round', 'Offer', 'Rejected', 'Ghosted']
  return [...byRole.entries()].map(([category, list]) => {
    const row: RoleStatusMatrix = { category }
    for (const s of statuses) {
      row[s] = list.filter(a => a.status === s).length
    }
    return row
  }).sort((a, b) => (b.Applied as number) - (a.Applied as number))
}

/* ────────────────────────────────────────────────────────── */
/*  Source Performance                                       */
/* ────────────────────────────────────────────────────────── */
export interface SourceMetric {
  source: string
  total: number
  interviews: number
  offers: number
  rejected: number
  conversionRate: number
}

export function computeSourcePerformance(apps: Application[]): SourceMetric[] {
  const bySource = new Map<string, Application[]>()
  for (const a of apps) {
    const src = a.source || 'Other'
    if (!bySource.has(src)) bySource.set(src, [])
    bySource.get(src)!.push(a)
  }
  return [...bySource.entries()]
    .map(([source, list]) => {
      const interviews = list.filter(a => isInterviewStatus(a.status) || a.status === 'Offer' || a.status === 'Accepted').length
      const offers = list.filter(a => a.status === 'Offer' || a.status === 'Accepted').length
      const rejected = list.filter(a => a.status === 'Rejected').length
      return {
        source,
        total: list.length,
        interviews,
        offers,
        rejected,
        conversionRate: list.length > 0 ? Math.round((interviews / list.length) * 100) : 0,
      }
    })
    .sort((a, b) => b.conversionRate - a.conversionRate)
}

/* ────────────────────────────────────────────────────────── */
/*  Resume Version Performance                               */
/* ────────────────────────────────────────────────────────── */
export interface ResumeMetric {
  name: string
  total: number
  interviews: number
  interviewRate: number
  topRole: string
}

export function computeResumePerformance(apps: Application[]): ResumeMetric[] {
  const byVersion = new Map<string, Application[]>()
  for (const a of apps) {
    if (!a.resumeVersion) continue
    if (!byVersion.has(a.resumeVersion)) byVersion.set(a.resumeVersion, [])
    byVersion.get(a.resumeVersion)!.push(a)
  }
  return [...byVersion.entries()]
    .map(([name, list]) => {
      const interviews = list.filter(a => isInterviewStatus(a.status) || a.status === 'Offer' || a.status === 'Accepted').length
      const roleCounts = new Map<string, number>()
      for (const a of list) {
        const r = a.roleCategory || 'Other'
        roleCounts.set(r, (roleCounts.get(r) || 0) + 1)
      }
      const topRole = [...roleCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || '—'
      return {
        name,
        total: list.length,
        interviews,
        interviewRate: list.length > 0 ? Math.round((interviews / list.length) * 100) : 0,
        topRole,
      }
    })
    .sort((a, b) => b.interviewRate - a.interviewRate)
}

/* ────────────────────────────────────────────────────────── */
/*  Company Strategy                                         */
/* ────────────────────────────────────────────────────────── */
export interface TargetTypeMetric {
  type: string
  total: number
  active: number
  interviews: number
  offers: number
}

export function computeTargetTypeBreakdown(apps: Application[]): TargetTypeMetric[] {
  const byType = new Map<string, Application[]>()
  for (const a of apps) {
    const t = a.targetType || 'Realistic'
    if (!byType.has(t)) byType.set(t, [])
    byType.get(t)!.push(a)
  }
  return ['Dream', 'Stretch', 'Realistic', 'Backup']
    .map(type => {
      const list = byType.get(type) || []
      const interviews = list.filter(a => isInterviewStatus(a.status) || a.status === 'Offer' || a.status === 'Accepted').length
      const active = list.filter(a => isActiveStatus(a.status)).length
      const offers = list.filter(a => a.status === 'Offer' || a.status === 'Accepted').length
      return { type, total: list.length, active, interviews, offers }
    })
}

/* ────────────────────────────────────────────────────────── */
/*  Work Mode Performance                                    */
/* ────────────────────────────────────────────────────────── */
export interface WorkModeMetric {
  mode: WorkMode
  total: number
  interviews: number
  conversionRate: number
}

export function computeWorkModePerformance(apps: Application[]): WorkModeMetric[] {
  return (['Remote', 'Hybrid', 'Onsite'] as WorkMode[]).map(mode => {
    const list = apps.filter(a => a.workMode === mode)
    const interviews = list.filter(a => isInterviewStatus(a.status) || a.status === 'Offer' || a.status === 'Accepted').length
    return {
      mode,
      total: list.length,
      interviews,
      conversionRate: list.length > 0 ? Math.round((interviews / list.length) * 100) : 0,
    }
  })
}

/* ────────────────────────────────────────────────────────── */
/*  Weekly Momentum                                          */
/* ────────────────────────────────────────────────────────── */
export interface WeeklyMomentum {
  appliedThisWeek: number
  interviewsThisWeek: number
  followUpsDueThisWeek: number
  rejectedThisWeek: number
  activeOpportunities: number
  weeklyStreak: number
}

export function computeWeeklyMomentum(apps: Application[], weeklyTarget: number): WeeklyMomentum {
  const now = new Date()
  const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 })
  const thisWeekStr = thisWeekStart.toISOString().split('T')[0]

  const appliedThisWeek = apps.filter(a => a.dateApplied >= thisWeekStr && a.status !== 'Saved' && a.status !== 'Preparing').length
  const interviewsThisWeek = apps.filter(a => a.interviewDate && a.interviewDate >= thisWeekStr && a.interviewDate <= format(now, 'yyyy-MM-dd')).length
  const followUpsDueThisWeek = apps.filter(a => a.followUpDate && a.followUpDate >= thisWeekStr && a.followUpDate <= format(now, 'yyyy-MM-dd')).length
  const rejectedThisWeek = apps.filter(a => a.status === 'Rejected' && a.lastStatusUpdate >= thisWeekStr).length
  const activeOpportunities = apps.filter(a => isActiveStatus(a.status)).length

  // Streak: how many consecutive past weeks hit the target?
  let streak = 0
  for (let i = 1; i <= 12; i++) {
    const wStart = subWeeks(thisWeekStart, i)
    const wEnd = subWeeks(thisWeekStart, i - 1)
    const count = apps.filter(a => {
      const d = a.dateApplied
      return d >= format(wStart, 'yyyy-MM-dd') && d < format(wEnd, 'yyyy-MM-dd') && a.status !== 'Saved' && a.status !== 'Preparing'
    }).length
    if (count >= weeklyTarget) streak++
    else break
  }

  return { appliedThisWeek, interviewsThisWeek, followUpsDueThisWeek, rejectedThisWeek, activeOpportunities, weeklyStreak: streak }
}

/* ────────────────────────────────────────────────────────── */
/*  Response Velocity                                        */
/* ────────────────────────────────────────────────────────── */
export interface VelocityMetrics {
  avgDaysToResponse: number
  avgDaysToRejection: number
  avgDaysToOffer: number
  stalledCount: number
}

export function computeVelocity(apps: Application[]): VelocityMetrics {
  const responded = apps.filter(a => hasResponse(a.status) && a.dateApplied && a.lastStatusUpdate)
  const rejections = apps.filter(a => a.status === 'Rejected' && a.dateApplied && a.lastStatusUpdate)
  const offers = apps.filter(a => (a.status === 'Offer' || a.status === 'Accepted') && a.dateApplied && a.lastStatusUpdate)

  const avg = (list: Application[]) => {
    if (list.length === 0) return 0
    const sum = list.reduce((s, a) => s + daysBetween(a.dateApplied, a.lastStatusUpdate), 0)
    return Math.round(sum / list.length)
  }

  const stalledCount = apps.filter(a => {
    if (TERMINAL_STATUSES.includes(a.status) || a.status === 'Saved') return false
    return daysBetween(a.lastStatusUpdate, today()) > 14
  }).length

  return {
    avgDaysToResponse: avg(responded),
    avgDaysToRejection: avg(rejections),
    avgDaysToOffer: avg(offers),
    stalledCount,
  }
}

/* ────────────────────────────────────────────────────────── */
/*  Tracker Health Summary                                   */
/* ────────────────────────────────────────────────────────── */
export interface TrackerHealth {
  needsFollowUp: number
  staleApplications: number
  activePipeline: number
  overdueUpdate: number
  behindTarget: boolean
}

export function computeTrackerHealth(apps: Application[], weeklyTarget: number): TrackerHealth {
  const todayStr = today()
  const needsFollowUp = apps.filter(a => a.followUpDate && a.followUpDate <= todayStr && isActiveStatus(a.status)).length
  const staleApplications = apps.filter(a => isActiveStatus(a.status) && daysBetween(a.lastStatusUpdate, todayStr) > 21).length
  const activePipeline = apps.filter(a => isActiveStatus(a.status)).length
  const overdueUpdate = apps.filter(a => isActiveStatus(a.status) && daysBetween(a.lastStatusUpdate, todayStr) > 14).length

  const thisWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
  const thisWeekApps = apps.filter(a => a.dateApplied >= format(thisWeekStart, 'yyyy-MM-dd') && a.status !== 'Saved' && a.status !== 'Preparing').length
  const behindTarget = thisWeekApps < weeklyTarget

  return { needsFollowUp, staleApplications, activePipeline, overdueUpdate, behindTarget }
}

/* ────────────────────────────────────────────────────────── */
/*  Action Queue (Upcoming)                                  */
/* ────────────────────────────────────────────────────────── */
export interface ActionItem {
  type: 'follow-up' | 'interview' | 'stale' | 'resume-needed'
  app: Application
  dueDate: string
  urgency: 'high' | 'medium' | 'low'
}

export function computeActionQueue(apps: Application[]): ActionItem[] {
  const todayStr = today()
  const tomorrowStr = format(subDays(new Date(), -1), 'yyyy-MM-dd')
  const items: ActionItem[] = []

  for (const app of apps) {
    if (!isActiveStatus(app.status) && app.status !== 'Saved') continue

    // Overdue follow-ups
    if (app.followUpDate && app.followUpDate <= todayStr) {
      items.push({ type: 'follow-up', app, dueDate: app.followUpDate, urgency: 'high' })
    }
    // Upcoming interviews
    if (app.interviewDate && app.interviewDate >= todayStr && app.interviewDate <= format(subDays(new Date(), -3), 'yyyy-MM-dd')) {
      items.push({ type: 'interview', app, dueDate: app.interviewDate, urgency: app.interviewDate <= tomorrowStr ? 'high' : 'medium' })
    }
    // Stale apps
    if (isActiveStatus(app.status) && daysBetween(app.lastStatusUpdate, todayStr) > 14) {
      items.push({ type: 'stale', app, dueDate: app.lastStatusUpdate, urgency: daysBetween(app.lastStatusUpdate, todayStr) > 21 ? 'high' : 'medium' })
    }
    // Missing resume
    if (!app.resumeVersion && app.status !== 'Saved') {
      items.push({ type: 'resume-needed', app, dueDate: todayStr, urgency: 'low' })
    }
  }

  return items.sort((a, b) => {
    const urgencyOrder = { high: 0, medium: 1, low: 2 }
    return urgencyOrder[a.urgency] - urgencyOrder[b.urgency] || a.dueDate.localeCompare(b.dueDate)
  })
}

/* ────────────────────────────────────────────────────────── */
/*  Trend: applications per role per week                    */
/* ────────────────────────────────────────────────────────── */
export interface WeeklyRoleTrend {
  week: string
  [role: string]: number | string
}

export function computeWeeklyRoleTrends(apps: Application[], weeks = 6): WeeklyRoleTrend[] {
  const now = new Date()
  const roles = [...new Set(apps.map(a => a.roleCategory || 'Other'))]
  return Array.from({ length: weeks }, (_, i) => {
    const wStart = startOfWeek(subWeeks(now, weeks - 1 - i), { weekStartsOn: 1 })
    const wEnd = subWeeks(wStart, -1)
    const label = format(wStart, 'MMM d')
    const row: WeeklyRoleTrend = { week: label }
    for (const role of roles) {
      row[role] = apps.filter(a => {
        const d = a.dateApplied
        return d >= format(wStart, 'yyyy-MM-dd') && d < format(wEnd, 'yyyy-MM-dd') && (a.roleCategory || 'Other') === role
      }).length
    }
    return row
  })
}

/* ────────────────────────────────────────────────────────── */
/*  Smart Suggestions                                        */
/* ────────────────────────────────────────────────────────── */
export interface TrackerSuggestion {
  priority: 'high' | 'medium' | 'low'
  icon: string
  title: string
  body: string
  reason: string
  recommendation: string
  cta?: string
  tab?: string
}

export function generateTrackerSuggestions(apps: Application[], weeklyTarget: number): TrackerSuggestion[] {
  const tips: TrackerSuggestion[] = []
  if (apps.length === 0) return tips

  const roles = computeRoleBreakdowns(apps)
  const sources = computeSourcePerformance(apps)
  const health = computeTrackerHealth(apps, weeklyTarget)
  const velocity = computeVelocity(apps)
  const modes = computeWorkModePerformance(apps)
  const targets = computeTargetTypeBreakdown(apps)

  // Role focus insights
  const topRole = roles[0]
  const bestConversion = [...roles].sort((a, b) => b.successRate - a.successRate)[0]
  if (topRole && bestConversion && topRole.category !== bestConversion.category && bestConversion.successRate > topRole.successRate + 15) {
    tips.push({
      priority: 'high', icon: '🎯',
      title: `Better results in ${bestConversion.category} roles`,
      body: `You are applying heavily to ${topRole.category} roles but getting better interview conversion in ${bestConversion.category} roles (${bestConversion.successRate}% vs ${topRole.successRate}%).`,
      reason: 'Role conversion analysis', recommendation: `Consider increasing focus on ${bestConversion.category} applications.`,
      tab: 'applications',
    })
  }

  // Low-performing role
  const lowRole = roles.find(r => r.total >= 3 && r.successRate < 20 && r.rejected > r.interviews)
  if (lowRole) {
    tips.push({
      priority: 'high', icon: '⚠️',
      title: `${lowRole.category} applications struggling`,
      body: `You have applied to ${lowRole.total} ${lowRole.category} roles but only ${lowRole.interviews} progressed past screening. ${lowRole.rejected} were rejected.`,
      reason: 'High rejection rate', recommendation: 'Consider tailoring your resume or adjusting targeting for this role.',
      tab: 'resumes',
    })
  }

  // Referral performance
  const referralSource = sources.find(s => s.source === 'Referral')
  const nonReferral = sources.filter(s => s.source !== 'Referral')
  const avgNonRef = nonReferral.length > 0 ? Math.round(nonReferral.reduce((s, x) => s + x.conversionRate, 0) / nonReferral.length) : 0
  if (referralSource && referralSource.conversionRate > avgNonRef * 1.5 && referralSource.total >= 2) {
    tips.push({
      priority: 'medium', icon: '🤝',
      title: 'Referrals converting significantly better',
      body: `Applications from referrals are converting at ${referralSource.conversionRate}% vs ${avgNonRef}% from other sources.`,
      reason: 'Source conversion analysis', recommendation: 'Invest more in networking to get referrals.',
    })
  }

  // Follow-up compliance
  if (health.needsFollowUp > 0) {
    tips.push({
      priority: 'high', icon: '📬',
      title: `${health.needsFollowUp} overdue follow-up${health.needsFollowUp > 1 ? 's' : ''}`,
      body: `You have applications with follow-up dates that have passed. Sending a polite follow-up can increase your response rate.`,
      reason: 'Follow-up compliance', recommendation: 'Send follow-ups today.',
      cta: 'View applications', tab: 'applications',
    })
  }

  // Stale applications
  if (health.staleApplications > 0) {
    tips.push({
      priority: 'medium', icon: '💤',
      title: `${health.staleApplications} stale application${health.staleApplications > 1 ? 's' : ''}`,
      body: 'Some applications haven\'t been updated in over 3 weeks. Consider following up or marking them as ghosted.',
      reason: 'Application freshness', recommendation: 'Review and update stale applications.',
      tab: 'applications',
    })
  }

  // Work mode insight
  const bestMode = [...modes].sort((a, b) => b.conversionRate - a.conversionRate)[0]
  const worstMode = [...modes].sort((a, b) => a.conversionRate - b.conversionRate)[0]
  if (bestMode && worstMode && bestMode.mode !== worstMode.mode && bestMode.total >= 3 && worstMode.total >= 3 && bestMode.conversionRate > worstMode.conversionRate + 20) {
    tips.push({
      priority: 'low', icon: '🏢',
      title: `${bestMode.mode} applications performing better`,
      body: `Your ${bestMode.mode} applications are converting at ${bestMode.conversionRate}% vs ${worstMode.conversionRate}% for ${worstMode.mode}.`,
      reason: 'Work mode analysis', recommendation: `Consider prioritizing ${bestMode.mode} opportunities.`,
    })
  }

  // Dream company overload
  const dreamStats = targets.find(t => t.type === 'Dream')
  const realisticStats = targets.find(t => t.type === 'Realistic')
  if (dreamStats && realisticStats && dreamStats.total > realisticStats.total * 2 && dreamStats.offers === 0) {
    tips.push({
      priority: 'medium', icon: '🌟',
      title: 'Heavy focus on dream companies',
      body: `${dreamStats.total} dream company applications vs ${realisticStats.total} realistic. Consider balancing your strategy.`,
      reason: 'Target type analysis', recommendation: 'Add more realistic targets to secure backup offers.',
      tab: 'applications',
    })
  }

  // Behind weekly target
  if (health.behindTarget) {
    const momentum = computeWeeklyMomentum(apps, weeklyTarget)
    tips.push({
      priority: 'high', icon: '📤',
      title: 'Behind weekly application target',
      body: `You've sent ${momentum.appliedThisWeek} applications this week but your goal is ${weeklyTarget}.`,
      reason: 'Weekly target tracking', recommendation: `Apply to ${weeklyTarget - momentum.appliedThisWeek} more before the week ends.`,
      cta: 'Go to Applications', tab: 'applications',
    })
  }

  // Velocity insight
  if (velocity.avgDaysToResponse > 14 && apps.length >= 5) {
    tips.push({
      priority: 'low', icon: '⏱️',
      title: `Average response time: ${velocity.avgDaysToResponse} days`,
      body: 'Your average time to first response is above 2 weeks. This is normal for many companies — focus on volume.',
      reason: 'Response velocity', recommendation: 'Keep applying consistently while waiting for responses.',
    })
  }

  return tips
}

/* ────────────────────────────────────────────────────────── */
/*  Role Pipeline Heatmap                                     */
/* ────────────────────────────────────────────────────────── */
export interface RolePipelineCell {
  role: string
  stages: Record<string, number>
  total: number
}

export function computeRolePipelineHeatmap(apps: Application[]): RolePipelineCell[] {
  const allStages = ['Saved', 'Applied', 'OA', 'Recruiter Screen', 'Phone Screen', 'Hiring Manager', 'Technical Interview', 'Case Study', 'Panel Interview', 'Final Round', 'Offer', 'Accepted', 'Rejected', 'Ghosted', 'Withdrawn']
  const byRole = new Map<string, Application[]>()
  for (const a of apps) {
    const cat = a.roleCategory || 'Other'
    if (!byRole.has(cat)) byRole.set(cat, [])
    byRole.get(cat)!.push(a)
  }
  return [...byRole.entries()]
    .map(([role, list]) => {
      const stages: Record<string, number> = {}
      for (const s of allStages) stages[s] = list.filter(a => a.status === s).length
      return { role, stages, total: list.length }
    })
    .sort((a, b) => b.total - a.total)
}

/* ────────────────────────────────────────────────────────── */
/*  Follow-Up Urgency Board                                   */
/* ────────────────────────────────────────────────────────── */
export interface FollowUpItem {
  app: Application
  daysSinceUpdate: number
  daysSinceApplied: number
  action: 'overdue-followup' | 'stale-no-response' | 'interview-prep' | 'send-followup' | 'check-in'
  urgencyScore: number // 0-100, higher = more urgent
  label: string
}

export function computeFollowUpUrgency(apps: Application[]): FollowUpItem[] {
  const todayStr = today()
  const items: FollowUpItem[] = []

  for (const app of apps) {
    if (TERMINAL_STATUSES.includes(app.status)) continue
    const daysSinceUpdate = daysBetween(app.lastStatusUpdate, todayStr)
    const daysSinceApplied = daysBetween(app.dateApplied, todayStr)

    // Overdue follow-up date
    if (app.followUpDate && app.followUpDate <= todayStr && app.status !== 'Saved') {
      const overdueDays = daysBetween(app.followUpDate, todayStr)
      items.push({
        app, daysSinceUpdate, daysSinceApplied,
        action: 'overdue-followup',
        urgencyScore: Math.min(100, 70 + overdueDays * 3),
        label: `Follow-up overdue by ${overdueDays} day${overdueDays !== 1 ? 's' : ''}`,
      })
      continue
    }

    // Upcoming interview — needs prep
    if (app.interviewDate && app.interviewDate >= todayStr) {
      const daysUntil = daysBetween(todayStr, app.interviewDate)
      if (daysUntil <= 5) {
        items.push({
          app, daysSinceUpdate, daysSinceApplied,
          action: 'interview-prep',
          urgencyScore: daysUntil <= 1 ? 95 : daysUntil <= 3 ? 80 : 60,
          label: `Interview in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`,
        })
        continue
      }
    }

    // Applied but no response for 10+ days
    if (app.status === 'Applied' && daysSinceUpdate >= 10) {
      items.push({
        app, daysSinceUpdate, daysSinceApplied,
        action: 'stale-no-response',
        urgencyScore: Math.min(90, 40 + daysSinceUpdate * 2),
        label: `No response in ${daysSinceUpdate} days`,
      })
      continue
    }

    // Active pipeline but stale
    if (isActiveStatus(app.status) && app.status !== 'Applied' && daysSinceUpdate >= 7) {
      items.push({
        app, daysSinceUpdate, daysSinceApplied,
        action: daysSinceUpdate >= 14 ? 'send-followup' : 'check-in',
        urgencyScore: Math.min(85, 30 + daysSinceUpdate * 2),
        label: daysSinceUpdate >= 14 ? `Stale ${daysSinceUpdate}d — send follow-up` : `${daysSinceUpdate}d since update — check in`,
      })
    }
  }

  return items.sort((a, b) => b.urgencyScore - a.urgencyScore)
}

/* ────────────────────────────────────────────────────────── */
/*  Role Conversion Ranking (best → worst)                    */
/* ────────────────────────────────────────────────────────── */
export interface RoleConversionRank {
  category: string
  total: number
  applied: number
  responded: number
  interviewed: number
  offers: number
  rejected: number
  ghosted: number
  responseRate: number
  interviewRate: number
  offerRate: number
  avgDaysToProgress: number
  verdict: 'strong' | 'average' | 'weak' | 'insufficient'
}

export function computeRoleConversionRanking(apps: Application[]): RoleConversionRank[] {
  const byRole = new Map<string, Application[]>()
  for (const a of apps) {
    const cat = a.roleCategory || 'Other'
    if (!byRole.has(cat)) byRole.set(cat, [])
    byRole.get(cat)!.push(a)
  }

  const pct = (n: number, d: number) => d > 0 ? Math.round((n / d) * 100) : 0

  return [...byRole.entries()]
    .map(([category, list]) => {
      const applied = list.filter(a => a.status !== 'Saved' && a.status !== 'Preparing').length
      const responded = list.filter(a => hasResponse(a.status)).length
      const interviewed = list.filter(a => isInterviewStatus(a.status) || a.status === 'Offer' || a.status === 'Accepted').length
      const offers = list.filter(a => a.status === 'Offer' || a.status === 'Accepted').length
      const rejected = list.filter(a => a.status === 'Rejected').length
      const ghosted = list.filter(a => a.status === 'Ghosted').length

      // Average days from applied to first status change
      const progressDays = list
        .filter(a => a.statusHistory && a.statusHistory.length >= 2 && a.dateApplied)
        .map(a => daysBetween(a.dateApplied, a.statusHistory[1]?.date || a.lastStatusUpdate))
      const avgDaysToProgress = progressDays.length > 0 ? Math.round(progressDays.reduce((s, d) => s + d, 0) / progressDays.length) : 0

      const responseRate = pct(responded, applied)
      const interviewRate = pct(interviewed, applied)
      const offerRate = pct(offers, applied)

      let verdict: RoleConversionRank['verdict'] = 'insufficient'
      if (applied >= 3) {
        if (interviewRate >= 40 || offerRate >= 15) verdict = 'strong'
        else if (interviewRate >= 20 || offerRate >= 5) verdict = 'average'
        else verdict = 'weak'
      }

      return { category, total: list.length, applied, responded, interviewed, offers, rejected, ghosted, responseRate, interviewRate, offerRate, avgDaysToProgress, verdict }
    })
    .sort((a, b) => b.interviewRate - a.interviewRate || b.total - a.total)
}

/* ────────────────────────────────────────────────────────── */
/*  Source Deep Insights                                      */
/* ────────────────────────────────────────────────────────── */
export interface SourceInsight {
  source: string
  total: number
  applied: number
  interviews: number
  offers: number
  rejected: number
  ghosted: number
  responseRate: number
  interviewRate: number
  avgDaysToResponse: number
  topRole: string
  verdict: 'best' | 'good' | 'average' | 'poor' | 'insufficient'
}

export function computeSourceInsights(apps: Application[]): SourceInsight[] {
  const bySource = new Map<string, Application[]>()
  for (const a of apps) {
    const src = a.source || 'Other'
    if (!bySource.has(src)) bySource.set(src, [])
    bySource.get(src)!.push(a)
  }

  const pct = (n: number, d: number) => d > 0 ? Math.round((n / d) * 100) : 0
  const results: SourceInsight[] = []

  for (const [source, list] of bySource) {
    const applied = list.filter(a => a.status !== 'Saved' && a.status !== 'Preparing').length
    const responded = list.filter(a => hasResponse(a.status)).length
    const interviews = list.filter(a => isInterviewStatus(a.status) || a.status === 'Offer' || a.status === 'Accepted').length
    const offers = list.filter(a => a.status === 'Offer' || a.status === 'Accepted').length
    const rejected = list.filter(a => a.status === 'Rejected').length
    const ghosted = list.filter(a => a.status === 'Ghosted').length

    const respondedApps = list.filter(a => hasResponse(a.status) && a.dateApplied && a.lastStatusUpdate)
    const avgDaysToResponse = respondedApps.length > 0
      ? Math.round(respondedApps.reduce((s, a) => s + daysBetween(a.dateApplied, a.lastStatusUpdate), 0) / respondedApps.length)
      : 0

    const roleCounts = new Map<string, number>()
    for (const a of list) {
      const r = a.roleCategory || 'Other'
      roleCounts.set(r, (roleCounts.get(r) || 0) + 1)
    }
    const topRole = [...roleCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || '—'

    const responseRate = pct(responded, applied)
    const interviewRate = pct(interviews, applied)

    let verdict: SourceInsight['verdict'] = 'insufficient'
    if (applied >= 3) {
      if (interviewRate >= 40 && responseRate >= 50) verdict = 'best'
      else if (interviewRate >= 25) verdict = 'good'
      else if (interviewRate >= 10) verdict = 'average'
      else verdict = 'poor'
    }

    results.push({ source, total: list.length, applied, interviews, offers, rejected, ghosted, responseRate, interviewRate, avgDaysToResponse, topRole, verdict })
  }

  return results.sort((a, b) => b.interviewRate - a.interviewRate || b.total - a.total)
}
