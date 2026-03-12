/**
 * Visitor Tracker — logs visits to localStorage for the admin dashboard.
 * Each visit records a unique visitor ID, timestamp, and device metadata.
 */

export interface VisitEvent {
  id: string
  visitorId: string
  timestamp: string
  page: string
  userAgent: string
  screenWidth: number
  screenHeight: number
  language: string
  referrer: string
  /** Derived */
  device: 'mobile' | 'tablet' | 'desktop'
  browser: string
  os: string
}

const STORAGE_KEY = 'ct-visit-log'
const VISITOR_KEY = 'ct-visitor-id'

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

function getVisitorId(): string {
  let id = localStorage.getItem(VISITOR_KEY)
  if (!id) {
    id = generateId()
    localStorage.setItem(VISITOR_KEY, id)
  }
  return id
}

function detectDevice(w: number): VisitEvent['device'] {
  if (w < 768) return 'mobile'
  if (w < 1024) return 'tablet'
  return 'desktop'
}

function detectBrowser(ua: string): string {
  if (ua.includes('Firefox')) return 'Firefox'
  if (ua.includes('Edg')) return 'Edge'
  if (ua.includes('Chrome')) return 'Chrome'
  if (ua.includes('Safari')) return 'Safari'
  if (ua.includes('Opera') || ua.includes('OPR')) return 'Opera'
  return 'Other'
}

function detectOS(ua: string): string {
  if (ua.includes('Win')) return 'Windows'
  if (ua.includes('Mac')) return 'macOS'
  if (ua.includes('Linux')) return 'Linux'
  if (ua.includes('Android')) return 'Android'
  if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS'
  return 'Other'
}

/** Get all stored visits */
export function getVisitLog(): VisitEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

/** Record a new visit */
export function trackVisit(page = '/'): VisitEvent {
  const ua = navigator.userAgent
  const visit: VisitEvent = {
    id: generateId(),
    visitorId: getVisitorId(),
    timestamp: new Date().toISOString(),
    page,
    userAgent: ua,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    language: navigator.language,
    referrer: document.referrer || 'direct',
    device: detectDevice(window.screen.width),
    browser: detectBrowser(ua),
    os: detectOS(ua),
  }

  const log = getVisitLog()
  log.push(visit)
  // Keep last 10,000 entries to avoid storage bloat
  const trimmed = log.slice(-10000)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))

  return visit
}

/** Clear all visit logs */
export function clearVisitLog(): void {
  localStorage.removeItem(STORAGE_KEY)
}

/** Get unique visitor count */
export function getUniqueVisitors(visits: VisitEvent[]): number {
  return new Set(visits.map(v => v.visitorId)).size
}
