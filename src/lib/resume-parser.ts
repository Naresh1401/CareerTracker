/* ── Resume Parser ──
   Heuristic-based parsing of plain-text resumes into structured sections.
*/

export interface ParsedSection {
  heading: string
  content: string
}

export interface ParsedResume {
  contact: {
    name: string
    email: string
    phone: string
    linkedin: string
    github: string
    portfolio: string
    location: string
  }
  summary: string
  skills: string[]
  experience: {
    title: string
    company: string
    duration: string
    bullets: string[]
  }[]
  education: {
    degree: string
    institution: string
    year: string
    details: string
  }[]
  projects: {
    name: string
    description: string
    tech: string[]
  }[]
  certifications: string[]
  rawSections: ParsedSection[]
}

/* ── Section heading patterns ── */
const SECTION_PATTERNS: [RegExp, string][] = [
  [/^(?:professional\s+)?summary|^(?:career\s+)?objective|^about\s*me|^profile/i, 'summary'],
  [/^(?:technical\s+)?skills|^core\s+competencies|^technologies|^tech\s+stack|^tools/i, 'skills'],
  [/^(?:work\s+)?experience|^employment|^work\s+history|^professional\s+experience/i, 'experience'],
  [/^education|^academic/i, 'education'],
  [/^projects?|^personal\s+projects?|^key\s+projects?/i, 'projects'],
  [/^certifications?|^licenses?|^accreditations?/i, 'certifications'],
  [/^contact|^personal\s+(?:info|details)/i, 'contact'],
  [/^publications?|^papers?/i, 'publications'],
  [/^awards?|^honors?|^achievements?/i, 'awards'],
  [/^languages?/i, 'languages'],
  [/^volunteer|^community/i, 'volunteer'],
  [/^interests?|^hobbies?/i, 'interests'],
  [/^references?/i, 'references'],
]

function isHeading(line: string): string | null {
  const trimmed = line.replace(/^[#\-=*\s]+/, '').replace(/[:\-=*\s]+$/, '').trim()
  if (!trimmed || trimmed.length > 60) return null
  for (const [pattern, section] of SECTION_PATTERNS) {
    if (pattern.test(trimmed)) return section
  }
  // Generic heading detection: all caps, short line
  if (/^[A-Z\s&]+$/.test(trimmed) && trimmed.length >= 3 && trimmed.length <= 40) {
    return trimmed.toLowerCase()
  }
  return null
}

/* ── Contact extraction ── */
const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.]+/
const PHONE_RE = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/
const LINKEDIN_RE = /(?:linkedin\.com\/in\/[\w-]+)/i
const GITHUB_RE = /(?:github\.com\/[\w-]+)/i
const URL_RE = /https?:\/\/[^\s]+/gi

function extractContact(text: string): ParsedResume['contact'] {
  const lines = text.split('\n').slice(0, 10) // Contact info is usually at the top
  const topBlock = lines.join(' ')

  const email = topBlock.match(EMAIL_RE)?.[0] || ''
  const phone = topBlock.match(PHONE_RE)?.[0] || ''
  const linkedin = topBlock.match(LINKEDIN_RE)?.[0] || ''
  const github = topBlock.match(GITHUB_RE)?.[0] || ''

  const urls = topBlock.match(URL_RE) || []
  const portfolio = urls.find(u => !u.includes('linkedin') && !u.includes('github')) || ''

  // Name is typically the first non-empty line
  const name = lines.find(l => l.trim().length > 0 && !EMAIL_RE.test(l) && !PHONE_RE.test(l.trim()))?.trim() || ''

  // Rough location extraction
  const locationPatterns = [
    /(?:^|\s)([\w\s]+,\s*[A-Z]{2}(?:\s+\d{5})?)/,
    /(?:^|\s)([A-Z][\w\s]+,\s*[A-Z][\w\s]+)/,
  ]
  let location = ''
  for (const pat of locationPatterns) {
    const m = topBlock.match(pat)
    if (m && m[1].length < 50) { location = m[1].trim(); break }
  }

  return { name, email, phone, linkedin, github, portfolio, location }
}

/* ── Skills extraction ── */
function extractSkills(content: string): string[] {
  return content
    .split(/[,\n|•·▪►◆\-]/)
    .map(s => s.replace(/^\s*[-•*]\s*/, '').trim())
    .filter(s => s.length > 1 && s.length < 60)
}

/* ── Experience extraction ── */
function extractExperience(content: string): ParsedResume['experience'] {
  const entries: ParsedResume['experience'] = []
  const lines = content.split('\n').filter(l => l.trim())

  let current: ParsedResume['experience'][0] | null = null

  for (const line of lines) {
    const trimmed = line.trim()

    // Duration pattern (e.g., "Jan 2022 - Present", "2021–2023", "March 2020 - Dec 2021")
    const durationMatch = trimmed.match(
      /(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}|(?:\d{4}))\s*[-–—to]+\s*(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}|\d{4}|Present|Current)/i
    )

    // Check if this line looks like a title/company header
    const isBullet = /^[-•*▪►◆]/.test(trimmed)
    const isShortNonBullet = !isBullet && trimmed.length < 120

    if (!isBullet && isShortNonBullet && (durationMatch || (!current && trimmed.length > 3))) {
      if (current) entries.push(current)

      // Try to split title | company
      const parts = trimmed.replace(durationMatch?.[0] || '', '').split(/\s*[|@–—,]\s*/)
      current = {
        title: parts[0]?.trim() || trimmed,
        company: parts[1]?.trim() || '',
        duration: durationMatch?.[0] || '',
        bullets: [],
      }
    } else if (current && isBullet) {
      current.bullets.push(trimmed.replace(/^[-•*▪►◆]\s*/, ''))
    } else if (current && trimmed.length > 20) {
      // Long non-bullet line probably belongs to bullets
      current.bullets.push(trimmed)
    }
  }
  if (current) entries.push(current)
  return entries
}

