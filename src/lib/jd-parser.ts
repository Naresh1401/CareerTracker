/* ── Job Description Parser ──
   Extract structured signals from a raw job description.
*/

export interface ParsedJD {
  title: string
  company: string
  location: string
  workMode: 'Remote' | 'Hybrid' | 'Onsite' | ''
  yearsRequired: number | null
  requiredSkills: string[]
  preferredSkills: string[]
  tools: string[]
  softSkills: string[]
  responsibilities: string[]
  qualifications: string[]
  keywords: string[]
  salaryRange: string
}

/* ── Known tool/tech sets ── */
const KNOWN_TOOLS = new Set([
  'python', 'java', 'javascript', 'typescript', 'c++', 'c#', 'go', 'rust', 'ruby', 'scala',
  'kotlin', 'swift', 'php', 'r', 'matlab', 'sql', 'nosql', 'graphql',
  'react', 'angular', 'vue', 'svelte', 'next.js', 'nuxt', 'remix', 'gatsby',
  'node.js', 'express', 'fastapi', 'django', 'flask', 'spring', 'rails',
  'aws', 'gcp', 'azure', 'docker', 'kubernetes', 'terraform', 'ansible',
  'jenkins', 'github actions', 'gitlab ci', 'circleci',
  'postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch', 'dynamodb',
  'kafka', 'rabbitmq', 'spark', 'airflow', 'snowflake', 'databricks',
  'pytorch', 'tensorflow', 'keras', 'scikit-learn', 'pandas', 'numpy',
  'langchain', 'llamaindex', 'huggingface', 'openai', 'pinecone', 'weaviate',
  'chromadb', 'faiss', 'mlflow', 'wandb', 'dvc', 'sagemaker',
  'figma', 'sketch', 'adobe xd', 'postman', 'swagger',
  'jira', 'confluence', 'notion', 'linear', 'asana',
  'git', 'linux', 'nginx', 'webpack', 'vite', 'babel',
  'jest', 'cypress', 'playwright', 'selenium', 'pytest',
  'grafana', 'prometheus', 'datadog', 'splunk', 'sentry',
  'tableau', 'power bi', 'looker', 'metabase',
  'vercel', 'netlify', 'heroku', 'firebase', 'supabase',
  'prisma', 'drizzle', 'sequelize', 'typeorm',
  'redux', 'zustand', 'mobx', 'rxjs',
  'tailwind', 'bootstrap', 'material ui', 'chakra ui',
  'rest api', 'grpc', 'websocket',
])

const SOFT_SKILLS = new Set([
  'communication', 'leadership', 'teamwork', 'collaboration', 'mentoring',
  'problem solving', 'critical thinking', 'analytical', 'creative', 'strategic',
  'initiative', 'adaptability', 'flexibility', 'self-motivated', 'proactive',
  'innovative', 'empathetic', 'negotiation', 'presentation', 'organized',
  'detail-oriented', 'time management', 'multitasking', 'interpersonal',
  'decision making', 'conflict resolution', 'stakeholder management',
  'cross-functional', 'agile', 'fast-paced', 'independent',
])

const TECH_PHRASES = [
  'machine learning', 'deep learning', 'neural network', 'natural language processing',
  'computer vision', 'large language model', 'generative ai', 'prompt engineering',
  'retrieval augmented generation', 'vector database', 'reinforcement learning',
  'data pipeline', 'etl pipeline', 'ci/cd', 'infrastructure as code',
  'microservices', 'event driven', 'serverless', 'distributed systems',
  'system design', 'full stack', 'front end', 'back end', 'devops',
  'data science', 'data engineering', 'data analysis', 'cloud computing',
  'container orchestration', 'api gateway', 'service mesh',
  'real-time processing', 'stream processing', 'model deployment',
  'feature engineering', 'test driven development', 'continuous integration',
]

/* ── Section detection ── */
const SECTION_PATTERNS: [RegExp, string][] = [
  [/^(?:about|overview|description|who we are|the role|the opportunity)/i, 'description'],
  [/^(?:responsibilities|what you.?ll do|duties|key responsibilities|your role)/i, 'responsibilities'],
  [/^(?:requirements|qualifications|what (?:you|we) (?:need|require|look)|must have|minimum)/i, 'requirements'],
  [/^(?:preferred|nice to have|bonus|desired|ideal|plus|good to have)/i, 'preferred'],
  [/^(?:benefits|perks|what we offer|compensation|salary)/i, 'benefits'],
  [/^(?:about (?:the )?company|about us|who we are)/i, 'company'],
  [/^(?:skills|technical skills|tech stack|technologies)/i, 'skills'],
]

