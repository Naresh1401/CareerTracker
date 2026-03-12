import { useState, useRef, useCallback } from 'react'
import { useStore } from '../../store/useStore'
import { Card, Badge, Button, Input, Textarea, EmptyState, Progress, Select } from '../../components/ui'
import { cn, formatDate, downloadFile } from '../../lib/utils'
import { parseResume, resumeToText, type ParsedResume } from '../../lib/resume-parser'
import { scoreResume, type ATSScoreResult } from '../../lib/ats-scorer'
import { parseJobDescription, type ParsedJD } from '../../lib/jd-parser'
import { callAI, isAIConfigured } from '../../lib/ai-service'
import {
  Upload, FileText, ScanSearch, Sparkles, ArrowRight, ArrowLeftRight,
  ChevronDown, ChevronUp, Copy, Download, Check, Loader2, Plus, Trash2,
  Edit3, Star, Target, BarChart3, Lightbulb, XCircle, CheckCircle2,
  Briefcase, BookmarkPlus, Send, Eye, ChevronLeft, ChevronRight,
  AlertCircle, Settings2, Brain, Zap, FileSearch, PenTool,
} from 'lucide-react'
import {
  RadialBarChart, RadialBar, ResponsiveContainer, BarChart, Bar, XAxis,
  YAxis, Tooltip, Cell,
} from 'recharts'
import type { ResumeVersion, TailoringSession } from '../../types'

/* ── Helpers ── */

function scoreColor(s: number) {
  return s >= 80 ? '#10b981' : s >= 60 ? '#6366f1' : s >= 40 ? '#f59e0b' : '#ef4444'
}
function scoreLabel(s: number) {
  return s >= 80 ? 'Excellent' : s >= 60 ? 'Good' : s >= 40 ? 'Moderate' : 'Low'
}
function statusBadge(status: string) {
  const map: Record<string, string> = {
    excellent: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    good: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    'needs-work': 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    poor: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  }
  return map[status] || map.poor
}

type Step = 'upload' | 'parsed' | 'ats' | 'jd' | 'jd-analysis' | 'tailoring' | 'comparison' | 'editor' | 'save' | 'apply'

const STEP_LABELS: Record<Step, string> = {
  upload: 'Upload Resume',
  parsed: 'Parsed Preview',
  ats: 'ATS Analysis',
  jd: 'Job Description',
  'jd-analysis': 'JD Analysis',
  tailoring: 'AI Tailoring',
  comparison: 'Before vs After',
  editor: 'Resume Editor',
  save: 'Save Version',
  apply: 'Push to Applications',
}
const STEPS: Step[] = ['upload', 'parsed', 'ats', 'jd', 'jd-analysis', 'tailoring', 'comparison', 'editor', 'save', 'apply']

/* ── Score Gauge ── */
function ScoreGauge({ score, label, size = 'md' }: { score: number; label: string; size?: 'sm' | 'md' }) {
  const color = scoreColor(score)
  const dim = size === 'sm' ? 'w-24 h-24' : 'w-32 h-32'
  const txtSz = size === 'sm' ? 'text-xl' : 'text-3xl'
  return (
    <div className="flex flex-col items-center">
      <div className={cn(dim, 'relative')}>
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart innerRadius="65%" outerRadius="100%" data={[{ value: score, fill: color }]} startAngle={90} endAngle={-270}>
            <RadialBar dataKey="value" cornerRadius={8} background={{ fill: 'var(--gauge-bg, #f3f4f6)' }} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className={cn(txtSz, 'font-bold font-mono')} style={{ color }}>{score}</p>
          <p className="text-[9px] text-gray-400">/100</p>
        </div>
      </div>
      <p className="text-xs mt-1 font-medium" style={{ color }}>{label}</p>
      <p className="text-[10px] text-gray-400">{scoreLabel(score)}</p>
    </div>
  )
}

/* ── Stepper ── */
function Stepper({ current, completed, onGo }: { current: Step; completed: Set<Step>; onGo: (s: Step) => void }) {
  const currentIdx = STEPS.indexOf(current)
  return (
    <div className="flex items-center gap-0.5 overflow-x-auto pb-2">
      {STEPS.map((step, i) => {
        const done = completed.has(step)
        const active = step === current
        const reachable = done || i <= currentIdx
        return (
          <div key={step} className="flex items-center">
            <button
              onClick={() => reachable && onGo(step)}
              disabled={!reachable}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-colors whitespace-nowrap',
                active && 'bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300',
                done && !active && 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400',
                !done && !active && 'text-gray-400 dark:text-gray-500',
                reachable && 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800',
              )}
            >
              {done && !active ? <CheckCircle2 className="w-3 h-3" /> : <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[8px]">{i + 1}</span>}
              <span className="hidden sm:inline">{STEP_LABELS[step]}</span>
            </button>
            {i < STEPS.length - 1 && <ChevronRight className="w-3 h-3 text-gray-300 dark:text-gray-600 flex-shrink-0" />}
          </div>
        )
      })}
    </div>
  )
}