/* ── Education extraction ── */
function extractEducation(content: string): ParsedResume['education'] {
  const entries: ParsedResume['education'] = []
  const lines = content.split('\n').filter(l => l.trim())

  let current: ParsedResume['education'][0] | null = null

  for (const line of lines) {
    const trimmed = line.trim()
    const yearMatch = trimmed.match(/\b(20\d{2}|19\d{2})\b/)
    const degreeMatch = trimmed.match(
      /\b(B\.?S\.?|M\.?S\.?|B\.?A\.?|M\.?A\.?|Ph\.?D\.?|MBA|Bachelor|Master|Doctor|Associate|Diploma)/i
    )

    if (degreeMatch || (yearMatch && trimmed.length < 120)) {
      if (current) entries.push(current)
      current = {
        degree: trimmed,
        institution: '',
        year: yearMatch?.[0] || '',
        details: '',
      }
    } else if (current) {
      if (!current.institution && trimmed.length < 80) {
        current.institution = trimmed
      } else {
        current.details += (current.details ? '\n' : '') + trimmed
      }
    }
  }
  if (current) entries.push(current)
  return entries
}

/* ── Projects extraction ── */
function extractProjects(content: string): ParsedResume['projects'] {
  const projects: ParsedResume['projects'] = []
  const lines = content.split('\n').filter(l => l.trim())

  let current: ParsedResume['projects'][0] | null = null

  for (const line of lines) {
    const trimmed = line.trim()
    const isBullet = /^[-•*▪►◆]/.test(trimmed)

    if (!isBullet && trimmed.length < 100 && trimmed.length > 2) {
      if (current) projects.push(current)
      // Try to extract tech from parenthetical
      const techMatch = trimmed.match(/\(([^)]+)\)/)
      const tech = techMatch ? techMatch[1].split(/[,|]/).map(t => t.trim()).filter(Boolean) : []
      current = {
        name: trimmed.replace(/\([^)]*\)/, '').trim(),
        description: '',
        tech,
      }
    } else if (current) {
      const clean = trimmed.replace(/^[-•*▪►◆]\s*/, '')
      current.description += (current.description ? '\n' : '') + clean
      // Try to extract tech from "Technologies: ..." or "Tech Stack: ..."
      const techLine = clean.match(/(?:tech(?:nologies|stack)?|built with|tools?):\s*(.+)/i)
      if (techLine) {
        current.tech = techLine[1].split(/[,|]/).map(t => t.trim()).filter(Boolean)
      }
    }
  }
  if (current) projects.push(current)
  return projects
}