function detectSection(line: string): string | null {
  const clean = line.replace(/^[#*\-=\s]+/, '').replace(/[:*\-=\s]+$/, '').trim()
  if (!clean || clean.length > 80) return null
  for (const [pat, section] of SECTION_PATTERNS) {
    if (pat.test(clean)) return section
  }
  return null
}

/* ── Main parser ── */
export function parseJobDescription(text: string): ParsedJD {
  const lines = text.split('\n')
  const lower = text.toLowerCase()

  // Extract title (usually first meaningful line)
  const title = lines.find(l => l.trim().length > 3 && l.trim().length < 100)?.trim() || ''

  // Extract company
  let company = ''
  const companyPatterns = [
    /(?:at|@|for)\s+([A-Z][\w\s&.]+?)(?:\s*[-–|,]|\s*$)/m,
    /^([A-Z][\w\s&.]+?)(?:\s+is\s+(?:looking|seeking|hiring))/m,
  ]
  for (const pat of companyPatterns) {
    const m = text.match(pat)
    if (m && m[1].length < 50) { company = m[1].trim(); break }
  }

  // Work mode
  let workMode: ParsedJD['workMode'] = ''
  if (/\bremote\b/i.test(lower)) workMode = 'Remote'
  else if (/\bhybrid\b/i.test(lower)) workMode = 'Hybrid'
  else if (/\bon[\s-]?site|in[\s-]?office\b/i.test(lower)) workMode = 'Onsite'

  // Location
  let location = ''
  const locMatch = text.match(/(?:location|based in|office in)[:\s]+([^\n]+)/i)
  if (locMatch) location = locMatch[1].trim().slice(0, 60)

  // Years of experience
  let yearsRequired: number | null = null
  const yearsMatch = text.match(/(\d+)\+?\s*(?:years?|yrs?)\s+(?:of\s+)?(?:experience|exp)/i)
  if (yearsMatch) yearsRequired = parseInt(yearsMatch[1])

  // Salary range
  let salaryRange = ''
  const salaryMatch = text.match(/\$[\d,]+[KkMm]?\s*[-–to]+\s*\$[\d,]+[KkMm]?/i)
  if (salaryMatch) salaryRange = salaryMatch[0]

  // Section-based parsing
  const sections = new Map<string, string[]>()
  let currentSection = 'description'

  for (const line of lines) {
    const section = detectSection(line)
    if (section) {
      currentSection = section
      if (!sections.has(currentSection)) sections.set(currentSection, [])
    } else if (line.trim()) {
      const arr = sections.get(currentSection) || []
      arr.push(line.trim())
      sections.set(currentSection, arr)
    }
  }

  // Extract responsibilities
  const responsibilities = (sections.get('responsibilities') || [])
    .map(l => l.replace(/^[-•*▪►◆\d.)\s]+/, '').trim())
    .filter(l => l.length > 10)

  // Extract qualifications (requirements + skills)
  const qualifications = [
    ...(sections.get('requirements') || []),
    ...(sections.get('skills') || []),
  ].map(l => l.replace(/^[-•*▪►◆\d.)\s]+/, '').trim())
    .filter(l => l.length > 5)

  // Extract tools
  const tools: string[] = []
  for (const tool of KNOWN_TOOLS) {
    if (lower.includes(tool)) tools.push(tool)
  }
  for (const phrase of TECH_PHRASES) {
    if (lower.includes(phrase) && !tools.includes(phrase)) tools.push(phrase)
  }

  // Extract soft skills
  const softSkills: string[] = []
  for (const skill of SOFT_SKILLS) {
    if (lower.includes(skill)) softSkills.push(skill)
  }

  // Required vs preferred skills
  const requiredText = (sections.get('requirements') || []).join(' ').toLowerCase()
  const preferredText = (sections.get('preferred') || []).join(' ').toLowerCase()

  const requiredSkills = tools.filter(t => requiredText.includes(t) || (!preferredText.includes(t) && lower.includes(t)))
  const preferredSkills = tools.filter(t => preferredText.includes(t) && !requiredText.includes(t))

  // Extract all keywords (unique, non-stop-word terms)
  const STOP2 = new Set([
    'the','be','to','of','and','a','in','that','have','it','for','not','on','with',
    'as','do','at','this','but','by','from','or','an','will','all','would','their',
    'what','so','up','out','if','about','who','get','which','go','when','can','like',
    'are','is','was','were','been','has','had','may','must','should','being','such',
    'more','very','also','our','your','you','we','they','them','these','those',
    'experience','working','role','team','strong','ability','skills','required',
    'preferred','minimum','years','looking','join','company','job','position',
    'candidate','ideal','opportunity','responsibilities','qualifications',
    'requirements','description','benefits','apply','resume','cover','letter',
  ])

  const words = lower.replace(/[^\w\s+#./\-]/g, ' ').split(/\s+/)
  const keywords = [...new Set(
    [...tools, ...words.filter(w => w.length > 2 && !STOP2.has(w))]
  )]

  return {
    title,
    company,
    location,
    workMode,
    yearsRequired,
    requiredSkills,
    preferredSkills,
    tools,
    softSkills,
    responsibilities,
    qualifications,
    keywords,
    salaryRange,
  }
}
