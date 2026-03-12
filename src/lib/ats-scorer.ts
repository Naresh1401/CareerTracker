/* ── Comprehensive ATS Scorer ──
   12-category ATS analysis with detailed per-category breakdowns.
*/

import type { ParsedResume } from './resume-parser'

/* ── Types ── */

export interface ATSCategoryScore {
  name: string
  score: number          // 0-100
  maxScore: number       // weight in final score
  details: string[]      // what was found / what's missing
  status: 'excellent' | 'good' | 'needs-work' | 'poor'
}

export interface ATSScoreResult {
  overallScore: number
  categories: ATSCategoryScore[]
  matchedKeywords: string[]
  missingKeywords: string[]
  strongBullets: string[]
  weakBullets: string[]
  suggestions: string[]
}

/* ── Constants ── */

const ACTION_VERBS = new Set([
  'achieved', 'built', 'created', 'delivered', 'developed', 'designed', 'drove',
  'engineered', 'established', 'executed', 'expanded', 'generated', 'grew',
  'implemented', 'improved', 'increased', 'initiated', 'launched', 'led',
  'managed', 'mentored', 'negotiated', 'optimized', 'orchestrated', 'pioneered',
  'reduced', 'refactored', 'resolved', 'scaled', 'spearheaded', 'streamlined',
  'transformed', 'automated', 'architected', 'collaborated', 'contributed',
  'configured', 'constructed', 'coordinated', 'customized', 'debugged',
  'defined', 'deployed', 'documented', 'enhanced', 'evaluated', 'facilitated',
  'formulated', 'founded', 'integrated', 'leveraged', 'maintained', 'migrated',
  'modernized', 'monitored', 'overhauled', 'performed', 'planned', 'presented',
  'produced', 'programmed', 'proposed', 'provided', 'published', 'recommended',
  'recruited', 'redesigned', 'revamped', 'reviewed', 'simplified', 'supervised',
  'supported', 'tested', 'trained', 'troubleshot', 'upgraded', 'utilized',
])

const QUANTIFIER_RE = /\b(\d+[\d,]*%?|\$[\d,]+[KkMmBb]?|\d+x|\d+\+)\b/

const STOP_WORDS = new Set([
  'the','be','to','of','and','a','in','that','have','i','it','for','not','on',
  'with','as','you','do','at','this','but','by','from','they','we','or','an',
  'will','my','one','all','would','there','their','what','so','up','out','if',
  'about','who','get','which','go','me','when','make','can','like','time','no',
  'just','know','take','people','into','your','good','some','could','them','see',
  'other','than','then','now','look','only','come','its','over','think','also',
  'back','after','use','two','how','our','work','first','well','way','even','new',
  'want','because','any','these','give','day','most','us','are','is','was','were',
  'been','has','had','may','must','should','shall','being','able','such','each',
  'per','more','very','need','great','own','key','part','both','much','before','too',
  'same','right','still','find','here','thing','many','those','long','start',
  'against','place','every','keep','help','through','set','while','why','let',
  'off','turn','end','move','show','might','try','below','above','including',
  'within','across','between','under','without','along','during','around',
  'experience','working','role','team','strong','understanding','ability',
  'skills','required','preferred','minimum','years','looking','join','build',
  'develop','company','job','position','candidate','ideal','opportunity',
  'responsibilities','qualifications','requirements','description','benefits',
  'salary','location','apply','please','submit','resume','cover','letter',
  'plus','bonus','equivalent','degree','bachelor','master','phd','related',
])

const TECH_PHRASES: string[] = [
  'machine learning','deep learning','neural network','natural language processing',
  'computer vision','large language model','generative ai','prompt engineering',
  'retrieval augmented generation','vector database','reinforcement learning',
  'transfer learning','few-shot learning','model training','model deployment',
  'feature engineering','data pipeline','sentiment analysis','text generation',
  'image generation','speech recognition','object detection','semantic search',
  'knowledge graph','diffusion model','attention mechanism','responsible ai',
  'ai safety','ai ethics','conversational ai','spring boot','ruby on rails',
  'react native','next.js','vue.js','node.js','asp.net','amazon web services',
  'google cloud','azure devops','cloud computing','infrastructure as code',
  'continuous integration','continuous deployment','ci/cd','data science',
  'data engineering','data analysis','big data','data warehouse','data lake',
  'data modeling','etl pipeline','real-time processing','stream processing',
  'version control','load balancing','container orchestration',
  'microservices architecture','event driven','serverless computing',
  'api gateway','service mesh','agile methodology','scrum master',
  'product owner','sprint planning','user stories','test driven development',
  'pair programming','code review','design patterns','project management',
  'system design','distributed systems','high availability','fault tolerance',
  'performance optimization','mobile development','web development',
  'full stack','front end','back end','cross functional','problem solving',
  'critical thinking','open source','rest api','unit testing','integration testing',
]

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^\w\s+#./\-]/g, ' ').replace(/\s+/g, ' ').trim()
}