/** Parse raw resume text into structured data. */
export function parseResume(text: string): ParsedResume {
  const lines = text.split('\n')
  const sections: ParsedSection[] = []
  let currentSection: ParsedSection = { heading: '_preamble', content: '' }

  for (const line of lines) {
    const heading = isHeading(line)
    if (heading) {
      if (currentSection.content.trim()) sections.push(currentSection)
      currentSection = { heading, content: '' }
    } else {
      currentSection.content += line + '\n'
    }
  }
  if (currentSection.content.trim()) sections.push(currentSection)

  // Map sections to structured data
  const sectionMap = new Map<string, string>()
  for (const s of sections) {
    const existing = sectionMap.get(s.heading) || ''
    sectionMap.set(s.heading, existing + '\n' + s.content)
  }

  const contact = extractContact(text)
  const summary = (sectionMap.get('summary') || sectionMap.get('profile') || '').trim()
  const skills = extractSkills(sectionMap.get('skills') || '')
  const experience = extractExperience(sectionMap.get('experience') || '')
  const education = extractEducation(sectionMap.get('education') || '')
  const projects = extractProjects(sectionMap.get('projects') || '')
  const certifications = (sectionMap.get('certifications') || '')
    .split('\n')
    .map(l => l.replace(/^[-•*]\s*/, '').trim())
    .filter(l => l.length > 2)

  return {
    contact,
    summary,
    skills,
    experience,
    education,
    projects,
    certifications,
    rawSections: sections,
  }
}

/** Reconstruct plain text from a ParsedResume. */
export function resumeToText(parsed: ParsedResume): string {
  const lines: string[] = []

  // Contact
  if (parsed.contact.name) lines.push(parsed.contact.name)
  const contactLine = [parsed.contact.email, parsed.contact.phone, parsed.contact.location]
    .filter(Boolean).join(' | ')
  if (contactLine) lines.push(contactLine)
  const links = [parsed.contact.linkedin, parsed.contact.github, parsed.contact.portfolio]
    .filter(Boolean).join(' | ')
  if (links) lines.push(links)
  lines.push('')

  // Summary
  if (parsed.summary) {
    lines.push('PROFESSIONAL SUMMARY')
    lines.push(parsed.summary, '')
  }

  // Skills
  if (parsed.skills.length > 0) {
    lines.push('SKILLS')
    lines.push(parsed.skills.join(', '), '')
  }

  // Experience
  if (parsed.experience.length > 0) {
    lines.push('EXPERIENCE')
    for (const exp of parsed.experience) {
      const header = [exp.title, exp.company].filter(Boolean).join(' | ')
      lines.push(header + (exp.duration ? ` (${exp.duration})` : ''))
      for (const b of exp.bullets) lines.push(`• ${b}`)
      lines.push('')
    }
  }

  // Projects
  if (parsed.projects.length > 0) {
    lines.push('PROJECTS')
    for (const proj of parsed.projects) {
      lines.push(proj.name + (proj.tech.length ? ` (${proj.tech.join(', ')})` : ''))
      if (proj.description) lines.push(proj.description)
      lines.push('')
    }
  }

  // Education
  if (parsed.education.length > 0) {
    lines.push('EDUCATION')
    for (const edu of parsed.education) {
      lines.push(edu.degree)
      if (edu.institution) lines.push(edu.institution)
      if (edu.details) lines.push(edu.details)
      lines.push('')
    }
  }

  // Certifications
  if (parsed.certifications.length > 0) {
    lines.push('CERTIFICATIONS')
    for (const c of parsed.certifications) lines.push(`• ${c}`)
    lines.push('')
  }

  return lines.join('\n').trim()
}
