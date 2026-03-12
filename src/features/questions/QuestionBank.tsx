import { useState, useRef } from 'react'
import { useStore } from '../../store/useStore'
import { Card, Badge, Button, Progress, EmptyState } from '../../components/ui'
import { QUESTION_STATUS_STYLES, DIFFICULTY_STYLES } from '../../constants/config'
import { cn } from '../../lib/utils'
import {
  BookOpen, Edit3, X, Check, RefreshCw, Eye, Star,
  ChevronRight, Filter, Upload, FileText, Loader2, AlertCircle
} from 'lucide-react'
import type { Question } from '../../types'

/* ── AI helpers (same as Chatbot) ── */
const AI_STORAGE_KEY = 'ct-chat-config'
interface AICfg { provider: string; model: string; apiKeys: Record<string, string> }
function loadAI(): AICfg {
  try { const r = localStorage.getItem(AI_STORAGE_KEY); if (r) return { provider: 'openai', model: 'gpt-4o-mini', apiKeys: {}, ...JSON.parse(r) } } catch {}
  return { provider: 'openai', model: 'gpt-4o-mini', apiKeys: {} }
}

async function aiCall(url: string, apiKey: string, model: string, msgs: { role: string; content: string }[], extra: Record<string, string> = {}) {
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}`, ...extra }, body: JSON.stringify({ model, messages: msgs, max_tokens: 4096 }) })
  if (!res.ok) throw new Error(`API ${res.status}`)
  return ((await res.json()).choices?.[0]?.message?.content || '') as string
}
async function geminiCall(apiKey: string, model: string, msgs: { role: string; content: string }[]) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
  const sysMsg = msgs.find(m => m.role === 'system')
  const contents = msgs.filter(m => m.role !== 'system').map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }))
  const body: Record<string, unknown> = { contents }
  if (sysMsg) body.systemInstruction = { parts: [{ text: sysMsg.content }] }
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  if (!res.ok) throw new Error(`Gemini ${res.status}`)
  return (await res.json()).candidates?.[0]?.content?.parts?.[0]?.text || ''
}
async function generateQuestionsAI(text: string): Promise<Omit<Question, 'id'>[]> {
  const cfg = loadAI()
  const key = cfg.apiKeys[cfg.provider]
  if (!key) throw new Error('No API key configured. Set one in the AI Chatbot settings first.')
  const prompt = `Given the following document text, generate 10-15 interview/study questions with answers.
Return ONLY a JSON array. Each object must have: "category" (string), "difficulty" ("Easy"|"Medium"|"Hard"), "question" (string), "sampleAnswer" (string).
Do not include any other text or markdown fences.