function extractJDKeywords(jdText: string): string[] {
  const normalized = normalize(jdText)
  const keywords = new Set<string>()

  for (const phrase of TECH_PHRASES) {
    if (normalized.includes(phrase)) keywords.add(phrase)
  }

  const words = normalized.split(/\s+/)
  for (const word of words) {
    if (word.length > 2 && !STOP_WORDS.has(word)) keywords.add(word)
  }

  const acronyms = jdText.match(/\b[A-Z][A-Z0-9+#]{1,10}\b/g) || []
  for (const acr of acronyms) keywords.add(acr.toLowerCase())

  return [...keywords]
}

/* ── Category Scorers ── */

function scoreContact(parsed: ParsedResume): ATSCategoryScore {
  const details: string[] = []
  let score = 0

  if (parsed.contact.name) { score += 20; details.push('✓ Name found') }
  else details.push('✗ Name not detected')

  if (parsed.contact.email) { score += 25; details.push('✓ Email found') }
  else details.push('✗ Email missing')

  if (parsed.contact.phone) { score += 20; details.push('✓ Phone found') }
  else details.push('✗ Phone missing')

  if (parsed.contact.linkedin) { score += 15; details.push('✓ LinkedIn found') }
  else details.push('✗ LinkedIn missing')

  if (parsed.contact.github || parsed.contact.portfolio) { score += 10; details.push('✓ Portfolio/GitHub found') }
  else details.push('○ No portfolio/GitHub link')

  if (parsed.contact.location) { score += 10; details.push('✓ Location found') }
  else details.push('○ Location missing')

  return {
    name: 'Contact Information',
    score,
    maxScore: 5,
    details,
    status: score >= 80 ? 'excellent' : score >= 60 ? 'good' : score >= 40 ? 'needs-work' : 'poor',
  }
}

function scoreSummary(parsed: ParsedResume): ATSCategoryScore {
  const details: string[] = []
  let score = 0

  if (!parsed.summary) {
    details.push('✗ No professional summary found')
    return { name: 'Professional Summary', score: 0, maxScore: 10, details, status: 'poor' }
  }

  const words = parsed.summary.split(/\s+/).length
  if (words >= 30 && words <= 100) { score += 40; details.push(`✓ Good length (${words} words)`) }
  else if (words > 0) { score += 15; details.push(`○ Summary length is ${words} words (aim for 30-100)`) }

  if (QUANTIFIER_RE.test(parsed.summary)) { score += 20; details.push('✓ Contains quantified achievements') }
  else details.push('○ Add quantified achievements (e.g., "5+ years", "$2M revenue")')

  const summaryLower = parsed.summary.toLowerCase()
  const hasActionVerb = [...ACTION_VERBS].some(v => summaryLower.includes(v))
  if (hasActionVerb) { score += 20; details.push('✓ Uses action verbs') }
  else details.push('○ Use strong action verbs in your summary')

  if (parsed.summary.length > 50) { score += 20; details.push('✓ Sufficiently detailed') }
  else details.push('○ Add more detail to your summary')

  return { name: 'Professional Summary', score, maxScore: 10, details, status: score >= 80 ? 'excellent' : score >= 60 ? 'good' : score >= 40 ? 'needs-work' : 'poor' }
}

function scoreSkillsSection(parsed: ParsedResume): ATSCategoryScore {
  const details: string[] = []
  let score = 0

  if (parsed.skills.length === 0) {
    details.push('✗ No skills section found')
    return { name: 'Skills Section', score: 0, maxScore: 10, details, status: 'poor' }
  }

  if (parsed.skills.length >= 8) { score += 40; details.push(`✓ ${parsed.skills.length} skills listed`) }
  else { score += 15; details.push(`○ Only ${parsed.skills.length} skills (aim for 8+)`) }

  // Check for mix of hard and soft skills
  const lower = parsed.skills.map(s => s.toLowerCase())
  const softSkillWords = ['communication', 'leadership', 'teamwork', 'collaboration', 'problem-solving', 'analytical']
  const hasSoft = softSkillWords.some(s => lower.some(sk => sk.includes(s)))
  const hasTech = lower.some(s => /\b(python|java|react|aws|docker|sql|kubernetes|node|typescript)\b/i.test(s))

  if (hasTech) { score += 30; details.push('✓ Technical skills present') }
  else details.push('○ Add specific technical skills')

  if (hasSoft) { score += 15; details.push('✓ Includes soft skills') }
  else details.push('○ Consider adding relevant soft skills')

  score += 15 // bonus for having a section at all
  details.push('✓ Skills section present')

  return { name: 'Skills Section', score: Math.min(100, score), maxScore: 10, details, status: score >= 80 ? 'excellent' : score >= 60 ? 'good' : score >= 40 ? 'needs-work' : 'poor' }
}

function scoreKeywordMatch(resumeText: string, jdKeywords: string[]): { category: ATSCategoryScore; matched: string[]; missing: string[] } {
  if (jdKeywords.length === 0) {
    return {
      category: { name: 'Keyword Match', score: 0, maxScore: 20, details: ['No job description provided'], status: 'poor' },
      matched: [],
      missing: [],
    }
  }

  const normalized = normalize(resumeText)
  const matched: string[] = []
  const missing: string[] = []

  for (const kw of jdKeywords) {
    if (normalized.includes(kw)) matched.push(kw)
    else missing.push(kw)
  }

  const ratio = matched.length / jdKeywords.length
  const score = Math.round(ratio * 100)
  const details = [
    `${matched.length}/${jdKeywords.length} keywords matched (${score}%)`,
    ...(missing.slice(0, 5).length > 0 ? [`Top missing: ${missing.slice(0, 5).join(', ')}`] : []),
  ]

  return {
    category: { name: 'Keyword Match', score, maxScore: 20, details, status: score >= 80 ? 'excellent' : score >= 60 ? 'good' : score >= 40 ? 'needs-work' : 'poor' },
    matched,
    missing,
  }
}

function scoreExperience(parsed: ParsedResume): ATSCategoryScore {
  const details: string[] = []
  let score = 0

  if (parsed.experience.length === 0) {
    details.push('✗ No experience section found')
    return { name: 'Experience', score: 0, maxScore: 15, details, status: 'poor' }
  }

  score += 20
  details.push(`✓ ${parsed.experience.length} position(s) listed`)

  // Check for bullet points
  const totalBullets = parsed.experience.reduce((sum, e) => sum + e.bullets.length, 0)
  if (totalBullets >= 6) { score += 20; details.push(`✓ ${totalBullets} bullet points across positions`) }
  else if (totalBullets > 0) { score += 10; details.push(`○ Only ${totalBullets} bullets (aim for 3-5 per role)`) }
  else details.push('✗ No bullet points found')

  // Check for durations
  const withDuration = parsed.experience.filter(e => e.duration).length
  if (withDuration === parsed.experience.length) { score += 15; details.push('✓ All positions have dates') }
  else if (withDuration > 0) { score += 8; details.push(`○ ${withDuration}/${parsed.experience.length} positions have dates`) }
  else details.push('✗ No dates found on positions')

  // Check for company names
  const withCompany = parsed.experience.filter(e => e.company).length
  if (withCompany > 0) { score += 15; details.push('✓ Company names present') }
  else details.push('○ Include company names')

  // Check for titles
  const withTitle = parsed.experience.filter(e => e.title && e.title.length > 3).length
  if (withTitle > 0) { score += 15; details.push('✓ Job titles present') }

  score += 15 // Section exists
  return { name: 'Experience', score: Math.min(100, score), maxScore: 15, details, status: score >= 80 ? 'excellent' : score >= 60 ? 'good' : score >= 40 ? 'needs-work' : 'poor' }
}

function scoreEducation(parsed: ParsedResume): ATSCategoryScore {
  const details: string[] = []
  let score = 0

  if (parsed.education.length === 0) {
    details.push('✗ No education section found')
    return { name: 'Education', score: 0, maxScore: 5, details, status: 'poor' }
  }

  score += 50
  details.push(`✓ ${parsed.education.length} entry/entries found`)

  const hasYear = parsed.education.some(e => e.year)
  if (hasYear) { score += 25; details.push('✓ Graduation year included') }
  else details.push('○ Add graduation year')

  const hasDegree = parsed.education.some(e =>
    /\b(B\.?S\.?|M\.?S\.?|B\.?A\.?|M\.?A\.?|Ph\.?D\.?|MBA|Bachelor|Master|Doctor|Diploma)/i.test(e.degree)
  )
  if (hasDegree) { score += 25; details.push('✓ Degree type specified') }
  else details.push('○ Specify degree type')

  return { name: 'Education', score, maxScore: 5, details, status: score >= 80 ? 'excellent' : score >= 60 ? 'good' : score >= 40 ? 'needs-work' : 'poor' }
}

function scoreFormatting(text: string): ATSCategoryScore {
  const details: string[] = []
  let score = 0
  const lines = text.split('\n')

  // Check length
  const words = text.split(/\s+/).length
  if (words >= 200 && words <= 800) { score += 25; details.push(`✓ Good length (${words} words)`) }
  else if (words < 200) { score += 10; details.push(`○ Too short (${words} words, aim for 300+)`) }
  else { score += 15; details.push(`○ Long (${words} words, consider trimming to 1-2 pages)`) }

  // Check for consistent formatting
  const bulletLines = lines.filter(l => /^\s*[-•*▪►]/.test(l)).length
  if (bulletLines >= 4) { score += 25; details.push('✓ Uses bullet points consistently') }
  else if (bulletLines > 0) { score += 10; details.push('○ Few bullets — use more for readability') }
  else details.push('○ No bullet points found')

  // Check for sections
  const sectionHeaders = lines.filter(l => /^[A-Z\s]{3,30}$/.test(l.trim()) || /^#+\s/.test(l)).length
  if (sectionHeaders >= 3) { score += 25; details.push(`✓ ${sectionHeaders} section headers found`) }
  else if (sectionHeaders > 0) { score += 10; details.push(`○ Only ${sectionHeaders} sections (aim for 4+)`) }
  else details.push('○ No clear section headers')

  // Check for no complex formatting indicators
  const hasTable = text.includes('|') && lines.filter(l => l.includes('|')).length > 2
  if (!hasTable) { score += 25; details.push('✓ No table formatting (ATS-friendly)') }
  else details.push('✗ Contains table formatting (may confuse ATS)')

  return { name: 'Formatting', score, maxScore: 5, details, status: score >= 80 ? 'excellent' : score >= 60 ? 'good' : score >= 40 ? 'needs-work' : 'poor' }
}

function scoreActionVerbs(parsed: ParsedResume): ATSCategoryScore {
  const allBullets = parsed.experience.flatMap(e => e.bullets)
  if (allBullets.length === 0) {
    return { name: 'Action Verbs', score: 0, maxScore: 5, details: ['No bullet points to analyze'], status: 'poor' }
  }

  let verbCount = 0
  const details: string[] = []
  const strongBullets: string[] = []
  const weakBullets: string[] = []

  for (const bullet of allBullets) {
    const firstWord = bullet.trim().split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, '')
    if (firstWord && ACTION_VERBS.has(firstWord)) {
      verbCount++
      strongBullets.push(bullet)
    } else {
      weakBullets.push(bullet)
    }
  }

  const ratio = verbCount / allBullets.length
  const score = Math.round(ratio * 100)

  details.push(`${verbCount}/${allBullets.length} bullets start with action verbs (${score}%)`)
  if (weakBullets.length > 0 && weakBullets.length <= 3) {
    details.push(`Weak starts: "${weakBullets[0]?.slice(0, 50)}…"`)
  }

  return {
    name: 'Action Verbs',
    score,
    maxScore: 5,
    details,
    status: score >= 80 ? 'excellent' : score >= 60 ? 'good' : score >= 40 ? 'needs-work' : 'poor',
  }
}

function scoreQuantifiedImpact(parsed: ParsedResume): ATSCategoryScore {
  const allBullets = parsed.experience.flatMap(e => e.bullets)
  const allText = [...allBullets, parsed.summary].join(' ')

  if (allBullets.length === 0) {
    return { name: 'Quantified Impact', score: 0, maxScore: 10, details: ['No bullets to analyze'], status: 'poor' }
  }

  let quantified = 0
  for (const bullet of allBullets) {
    if (QUANTIFIER_RE.test(bullet)) quantified++
  }

  const ratio = allBullets.length > 0 ? quantified / allBullets.length : 0
  const score = Math.min(100, Math.round(ratio * 100 * 1.5)) // boost slightly since any quantification is good

  const details = [
    `${quantified}/${allBullets.length} bullets contain metrics/numbers`,
  ]

  if (quantified === 0) {
    details.push('Add numbers: "Improved latency by 40%", "Led team of 5", "Served 10K+ users"')
  }

  // Check for dollar signs, percentages
  if (/\$[\d,]+/.test(allText)) details.push('✓ Includes dollar amounts')
  if (/\d+%/.test(allText)) details.push('✓ Includes percentage improvements')

  return {
    name: 'Quantified Impact',
    score,
    maxScore: 10,
    details,
    status: score >= 80 ? 'excellent' : score >= 60 ? 'good' : score >= 40 ? 'needs-work' : 'poor',
  }
}

function scoreRoleAlignment(resumeText: string, jdText: string): ATSCategoryScore {
  if (!jdText.trim()) {
    return { name: 'Role Alignment', score: 50, maxScore: 10, details: ['No job description provided for alignment check'], status: 'needs-work' }
  }

  // Extract likely role title from JD
  const jdLines = jdText.split('\n').slice(0, 5)
  const jdLower = jdText.toLowerCase()
  const resumeLower = resumeText.toLowerCase()
  const details: string[] = []
  let score = 0

  // Check if the JD role title appears in resume
  const titlePatterns = jdLines
    .map(l => l.trim())
    .filter(l => l.length > 3 && l.length < 80)
    .slice(0, 2)

  for (const title of titlePatterns) {
    if (resumeLower.includes(title.toLowerCase())) {
      score += 30
      details.push(`✓ Role title "${title.slice(0, 40)}" found in resume`)
      break
    }
  }

  // Check for years of experience alignment
  const jdYearsMatch = jdText.match(/(\d+)\+?\s*(?:years?|yrs?)\s+(?:of\s+)?(?:experience|exp)/i)
  const resumeYearsMatch = resumeText.match(/(\d+)\+?\s*(?:years?|yrs?)\s+(?:of\s+)?(?:experience|exp)/i)

  if (jdYearsMatch && resumeYearsMatch) {
    const jdYears = parseInt(jdYearsMatch[1])
    const resumeYears = parseInt(resumeYearsMatch[1])
    if (resumeYears >= jdYears) { score += 30; details.push(`✓ Experience ${resumeYears}yr meets requirement ${jdYears}yr`) }
    else { score += 10; details.push(`○ Resume shows ${resumeYears}yr experience, JD asks for ${jdYears}yr`) }
  }

  // Check for key responsibilities overlap
  const keyTerms = ['lead', 'manage', 'design', 'architect', 'implement', 'develop', 'maintain', 'optimize', 'scale', 'deploy']
  let termOverlap = 0
  for (const term of keyTerms) {
    if (jdLower.includes(term) && resumeLower.includes(term)) termOverlap++
  }
  if (termOverlap >= 4) { score += 40; details.push(`✓ Strong responsibility alignment (${termOverlap}/10 key terms)`) }
  else if (termOverlap >= 2) { score += 20; details.push(`○ Partial alignment (${termOverlap}/10 key terms)`) }
  else details.push(`✗ Weak alignment (${termOverlap}/10 responsibility terms)`)

  return { name: 'Role Alignment', score: Math.min(100, score), maxScore: 10, details, status: score >= 80 ? 'excellent' : score >= 60 ? 'good' : score >= 40 ? 'needs-work' : 'poor' }
}

function scoreSectionCompleteness(parsed: ParsedResume): ATSCategoryScore {
  const details: string[] = []
  const requiredSections = [
    { name: 'Contact', present: Boolean(parsed.contact.email || parsed.contact.phone) },
    { name: 'Summary', present: Boolean(parsed.summary) },
    { name: 'Skills', present: parsed.skills.length > 0 },
    { name: 'Experience', present: parsed.experience.length > 0 },
    { name: 'Education', present: parsed.education.length > 0 },
  ]

  const optionalSections = [
    { name: 'Projects', present: parsed.projects.length > 0 },
    { name: 'Certifications', present: parsed.certifications.length > 0 },
  ]

  let score = 0
  const requiredPresent = requiredSections.filter(s => s.present).length
  score += (requiredPresent / requiredSections.length) * 80

  for (const s of requiredSections) {
    details.push(`${s.present ? '✓' : '✗'} ${s.name}`)
  }

  const optionalPresent = optionalSections.filter(s => s.present).length
  score += (optionalPresent / optionalSections.length) * 20

  for (const s of optionalSections) {
    details.push(`${s.present ? '✓' : '○'} ${s.name} (optional)`)
  }

  return {
    name: 'Section Completeness',
    score: Math.round(score),
    maxScore: 5,
    details,
    status: score >= 80 ? 'excellent' : score >= 60 ? 'good' : score >= 40 ? 'needs-work' : 'poor',
  }
}

/* ── Main Scorer ── */

export function scoreResume(
  resumeText: string,
  parsed: ParsedResume,
  jobDescription: string = '',
): ATSScoreResult {
  const jdKeywords = jobDescription ? extractJDKeywords(jobDescription) : []

  const categories: ATSCategoryScore[] = []

  // 1. Contact (5%)
  categories.push(scoreContact(parsed))

  // 2. Summary (10%)
  categories.push(scoreSummary(parsed))

  // 3. Skills (10%)
  categories.push(scoreSkillsSection(parsed))

  // 4. Keyword Match (20%)
  const kwResult = scoreKeywordMatch(resumeText, jdKeywords)
  categories.push(kwResult.category)

  // 5. Experience (15%)
  categories.push(scoreExperience(parsed))

  // 6. Education (5%)
  categories.push(scoreEducation(parsed))

  // 7. Formatting (5%)
  categories.push(scoreFormatting(resumeText))

  // 8. Action Verbs (5%)
  const avScore = scoreActionVerbs(parsed)
  categories.push(avScore)

  // 9. Quantified Impact (10%)
  categories.push(scoreQuantifiedImpact(parsed))

  // 10. Role Alignment (10%)
  categories.push(scoreRoleAlignment(resumeText, jobDescription))

  // 11. Section Completeness (5%)
  categories.push(scoreSectionCompleteness(parsed))

  // Compute weighted overall score
  const totalWeight = categories.reduce((s, c) => s + c.maxScore, 0)
  const weightedSum = categories.reduce((s, c) => s + (c.score / 100) * c.maxScore, 0)
  const overallScore = totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 100) : 0

  // Collect strong/weak bullets
  const allBullets = parsed.experience.flatMap(e => e.bullets)
  const strongBullets = allBullets.filter(b => {
    const first = b.trim().split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, '')
    return first && ACTION_VERBS.has(first) && QUANTIFIER_RE.test(b)
  })
  const weakBullets = allBullets.filter(b => {
    const first = b.trim().split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, '')
    return !first || (!ACTION_VERBS.has(first) && !QUANTIFIER_RE.test(b))
  }).slice(0, 5)

  // Build suggestions
  const suggestions = buildSuggestions(categories, kwResult.missing)

  return {
    overallScore,
    categories,
    matchedKeywords: kwResult.matched,
    missingKeywords: kwResult.missing,
    strongBullets,
    weakBullets,
    suggestions,
  }
}

