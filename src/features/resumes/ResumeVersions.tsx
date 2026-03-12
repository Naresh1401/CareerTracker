import { useState, useRef } from 'react'
import { useStore } from '../../store/useStore'
import { Card, Badge, Button, Input, Textarea, EmptyState, Progress } from '../../components/ui'
import { cn, formatDate, downloadFile } from '../../lib/utils'
import {
  Plus, Trash2, Check, RefreshCw, FileText, Star, Edit3,
  ScanSearch, CheckCircle2, XCircle, Lightbulb, ChevronDown,
  ChevronUp, Target, BarChart3, Upload, ArrowRight,
  Loader2, Download, Sparkles, Copy, ArrowLeftRight,
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadialBarChart, RadialBar } from 'recharts'
import { analyzeATS, type ATSResult } from '../../lib/ats-analyzer'
import type { ResumeVersion } from '../../types'

/* ── AI helpers (reuse from chatbot config) ── */
const AI_KEY = 'ct-chat-config'
interface AICfg { provider: string; model: string; apiKeys: Record<string, string> }
function loadAI(): AICfg {
  try { const r = localStorage.getItem(AI_KEY); if (r) return { provider: 'openai', model: 'gpt-4o-mini', apiKeys: {}, ...JSON.parse(r) } } catch {}
  return { provider: 'openai', model: 'gpt-4o-mini', apiKeys: {} }
}
async function aiPost(url: string, key: string, model: string, msgs: { role: string; content: string }[], extra: Record<string, string> = {}) {
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}`, ...extra }, body: JSON.stringify({ model, messages: msgs, max_tokens: 4096 }) })
  if (!res.ok) throw new Error(`API ${res.status}`)
  return ((await res.json()).choices?.[0]?.message?.content || '') as string
}
async function geminiPost(key: string, model: string, msgs: { role: string; content: string }[]) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`
  const sys = msgs.find(m => m.role === 'system')
  const contents = msgs.filter(m => m.role !== 'system').map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }))
  const body: Record<string, unknown> = { contents }
  if (sys) body.systemInstruction = { parts: [{ text: sys.content }] }
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  if (!res.ok) throw new Error(`Gemini ${res.status}`)
  return (await res.json()).candidates?.[0]?.content?.parts?.[0]?.text || ''
}
async function callAI(msgs: { role: string; content: string }[]): Promise<string> {
  const cfg = loadAI()
  const key = cfg.apiKeys[cfg.provider]
  if (!key) throw new Error('No API key configured. Set one in the AI Chatbot settings first.')
  switch (cfg.provider) {
    case 'openai': return aiPost('https://api.openai.com/v1/chat/completions', key, cfg.model, msgs)
    case 'groq': return aiPost('https://api.groq.com/openai/v1/chat/completions', key, cfg.model, msgs)
    case 'openrouter': return aiPost('https://openrouter.ai/api/v1/chat/completions', key, cfg.model, msgs, { 'HTTP-Referer': globalThis.location?.origin || '' })
    case 'gemini': return geminiPost(key, cfg.model, msgs)
    default: throw new Error('Unknown provider')
  }
}

function scoreColor(s: number) {
  return s >= 80 ? '#10b981' : s >= 60 ? '#6366f1' : s >= 40 ? '#f59e0b' : '#ef4444'
}
function scoreLabel(s: number) {
  return s >= 80 ? 'Excellent' : s >= 60 ? 'Good' : s >= 40 ? 'Moderate' : 'Low'
}