Document:
${text.slice(0, 12000)}`

  const msgs = [{ role: 'system', content: 'You generate interview questions from documents. Respond only with valid JSON.' }, { role: 'user', content: prompt }]
  let raw: string
  switch (cfg.provider) {
    case 'openai': raw = await aiCall('https://api.openai.com/v1/chat/completions', key, cfg.model, msgs); break
    case 'groq': raw = await aiCall('https://api.groq.com/openai/v1/chat/completions', key, cfg.model, msgs); break
    case 'openrouter': raw = await aiCall('https://openrouter.ai/api/v1/chat/completions', key, cfg.model, msgs, { 'HTTP-Referer': globalThis.location?.origin || '' }); break
    case 'gemini': raw = await geminiCall(key, cfg.model, msgs); break
    default: throw new Error('Unknown provider')
  }
  // strip markdown fences if present
  raw = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
  const arr = JSON.parse(raw)
  if (!Array.isArray(arr)) throw new Error('AI did not return an array')
  return arr.map((item: Record<string, string>) => ({
    category: String(item.category || 'General'),
    difficulty: (['Easy', 'Medium', 'Hard'].includes(item.difficulty) ? item.difficulty : 'Medium') as Question['difficulty'],
    question: String(item.question || ''),
    sampleAnswer: String(item.sampleAnswer || ''),
    notes: '',
    status: 'Not Started' as const,
    lastPracticed: null,
    starred: false,
  })).filter((q: Omit<Question, 'id'>) => q.question.length > 5)
}

/* ── simple client-side fallback ── */
function extractQuestionsLocal(text: string): Omit<Question, 'id'>[] {
  // find lines ending with ?
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.endsWith('?') && l.length > 10)
  return lines.map(q => ({
    category: 'Uploaded',
    difficulty: 'Medium' as const,
    question: q.replace(/^\d+[\.\)]\s*/, ''),
    sampleAnswer: '',
    notes: '',
    status: 'Not Started' as const,
    lastPracticed: null,
    starred: false,
  }))
}

export function QuestionBank() {
  const { questions, cycleQuestionStatus, markQuestionConfident, updateQuestionNotes, toggleStarQuestion, addQuestions } = useStore()
  const [filter, setFilter] = useState({ category: 'All', difficulty: 'All', status: 'All' })
  const [practiceMode, setPracticeMode] = useState(false)
  const [practiceQ, setPracticeQ] = useState<Question | null>(null)
  const [showAnswer, setShowAnswer] = useState(false)
  const [expandedQ, setExpandedQ] = useState<number | null>(null)
  const [noteDraft, setNoteDraft] = useState('')

  // upload state
  const [showUpload, setShowUpload] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [uploadResult, setUploadResult] = useState<Omit<Question, 'id'>[] | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const categories = ['All', ...new Set(questions.map(q => q.category))]
  const difficulties = ['All', 'Easy', 'Medium', 'Hard']
  const statuses = ['All', 'Not Started', 'Needs Work', 'In Progress', 'Confident']

  const filtered = questions.filter(q =>
    (filter.category === 'All' || q.category === filter.category) &&
    (filter.difficulty === 'All' || q.difficulty === filter.difficulty) &&
    (filter.status === 'All' || q.status === filter.status)
  )

  const byCategory = categories.filter(c => c !== 'All').map(cat => ({
    cat,
    total: questions.filter(q => q.category === cat).length,
    confident: questions.filter(q => q.category === cat && q.status === 'Confident').length,
  }))

  const confidentTotal = questions.filter(q => q.status === 'Confident').length

  function startPractice() {
    const pool = questions.filter(q => q.status !== 'Confident')
    if (pool.length === 0) return
    setPracticeQ(pool[Math.floor(Math.random() * pool.length)])
    setShowAnswer(false)
    setPracticeMode(true)
  }

  function nextPractice() {
    const pool = questions.filter(q => q.status !== 'Confident')
    if (pool.length === 0) { setPracticeMode(false); return }
    setPracticeQ(pool[Math.floor(Math.random() * pool.length)])
    setShowAnswer(false)
  }

  /* ── file upload handler ── */
  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadError('')
    setUploadResult(null)
    setUploading(true)

    try {
      const text = await file.text()
      if (!text.trim()) throw new Error('File is empty')

      // try AI first, fall back to local
      let qs: Omit<Question, 'id'>[]
      try {
        qs = await generateQuestionsAI(text)
      } catch {
        qs = extractQuestionsLocal(text)
        if (qs.length === 0) throw new Error('Could not extract questions. Make sure the document contains question-like sentences or configure an AI key in the chatbot.')
      }
      setUploadResult(qs)
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Failed to process file')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  function confirmUpload() {
    if (!uploadResult) return
    addQuestions(uploadResult)
    setUploadResult(null)
    setShowUpload(false)
  }

  // Practice mode
  if (practiceMode && practiceQ) {
    return (
      <div className="space-y-4 max-w-2xl animate-fade-in">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">Practice Mode</h2>
          <Button variant="secondary" onClick={() => setPracticeMode(false)} size="sm">
            <X className="w-4 h-4" /> Exit
          </Button>
        </div>
        <Card className="p-8">
          <div className="flex gap-2 mb-6 flex-wrap">
            <Badge className={DIFFICULTY_STYLES[practiceQ.difficulty]}>{practiceQ.difficulty}</Badge>
            <Badge className="bg-purple-50 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">{practiceQ.category}</Badge>
            <Badge className={QUESTION_STATUS_STYLES[practiceQ.status]}>{practiceQ.status}</Badge>
          </div>
          <p className="text-lg font-medium text-gray-900 dark:text-white mb-8 leading-relaxed">{practiceQ.question}</p>
          {!showAnswer ? (
            <Button onClick={() => setShowAnswer(true)}>
              <Eye className="w-4 h-4" /> Reveal hints & answer
            </Button>
          ) : (
            <div className="space-y-4">
              {practiceQ.sampleAnswer && (
                <div className="p-4 bg-brand-50 dark:bg-brand-900/20 rounded-lg border border-brand-200 dark:border-brand-800">
                  <p className="text-sm font-medium text-brand-700 dark:text-brand-300 mb-1">Sample approach</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{practiceQ.sampleAnswer}</p>
                </div>
              )}
              {practiceQ.notes && (
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                  <p className="text-sm font-medium text-amber-700 dark:text-amber-300 mb-1">Your notes</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{practiceQ.notes}</p>
                </div>
              )}
              <div className="flex gap-3">
                <Button onClick={() => { markQuestionConfident(practiceQ.id); nextPractice() }} size="sm">
                  <Check className="w-4 h-4" /> Mark confident & next
                </Button>
                <Button variant="secondary" onClick={nextPractice} size="sm">
                  <RefreshCw className="w-4 h-4" /> Skip to next
                </Button>
              </div>
            </div>
          )}
        </Card>
        <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
          {questions.filter(q => q.status !== 'Confident').length} questions remaining to practice
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4 max-w-5xl animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">Interview Question Bank</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{confidentTotal} of {questions.length} confident</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowUpload(true)} size="sm" variant="secondary">
            <Upload className="w-4 h-4" /> Upload Document
          </Button>
          <Button onClick={startPractice} size="sm">
            <BookOpen className="w-4 h-4" /> Practice mode
          </Button>
        </div>
      </div>

      {/* Upload panel */}
      {showUpload && (
        <Card className="p-5 border border-dashed border-brand-300 dark:border-brand-700 bg-brand-50/30 dark:bg-brand-900/10">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-sm font-bold tracking-tight text-gray-900 dark:text-white">Generate Questions from a Document</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Upload .txt, .md, or .csv — AI will generate interview questions, or questions with "?" will be extracted.</p>
            </div>
            <button onClick={() => { setShowUpload(false); setUploadResult(null); setUploadError('') }} className="text-gray-400 hover:text-gray-600" title="Close upload"><X className="w-4 h-4" /></button>
          </div>

          <div className="flex items-center gap-3">
            <label className={cn(
              'flex items-center gap-2 px-4 py-3 rounded-lg border border-dashed cursor-pointer transition-colors',
              'border-gray-300 dark:border-gray-600 hover:border-brand-400 dark:hover:border-brand-500',
              uploading && 'opacity-50 pointer-events-none',
            )}>
              <FileText className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-300">Choose file…</span>
              <input ref={fileRef} type="file" accept=".txt,.md,.csv,.text" className="hidden" onChange={handleFile} />
            </label>
            {uploading && <Loader2 className="w-5 h-5 animate-spin text-brand-500" />}
          </div>

          {uploadError && (
            <div className="flex items-center gap-2 mt-3 text-xs text-red-600 dark:text-red-400">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {uploadError}
            </div>
          )}

          {uploadResult && (
            <div className="mt-4 space-y-3">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">{uploadResult.length} questions generated — preview:</p>
              <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                {uploadResult.slice(0, 10).map((q, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                    <Badge className={cn(DIFFICULTY_STYLES[q.difficulty], 'text-[9px]')}>{q.difficulty}</Badge>
                    <span className="text-gray-700 dark:text-gray-300 truncate">{q.question}</span>
                  </div>
                ))}
                {uploadResult.length > 10 && <p className="text-[10px] text-gray-400">…and {uploadResult.length - 10} more</p>}
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={confirmUpload}><Check className="w-4 h-4" /> Add {uploadResult.length} questions</Button>
                <Button size="sm" variant="secondary" onClick={() => setUploadResult(null)}>Discard</Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Category progress */}
      <div className="grid sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {byCategory.map(c => (
          <Card key={c.cat} className="p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-2">{c.cat}</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2 font-mono">{c.confident}/{c.total}</p>
            <Progress value={c.confident} max={Math.max(c.total, 1)} className="h-1.5" />
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <Filter className="w-3.5 h-3.5 text-gray-400" />
        {[
          { key: 'category' as const, opts: categories },
          { key: 'difficulty' as const, opts: difficulties },
          { key: 'status' as const, opts: statuses },
        ].map(({ key, opts }) => (
          <select
            key={key}
            className="text-xs py-1.5 px-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
            value={filter[key]}
            onChange={e => setFilter(f => ({ ...f, [key]: e.target.value }))}
            title={`Filter by ${key}`}
          >
            {opts.map(o => <option key={o}>{o}</option>)}
          </select>
        ))}
        <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">
          {filtered.length} question{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Questions list */}
      <div className="space-y-2">
        {filtered.map(q => (
          <Card key={q.id} className="p-4">
            <div className="flex items-start gap-3">
              <button
                onClick={() => cycleQuestionStatus(q.id)}
                className={cn('mt-0.5 px-2 py-0.5 rounded-md text-xs font-medium cursor-pointer flex-shrink-0 transition-colors', QUESTION_STATUS_STYLES[q.status])}
                title="Click to cycle status"
              >
                {q.status === 'Confident' ? '✓' : q.status === 'In Progress' ? '~' : q.status === 'Needs Work' ? '✗' : '○'}
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 dark:text-white">{q.question}</p>
                <div className="flex gap-2 mt-2 flex-wrap">
                  <Badge className={cn(DIFFICULTY_STYLES[q.difficulty], 'text-[10px]')}>{q.difficulty}</Badge>
                  <Badge className="bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-[10px]">{q.category}</Badge>
                  {q.lastPracticed && (
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 self-center">Last: {q.lastPracticed}</span>
                  )}
                </div>
              </div>
              <div className="flex gap-1.5 flex-shrink-0">
                <button
                  onClick={() => toggleStarQuestion(q.id)}
                  className={cn('transition-colors', q.starred ? 'text-amber-400' : 'text-gray-300 dark:text-gray-600 hover:text-amber-300')}
                  title={q.starred ? 'Unstar' : 'Star'}
                >
                  <Star className={cn('w-3.5 h-3.5', q.starred && 'fill-current')} />
                </button>
                <button
                  onClick={() => { setExpandedQ(expandedQ === q.id ? null : q.id); setNoteDraft(q.notes) }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  title="Edit notes"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {expandedQ === q.id && (
              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 space-y-3 ml-8">
                {q.sampleAnswer && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                    <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">Sample approach</p>
                    <p className="text-xs text-gray-600 dark:text-gray-300">{q.sampleAnswer}</p>
                  </div>
                )}
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Your notes</label>
                  <textarea
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-none h-20 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400"
                    value={noteDraft}
                    onChange={e => setNoteDraft(e.target.value)}
                    placeholder="Add tips, key points, or your approach..."
                  />
                  <Button onClick={() => { updateQuestionNotes(q.id, noteDraft); setExpandedQ(null) }} size="sm" className="mt-2">
                    Save notes
                  </Button>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}
