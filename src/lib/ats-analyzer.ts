const STOP_WORDS = new Set([
  'the','be','to','of','and','a','in','that','have','i','it','for','not','on',
  'with','he','as','you','do','at','this','but','his','by','from','they','we',
  'say','her','she','or','an','will','my','one','all','would','there','their',
  'what','so','up','out','if','about','who','get','which','go','me','when',
  'make','can','like','time','no','just','him','know','take','people','into',
  'year','your','good','some','could','them','see','other','than','then','now',
  'look','only','come','its','over','think','also','back','after','use','two',
  'how','our','work','first','well','way','even','new','want','because','any',
  'these','give','day','most','us','are','is','was','were','been','has','had',
  'may','must','should','shall','being','able','such','each','per','more','very',
  'need','great','own','key','part','both','much','before','too','same','right',
  'still','find','here','thing','many','those','long','start','against','place',
  'every','keep','help','through','set','while','why','let','off','turn','end',
  'move','show','might','try','below','above','including','within','across',
  'between','under','without','along','during','around',
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

export interface ATSResult {
  score: number
  matchedKeywords: string[]
  missingKeywords: string[]
  suggestions: string[]
  categories: { name: string; matched: number; total: number }[]
}

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^\w\s+#./\-]/g, ' ').replace(/\s+/g, ' ').trim()
}

function extractKeywords(text: string): string[] {
  const normalized = normalize(text)
  const keywords: Set<string> = new Set()

  for (const phrase of TECH_PHRASES) {
    if (normalized.includes(phrase)) keywords.add(phrase)
  }

  const words = normalized.split(/\s+/)
  for (const word of words) {
    if (word.length > 2 && !STOP_WORDS.has(word)) keywords.add(word)
  }

  const acronyms = text.match(/\b[A-Z][A-Z0-9+#]{1,10}\b/g) || []
  for (const acr of acronyms) keywords.add(acr.toLowerCase())

  return [...keywords]
}

const TOOLS_SET = new Set([
  'aws','gcp','azure','docker','kubernetes','jenkins','git','jira','figma',
  'postman','terraform','ansible','prometheus','grafana','elasticsearch',
  'redis','mongodb','postgresql','mysql','nginx','linux','webpack','vite',
  'jest','cypress','selenium','playwright','datadog','splunk','sentry',
  'vercel','netlify','heroku','firebase','supabase','prisma','redux',
  'zustand','rxjs','bootstrap','tailwind','pytorch','tensorflow','keras',
  'scikit-learn','pandas','numpy','matplotlib','jupyter','huggingface',
  'langchain','openai','anthropic','pinecone','weaviate','chromadb','faiss',
  'airflow','kafka','spark','snowflake','databricks','tableau','powerbi',
  ...TECH_PHRASES,
])

const SOFT_SKILLS = new Set([
  'communication','leadership','teamwork','collaboration','mentor','mentoring',
  'presentation','analytical','creative','strategic','initiative','adaptability',
  'flexibility','organized','self-motivated','passionate','driven','proactive',
  'innovative','empathetic','negotiation',
])

export function analyzeATS(
  jobDescription: string,
  resumeSkills: string[],
  resumeText: string = '',
): ATSResult {
  const jdKeywords = extractKeywords(jobDescription)
  const resumeNormalized = normalize([...resumeSkills, resumeText].join(' '))

  const matched: string[] = []
  const missing: string[] = []

  for (const keyword of jdKeywords) {
    const isMatch =
      resumeNormalized.includes(keyword) ||
      resumeSkills.some(s => {
        const ns = normalize(s)
        return ns.includes(keyword) || keyword.includes(ns)
      })
    if (isMatch) matched.push(keyword)
    else missing.push(keyword)
  }

  const score = jdKeywords.length > 0
    ? Math.min(100, Math.round((matched.length / jdKeywords.length) * 100))
    : 0

  const categories = categorize(matched, missing)
  const suggestions = buildSuggestions(score, missing)

  return { score, matchedKeywords: matched, missingKeywords: missing, suggestions, categories }
}

function categorize(matched: string[], missing: string[]) {
  const cats: Record<string, { m: number; t: number }> = {
    'Tools & Frameworks': { m: 0, t: 0 },
    'Soft Skills': { m: 0, t: 0 },
    'Technical Skills': { m: 0, t: 0 },
  }
  function bucket(kw: string) {
    if (TOOLS_SET.has(kw)) return 'Tools & Frameworks'
    if (SOFT_SKILLS.has(kw)) return 'Soft Skills'
    return 'Technical Skills'
  }
  for (const kw of matched) { const b = bucket(kw); cats[b].m++; cats[b].t++ }
  for (const kw of missing) { const b = bucket(kw); cats[b].t++ }
  return Object.entries(cats)
    .filter(([, v]) => v.t > 0)
    .map(([name, v]) => ({ name, matched: v.m, total: v.t }))
}

function buildSuggestions(score: number, missing: string[]): string[] {
  const s: string[] = []
  if (score < 40) s.push('Your resume has significant keyword gaps. Tailor it more closely to this JD.')
  else if (score < 60) s.push('Moderate match. Adding missing technical terms could boost your ATS score.')
  else if (score < 80) s.push('Good coverage! A few additions could push your score higher.')
  else s.push('Excellent keyword match! Your resume is well-tailored for this role.')

  const top = missing.filter(k => k.length > 3).slice(0, 6)
  if (top.length > 0) s.push(`Consider adding: ${top.join(', ')}`)
  if (missing.length > 10) s.push(`${missing.length} JD keywords missing — focus on the most relevant to your experience.`)
  s.push('Use exact phrases from the JD where possible — ATS systems match exact terms.')
  s.push('Include both abbreviations and full forms (e.g., "ML" and "Machine Learning").')
  return s
}