/* ── Component ── */
export function ResumeVersions() {
  const { resumeVersions, addResumeVersion, updateResumeVersion, deleteResumeVersion, applications, profile } = useStore()

  /* Resume form */
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState({ name: '', targetAudience: '', description: '', skillsEmphasized: '', roleType: '', link: '' })

  /* ATS + Tailoring */
  const [resumeText, setResumeText] = useState('')
  const [jd, setJd] = useState('')
  const [beforeResult, setBeforeResult] = useState<ATSResult | null>(null)
  const [afterResult, setAfterResult] = useState<ATSResult | null>(null)
  const [tailoredResume, setTailoredResume] = useState('')
  const [tailoring, setTailoring] = useState(false)
  const [tailorError, setTailorError] = useState('')
  const [showAtsDetails, setShowAtsDetails] = useState(true)
  const [showVersions, setShowVersions] = useState(true)
  const [copied, setCopied] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  /* Resume CRUD */
  function handleSave() {
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

  /* Upload resume file */
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    setResumeText(text)
    if (fileRef.current) fileRef.current.value = ''
  }

  /* Analyze original resume */
  function analyzeOriginal() {
    if (!resumeText.trim() || !jd.trim()) return
    const skills = resumeText.split(/[\n,;]/).map(s => s.trim()).filter(s => s.length > 2)
    const result = analyzeATS(jd, skills, resumeText)
    setBeforeResult(result)
    setAfterResult(null)
    setTailoredResume('')
    setTailorError('')
  }

  /* AI tailoring */
  async function tailorResume() {
    if (!resumeText.trim() || !jd.trim()) return
    setTailoring(true)
    setTailorError('')
    setTailoredResume('')
    setAfterResult(null)

    try {
      const msgs = [
        {
          role: 'system',
          content: `You are an expert ATS resume optimizer. Given a resume and job description, rewrite the resume to maximize ATS compatibility while keeping it truthful. Rules:
1. Keep all real experience, projects, education — do NOT fabricate
2. Incorporate keywords from the job description naturally
3. Use strong action verbs and quantifiable achievements
4. Match the job's required skills/tools in skills section
5. Optimize the professional summary for this specific role
6. Use ATS-friendly formatting (no tables, columns, images)
7. Output the full resume as plain text, ready to copy-paste
8. Keep it concise (1-2 pages worth of text)`
        },
        {
          role: 'user',
          content: `=== MY CURRENT RESUME ===
${resumeText.slice(0, 8000)}

=== JOB DESCRIPTION ===
${jd.slice(0, 6000)}

Please rewrite my resume to be optimized for this specific job description. Output the tailored resume text only.`
        },
      ]

      const result = await callAI(msgs)
      setTailoredResume(result)

      // Analyze the tailored version
      const tailoredSkills = result.split(/[\n,;]/).map(s => s.trim()).filter(s => s.length > 2)
      const atsAfter = analyzeATS(jd, tailoredSkills, result)
      setAfterResult(atsAfter)
    } catch (err: unknown) {
      setTailorError(err instanceof Error ? err.message : 'Failed to tailor resume')
    } finally {
      setTailoring(false)
    }
  }

  function copyTailored() {
    navigator.clipboard.writeText(tailoredResume)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  function downloadTailored() {
    downloadFile(tailoredResume, 'tailored-resume.txt', 'text/plain')
  }

  /* Perf helpers */
  function getPerf(rv: ResumeVersion) {
    const apps = applications.filter(a => a.resumeVersion === rv.name)
    const interviews = apps.filter(a => ['Phone Screen', 'Technical Interview', 'Final Interview', 'Offer', 'Accepted'].includes(a.status)).length
    const offers = apps.filter(a => ['Offer', 'Accepted'].includes(a.status)).length
    const rate = apps.length > 0 ? Math.round((interviews / apps.length) * 100) : 0
    return { apps: apps.length, interviews, offers, rate }
  }
  const bestRate = Math.max(0, ...resumeVersions.map(rv => getPerf(rv).rate))

  /* ── Score Gauge ── */
  function ScoreGauge({ score, label }: { score: number; label: string }) {
    const color = scoreColor(score)
    return (
      <div className="flex flex-col items-center">
        <div className="w-28 h-28 relative">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart innerRadius="65%" outerRadius="100%" data={[{ value: score, fill: color }]} startAngle={90} endAngle={-270}>
              <RadialBar dataKey="value" cornerRadius={8} background={{ fill: 'var(--gauge-bg, #f3f4f6)' }} />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-2xl font-bold font-mono" style={{ color }}>{score}</p>
            <p className="text-[9px] text-gray-400">/100</p>
          </div>
        </div>
        <p className="text-xs mt-1 font-medium" style={{ color }}>{label}</p>
        <p className="text-[10px] text-gray-400">{scoreLabel(score)}</p>
      </div>
    )
  }

  return (
    <div className="space-y-5 max-w-6xl animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">Resume & ATS Optimizer</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Upload → Compare → Tailor → Apply with confidence</p>
        </div>
        <Button onClick={() => { setShowForm(true); setEditId(null); setForm({ name: '', targetAudience: '', description: '', skillsEmphasized: '', roleType: '', link: '' }) }} size="sm">
          <Plus className="w-4 h-4" /> New version
        </Button>
      </div>

      {/* ═══ Resume Upload + JD Input ═══ */}
      <Card className="p-6 border border-brand-100/60 dark:border-brand-900/50">
        <div className="flex items-center gap-2 mb-4">
          <ScanSearch className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          <h3 className="text-sm font-bold tracking-tight text-gray-900 dark:text-white">ATS Score Analyzer & Resume Tailor</h3>
          <Badge className="bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300 text-[10px]">AI-Powered</Badge>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Left: Resume */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Your Resume</label>
              <label className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-medium text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/30 cursor-pointer hover:bg-brand-100 dark:hover:bg-brand-900/50 transition-colors">
                <Upload className="w-3 h-3" /> Upload .txt / .md
                <input ref={fileRef} type="file" accept=".txt,.md,.text,.csv" className="hidden" onChange={handleFileUpload} />
              </label>
            </div>
            <textarea
              value={resumeText}
              onChange={e => setResumeText(e.target.value)}
              placeholder="Paste your resume content here or upload a text file above..."
              rows={10}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:placeholder:text-gray-500 font-mono text-xs leading-relaxed"
            />
            {resumeText && (
              <p className="text-[10px] text-gray-400">{resumeText.split(/\s+/).length} words</p>
            )}
          </div>

          {/* Right: JD */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block">Job Description</label>
            <textarea
              value={jd}
              onChange={e => setJd(e.target.value)}
              placeholder="Paste the full job description you want to apply to..."
              rows={10}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:placeholder:text-gray-500 text-xs leading-relaxed"
            />
            {jd && (
              <p className="text-[10px] text-gray-400">{jd.split(/\s+/).length} words</p>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3 mt-4">
          <Button onClick={analyzeOriginal} disabled={!resumeText.trim() || !jd.trim()} size="sm" variant="secondary">
            <ScanSearch className="w-4 h-4" /> Analyze ATS Score
          </Button>
          <Button onClick={tailorResume} disabled={!resumeText.trim() || !jd.trim() || tailoring} size="sm">
            {tailoring ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {tailoring ? 'Tailoring…' : 'AI Tailor Resume'}
          </Button>
        </div>
        {tailorError && (
          <p className="text-xs text-red-500 mt-2">{tailorError}</p>
        )}
      </Card>

      {/* ═══ Score Comparison (Before vs After) ═══ */}
      {(beforeResult || afterResult) && (
        <Card className="p-6">
          <button onClick={() => setShowAtsDetails(v => !v)} className="flex items-center justify-between w-full mb-4">
            <div className="flex items-center gap-2">
              <ArrowLeftRight className="w-4 h-4 text-brand-500" />
              <h3 className="text-sm font-bold tracking-tight text-gray-900 dark:text-white">ATS Score Comparison</h3>
              {beforeResult && afterResult && (
                <Badge className="text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                  +{afterResult.score - beforeResult.score} points improvement
                </Badge>
              )}
            </div>
            {showAtsDetails ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>

          {showAtsDetails && (
            <div className="space-y-5">
              {/* Score gauges side by side */}
              <div className="flex items-center justify-center gap-6 flex-wrap">
                {beforeResult && <ScoreGauge score={beforeResult.score} label="Before Tailoring" />}
                {beforeResult && afterResult && (
                  <div className="flex flex-col items-center">
                    <ArrowRight className="w-8 h-8 text-brand-400" />
                    <p className="text-lg font-bold font-mono mt-1" style={{ color: afterResult.score > beforeResult.score ? '#10b981' : '#ef4444' }}>
                      {afterResult.score > beforeResult.score ? '+' : ''}{afterResult.score - beforeResult.score}
                    </p>
                  </div>
                )}
                {afterResult && <ScoreGauge score={afterResult.score} label="After Tailoring" />}
                {beforeResult && !afterResult && (
                  <div className="flex flex-col items-center text-center ml-4">
                    <Sparkles className="w-6 h-6 text-gray-300 mb-1" />
                    <p className="text-xs text-gray-400">Click "AI Tailor Resume"<br />to see the improved score</p>
                  </div>
                )}
              </div>

              {/* Category breakdown — before */}
              {beforeResult && (
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                    Category Breakdown {afterResult ? '(Original)' : ''}
                  </p>
                  <div className="grid sm:grid-cols-3 gap-3">
                    {beforeResult.categories.map(cat => (
                      <div key={cat.name}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-600 dark:text-gray-300">{cat.name}</span>
                          <span className="font-mono text-gray-500">{cat.matched}/{cat.total}</span>
                        </div>
                        <Progress value={cat.matched} max={cat.total} className="h-2" barClass={cat.matched / cat.total >= 0.7 ? 'bg-emerald-500' : cat.matched / cat.total >= 0.4 ? 'bg-blue-500' : 'bg-amber-500'} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Category breakdown — after */}
              {afterResult && (
                <div>
                  <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-2">Category Breakdown (Tailored)</p>
                  <div className="grid sm:grid-cols-3 gap-3">
                    {afterResult.categories.map(cat => (
                      <div key={cat.name}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-600 dark:text-gray-300">{cat.name}</span>
                          <span className="font-mono text-gray-500">{cat.matched}/{cat.total}</span>
                        </div>
                        <Progress value={cat.matched} max={cat.total} className="h-2" barClass="bg-emerald-500" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Stats grid */}
              {beforeResult && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3 text-center">
                    <p className="text-xl font-bold font-mono text-emerald-600">{beforeResult.matchedKeywords.length}</p>
                    <p className="text-[10px] text-emerald-600/70">Matched</p>
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 text-center">
                    <p className="text-xl font-bold font-mono text-red-500">{beforeResult.missingKeywords.length}</p>
                    <p className="text-[10px] text-red-500/70">Missing</p>
                  </div>
                  {afterResult && (
                    <>
                      <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3 text-center border border-emerald-200 dark:border-emerald-800">
                        <p className="text-xl font-bold font-mono text-emerald-600">{afterResult.matchedKeywords.length}</p>
                        <p className="text-[10px] text-emerald-600/70">Matched (After)</p>
                      </div>
                      <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 text-center border border-red-200 dark:border-red-800">
                        <p className="text-xl font-bold font-mono text-red-500">{afterResult.missingKeywords.length}</p>
                        <p className="text-[10px] text-red-500/70">Missing (After)</p>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Missing keywords from original */}
              {beforeResult && beforeResult.missingKeywords.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <XCircle className="w-4 h-4 text-red-400" />
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Missing Keywords ({beforeResult.missingKeywords.length})</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {beforeResult.missingKeywords.slice(0, 30).map(kw => (
                      <Badge key={kw} className={cn(
                        'text-[10px]',
                        afterResult?.matchedKeywords.includes(kw)
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 line-through'
                          : 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400',
                      )}>{kw}</Badge>
                    ))}
                    {beforeResult.missingKeywords.length > 30 && (
                      <Badge className="bg-gray-100 dark:bg-gray-800 text-gray-500 text-[10px]">+{beforeResult.missingKeywords.length - 30} more</Badge>
                    )}
                  </div>
                  {afterResult && <p className="text-[10px] text-gray-400 mt-1">Strikethrough = now matched in tailored version</p>}
                </div>
              )}

              {/* Suggestions */}
              {beforeResult && (
                <div className="bg-amber-50 dark:bg-amber-900/10 rounded-lg p-4 border border-amber-100 dark:border-amber-800/50">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Lightbulb className="w-4 h-4 text-amber-500" />
                    <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">Optimization Tips</p>
                  </div>
                  <ul className="space-y-1.5">
                    {beforeResult.suggestions.map((s, i) => (
                      <li key={i} className="text-xs text-amber-800 dark:text-amber-200/80 flex gap-2">
                        <span className="text-amber-400 mt-0.5">•</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      {/* ═══ Tailored Resume Output ═══ */}
      {tailoredResume && (
        <Card className="p-6 border border-emerald-200/60 dark:border-emerald-800/60">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-500" />
              <h3 className="text-sm font-bold tracking-tight text-gray-900 dark:text-white">Tailored Resume</h3>
              <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 text-[10px]">Ready to use</Badge>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={copyTailored}>
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied!' : 'Copy'}
              </Button>
              <Button size="sm" variant="secondary" onClick={downloadTailored}>
                <Download className="w-3.5 h-3.5" /> Download
              </Button>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 max-h-[500px] overflow-y-auto">
            <pre className="text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-mono leading-relaxed">{tailoredResume}</pre>
          </div>
          <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              <strong>Tip:</strong> Copy this tailored resume and paste into your resume template (Google Docs, Word, etc.) before applying. The content is optimized for ATS parsing — use simple formatting, standard headings, and avoid images/tables.
            </p>
          </div>
        </Card>
      )}

      {/* ═══ Resume Version Form ═══ */}
      {showForm && (
        <Card className="p-6 border border-brand-200/60 dark:border-brand-700/60">
          <h3 className="text-sm font-bold tracking-tight text-gray-900 dark:text-white mb-4">
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
            <Button onClick={handleSave} disabled={!form.name} size="sm">
              <Check className="w-3 h-3" /> {editId ? 'Save changes' : 'Add'}
            </Button>
            <Button variant="secondary" onClick={() => { setShowForm(false); setEditId(null) }} size="sm">Cancel</Button>
          </div>
        </Card>
      )}

      {/* ═══ Resume Versions Section ═══ */}
      <div>
        <button onClick={() => setShowVersions(v => !v)} className="flex items-center gap-2 mb-3">
          <BarChart3 className="w-4 h-4 text-gray-400" />
          <h3 className="text-sm font-bold tracking-tight text-gray-900 dark:text-white">Resume Versions ({resumeVersions.length})</h3>
          {showVersions ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </button>

        {showVersions && (
          <>
            {resumeVersions.length > 1 && (
              <Card className="p-6 mb-4">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Resume Performance Comparison</p>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={resumeVersions.map(rv => {
                      const p = getPerf(rv)
                      return { name: rv.name.replace(/^v\d+ - /, ''), sent: p.apps, interviews: p.interviews, offers: p.offers }
                    })} margin={{ left: 0, right: 0 }}>
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 10, border: '1px solid rgba(99,102,241,0.15)', boxShadow: '0 8px 24px -4px rgba(0,0,0,0.12)' }} />
                      <Bar dataKey="sent" fill="#93c5fd" name="Sent" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="interviews" fill="#f59e0b" name="Interviews" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="offers" fill="#10b981" name="Offers" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            )}

            {resumeVersions.length === 0 ? (
              <EmptyState icon={<FileText className="w-6 h-6" />} title="No resume versions" description="Add your first resume version to track performance." />
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {resumeVersions.map(rv => {
                  const perf = getPerf(rv)
                  const isBest = resumeVersions.length > 1 && perf.rate === bestRate && perf.rate > 0
                  return (
                    <Card key={rv.id} className={cn('p-5 relative', isBest && 'border border-brand-400 dark:border-brand-500')}>
                      {isBest && (
                        <Badge className="bg-brand-100 text-brand-700 dark:bg-brand-900/50 dark:text-brand-300 absolute -top-2.5 left-4">
                          <Star className="w-3 h-3 mr-1" /> Best performing
                        </Badge>
                      )}
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{rv.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{rv.targetAudience || rv.roleType}</p>
                        </div>
                        <div className="flex gap-1.5 ml-2">
                          <button onClick={() => startEdit(rv)} className="text-gray-300 hover:text-brand-500 transition-colors" title="Edit"><Edit3 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleDelete(rv.id)} className="text-gray-300 hover:text-red-400 transition-colors" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">{rv.description}</p>
                      {rv.skillsEmphasized.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {rv.skillsEmphasized.slice(0, 4).map(s => (
                            <Badge key={s} className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-[10px]">{s}</Badge>
                          ))}
                          {rv.skillsEmphasized.length > 4 && (
                            <Badge className="bg-gray-100 dark:bg-gray-800 text-gray-500 text-[10px]">+{rv.skillsEmphasized.length - 4}</Badge>
                          )}
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
                      {perf.apps > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                          <p className="text-[10px] text-gray-400 mb-1.5">Companies</p>
                          <div className="flex flex-wrap gap-1">
                            {applications.filter(a => a.resumeVersion === rv.name).slice(0, 4).map(a => (
                              <Badge key={a.id} className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-[10px]">{a.company}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
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