/* ── Main Component ── */
export function ResumeVersions() {
  const {
    resumeVersions, addResumeVersion, updateResumeVersion, deleteResumeVersion,
    applications, addApplication, profile,
    savedJDs, addSavedJD,
    tailoringSessions, addTailoringSession, updateTailoringSession, deleteTailoringSession,
    setActiveTab,
  } = useStore()

  /* ── Workflow state ── */
  const [step, setStep] = useState<Step>('upload')
  const [completedSteps, setCompletedSteps] = useState<Set<Step>>(new Set())

  /* Resume */
  const [resumeText, setResumeText] = useState('')
  const [parsed, setParsed] = useState<ParsedResume | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  /* ATS */
  const [atsResult, setAtsResult] = useState<ATSScoreResult | null>(null)
  const [showAllCategories, setShowAllCategories] = useState(false)

  /* JD */
  const [jdText, setJdText] = useState('')
  const [jdMeta, setJdMeta] = useState({ title: '', company: '', location: '', workMode: '', salaryRange: '' })
  const [parsedJD, setParsedJD] = useState<ParsedJD | null>(null)

  /* Tailoring */
  const [tailoring, setTailoring] = useState(false)
  const [tailorError, setTailorError] = useState('')
  const [tailoredText, setTailoredText] = useState('')
  const [afterAts, setAfterAts] = useState<ATSScoreResult | null>(null)

  /* Editor */
  const [editedResume, setEditedResume] = useState<ParsedResume | null>(null)

  /* Save */
  const [saveName, setSaveName] = useState('')
  const [saveDesc, setSaveDesc] = useState('')
  const [savedId, setSavedId] = useState<number | null>(null)

  /* Apply */
  const [applyStatus, setApplyStatus] = useState<'applied' | 'saved' | 'not-yet'>('not-yet')
  const [appliedAppId, setAppliedAppId] = useState<number | null>(null)

  /* Versions view */
  const [showVersions, setShowVersions] = useState(true)
  const [showSessions, setShowSessions] = useState(false)
  const [copied, setCopied] = useState(false)

  /* ── Version management form ── */
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState({ name: '', targetAudience: '', description: '', skillsEmphasized: '', roleType: '', link: '' })

  /* ── Navigation helpers ── */
  function goStep(s: Step) { setStep(s) }
  function complete(s: Step) { setCompletedSteps(prev => new Set([...prev, s])) }
  function nextStep() {
    const idx = STEPS.indexOf(step)
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1])
  }

  /* ── File upload ── */
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    setResumeText(text)
    if (fileRef.current) fileRef.current.value = ''
  }

  /* ── Step handlers ── */
  function handleParse() {
    if (!resumeText.trim()) return
    const result = parseResume(resumeText)
    setParsed(result)
    complete('upload')
    goStep('parsed')
  }

  function handleATSAnalyze() {
    if (!parsed) return
    const result = scoreResume(resumeText, parsed, jdText)
    setAtsResult(result)
    complete('parsed')
    goStep('ats')
  }

  function handleJDAnalyze() {
    if (!jdText.trim()) return
    const result = parseJobDescription(jdText)
    // Override with user-filled metadata
    if (jdMeta.title) result.title = jdMeta.title
    if (jdMeta.company) result.company = jdMeta.company
    if (jdMeta.location) result.location = jdMeta.location
    if (jdMeta.workMode) result.workMode = jdMeta.workMode as ParsedJD['workMode']
    if (jdMeta.salaryRange) result.salaryRange = jdMeta.salaryRange
    setParsedJD(result)

    // Re-score ATS with JD context
    if (parsed) {
      const newAts = scoreResume(resumeText, parsed, jdText)
      setAtsResult(newAts)
    }

    // Save JD
    addSavedJD({
      title: result.title,
      company: result.company,
      location: result.location,
      workMode: result.workMode,
      rawText: jdText,
      salaryRange: result.salaryRange,
      yearsRequired: result.yearsRequired,
      requiredSkills: result.requiredSkills,
      preferredSkills: result.preferredSkills,
      tools: result.tools,
      createdAt: new Date().toISOString().split('T')[0],
    })

    complete('jd')
    goStep('jd-analysis')
  }

  async function handleTailor() {
    if (!resumeText.trim() || !jdText.trim()) return
    setTailoring(true)
    setTailorError('')
    setTailoredText('')
    setAfterAts(null)

    try {
      const msgs = [
        {
          role: 'system',
          content: `You are an expert ATS resume optimizer. Given a resume and job description, rewrite the resume to maximize ATS compatibility while keeping it truthful. Rules:
1. Keep all real experience, projects, education — do NOT fabricate anything
2. Incorporate keywords from the job description naturally
3. Use strong action verbs and quantifiable achievements
4. Match the job's required skills/tools in skills section
5. Optimize the professional summary for this specific role
6. Use ATS-friendly formatting (no tables, columns, images)
7. Output the full resume as plain text, ready to copy-paste
8. Keep it concise (1-2 pages worth of text)
9. Preserve the original structure and section ordering
10. Do NOT add skills or experience the candidate does not have`,
        },
        {
          role: 'user',
          content: `=== MY CURRENT RESUME ===\n${resumeText.slice(0, 8000)}\n\n=== JOB DESCRIPTION ===\n${jdText.slice(0, 6000)}\n\nRewrite my resume optimized for this specific role. Output only the tailored resume text.`,
        },
      ]

      const result = await callAI(msgs)
      setTailoredText(result)

      // Score the tailored version
      const tailoredParsed = parseResume(result)
      const tailoredAts = scoreResume(result, tailoredParsed, jdText)
      setAfterAts(tailoredAts)

      // Set up the editor with tailored content
      setEditedResume(tailoredParsed)

      complete('tailoring')
      goStep('comparison')
    } catch (err: unknown) {
      setTailorError(err instanceof Error ? err.message : 'Failed to tailor resume')
    } finally {
      setTailoring(false)
    }
  }

  function handleSaveVersion() {
    if (!saveName.trim()) return
    const textToSave = editedResume ? resumeToText(editedResume) : tailoredText || resumeText
    const score = afterAts?.overallScore ?? atsResult?.overallScore ?? 0

    const rv: Omit<ResumeVersion, 'id'> = {
      name: saveName,
      targetAudience: parsedJD?.title || jdMeta.title || '',
      description: saveDesc || `Tailored for ${parsedJD?.company || jdMeta.company || 'target role'}`,
      skillsEmphasized: parsed?.skills.slice(0, 8) || [],
      roleType: parsedJD?.title || '',
      link: '',
      createdAt: new Date().toISOString().split('T')[0],
      resumeText: textToSave,
      atsScore: score,
      isTailored: Boolean(tailoredText),
    }

    addResumeVersion(rv)
    const newId = useStore.getState().resumeVersions[useStore.getState().resumeVersions.length - 1]?.id
    setSavedId(newId || null)

    // Create tailoring session
    if (tailoredText && atsResult && afterAts) {
      addTailoringSession({
        originalResumeId: 0,
        jobDescriptionId: savedJDs.length > 0 ? savedJDs[savedJDs.length - 1].id : 0,
        originalText: resumeText,
        tailoredText: textToSave,
        originalScore: atsResult.overallScore,
        tailoredScore: afterAts.overallScore,
        status: 'draft',
        createdAt: new Date().toISOString().split('T')[0],
        name: saveName,
      })
    }

    complete('save')
    goStep('apply')
  }

  function handlePushToApp(status: 'applied' | 'saved') {
    if (!parsedJD && !jdMeta.company) return
    setApplyStatus(status)

    const appStatus = status === 'applied' ? 'Applied' as const : 'Saved' as const

    addApplication({
      company: parsedJD?.company || jdMeta.company || 'Unknown',
      role: parsedJD?.title || jdMeta.title || 'Target Role',
      roleCategory: '',
      customRoleTag: '',
      department: '',
      jobLink: '',
      source: 'Company Site',
      location: parsedJD?.location || jdMeta.location || '',
      workMode: (parsedJD?.workMode || jdMeta.workMode || 'Remote') as 'Remote' | 'Hybrid' | 'Onsite',
      salaryRange: parsedJD?.salaryRange || jdMeta.salaryRange || '',
      dateSaved: new Date().toISOString().split('T')[0],
      dateApplied: new Date().toISOString().split('T')[0],
      lastStatusUpdate: new Date().toISOString().split('T')[0],
      status: appStatus,
      resumeVersion: saveName || 'Tailored Resume',
      coverLetter: '',
      contactName: '',
      contactEmail: '',
      referral: false,
      referralStatus: '',
      priority: 'Medium',
      followUpDate: '',
      interviewDate: '',
      rejectionReason: '',
      notes: `Resume score: ${afterAts?.overallScore ?? atsResult?.overallScore ?? '-'}/100`,
      outcomeNotes: '',
      confidenceLevel: 50,
      companyType: 'Startup',
      targetType: 'Realistic',
      statusHistory: [{ status: appStatus, date: new Date().toISOString().split('T')[0] }],
    })

    const newAppId = useStore.getState().applications[0]?.id
    setAppliedAppId(newAppId || null)

    // Update tailoring session status
    const sessions = useStore.getState().tailoringSessions
    const lastSession = sessions[sessions.length - 1]
    if (lastSession) {
      updateTailoringSession(lastSession.id, {
        status: status === 'applied' ? 'applied' : 'saved',
        applicationId: newAppId,
      })
    }

    complete('apply')
  }

  /* ── Resume CRUD ── */
  function handleFormSave() {
    if (!form.name) return
    const data = {
      name: form.name,
      targetAudience: form.targetAudience,
      description: form.description,
      skillsEmphasized: form.skillsEmphasized.split(',').map(s => s.trim()).filter(Boolean),
      roleType: form.roleType,
      link: form.link,
      createdAt: new Date().toISOString().split('T')[0],
    }
    if (editId) { updateResumeVersion(editId, data); setEditId(null) }
    else addResumeVersion(data)
    setForm({ name: '', targetAudience: '', description: '', skillsEmphasized: '', roleType: '', link: '' })
    setShowForm(false)
  }
  function startEdit(rv: ResumeVersion) {
    setForm({ name: rv.name, targetAudience: rv.targetAudience, description: rv.description, skillsEmphasized: rv.skillsEmphasized.join(', '), roleType: rv.roleType, link: rv.link })
    setEditId(rv.id)
    setShowForm(true)
  }
  function handleDelete(id: number) {
    if (!confirm('Delete this resume version?')) return
    deleteResumeVersion(id)
  }

  /* Perf helper */
  function getPerf(rv: ResumeVersion) {
    const apps = applications.filter(a => a.resumeVersion === rv.name)
    const interviews = apps.filter(a => ['Phone Screen', 'Technical Interview', 'Final Interview', 'Offer', 'Accepted'].includes(a.status)).length
    const offers = apps.filter(a => ['Offer', 'Accepted'].includes(a.status)).length
    const rate = apps.length > 0 ? Math.round((interviews / apps.length) * 100) : 0
    return { apps: apps.length, interviews, offers, rate }
  }

  /* Copy / download */
  function copyText(text: string) {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  /* Reset workflow */
  function resetWorkflow() {
    setStep('upload')
    setCompletedSteps(new Set())
    setResumeText('')
    setParsed(null)
    setAtsResult(null)
    setJdText('')
    setJdMeta({ title: '', company: '', location: '', workMode: '', salaryRange: '' })
    setParsedJD(null)
    setTailoredText('')
    setAfterAts(null)
    setEditedResume(null)
    setSaveName('')
    setSaveDesc('')
    setSavedId(null)
    setApplyStatus('not-yet')
    setAppliedAppId(null)
    setTailorError('')
  }

  /* Load a saved version into the workflow */
  const loadVersion = useCallback((rv: ResumeVersion) => {
    if (rv.resumeText) {
      setResumeText(rv.resumeText)
      const p = parseResume(rv.resumeText)
      setParsed(p)
      setStep('parsed')
      setCompletedSteps(new Set(['upload']))
    }
  }, [])

  /* ── Render ── */
  return (
    <div className="space-y-5 max-w-6xl animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
            <Brain className="w-5 h-5 text-brand-500" />
            Resume Intelligence
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Upload → Parse → Score → Tailor → Save → Apply</p>
        </div>
        <div className="flex gap-2">
          {step !== 'upload' && (
            <Button variant="secondary" size="sm" onClick={resetWorkflow}>
              <Plus className="w-3.5 h-3.5" /> New Workflow
            </Button>
          )}
          <Button onClick={() => { setShowForm(true); setEditId(null); setForm({ name: '', targetAudience: '', description: '', skillsEmphasized: '', roleType: '', link: '' }) }} size="sm" variant="secondary">
            <Plus className="w-4 h-4" /> Manual Version
          </Button>
        </div>
      </div>

      {/* Stepper */}
      <Card className="p-3">
        <Stepper current={step} completed={completedSteps} onGo={goStep} />
      </Card>

      {/* ═══════ STEP 1: Upload ═══════ */}
      {step === 'upload' && (
        <Card className="p-6 border border-brand-100/60 dark:border-brand-900/50">
          <div className="flex items-center gap-2 mb-4">
            <Upload className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            <h3 className="text-sm font-bold tracking-tight text-gray-900 dark:text-white">Upload or Paste Your Resume</h3>
          </div>

          <div className="flex items-center gap-3 mb-3">
            <label className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/30 cursor-pointer hover:bg-brand-100 dark:hover:bg-brand-900/50 transition-colors">
              <Upload className="w-4 h-4" /> Upload .txt / .md
              <input ref={fileRef} type="file" accept=".txt,.md,.text" className="hidden" onChange={handleFileUpload} />
            </label>
            {resumeText && <p className="text-xs text-gray-400">{resumeText.split(/\s+/).length} words</p>}
          </div>

          <textarea
            value={resumeText}
            onChange={e => setResumeText(e.target.value)}
            placeholder="Paste your full resume text here, or upload a file above..."
            rows={14}
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:placeholder:text-gray-500 font-mono text-xs leading-relaxed"
          />

          <div className="flex gap-3 mt-4">
            <Button onClick={handleParse} disabled={!resumeText.trim()} size="sm">
              <FileSearch className="w-4 h-4" /> Parse & Continue
            </Button>
          </div>
        </Card>
      )}

      {/* ═══════ STEP 2: Parsed Preview ═══════ */}
      {step === 'parsed' && parsed && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-brand-500" />
              <h3 className="text-sm font-bold tracking-tight text-gray-900 dark:text-white">Parsed Resume Preview</h3>
              <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 text-[10px]">
                {parsed.rawSections.length} sections found
              </Badge>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Contact */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Contact</p>
              <div className="space-y-1 text-xs">
                {parsed.contact.name && <p className="font-medium text-gray-900 dark:text-white">{parsed.contact.name}</p>}
                {parsed.contact.email && <p className="text-gray-600 dark:text-gray-300">{parsed.contact.email}</p>}
                {parsed.contact.phone && <p className="text-gray-600 dark:text-gray-300">{parsed.contact.phone}</p>}
                {parsed.contact.location && <p className="text-gray-600 dark:text-gray-300">{parsed.contact.location}</p>}
                {parsed.contact.linkedin && <p className="text-blue-500">{parsed.contact.linkedin}</p>}
                {parsed.contact.github && <p className="text-gray-600 dark:text-gray-300">{parsed.contact.github}</p>}
              </div>
            </div>

            {/* Summary */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Summary</p>
              <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">{parsed.summary || 'No summary detected'}</p>
            </div>

            {/* Skills */}
            {parsed.skills.length > 0 && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 md:col-span-2">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Skills ({parsed.skills.length})</p>
                <div className="flex flex-wrap gap-1.5">
                  {parsed.skills.map((s, i) => (
                    <Badge key={i} className="bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300 text-[10px]">{s}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Experience */}
            {parsed.experience.length > 0 && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 md:col-span-2">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Experience ({parsed.experience.length})</p>
                <div className="space-y-3">
                  {parsed.experience.map((exp, i) => (
                    <div key={i}>
                      <p className="text-xs font-medium text-gray-900 dark:text-white">{exp.title}{exp.company ? ` @ ${exp.company}` : ''}</p>
                      {exp.duration && <p className="text-[10px] text-gray-400">{exp.duration}</p>}
                      {exp.bullets.length > 0 && (
                        <ul className="mt-1 space-y-0.5">
                          {exp.bullets.slice(0, 3).map((b, j) => (
                            <li key={j} className="text-[11px] text-gray-600 dark:text-gray-300 flex gap-1.5"><span className="text-gray-300 mt-0.5">•</span><span className="line-clamp-1">{b}</span></li>
                          ))}
                          {exp.bullets.length > 3 && <li className="text-[10px] text-gray-400">+{exp.bullets.length - 3} more bullets</li>}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Education */}
            {parsed.education.length > 0 && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Education</p>
                {parsed.education.map((edu, i) => (
                  <div key={i} className="mb-1">
                    <p className="text-xs text-gray-800 dark:text-gray-200">{edu.degree}</p>
                    {edu.institution && <p className="text-[10px] text-gray-500">{edu.institution}</p>}
                  </div>
                ))}
              </div>
            )}

            {/* Projects */}
            {parsed.projects.length > 0 && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Projects ({parsed.projects.length})</p>
                {parsed.projects.slice(0, 3).map((p, i) => (
                  <div key={i} className="mb-1.5">
                    <p className="text-xs font-medium text-gray-800 dark:text-gray-200">{p.name}</p>
                    {p.tech.length > 0 && <p className="text-[10px] text-gray-400">{p.tech.join(', ')}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-4">
            <Button variant="secondary" size="sm" onClick={() => goStep('upload')}>
              <ChevronLeft className="w-3.5 h-3.5" /> Back
            </Button>
            <Button size="sm" onClick={handleATSAnalyze}>
              <ScanSearch className="w-4 h-4" /> Run ATS Analysis
            </Button>
          </div>
        </Card>
      )}

      {/* ═══════ STEP 3: ATS Analysis ═══════ */}
      {step === 'ats' && atsResult && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-brand-500" />
              <h3 className="text-sm font-bold tracking-tight text-gray-900 dark:text-white">ATS Score Breakdown</h3>
              <Badge className={cn('text-[10px]', statusBadge(atsResult.overallScore >= 80 ? 'excellent' : atsResult.overallScore >= 60 ? 'good' : atsResult.overallScore >= 40 ? 'needs-work' : 'poor'))}>
                {scoreLabel(atsResult.overallScore)}
              </Badge>
            </div>
          </div>

          {/* Overall gauge */}
          <div className="flex justify-center mb-5">
            <ScoreGauge score={atsResult.overallScore} label="Overall ATS Score" />
          </div>

          {/* Category cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
            {(showAllCategories ? atsResult.categories : atsResult.categories.slice(0, 6)).map(cat => (
              <div key={cat.name} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{cat.name}</span>
                  <Badge className={cn('text-[9px]', statusBadge(cat.status))}>{cat.status}</Badge>
                </div>
                <Progress value={cat.score} className="h-2 mb-2" barClass={cat.score >= 80 ? 'bg-emerald-500' : cat.score >= 60 ? 'bg-blue-500' : cat.score >= 40 ? 'bg-amber-500' : 'bg-red-500'} />
                <div className="space-y-0.5">
                  {cat.details.slice(0, 3).map((d, i) => (
                    <p key={i} className="text-[10px] text-gray-500 dark:text-gray-400">{d}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {atsResult.categories.length > 6 && (
            <button onClick={() => setShowAllCategories(v => !v)} className="text-xs text-brand-600 dark:text-brand-400 hover:underline mb-4">
              {showAllCategories ? 'Show fewer' : `Show all ${atsResult.categories.length} categories`}
            </button>
          )}

          {/* Keyword stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3 text-center">
              <p className="text-xl font-bold font-mono text-emerald-600">{atsResult.matchedKeywords.length}</p>
              <p className="text-[10px] text-emerald-600/70">Keywords Matched</p>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 text-center">
              <p className="text-xl font-bold font-mono text-red-500">{atsResult.missingKeywords.length}</p>
              <p className="text-[10px] text-red-500/70">Keywords Missing</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center">
              <p className="text-xl font-bold font-mono text-blue-600">{atsResult.strongBullets.length}</p>
              <p className="text-[10px] text-blue-600/70">Strong Bullets</p>
            </div>
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 text-center">
              <p className="text-xl font-bold font-mono text-amber-600">{atsResult.weakBullets.length}</p>
              <p className="text-[10px] text-amber-600/70">Weak Bullets</p>
            </div>
          </div>

          {/* Suggestions */}
          {atsResult.suggestions.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-900/10 rounded-lg p-4 border border-amber-100 dark:border-amber-800/50 mb-4">
              <div className="flex items-center gap-1.5 mb-2">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">Optimization Tips</p>
              </div>
              <ul className="space-y-1.5">
                {atsResult.suggestions.map((s, i) => (
                  <li key={i} className="text-xs text-amber-800 dark:text-amber-200/80 flex gap-2">
                    <span className="text-amber-400">•</span><span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="secondary" size="sm" onClick={() => goStep('parsed')}>
              <ChevronLeft className="w-3.5 h-3.5" /> Back
            </Button>
            <Button size="sm" onClick={() => { complete('ats'); goStep('jd') }}>
              <FileText className="w-4 h-4" /> Add Job Description
            </Button>
          </div>
        </Card>
      )}

      {/* ═══════ STEP 4: Job Description Input ═══════ */}
      {step === 'jd' && (
        <Card className="p-6 border border-purple-100/60 dark:border-purple-900/50">
          <div className="flex items-center gap-2 mb-4">
            <Briefcase className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <h3 className="text-sm font-bold tracking-tight text-gray-900 dark:text-white">Job Description</h3>
          </div>

          {/* Metadata fields */}
          <div className="grid sm:grid-cols-3 gap-3 mb-4">
            <Input label="Job Title" value={jdMeta.title} onChange={e => setJdMeta(m => ({ ...m, title: e.target.value }))} placeholder="Senior AI Engineer" />
            <Input label="Company" value={jdMeta.company} onChange={e => setJdMeta(m => ({ ...m, company: e.target.value }))} placeholder="Google" />
            <Input label="Location" value={jdMeta.location} onChange={e => setJdMeta(m => ({ ...m, location: e.target.value }))} placeholder="San Francisco, CA" />
            <Select label="Work Mode" value={jdMeta.workMode} onChange={e => setJdMeta(m => ({ ...m, workMode: e.target.value }))} options={[{ value: '', label: 'Select' }, { value: 'Remote', label: 'Remote' }, { value: 'Hybrid', label: 'Hybrid' }, { value: 'Onsite', label: 'Onsite' }]} />
            <Input label="Salary Range" value={jdMeta.salaryRange} onChange={e => setJdMeta(m => ({ ...m, salaryRange: e.target.value }))} placeholder="$150K-$200K" />
          </div>

          <textarea
            value={jdText}
            onChange={e => setJdText(e.target.value)}
            placeholder="Paste the full job description here..."
            rows={12}
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:placeholder:text-gray-500 text-xs leading-relaxed"
          />
          {jdText && <p className="text-[10px] text-gray-400 mt-1">{jdText.split(/\s+/).length} words</p>}

          <div className="flex gap-3 mt-4">
            <Button variant="secondary" size="sm" onClick={() => goStep('ats')}>
              <ChevronLeft className="w-3.5 h-3.5" /> Back
            </Button>
            <Button size="sm" onClick={handleJDAnalyze} disabled={!jdText.trim()}>
              <ScanSearch className="w-4 h-4" /> Analyze JD & Match
            </Button>
          </div>
        </Card>
      )}

      {/* ═══════ STEP 5: JD Analysis ═══════ */}
      {step === 'jd-analysis' && parsedJD && atsResult && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-purple-500" />
            <h3 className="text-sm font-bold tracking-tight text-gray-900 dark:text-white">JD Analysis & Gap Report</h3>
          </div>

          {/* JD overview */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            {parsedJD.title && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                <p className="text-[10px] text-gray-400 mb-0.5">Role</p>
                <p className="text-xs font-medium text-gray-900 dark:text-white">{parsedJD.title}</p>
              </div>
            )}
            {parsedJD.company && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                <p className="text-[10px] text-gray-400 mb-0.5">Company</p>
                <p className="text-xs font-medium text-gray-900 dark:text-white">{parsedJD.company}</p>
              </div>
            )}
            {parsedJD.yearsRequired !== null && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                <p className="text-[10px] text-gray-400 mb-0.5">Experience</p>
                <p className="text-xs font-medium text-gray-900 dark:text-white">{parsedJD.yearsRequired}+ years</p>
              </div>
            )}
            {parsedJD.workMode && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                <p className="text-[10px] text-gray-400 mb-0.5">Work Mode</p>
                <p className="text-xs font-medium text-gray-900 dark:text-white">{parsedJD.workMode}</p>
              </div>
            )}
          </div>

          {/* Required skills match */}
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div className="bg-emerald-50 dark:bg-emerald-900/15 rounded-lg p-4">
              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 mb-2">Matching Skills</p>
              <div className="flex flex-wrap gap-1">
                {atsResult.matchedKeywords.slice(0, 20).map(kw => (
                  <Badge key={kw} className="bg-emerald-100 text-emerald-700 dark:bg-emerald-800/50 dark:text-emerald-300 text-[10px]">{kw}</Badge>
                ))}
                {atsResult.matchedKeywords.length > 20 && <Badge className="bg-gray-100 text-gray-500 text-[10px]">+{atsResult.matchedKeywords.length - 20} more</Badge>}
              </div>
            </div>
            <div className="bg-red-50 dark:bg-red-900/15 rounded-lg p-4">
              <p className="text-xs font-semibold text-red-700 dark:text-red-300 mb-2">Gap — Missing Keywords</p>
              <div className="flex flex-wrap gap-1">
                {atsResult.missingKeywords.filter(k => k.length > 3).slice(0, 20).map(kw => (
                  <Badge key={kw} className="bg-red-100 text-red-600 dark:bg-red-800/50 dark:text-red-300 text-[10px]">{kw}</Badge>
                ))}
                {atsResult.missingKeywords.length > 20 && <Badge className="bg-gray-100 text-gray-500 text-[10px]">+{atsResult.missingKeywords.length - 20} more</Badge>}
              </div>
            </div>
          </div>

          {/* Tools required */}
          {parsedJD.tools.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/15 rounded-lg p-4 mb-4">
              <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-2">Tools & Technologies Required</p>
              <div className="flex flex-wrap gap-1.5">
                {parsedJD.tools.map(tool => {
                  const inResume = atsResult.matchedKeywords.some(m => m.includes(tool) || tool.includes(m))
                  return (
                    <Badge key={tool} className={cn('text-[10px]', inResume ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-800/40 dark:text-emerald-300' : 'bg-red-100 text-red-600 dark:bg-red-800/40 dark:text-red-300')}>
                      {inResume ? '✓' : '✗'} {tool}
                    </Badge>
                  )
                })}
              </div>
            </div>
          )}

          {/* Updated score after JD matching */}
          <div className="flex justify-center mb-4">
            <ScoreGauge score={atsResult.overallScore} label="ATS Score (with JD)" />
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" size="sm" onClick={() => goStep('jd')}>
              <ChevronLeft className="w-3.5 h-3.5" /> Back
            </Button>
            <Button size="sm" onClick={() => { complete('jd-analysis'); goStep('tailoring') }} disabled={!isAIConfigured()}>
              <Sparkles className="w-4 h-4" /> Tailor with AI
            </Button>
            {!isAIConfigured() && (
              <p className="text-xs text-amber-600 self-center">Configure AI API key in Chatbot settings first</p>
            )}
          </div>
        </Card>
      )}

      {/* ═══════ STEP 6: AI Tailoring ═══════ */}
      {step === 'tailoring' && (
        <Card className="p-6 border border-brand-100/60 dark:border-brand-900/50">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            <h3 className="text-sm font-bold tracking-tight text-gray-900 dark:text-white">AI Resume Tailoring</h3>
            <Badge className="bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300 text-[10px]">AI-Powered</Badge>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-100 dark:border-blue-800 mb-4">
            <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
              <strong>How it works:</strong> The AI will rewrite your resume to maximize ATS compatibility for the target JD while keeping ALL your real experience intact.
              It will NOT fabricate skills or experience.
            </p>
          </div>

          {tailorError && (
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 border border-red-100 dark:border-red-800 mb-4 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <p className="text-xs text-red-600 dark:text-red-400">{tailorError}</p>
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="secondary" size="sm" onClick={() => goStep('jd-analysis')}>
              <ChevronLeft className="w-3.5 h-3.5" /> Back
            </Button>
            <Button size="sm" onClick={handleTailor} disabled={tailoring}>
              {tailoring ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {tailoring ? 'Tailoring… (this may take 15-30s)' : 'Start AI Tailoring'}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => { complete('tailoring'); complete('comparison'); setEditedResume(parsed); goStep('editor') }}>
              <PenTool className="w-4 h-4" /> Skip to Manual Editor
            </Button>
          </div>
        </Card>
      )}

      {/* ═══════ STEP 7: Before vs After Comparison ═══════ */}
      {step === 'comparison' && tailoredText && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <ArrowLeftRight className="w-5 h-5 text-emerald-500" />
            <h3 className="text-sm font-bold tracking-tight text-gray-900 dark:text-white">Before vs After Comparison</h3>
            {atsResult && afterAts && (
              <Badge className="text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                +{afterAts.overallScore - atsResult.overallScore} points
              </Badge>
            )}
          </div>

          {/* Score comparison */}
          <div className="flex items-center justify-center gap-6 flex-wrap mb-5">
            {atsResult && <ScoreGauge score={atsResult.overallScore} label="Before" size="sm" />}
            {atsResult && afterAts && (
              <div className="flex flex-col items-center">
                <ArrowRight className="w-8 h-8 text-brand-400" />
                <p className="text-lg font-bold font-mono mt-1" style={{ color: afterAts.overallScore > atsResult.overallScore ? '#10b981' : '#ef4444' }}>
                  {afterAts.overallScore > atsResult.overallScore ? '+' : ''}{afterAts.overallScore - atsResult.overallScore}
                </p>
              </div>
            )}
            {afterAts && <ScoreGauge score={afterAts.overallScore} label="After" size="sm" />}
          </div>

          {/* Category comparison chart */}
          {atsResult && afterAts && (
            <div className="mb-4">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Category Improvement</p>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={atsResult.categories.map((cat, i) => ({
                    name: cat.name.replace(/^(.*)\s.*$/, '$1').slice(0, 12),
                    before: cat.score,
                    after: afterAts.categories[i]?.score || cat.score,
                  }))} margin={{ left: -10, right: 0, top: 5, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false} domain={[0, 100]} />
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="before" fill="#94a3b8" name="Before" radius={[4, 4, 0, 0]} barSize={12} />
                    <Bar dataKey="after" fill="#10b981" name="After" radius={[4, 4, 0, 0]} barSize={12} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Tailored resume text */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 max-h-[400px] overflow-y-auto mb-4">
            <pre className="text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-mono leading-relaxed">{tailoredText}</pre>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            <Button size="sm" variant="secondary" onClick={() => copyText(tailoredText)}>
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied!' : 'Copy'}
            </Button>
            <Button size="sm" variant="secondary" onClick={() => downloadFile(tailoredText, 'tailored-resume.txt', 'text/plain')}>
              <Download className="w-3.5 h-3.5" /> Download
            </Button>
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" size="sm" onClick={() => goStep('tailoring')}>
              <ChevronLeft className="w-3.5 h-3.5" /> Back
            </Button>
            <Button size="sm" onClick={() => { complete('comparison'); goStep('editor') }}>
              <PenTool className="w-4 h-4" /> Edit Resume
            </Button>
            <Button size="sm" variant="secondary" onClick={() => { complete('comparison'); complete('editor'); goStep('save') }}>
              Skip to Save <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </Card>
      )}

      {/* ═══════ STEP 8: Structured Resume Editor ═══════ */}
      {step === 'editor' && editedResume && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <PenTool className="w-5 h-5 text-brand-500" />
            <h3 className="text-sm font-bold tracking-tight text-gray-900 dark:text-white">Resume Editor</h3>
            <Badge className="bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300 text-[10px]">Edit any section</Badge>
          </div>

          <div className="space-y-4">
            {/* Contact */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Contact</p>
              <div className="grid sm:grid-cols-2 gap-2">
                <Input label="Name" value={editedResume.contact.name} onChange={e => setEditedResume({ ...editedResume, contact: { ...editedResume.contact, name: e.target.value } })} />
                <Input label="Email" value={editedResume.contact.email} onChange={e => setEditedResume({ ...editedResume, contact: { ...editedResume.contact, email: e.target.value } })} />
                <Input label="Phone" value={editedResume.contact.phone} onChange={e => setEditedResume({ ...editedResume, contact: { ...editedResume.contact, phone: e.target.value } })} />
                <Input label="Location" value={editedResume.contact.location} onChange={e => setEditedResume({ ...editedResume, contact: { ...editedResume.contact, location: e.target.value } })} />
                <Input label="LinkedIn" value={editedResume.contact.linkedin} onChange={e => setEditedResume({ ...editedResume, contact: { ...editedResume.contact, linkedin: e.target.value } })} />
                <Input label="GitHub" value={editedResume.contact.github} onChange={e => setEditedResume({ ...editedResume, contact: { ...editedResume.contact, github: e.target.value } })} />
              </div>
            </div>

            {/* Summary */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Summary</p>
              <textarea
                value={editedResume.summary}
                onChange={e => setEditedResume({ ...editedResume, summary: e.target.value })}
                rows={3}
                title="Resume summary"
                className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 bg-white dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-gray-100 resize-none focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400"
              />
            </div>

            {/* Skills */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Skills</p>
              <textarea
                value={editedResume.skills.join(', ')}
                onChange={e => setEditedResume({ ...editedResume, skills: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                rows={2}
                className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 bg-white dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-gray-100 resize-none focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400"
                placeholder="Comma-separated skills"
              />
            </div>

            {/* Experience */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
                Experience ({editedResume.experience.length})
              </p>
              {editedResume.experience.map((exp, i) => (
                <div key={i} className="mb-4 p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-100 dark:border-gray-600">
                  <div className="grid sm:grid-cols-3 gap-2 mb-2">
                    <Input
                      label="Title"
                      value={exp.title}
                      onChange={e => {
                        const updated = [...editedResume.experience]
                        updated[i] = { ...exp, title: e.target.value }
                        setEditedResume({ ...editedResume, experience: updated })
                      }}
                    />
                    <Input
                      label="Company"
                      value={exp.company}
                      onChange={e => {
                        const updated = [...editedResume.experience]
                        updated[i] = { ...exp, company: e.target.value }
                        setEditedResume({ ...editedResume, experience: updated })
                      }}
                    />
                    <Input
                      label="Duration"
                      value={exp.duration}
                      onChange={e => {
                        const updated = [...editedResume.experience]
                        updated[i] = { ...exp, duration: e.target.value }
                        setEditedResume({ ...editedResume, experience: updated })
                      }}
                    />
                  </div>
                  <textarea
                    value={exp.bullets.join('\n')}
                    onChange={e => {
                      const updated = [...editedResume.experience]
                      updated[i] = { ...exp, bullets: e.target.value.split('\n').filter(b => b.trim()) }
                      setEditedResume({ ...editedResume, experience: updated })
                    }}
                    rows={Math.max(2, exp.bullets.length)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 bg-gray-50 dark:bg-gray-800 dark:border-gray-600 text-gray-900 dark:text-gray-100 resize-none focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400"
                    placeholder="One bullet point per line"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <Button variant="secondary" size="sm" onClick={() => goStep(tailoredText ? 'comparison' : 'ats')}>
              <ChevronLeft className="w-3.5 h-3.5" /> Back
            </Button>
            <Button size="sm" onClick={() => {
              // Re-score the edited version
              const text = resumeToText(editedResume)
              const newAts = scoreResume(text, editedResume, jdText)
              if (tailoredText) setAfterAts(newAts)
              else setAtsResult(newAts)
              setTailoredText(text)
              complete('editor')
              goStep('save')
            }}>
              <Check className="w-4 h-4" /> Finalize & Save
            </Button>
          </div>
        </Card>
      )}

      {/* ═══════ STEP 9: Save Version ═══════ */}
      {step === 'save' && (
        <Card className="p-6 border border-emerald-100/60 dark:border-emerald-900/50">
          <div className="flex items-center gap-2 mb-4">
            <BookmarkPlus className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm font-bold tracking-tight text-gray-900 dark:text-white">Save Resume Version</h3>
          </div>

          {savedId ? (
            <div className="text-center py-8">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">Version Saved!</p>
              <p className="text-xs text-gray-500 mb-4">"{saveName}" has been saved to your resume versions.</p>
              <Button size="sm" onClick={() => { complete('save'); goStep('apply') }}>
                <Send className="w-4 h-4" /> Push to Application
              </Button>
            </div>
          ) : (
            <>
              <div className="grid sm:grid-cols-2 gap-3 mb-4">
                <Input
                  label="Version Name"
                  value={saveName}
                  onChange={e => setSaveName(e.target.value)}
                  placeholder={`v${resumeVersions.length + 1} — ${parsedJD?.company || 'Role'} Tailored`}
                />
                <Input
                  label="Description (optional)"
                  value={saveDesc}
                  onChange={e => setSaveDesc(e.target.value)}
                  placeholder="Tailored for Senior AI Engineer at Google"
                />
              </div>

              {/* Score preview */}
              {(afterAts || atsResult) && (
                <div className="flex items-center gap-4 mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <ScoreGauge score={(afterAts || atsResult)!.overallScore} label="Final Score" size="sm" />
                  <div className="text-xs text-gray-500 space-y-0.5">
                    <p>Keywords matched: {(afterAts || atsResult)!.matchedKeywords.length}</p>
                    <p>Strong bullets: {(afterAts || atsResult)!.strongBullets.length}</p>
                    {tailoredText && <Badge className="bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300 text-[10px]">AI Tailored</Badge>}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="secondary" size="sm" onClick={() => goStep('editor')}>
                  <ChevronLeft className="w-3.5 h-3.5" /> Back
                </Button>
                <Button size="sm" onClick={handleSaveVersion} disabled={!saveName.trim()}>
                  <Check className="w-4 h-4" /> Save Version
                </Button>
              </div>
            </>
          )}
        </Card>
      )}

      {/* ═══════ STEP 10: Push to Applications ═══════ */}
      {step === 'apply' && (
        <Card className="p-6 border border-blue-100/60 dark:border-blue-900/50">
          <div className="flex items-center gap-2 mb-4">
            <Send className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-sm font-bold tracking-tight text-gray-900 dark:text-white">Push to Applications</h3>
          </div>

          {appliedAppId ? (
            <div className="text-center py-8">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                {applyStatus === 'applied' ? 'Marked as Applied!' : 'Saved for Later!'}
              </p>
              <p className="text-xs text-gray-500 mb-4">Application has been added to your tracker.</p>
              <div className="flex gap-3 justify-center">
                <Button size="sm" onClick={() => setActiveTab('applications')}>
                  <Briefcase className="w-4 h-4" /> View Applications
                </Button>
                <Button size="sm" variant="secondary" onClick={resetWorkflow}>
                  <Plus className="w-4 h-4" /> New Resume
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
                <p className="text-xs text-gray-500 mb-2">This will create a new application entry linked to your saved resume:</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <span className="text-gray-400">Company:</span>
                  <span className="text-gray-900 dark:text-white font-medium">{parsedJD?.company || jdMeta.company || 'Unknown'}</span>
                  <span className="text-gray-400">Role:</span>
                  <span className="text-gray-900 dark:text-white font-medium">{parsedJD?.title || jdMeta.title || 'Target Role'}</span>
                  <span className="text-gray-400">Resume:</span>
                  <span className="text-gray-900 dark:text-white font-medium">{saveName || 'Tailored Resume'}</span>
                  <span className="text-gray-400">ATS Score:</span>
                  <span className="text-gray-900 dark:text-white font-medium">{afterAts?.overallScore ?? atsResult?.overallScore ?? '-'}/100</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button size="sm" onClick={() => handlePushToApp('applied')}>
                  <Send className="w-4 h-4" /> I Applied
                </Button>
                <Button size="sm" variant="secondary" onClick={() => handlePushToApp('saved')}>
                  <BookmarkPlus className="w-4 h-4" /> Save for Later
                </Button>
                <Button size="sm" variant="secondary" onClick={resetWorkflow}>
                  Skip — Start New
                </Button>
              </div>
            </>
          )}
        </Card>
      )}

      {/* ═══════ Resume Version Form ═══════ */}
      {showForm && (
        <Card className="p-6 border border-brand-200/60 dark:border-brand-700/60">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
            {editId ? 'Edit resume version' : 'New resume version'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Version name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="v5 - GenAI Focus" />
            <Input label="Target audience" value={form.targetAudience} onChange={e => setForm({ ...form, targetAudience: e.target.value })} placeholder="GenAI roles" />
            <Input label="Role type" value={form.roleType} onChange={e => setForm({ ...form, roleType: e.target.value })} placeholder="GenAI Engineer" />
            <Input label="Skills (comma-separated)" value={form.skillsEmphasized} onChange={e => setForm({ ...form, skillsEmphasized: e.target.value })} placeholder="PyTorch, LangChain, RAG, LLMs" />
            <Input label="Link" value={form.link} onChange={e => setForm({ ...form, link: e.target.value })} placeholder="https://drive.google.com/..." />
          </div>
          <div className="mt-3">
            <Textarea label="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="What makes this version different..." rows={2} />
          </div>
          <div className="flex gap-3 mt-4">
            <Button onClick={handleFormSave} disabled={!form.name} size="sm">
              <Check className="w-3 h-3" /> {editId ? 'Save changes' : 'Add'}
            </Button>
            <Button variant="secondary" onClick={() => { setShowForm(false); setEditId(null) }} size="sm">Cancel</Button>
          </div>
        </Card>
      )}

      {/* ═══════ Tailoring History ═══════ */}
      {tailoringSessions.length > 0 && (
        <div>
          <button onClick={() => setShowSessions(v => !v)} className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-bold tracking-tight text-gray-900 dark:text-white">Tailoring History ({tailoringSessions.length})</h3>
            {showSessions ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>

          {showSessions && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {tailoringSessions.map(session => (
                <Card key={session.id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-xs font-medium text-gray-900 dark:text-white">{session.name}</p>
                      <p className="text-[10px] text-gray-400">{formatDate(session.createdAt)}</p>
                    </div>
                    <div className="flex gap-1.5">
                      <Badge className={cn('text-[9px]',
                        session.status === 'applied' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' :
                        session.status === 'saved' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                        'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                      )}>
                        {session.status}
                      </Badge>
                      <button onClick={() => deleteTailoringSession(session.id)} className="text-gray-300 hover:text-red-400" title="Delete session"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-sm font-bold font-mono" style={{ color: scoreColor(session.originalScore) }}>{session.originalScore}</p>
                      <p className="text-[9px] text-gray-400">Before</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-300" />
                    <div className="text-center">
                      <p className="text-sm font-bold font-mono" style={{ color: scoreColor(session.tailoredScore) }}>{session.tailoredScore}</p>
                      <p className="text-[9px] text-gray-400">After</p>
                    </div>
                    <div className="ml-auto">
                      <p className="text-xs font-bold font-mono" style={{ color: session.tailoredScore > session.originalScore ? '#10b981' : '#ef4444' }}>
                        {session.tailoredScore > session.originalScore ? '+' : ''}{session.tailoredScore - session.originalScore}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══════ Resume Versions ═══════ */}
      <div>
        <button onClick={() => setShowVersions(v => !v)} className="flex items-center gap-2 mb-3">
          <BarChart3 className="w-4 h-4 text-gray-400" />
          <h3 className="text-sm font-bold tracking-tight text-gray-900 dark:text-white">Resume Versions ({resumeVersions.length})</h3>
          {showVersions ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </button>

        {showVersions && (
          <>
            {/* Performance chart */}
            {resumeVersions.length > 1 && (
              <Card className="p-6 mb-4">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Resume Performance Comparison</p>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={resumeVersions.map(rv => {
                      const p = getPerf(rv)
                      return { name: rv.name.replace(/^v\d+ [-—] /, '').slice(0, 15), sent: p.apps, interviews: p.interviews, score: rv.atsScore || 0 }
                    })} margin={{ left: 0, right: 0 }}>
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ fontSize: 11, borderRadius: 10, border: '1px solid rgba(0,0,0,0.04)', boxShadow: '0 8px 24px -4px rgba(0,0,0,0.12)' }} />
                      <Bar dataKey="sent" fill="#93c5fd" name="Sent" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="interviews" fill="#f59e0b" name="Interviews" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="score" fill="#10b981" name="ATS Score" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            )}

            {resumeVersions.length === 0 ? (
              <EmptyState icon={<FileText className="w-6 h-6" />} title="No resume versions" description="Upload a resume above to start the workflow." />
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {resumeVersions.map(rv => {
                  const perf = getPerf(rv)
                  const bestRate = Math.max(0, ...resumeVersions.map(r => getPerf(r).rate))
                  const isBest = resumeVersions.length > 1 && perf.rate === bestRate && perf.rate > 0
                  return (
                    <Card key={rv.id} className={cn('p-5 relative', isBest && 'border border-brand-400 dark:border-brand-500')}>
                      {isBest && (
                        <Badge className="bg-brand-100 text-brand-700 dark:bg-brand-900/50 dark:text-brand-300 absolute -top-2.5 left-4">
                          <Star className="w-3 h-3 mr-1" /> Best performing
                        </Badge>
                      )}
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white text-sm">{rv.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{rv.targetAudience || rv.roleType}</p>
                        </div>
                        <div className="flex gap-1.5 ml-2">
                          {rv.resumeText && <button onClick={() => loadVersion(rv)} className="text-gray-300 hover:text-brand-500 transition-colors" title="Load into workflow"><FileSearch className="w-3.5 h-3.5" /></button>}
                          <button onClick={() => startEdit(rv)} className="text-gray-300 hover:text-brand-500 transition-colors" title="Edit"><Edit3 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleDelete(rv.id)} className="text-gray-300 hover:text-red-400 transition-colors" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>

                      {/* ATS Score badge */}
                      {rv.atsScore !== undefined && rv.atsScore > 0 && (
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: scoreColor(rv.atsScore) + '20' }}>
                            <span className="text-xs font-bold font-mono" style={{ color: scoreColor(rv.atsScore) }}>{rv.atsScore}</span>
                          </div>
                          <span className="text-[10px] text-gray-400">ATS Score</span>
                          {rv.isTailored && <Badge className="bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300 text-[9px]">AI Tailored</Badge>}
                        </div>
                      )}

                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">{rv.description}</p>
                      {rv.skillsEmphasized.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {rv.skillsEmphasized.slice(0, 4).map(s => (
                            <Badge key={s} className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-[10px]">{s}</Badge>
                          ))}
                          {rv.skillsEmphasized.length > 4 && <Badge className="bg-gray-100 dark:bg-gray-800 text-gray-500 text-[10px]">+{rv.skillsEmphasized.length - 4}</Badge>}
                        </div>
                      )}
                      <div className="grid grid-cols-4 gap-2 mt-auto">
                        {[
                          { label: 'Sent', val: perf.apps },
                          { label: 'Interviews', val: perf.interviews },
                          { label: 'Offers', val: perf.offers },
                          { label: 'Rate', val: `${perf.rate}%` },
                        ].map(s => (
                          <div key={s.label} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 text-center">
                            <p className="text-sm font-semibold font-mono text-gray-900 dark:text-white">{s.val}</p>
                            <p className="text-[10px] text-gray-400">{s.label}</p>
                          </div>
                        ))}
                      </div>
                      <p className="text-[10px] text-gray-400 mt-2">Created {formatDate(rv.createdAt)}</p>
                    </Card>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
