import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, differenceInDays } from 'date-fns'
import type { Application, Question, RoadmapWeek, ResumeVersion } from '../types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string) {
  return format(new Date(date), 'MMM d, yyyy')
}

export function formatShortDate(date: string) {
  return format(new Date(date), 'MMM d')
}

export function timeAgo(date: string) {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export function daysSinceDate(date: string): number {
  return differenceInDays(new Date(), new Date(date))
}

export function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export function calculateHealthScore(
  applications: Application[],
  questions: Question[],
  roadmap: RoadmapWeek[],
  resumeVersions: ResumeVersion[],
): number {
  const appCount = applications.length
  const interviews = applications.filter(a =>
    ['Recruiter Screen', 'Phone Screen', 'Hiring Manager', 'Technical Interview', 'Case Study', 'Panel Interview', 'Final Round', 'Offer', 'Accepted'].includes(a.status)
  ).length
  const offers = applications.filter(a => ['Offer', 'Accepted'].includes(a.status)).length
  const convRate = appCount > 0 ? interviews / appCount : 0
  const roadmapPct = roadmap.length > 0 ? roadmap.filter(r => r.completed).length / roadmap.length : 0
  const confidentPct = questions.length > 0 ? questions.filter(q => q.status === 'Confident').length / questions.length : 0
  const resumeCount = resumeVersions.length

  const score = Math.min(100, Math.round(
    (Math.min(appCount, 20) / 20) * 25 +
    convRate * 25 * 100 / 100 +
    roadmapPct * 20 * 100 / 100 +
    confidentPct * 15 * 100 / 100 +
    Math.min(resumeCount, 4) / 4 * 5 +
    offers * 5
  ))
  return Math.max(0, score)
}

export function getScoreColor(score: number): string {
  if (score < 30) return '#ef4444'
  if (score < 50) return '#f59e0b'
  if (score < 70) return '#3b82f6'
  return '#10b981'
}

export function getScoreLabel(score: number): string {
  if (score < 30) return 'Getting started'
  if (score < 50) return 'Building momentum'
  if (score < 70) return 'Making progress'
  return 'Strong position'
}

export function generateICS(events: { title: string; start: Date; end: Date; description: string }[]): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  const fmtDT = (d: Date) =>
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`

  const vevents = events.map(e => [
    'BEGIN:VEVENT',
    `DTSTART:${fmtDT(e.start)}`,
    `DTEND:${fmtDT(e.end)}`,
    `SUMMARY:${e.title}`,
    `DESCRIPTION:${e.description}`,
    `UID:ct-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    'END:VEVENT',
  ].join('\r\n'))

  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//CareerTrackPro//EN', 'CALSCALE:GREGORIAN',
    ...vevents,
    'END:VCALENDAR',
  ].join('\r\n')
}

export function downloadFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