function buildSuggestions(categories: ATSCategoryScore[], missingKeywords: string[]): string[] {
  const suggestions: string[] = []
  const poorCats = categories.filter(c => c.status === 'poor')
  const needsWork = categories.filter(c => c.status === 'needs-work')

  if (poorCats.length > 0) {
    suggestions.push(`Critical gaps in: ${poorCats.map(c => c.name).join(', ')}. Address these first.`)
  }
  if (needsWork.length > 0) {
    suggestions.push(`Improve: ${needsWork.map(c => c.name).join(', ')}.`)
  }

  const kwCat = categories.find(c => c.name === 'Keyword Match')
  if (kwCat && kwCat.score < 60 && missingKeywords.length > 0) {
    const top = missingKeywords.filter(k => k.length > 3).slice(0, 8)
    if (top.length > 0) suggestions.push(`Add missing keywords: ${top.join(', ')}`)
  }

  const avCat = categories.find(c => c.name === 'Action Verbs')
  if (avCat && avCat.score < 60) {
    suggestions.push('Start bullet points with strong action verbs (e.g., Built, Designed, Optimized, Led).')
  }

  const qiCat = categories.find(c => c.name === 'Quantified Impact')
  if (qiCat && qiCat.score < 60) {
    suggestions.push('Quantify achievements: add percentages, dollar amounts, team sizes, or user counts.')
  }

  const sumCat = categories.find(c => c.name === 'Professional Summary')
  if (sumCat && sumCat.score < 40) {
    suggestions.push('Add a professional summary (30-100 words) highlighting your key strengths and target role.')
  }

  if (suggestions.length === 0) {
    suggestions.push('Your resume is well-optimized! Review the category details for minor improvements.')
  }

  suggestions.push('Use exact phrases from the JD where possible — ATS systems match exact terms.')
  suggestions.push('Include both abbreviations and full forms (e.g., "ML" and "Machine Learning").')

  return suggestions
}
