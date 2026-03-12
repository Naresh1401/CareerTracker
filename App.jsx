import { useState, useEffect, useCallback } from 'react'
import {
  LayoutDashboard, Briefcase, FileText, Map, HelpCircle,
  Calendar, Lightbulb, LogOut, Plus, Trash2, Edit3, Check,
  X, Download, ChevronRight, TrendingUp, Target, BookOpen,
  Award, Clock, RefreshCw, ChevronDown, Eye, EyeOff, User
} from 'lucide-react'
import {
  RadialBarChart, RadialBar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell
} from 'recharts'

// ─── Status config ───────────────────────────────────────────
const STATUS_CONFIG = {
  Applied:      { color: 'bg-blue-50 text-blue-700',    dot: 'bg-blue-500' },
  OA:           { color: 'bg-purple-50 text-purple-700', dot: 'bg-purple-500' },
  'Phone Screen':{ color: 'bg-yellow-50 text-yellow-700',dot: 'bg-yellow-500' },
  Interview:    { color: 'bg-orange-50 text-orange-700', dot: 'bg-orange-500' },
  Offer:        { color: 'bg-green-50 text-green-700',   dot: 'bg-green-500' },
  Rejected:     { color: 'bg-red-50 text-red-700',       dot: 'bg-red-400' },
}

// ─── Seed data ────────────────────────────────────────────────
let _nextId = 100
function nextId() { return _nextId++ }

const SEED_APPLICATIONS = [
  { id: nextId(), company: 'Google', role: 'ML Engineer', date_applied: '2024-03-10', status: 'Phone Screen', resume_version: 'v2 - ML Focus', notes: 'Recruiter reached out via LinkedIn' },
  { id: nextId(), company: 'Stripe', role: 'Data Scientist', date_applied: '2024-03-08', status: 'OA', resume_version: 'v1 - General', notes: '' },
  { id: nextId(), company: 'Airbnb', role: 'Analytics Engineer', date_applied: '2024-03-06', status: 'Interview', resume_version: 'v2 - ML Focus', notes: '2 rounds scheduled' },
  { id: nextId(), company: 'OpenAI', role: 'Research Engineer', date_applied: '2024-03-04', status: 'Rejected', resume_version: 'v3 - Research', notes: 'Applied too early, revisit in 3 months' },
  { id: nextId(), company: 'Netflix', role: 'Senior Data Scientist', date_applied: '2024-03-01', status: 'Applied', resume_version: 'v1 - General', notes: '' },
]

const SEED_RESUME_VERSIONS = [
  { id: nextId(), name: 'v1 - General', description: 'Broad DS resume, emphasizes Python and SQL', created_at: '2024-02-01' },
  { id: nextId(), name: 'v2 - ML Focus', description: 'Highlights PyTorch, model deployment, A/B testing', created_at: '2024-02-15' },
  { id: nextId(), name: 'v3 - Research', description: 'Academic tone, emphasizes publications and methods', created_at: '2024-03-01' },
]

const SEED_ROADMAP = [
  { id: nextId(), week: 1, title: 'Python & Data Wrangling', topics: 'pandas, numpy, data cleaning, EDA', completed: true },
  { id: nextId(), week: 2, title: 'SQL & Databases', topics: 'advanced SQL, window functions, indexing, PostgreSQL', completed: true },
  { id: nextId(), week: 3, title: 'Statistics & Probability', topics: 'hypothesis testing, distributions, A/B testing', completed: true },
  { id: nextId(), week: 4, title: 'Machine Learning', topics: 'supervised learning, sklearn, model evaluation', completed: false },
  { id: nextId(), week: 5, title: 'Deep Learning', topics: 'neural networks, PyTorch, CNNs, transformers basics', completed: false },
  { id: nextId(), week: 6, title: 'System Design', topics: 'ML pipelines, feature stores, model serving', completed: false },
  { id: nextId(), week: 7, title: 'Interview Prep', topics: 'mock interviews, case studies, coding challenges', completed: false },
]

const SEED_QUESTIONS = [
  { id: nextId(), category: 'Behavioral', question: 'Tell me about a time you resolved a conflict in a team.', difficulty: 'Easy', status: 'Confident', notes: 'Used STAR with my hackathon story' },
  { id: nextId(), category: 'Behavioral', question: 'Describe a project where you had to learn something new quickly.', difficulty: 'Medium', status: 'In Progress', notes: '' },
  { id: nextId(), category: 'Behavioral', question: 'How do you handle tight deadlines with competing priorities?', difficulty: 'Medium', status: 'Not Started', notes: '' },
  { id: nextId(), category: 'Technical', question: 'Explain the bias-variance tradeoff.', difficulty: 'Medium', status: 'Confident', notes: 'Draw the U-curve. Mention regularization.' },
  { id: nextId(), category: 'Technical', question: 'How does gradient descent work? What are its variants?', difficulty: 'Hard', status: 'In Progress', notes: 'Review Adam optimizer' },
  { id: nextId(), category: 'Technical', question: 'What is the difference between L1 and L2 regularization?', difficulty: 'Medium', status: 'Not Started', notes: '' },
  { id: nextId(), category: 'Technical', question: 'How would you handle class imbalance in a dataset?', difficulty: 'Medium', status: 'Not Started', notes: '' },
  { id: nextId(), category: 'System Design', question: 'Design a recommendation system for an e-commerce platform.', difficulty: 'Hard', status: 'Not Started', notes: '' },
  { id: nextId(), category: 'System Design', question: 'How would you build a real-time fraud detection system?', difficulty: 'Hard', status: 'In Progress', notes: 'Focus on feature engineering at stream level' },
  { id: nextId(), category: 'System Design', question: 'Design a feature store for a large ML platform.', difficulty: 'Hard', status: 'Not Started', notes: '' },
]

// ─── Auth Page ────────────────────────────────────────────────
function AuthPage() {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: name } }
        })
        if (error) throw error
        setMessage('Check your email for a confirmation link, then come back to log in!')
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin
        })
        if (error) throw error
        setMessage('Password reset email sent! Check your inbox.')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-brand-600 rounded-2xl mb-4 shadow-lg">
            <TrendingUp className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">CareerTrack</h1>
          <p className="text-gray-500 text-sm mt-1">Your personal job search command center</p>
        </div>

        <div className="card p-8">
          {/* Tab switcher */}
          {mode !== 'reset' && (
            <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
              {['login','signup'].map(m => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setError(''); setMessage('') }}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode===m ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  {m === 'login' ? 'Sign in' : 'Create account'}
                </button>
              ))}
            </div>
          )}

          {message && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
              {message}
            </div>
          )}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
                <input className="input" placeholder="Alex Chen" value={name} onChange={e => setName(e.target.value)} required />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input className="input" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            {mode !== 'reset' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <div className="relative">
                  <input className="input pr-10" type={showPass ? 'text' : 'password'} placeholder="Min. 6 characters" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 flex items-center justify-center gap-2">
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
              {mode === 'login' ? 'Sign in' : mode === 'signup' ? 'Create free account' : 'Send reset link'}
            </button>
          </form>

          {mode === 'login' && (
            <p className="text-center text-sm text-gray-500 mt-4">
              <button onClick={() => { setMode('reset'); setError(''); setMessage('') }} className="text-brand-600 hover:underline">
                Forgot password?
              </button>
            </p>
          )}
          {mode === 'reset' && (
            <p className="text-center text-sm text-gray-500 mt-4">
              <button onClick={() => { setMode('login'); setError(''); setMessage('') }} className="text-brand-600 hover:underline">
                Back to sign in
              </button>
            </p>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          100% free · No credit card · Your data is private
        </p>
      </div>
    </div>
  )
}

// ─── Onboarding ───────────────────────────────────────────────
function Onboarding({ user, onComplete }) {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    full_name: user.user_metadata?.full_name || '',
    education: 'Graduate Student',
    field: '',
    experience_years: '1',
    target_roles: '',
    search_start_date: new Date().toISOString().split('T')[0],
    weekly_hours: '10',
    weekly_app_target: '5',
    courses: '',
  })
  const [loading, setLoading] = useState(false)

  const steps = [
    { title: 'About you', fields: ['full_name','education','field','experience_years'] },
    { title: 'Job search goals', fields: ['target_roles','weekly_app_target','search_start_date'] },
    { title: 'Learning plan', fields: ['courses','weekly_hours'] },
  ]

  async function handleFinish() {
    setLoading(true)
    const { error } = await supabase.from('profiles').upsert({
      id: user.id, ...form,
      target_roles: form.target_roles.split(',').map(s => s.trim()).filter(Boolean),
      courses: form.courses.split('\n').filter(Boolean),
      onboarded: true,
    })
    if (!error) {
      await seedData(user.id)
      onComplete()
    }
    setLoading(false)
  }

  async function seedData(userId) {
    await supabase.from('applications').insert(
      SEED_APPLICATIONS.map(a => ({ ...a, user_id: userId }))
    )
    await supabase.from('resume_versions').insert(
      SEED_RESUME_VERSIONS.map(r => ({ ...r, user_id: userId }))
    )
    await supabase.from('roadmap').insert(
      SEED_ROADMAP.map(r => ({ ...r, user_id: userId }))
    )
    await supabase.from('questions').insert(
      SEED_QUESTIONS.map(q => ({ ...q, user_id: userId }))
    )
  }

  const educationOptions = ['High School', 'Bachelor\'s', 'Master\'s', 'Graduate Student', 'PhD', 'Bootcamp', 'Self-taught']

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">Let's set up your tracker</h2>
          <p className="text-gray-500 text-sm mt-1">Step {step + 1} of {steps.length} — {steps[step].title}</p>
          <div className="flex gap-2 justify-center mt-3">
            {steps.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all ${i <= step ? 'w-12 bg-brand-500' : 'w-6 bg-gray-200'}`} />
            ))}
          </div>
        </div>

        <div className="card p-8 space-y-4">
          {step === 0 && <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your name</label>
              <input className="input" value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} placeholder="Alex Chen" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Education level</label>
              <select className="input" value={form.education} onChange={e => setForm({...form, education: e.target.value})}>
                {educationOptions.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Field / domain</label>
              <input className="input" value={form.field} onChange={e => setForm({...form, field: e.target.value})} placeholder="e.g. Data Science, Software Engineering, Finance" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Years of experience</label>
              <input className="input" type="number" min="0" max="30" value={form.experience_years} onChange={e => setForm({...form, experience_years: e.target.value})} />
            </div>
          </>}

          {step === 1 && <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target roles <span className="text-gray-400">(comma-separated)</span></label>
              <input className="input" value={form.target_roles} onChange={e => setForm({...form, target_roles: e.target.value})} placeholder="Data Scientist, ML Engineer, Analytics Engineer" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Job search start date</label>
              <input className="input" type="date" value={form.search_start_date} onChange={e => setForm({...form, search_start_date: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Applications target per week</label>
              <input className="input" type="number" min="1" max="50" value={form.weekly_app_target} onChange={e => setForm({...form, weekly_app_target: e.target.value})} />
            </div>
          </>}

          {step === 2 && <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current courses <span className="text-gray-400">(one per line)</span></label>
              <textarea className="input h-28 resize-none" value={form.courses} onChange={e => setForm({...form, courses: e.target.value})} placeholder={"Deep Learning Specialization (deadline: Apr 15)\nSQL Advanced Course (deadline: Mar 30)"} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Weekly hours available for learning</label>
              <input className="input" type="number" min="1" max="80" value={form.weekly_hours} onChange={e => setForm({...form, weekly_hours: e.target.value})} />
            </div>
          </>}

          <div className="flex gap-3 pt-2">
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)} className="btn-secondary flex-1">Back</button>
            )}
            {step < steps.length - 1 ? (
              <button onClick={() => setStep(s => s + 1)} className="btn-primary flex-1">Continue</button>
            ) : (
              <button onClick={handleFinish} disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Launch my tracker
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Dashboard Tab ────────────────────────────────────────────
function Dashboard({ profile, applications, roadmap, questions }) {
  const daysSince = profile?.search_start_date
    ? Math.floor((Date.now() - new Date(profile.search_start_date)) / 86400000)
    : 0

  const interviews = applications.filter(a => ['Interview','Offer'].includes(a.status)).length
  const offers = applications.filter(a => a.status === 'Offer').length
  const convRate = applications.length > 0 ? Math.round((interviews / applications.length) * 100) : 0
  const roadmapPct = roadmap.length > 0 ? Math.round(roadmap.filter(r => r.completed).length / roadmap.length * 100) : 0
  const confidentPct = questions.length > 0 ? Math.round(questions.filter(q => q.status === 'Confident').length / questions.length * 100) : 0

  const score = Math.min(100, Math.round(
    (Math.min(applications.length, 20) / 20) * 30 +
    convRate * 0.3 +
    roadmapPct * 0.2 +
    confidentPct * 0.1 +
    offers * 10
  ))

  const scoreColor = score < 30 ? '#ef4444' : score < 60 ? '#f59e0b' : '#2d9469'
  const gaugeData = [{ value: score, fill: scoreColor }]

  const statusCounts = Object.keys(STATUS_CONFIG).reduce((acc, s) => {
    acc[s] = applications.filter(a => a.status === s).length
    return acc
  }, {})

  const suggestions = []
  if (applications.length < 5) suggestions.push({ icon: '📤', text: 'Apply to at least 5 companies to get meaningful data from this tracker.' })
  if (convRate < 15 && applications.length >= 5) suggestions.push({ icon: '📄', text: 'Your interview rate is below 15% — consider tailoring your resume more per role.' })
  if (roadmapPct < 50) suggestions.push({ icon: '📚', text: `You're ${roadmapPct}% through your learning roadmap. Keep your momentum going!` })
  if (confidentPct < 40) suggestions.push({ icon: '🎯', text: 'Practice more interview questions — especially technical and system design ones.' })
  const activeWeek = roadmap.find(r => !r.completed)
  if (activeWeek) suggestions.push({ icon: '🗓', text: `Current focus: Week ${activeWeek.week} — ${activeWeek.title}` })
  if (suggestions.length === 0) suggestions.push({ icon: '🌟', text: 'Great progress! Keep applying consistently and practicing interview questions.' })

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900">
          Good {new Date().getHours() < 12 ? 'morning' : 'afternoon'}, {profile?.full_name?.split(' ')[0] || 'there'} 👋
        </h2>
        <p className="text-gray-500 text-sm">Day {daysSince} of your job search · {profile?.field}</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Applications', value: applications.length, sub: `+${applications.filter(a => { const d = new Date(a.date_applied); return (Date.now()-d)/86400000 < 7 }).length} this week`, color: 'text-blue-600' },
          { label: 'Interviews', value: interviews, sub: `${convRate}% conversion rate`, color: 'text-orange-600' },
          { label: 'Offers', value: offers, sub: offers > 0 ? 'Congrats! 🎉' : 'Keep going!', color: 'text-green-600' },
          { label: 'Roadmap', value: `${roadmapPct}%`, sub: `Week ${(roadmap.filter(r=>r.completed).length)+1} of ${roadmap.length}`, color: 'text-purple-600' },
        ].map(s => (
          <div key={s.label} className="card p-5">
            <p className="text-xs text-gray-500 font-medium mb-1">{s.label}</p>
            <p className={`text-3xl font-semibold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-400 mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Probability score */}
        <div className="card p-6 flex flex-col items-center">
          <p className="text-sm font-medium text-gray-700 mb-2">Job probability score</p>
          <div className="w-36 h-36">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart innerRadius="65%" outerRadius="100%" data={gaugeData} startAngle={90} endAngle={-270}>
                <RadialBar dataKey="value" cornerRadius={8} background={{ fill: '#f3f4f6' }} />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
          <div className="text-center -mt-16 mb-4">
            <p className="text-3xl font-semibold" style={{ color: scoreColor }}>{score}%</p>
          </div>
          <p className="text-xs text-gray-500 text-center">
            {score < 30 ? 'Build more momentum — apply more and study harder.' :
             score < 60 ? 'Making progress! Focus on interview conversion.' :
             'Strong position — keep consistent and stay prepared.'}
          </p>
        </div>

        {/* Status breakdown */}
        <div className="card p-6">
          <p className="text-sm font-medium text-gray-700 mb-4">Application pipeline</p>
          <div className="space-y-2.5">
            {Object.entries(statusCounts).filter(([,v]) => v > 0).map(([status, count]) => (
              <div key={status} className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${STATUS_CONFIG[status].dot}`} />
                <span className="text-sm text-gray-600 flex-1">{status}</span>
                <span className="text-sm font-medium text-gray-900">{count}</span>
                <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-400 rounded-full" style={{ width: `${(count/applications.length)*100}%` }} />
                </div>
              </div>
            ))}
            {Object.values(statusCounts).every(v => v === 0) && (
              <p className="text-sm text-gray-400">No applications yet. Add your first one!</p>
            )}
          </div>
        </div>

        {/* Suggestions */}
        <div className="card p-6">
          <p className="text-sm font-medium text-gray-700 mb-4">Today's focus</p>
          <div className="space-y-3">
            {suggestions.slice(0, 4).map((s, i) => (
              <div key={i} className="flex gap-3 p-3 bg-gray-50 rounded-xl">
                <span className="text-base">{s.icon}</span>
                <p className="text-xs text-gray-600 leading-relaxed">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Applications Tab ─────────────────────────────────────────
function Applications({ applications, setApplications, resumeVersions, userId }) {
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)
  const [filterStatus, setFilterStatus] = useState('All')
  const [form, setForm] = useState({ company: '', role: '', date_applied: new Date().toISOString().split('T')[0], status: 'Applied', resume_version: '', notes: '' })
  const [loading, setLoading] = useState(false)

  const filtered = filterStatus === 'All' ? applications : applications.filter(a => a.status === filterStatus)

  function startEdit(app) {
    setForm({ company: app.company, role: app.role, date_applied: app.date_applied, status: app.status, resume_version: app.resume_version || '', notes: app.notes || '' })
    setEditId(app.id)
    setShowForm(true)
  }

  function handleSave() {
    setLoading(true)
    if (editId) {
      setApplications(prev => prev.map(a => a.id === editId ? { ...a, ...form } : a))
      setEditId(null)
    } else {
      setApplications(prev => [{ id: nextId(), ...form }, ...prev])
    }
    setForm({ company: '', role: '', date_applied: new Date().toISOString().split('T')[0], status: 'Applied', resume_version: '', notes: '' })
    setShowForm(false)
    setLoading(false)
  }

  function handleDelete(id) {
    if (!confirm('Delete this application?')) return
    setApplications(prev => prev.filter(a => a.id !== id))
  }

  const counts = Object.keys(STATUS_CONFIG).reduce((acc, s) => {
    acc[s] = applications.filter(a => a.status === s).length
    return acc
  }, {})

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Applications</h2>
          <p className="text-sm text-gray-500">{applications.length} total</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditId(null) }} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add application
        </button>
      </div>

      {/* Status pills */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setFilterStatus('All')} className={`badge cursor-pointer ${filterStatus === 'All' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          All ({applications.length})
        </button>
        {Object.entries(counts).filter(([,v]) => v > 0).map(([s, c]) => (
          <button key={s} onClick={() => setFilterStatus(filterStatus === s ? 'All' : s)}
            className={`badge cursor-pointer ${filterStatus === s ? STATUS_CONFIG[s].color + ' ring-2 ring-offset-1 ring-current' : STATUS_CONFIG[s].color}`}>
            {s} ({c})
          </button>
        ))}
      </div>

      {/* Form */}
      {showForm && (
        <div className="card p-6 border-brand-200 border-2">
          <h3 className="text-sm font-medium text-gray-900 mb-4">{editId ? 'Edit application' : 'New application'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Company</label>
              <input className="input" value={form.company} onChange={e => setForm({...form, company: e.target.value})} placeholder="Google" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Role</label>
              <input className="input" value={form.role} onChange={e => setForm({...form, role: e.target.value})} placeholder="ML Engineer" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Date applied</label>
              <input className="input" type="date" value={form.date_applied} onChange={e => setForm({...form, date_applied: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Status</label>
              <select className="input" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                {Object.keys(STATUS_CONFIG).map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Resume version</label>
              <select className="input" value={form.resume_version} onChange={e => setForm({...form, resume_version: e.target.value})}>
                <option value="">— Select —</option>
                {resumeVersions.map(r => <option key={r.id}>{r.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Notes</label>
              <input className="input" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Any notes..." />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={handleSave} disabled={loading || !form.company || !form.role} className="btn-primary flex items-center gap-2">
              {loading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
              {editId ? 'Save changes' : 'Add'}
            </button>
            <button onClick={() => { setShowForm(false); setEditId(null) }} className="btn-secondary">Cancel</button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['Company','Role','Date','Status','Resume Version','Notes',''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-gray-400 text-sm">No applications yet. Add your first one!</td></tr>
              ) : filtered.map(app => (
                <tr key={app.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{app.company}</td>
                  <td className="px-4 py-3 text-gray-600">{app.role}</td>
                  <td className="px-4 py-3 text-gray-500">{new Date(app.date_applied).toLocaleDateString('en-US',{month:'short',day:'numeric'})}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${STATUS_CONFIG[app.status]?.color || 'bg-gray-100 text-gray-600'}`}>
                      {app.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{app.resume_version || '—'}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs max-w-[140px] truncate">{app.notes || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => startEdit(app)} className="text-gray-400 hover:text-brand-600 transition-colors"><Edit3 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDelete(app.id)} className="text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ─── Resume Versions Tab ──────────────────────────────────────
function ResumeVersions({ resumeVersions, setResumeVersions, applications, userId }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', description: '' })
  const [loading, setLoading] = useState(false)

  function handleAdd() {
    setLoading(true)
    setResumeVersions(prev => [...prev, { id: nextId(), ...form, created_at: new Date().toISOString().split('T')[0] }])
    setForm({ name: '', description: '' })
    setShowForm(false)
    setLoading(false)
  }

  function handleDelete(id) {
    if (!confirm('Delete this resume version?')) return
    setResumeVersions(prev => prev.filter(r => r.id !== id))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Resume versions</h2>
          <p className="text-sm text-gray-500">Track which resume gets the best results</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> New version
        </button>
      </div>

      {showForm && (
        <div className="card p-6 border-2 border-brand-200">
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Version name</label>
              <input className="input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="v4 - Startup Focused" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Description / notes</label>
              <input className="input" value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Emphasizes scrappy projects and fast iteration..." />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={handleAdd} disabled={loading || !form.name} className="btn-primary flex items-center gap-2">
              {loading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} Add
            </button>
            <button onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {resumeVersions.map(rv => {
          const apps = applications.filter(a => a.resume_version === rv.name)
          const interviews = apps.filter(a => ['Interview','Offer'].includes(a.status)).length
          const rate = apps.length > 0 ? Math.round((interviews / apps.length) * 100) : 0
          const isBest = resumeVersions.length > 1 && rate === Math.max(...resumeVersions.map(r => {
            const a2 = applications.filter(x => x.resume_version === r.name)
            return a2.length > 0 ? (a2.filter(x => ['Interview','Offer'].includes(x.status)).length / a2.length) * 100 : 0
          })) && rate > 0

          return (
            <div key={rv.id} className={`card p-5 relative ${isBest ? 'border-2 border-brand-400' : ''}`}>
              {isBest && <span className="badge bg-brand-100 text-brand-700 absolute -top-2.5 left-4">⭐ Best performing</span>}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-medium text-gray-900">{rv.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{rv.description}</p>
                </div>
                <button onClick={() => handleDelete(rv.id)} className="text-gray-300 hover:text-red-400 transition-colors ml-2">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-4">
                {[
                  { label: 'Sent', val: apps.length },
                  { label: 'Interviews', val: interviews },
                  { label: 'Rate', val: `${rate}%` },
                ].map(s => (
                  <div key={s.label} className="bg-gray-50 rounded-xl p-2 text-center">
                    <p className="text-lg font-semibold text-gray-900">{s.val}</p>
                    <p className="text-xs text-gray-400">{s.label}</p>
                  </div>
                ))}
              </div>
              {apps.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-400 mb-1.5">Companies</p>
                  <div className="flex flex-wrap gap-1">
                    {apps.slice(0, 5).map(a => (
                      <span key={a.id} className="badge bg-gray-100 text-gray-600 text-xs">{a.company}</span>
                    ))}
                    {apps.length > 5 && <span className="badge bg-gray-100 text-gray-500">+{apps.length - 5}</span>}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Roadmap Tab ──────────────────────────────────────────────
function Roadmap({ roadmap, setRoadmap }) {
  const [expandedWeek, setExpandedWeek] = useState(null)

  function toggleComplete(item) {
    const updated = { ...item, completed: !item.completed }
    setRoadmap(prev => prev.map(r => r.id === item.id ? updated : r))
  }

  const completedCount = roadmap.filter(r => r.completed).length
  const pct = roadmap.length > 0 ? Math.round(completedCount / roadmap.length * 100) : 0

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Learning roadmap</h2>
          <p className="text-sm text-gray-500">{completedCount} of {roadmap.length} weeks complete</p>
        </div>
        <span className="text-2xl font-semibold text-brand-600">{pct}%</span>
      </div>

      {/* Progress bar */}
      <div className="card p-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-brand-400 to-brand-600 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-sm text-gray-500 min-w-[3rem] text-right">{pct}%</span>
        </div>
      </div>

      {/* Roadmap nodes */}
      <div className="space-y-3">
        {roadmap.map((item, i) => {
          const isActive = !item.completed && (i === 0 || roadmap[i-1]?.completed)
          return (
            <div key={item.id} className={`card p-4 border-l-4 ${item.completed ? 'border-brand-400 bg-brand-50/30' : isActive ? 'border-blue-400 bg-blue-50/30' : 'border-gray-200'}`}>
              <div className="flex items-center gap-3">
                <button onClick={() => toggleComplete(item)}
                  className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${item.completed ? 'bg-brand-500 text-white' : isActive ? 'bg-blue-100 text-blue-500 hover:bg-blue-200' : 'bg-gray-100 text-gray-300 hover:bg-gray-200'}`}>
                  {item.completed ? <Check className="w-3.5 h-3.5" /> : <span className="text-xs font-medium">{item.week}</span>}
                </button>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className={`font-medium text-sm ${item.completed ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                      Week {item.week}: {item.title}
                    </p>
                    {isActive && <span className="badge bg-blue-100 text-blue-700 text-xs">Current</span>}
                  </div>
                </div>
                <button onClick={() => setExpandedWeek(expandedWeek === item.id ? null : item.id)}
                  className="text-gray-400 hover:text-gray-600 transition-colors">
                  <ChevronDown className={`w-4 h-4 transition-transform ${expandedWeek === item.id ? 'rotate-180' : ''}`} />
                </button>
              </div>
              {expandedWeek === item.id && (
                <div className="mt-3 ml-10">
                  <p className="text-xs text-gray-500 font-medium mb-2">Topics to cover</p>
                  <div className="flex flex-wrap gap-1.5">
                    {item.topics?.split(',').map((t, ti) => (
                      <span key={ti} className="badge bg-gray-100 text-gray-600">{t.trim()}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Question Bank Tab ────────────────────────────────────────
function QuestionBank({ questions, setQuestions }) {
  const [filter, setFilter] = useState({ category: 'All', difficulty: 'All', status: 'All' })
  const [practiceMode, setPracticeMode] = useState(false)
  const [practiceQ, setPracticeQ] = useState(null)
  const [showAnswer, setShowAnswer] = useState(false)
  const [expandedQ, setExpandedQ] = useState(null)
  const [editNotes, setEditNotes] = useState({})

  const categories = ['All', ...new Set(questions.map(q => q.category))]
  const difficulties = ['All', 'Easy', 'Medium', 'Hard']
  const statuses = ['All', 'Not Started', 'In Progress', 'Confident']

  const filtered = questions.filter(q =>
    (filter.category === 'All' || q.category === filter.category) &&
    (filter.difficulty === 'All' || q.difficulty === filter.difficulty) &&
    (filter.status === 'All' || q.status === filter.status)
  )

  function cycleStatus(q) {
    const order = ['Not Started', 'In Progress', 'Confident']
    const next = order[(order.indexOf(q.status) + 1) % 3]
    setQuestions(prev => prev.map(x => x.id === q.id ? { ...x, status: next } : x))
  }

  function saveNotes(q) {
    const notes = editNotes[q.id] ?? q.notes
    setQuestions(prev => prev.map(x => x.id === q.id ? { ...x, notes } : x))
    setExpandedQ(null)
  }

  function startPractice() {
    const unanswered = questions.filter(q => q.status !== 'Confident')
    if (unanswered.length === 0) return
    setPracticeQ(unanswered[Math.floor(Math.random() * unanswered.length)])
    setShowAnswer(false)
    setPracticeMode(true)
  }

  const statusStyle = { 'Not Started': 'bg-gray-100 text-gray-500', 'In Progress': 'bg-yellow-50 text-yellow-700', 'Confident': 'bg-green-50 text-green-700' }
  const diffStyle = { Easy: 'bg-green-50 text-green-600', Medium: 'bg-yellow-50 text-yellow-600', Hard: 'bg-red-50 text-red-600' }

  const byCategory = categories.filter(c => c !== 'All').map(cat => ({
    cat,
    total: questions.filter(q => q.category === cat).length,
    confident: questions.filter(q => q.category === cat && q.status === 'Confident').length,
  }))

  if (practiceMode && practiceQ) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Practice mode</h2>
          <button onClick={() => setPracticeMode(false)} className="btn-secondary flex items-center gap-2">
            <X className="w-4 h-4" /> Exit
          </button>
        </div>
        <div className="card p-8 max-w-2xl">
          <div className="flex gap-2 mb-6">
            <span className={`badge ${diffStyle[practiceQ.difficulty]}`}>{practiceQ.difficulty}</span>
            <span className="badge bg-purple-50 text-purple-700">{practiceQ.category}</span>
          </div>
          <p className="text-xl font-medium text-gray-900 mb-8 leading-relaxed">{practiceQ.question}</p>
          {!showAnswer ? (
            <button onClick={() => setShowAnswer(true)} className="btn-primary flex items-center gap-2">
              <Eye className="w-4 h-4" /> Reveal tips & notes
            </button>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-brand-50 rounded-xl border border-brand-200">
                <p className="text-sm font-medium text-brand-700 mb-1">Your notes</p>
                <p className="text-sm text-gray-600">{practiceQ.notes || 'No notes yet. Add them from the question list.'}</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => cycleStatus(practiceQ)} className="btn-primary flex items-center gap-2">
                  <Check className="w-4 h-4" /> Mark as confident
                </button>
                <button onClick={startPractice} className="btn-secondary flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" /> Next question
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Interview question bank</h2>
          <p className="text-sm text-gray-500">{questions.filter(q=>q.status==='Confident').length} of {questions.length} confident</p>
        </div>
        <button onClick={startPractice} className="btn-primary flex items-center gap-2">
          <BookOpen className="w-4 h-4" /> Practice mode
        </button>
      </div>

      {/* Category progress */}
      <div className="grid sm:grid-cols-3 gap-3">
        {byCategory.map(c => (
          <div key={c.cat} className="card p-4">
            <p className="text-xs text-gray-500 font-medium mb-2">{c.cat}</p>
            <p className="text-sm font-medium text-gray-900 mb-2">{c.confident}/{c.total} confident</p>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-brand-500 rounded-full" style={{ width: `${c.total > 0 ? (c.confident/c.total)*100 : 0}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {[['category', categories], ['difficulty', difficulties], ['status', statuses]].map(([key, opts]) => (
          <select key={key} className="input !w-auto text-xs py-1.5" value={filter[key]}
            onChange={e => setFilter(f => ({ ...f, [key]: e.target.value }))}>
            {opts.map(o => <option key={o}>{o}</option>)}
          </select>
        ))}
      </div>

      {/* Questions list */}
      <div className="space-y-2">
        {filtered.map(q => (
          <div key={q.id} className="card p-4">
            <div className="flex items-start gap-3">
              <button onClick={() => cycleStatus(q)} className={`mt-0.5 badge cursor-pointer ${statusStyle[q.status]} flex-shrink-0`}>
                {q.status === 'Confident' ? '✓' : q.status === 'In Progress' ? '~' : '○'}
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900">{q.question}</p>
                <div className="flex gap-2 mt-2">
                  <span className={`badge text-xs ${diffStyle[q.difficulty]}`}>{q.difficulty}</span>
                  <span className="badge text-xs bg-gray-100 text-gray-500">{q.category}</span>
                </div>
              </div>
              <button onClick={() => setExpandedQ(expandedQ === q.id ? null : q.id)}
                className="text-gray-400 hover:text-gray-600 flex-shrink-0">
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            </div>
            {expandedQ === q.id && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <label className="block text-xs text-gray-500 mb-1">Notes / answer hints</label>
                <textarea
                  className="input h-20 resize-none text-xs"
                  defaultValue={q.notes || ''}
                  onChange={e => setEditNotes(n => ({ ...n, [q.id]: e.target.value }))}
                  placeholder="Add tips, key points, or your answer approach..."
                />
                <button onClick={() => saveNotes(q)} className="btn-primary mt-2 text-xs py-1.5">Save notes</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Timetable Tab ────────────────────────────────────────────
function Timetable({ profile, roadmap }) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const hoursPerDay = Math.round((profile?.weekly_hours || 10) / 7)
  const activeWeek = roadmap.find(r => !r.completed) || roadmap[0]

  const scheduleTypes = {
    Learning: { color: 'bg-blue-100 text-blue-700 border-blue-200', border: 'border-blue-300' },
    Applications: { color: 'bg-green-100 text-green-700 border-green-200', border: 'border-green-300' },
    'Interview Prep': { color: 'bg-amber-100 text-amber-700 border-amber-200', border: 'border-amber-300' },
    Rest: { color: 'bg-gray-100 text-gray-600 border-gray-200', border: 'border-gray-300' },
  }

  const schedule = {
    Mon: [{ type: 'Learning', time: '9–11am', task: activeWeek?.title || 'Study' }, { type: 'Applications', time: '7–8pm', task: 'Apply to 1–2 jobs' }],
    Tue: [{ type: 'Learning', time: '9–11am', task: activeWeek?.title || 'Study' }, { type: 'Interview Prep', time: '7–8pm', task: 'Practice questions' }],
    Wed: [{ type: 'Applications', time: '9–10am', task: 'Apply + follow up' }, { type: 'Learning', time: '7–9pm', task: activeWeek?.title || 'Study' }],
    Thu: [{ type: 'Learning', time: '9–11am', task: activeWeek?.title || 'Study' }, { type: 'Interview Prep', time: '7–8pm', task: 'Mock interview' }],
    Fri: [{ type: 'Applications', time: '9–10am', task: 'Apply + networking' }, { type: 'Learning', time: '2–4pm', task: 'Review week' }],
    Sat: [{ type: 'Learning', time: '10am–1pm', task: 'Deep work — ' + (activeWeek?.title || 'Study') }, { type: 'Interview Prep', time: '3–5pm', task: 'Coding challenges' }],
    Sun: [{ type: 'Rest', time: 'Morning', task: 'Recharge' }, { type: 'Applications', time: '7–8pm', task: 'Plan next week' }],
  }

  function exportICS() {
    const now = new Date()
    const monday = new Date(now)
    monday.setDate(now.getDate() - now.getDay() + 1)

    const dayMap = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 }
    const hourMap = {
      '9–11am': [9, 11], '7–8pm': [19, 20], '7–9pm': [19, 21],
      '9–10am': [9, 10], '2–4pm': [14, 16], '10am–1pm': [10, 13],
      '3–5pm': [15, 17], 'Morning': [9, 10], 'Evening': [19, 20],
    }

    const formatDT = (date) => {
      const p = n => String(n).padStart(2, '0')
      return `${date.getFullYear()}${p(date.getMonth()+1)}${p(date.getDate())}T${p(date.getHours())}${p(date.getMinutes())}00`
    }

    let events = []
    Object.entries(schedule).forEach(([day, blocks]) => {
      blocks.forEach(block => {
        const offset = dayMap[day]
        const hours = hourMap[block.time] || [9, 10]
        const start = new Date(monday)
        start.setDate(monday.getDate() + offset)
        start.setHours(hours[0], 0, 0)
        const end = new Date(start)
        end.setHours(hours[1], 0, 0)

        events.push([
          'BEGIN:VEVENT',
          `DTSTART:${formatDT(start)}`,
          `DTEND:${formatDT(end)}`,
          `SUMMARY:[${block.type}] ${block.task}`,
          `DESCRIPTION:CareerTrack — ${block.type} block`,
          `UID:ct-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          'END:VEVENT',
        ].join('\r\n'))
      })
    })

    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//CareerTrack//EN',
      'CALSCALE:GREGORIAN',
      ...events,
      'END:VCALENDAR',
    ].join('\r\n')

    const blob = new Blob([ics], { type: 'text/calendar' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'career-track-week.ics'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Weekly timetable</h2>
          <p className="text-sm text-gray-500">Based on {profile?.weekly_hours || 10} hrs/week · {activeWeek?.title || 'study plan'}</p>
        </div>
        <div className="flex gap-3">
          <div className="flex flex-wrap gap-2">
            {Object.entries(scheduleTypes).map(([type, style]) => (
              <span key={type} className={`badge border ${style.color} text-xs`}>{type}</span>
            ))}
          </div>
          <button onClick={exportICS} className="btn-primary flex items-center gap-2">
            <Download className="w-4 h-4" /> Export .ics
          </button>
        </div>
      </div>

      <div className="card p-2 overflow-x-auto">
        <div className="grid grid-cols-7 gap-1 min-w-[600px]">
          {days.map(day => (
            <div key={day} className="space-y-1">
              <p className="text-xs font-medium text-gray-500 text-center py-2 bg-gray-50 rounded-lg">{day}</p>
              {(schedule[day] || []).map((block, i) => (
                <div key={i} className={`p-2 rounded-lg border text-xs ${scheduleTypes[block.type]?.color || ''}`}>
                  <p className="font-medium text-xs opacity-70 mb-0.5">{block.time}</p>
                  <p className="leading-tight">{block.task}</p>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="card p-4 bg-blue-50 border-blue-200">
        <div className="flex gap-3">
          <span className="text-2xl">📅</span>
          <div>
            <p className="text-sm font-medium text-blue-900">Import into Google Calendar</p>
            <p className="text-xs text-blue-700 mt-0.5">Click "Export .ics" → open the file or drag it into Google Calendar / Apple Calendar / Outlook. All your blocks will appear as events.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Suggestions Tab ──────────────────────────────────────────
function Suggestions({ profile, applications, roadmap, questions, resumeVersions }) {
  const weekly = parseInt(profile?.weekly_app_target || 5)
  const thisWeekApps = applications.filter(a => (Date.now() - new Date(a.date_applied)) / 86400000 < 7).length
  const convRate = applications.length > 0 ? (applications.filter(a => ['Interview','Offer'].includes(a.status)).length / applications.length) * 100 : 0
  const activeWeek = roadmap.find(r => !r.completed)
  const notStarted = questions.filter(q => q.status === 'Not Started').length
  const bestVersion = resumeVersions.reduce((best, rv) => {
    const apps = applications.filter(a => a.resume_version === rv.name)
    if (apps.length === 0) return best
    const rate = apps.filter(a => ['Interview','Offer'].includes(a.status)).length / apps.length
    return rate > (best.rate || 0) ? { ...rv, rate } : best
  }, {})

  const tips = []

  if (thisWeekApps < weekly) tips.push({
    priority: 'high', icon: '📤',
    title: 'Application pace behind target',
    body: `You've sent ${thisWeekApps} application${thisWeekApps !== 1 ? 's' : ''} this week but your target is ${weekly}. Apply to ${weekly - thisWeekApps} more before the week ends.`,
    action: 'Go to Applications',
  })

  if (convRate < 15 && applications.length >= 5) tips.push({
    priority: 'high', icon: '📄',
    title: 'Low interview conversion rate',
    body: `Your rate is ${convRate.toFixed(0)}%, below the typical 15–20%. Try tailoring your resume per role or targeting companies where ${bestVersion.name || 'your best resume'} performs well.`,
  })

  if (activeWeek) tips.push({
    priority: 'medium', icon: '📚',
    title: `Current milestone: Week ${activeWeek.week} — ${activeWeek.title}`,
    body: `Topics: ${activeWeek.topics}. Make sure this is blocked in your weekly schedule.`,
  })

  if (notStarted > 5) tips.push({
    priority: 'medium', icon: '🎯',
    title: `${notStarted} interview questions untouched`,
    body: `You have ${notStarted} questions not started yet. Spend 30 mins today in practice mode to build confidence.`,
    action: 'Practice now',
  })

  if (bestVersion.name && bestVersion.rate > 0) tips.push({
    priority: 'low', icon: '⭐',
    title: `Best resume: ${bestVersion.name}`,
    body: `This version has a ${Math.round(bestVersion.rate * 100)}% interview rate. Use it for your next round of applications.`,
  })

  tips.push({
    priority: 'low', icon: '🌐',
    title: 'Networking tip',
    body: 'Reach out to 2 people on LinkedIn this week — alumni, former classmates, or employees at target companies. Referrals increase interview odds by 4×.',
  })

  const priorityStyle = { high: 'border-red-200 bg-red-50', medium: 'border-yellow-200 bg-yellow-50', low: 'border-green-200 bg-green-50' }
  const priorityLabel = { high: 'bg-red-100 text-red-700', medium: 'bg-yellow-100 text-yellow-700', low: 'bg-green-100 text-green-700' }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Personalized suggestions</h2>
        <p className="text-sm text-gray-500">Updated based on your current data</p>
      </div>
      <div className="space-y-3">
        {tips.map((tip, i) => (
          <div key={i} className={`card p-5 border ${priorityStyle[tip.priority]}`}>
            <div className="flex items-start gap-4">
              <span className="text-2xl flex-shrink-0">{tip.icon}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium text-sm text-gray-900">{tip.title}</p>
                  <span className={`badge text-xs ${priorityLabel[tip.priority]}`}>{tip.priority}</span>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{tip.body}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Profile Modal ────────────────────────────────────────────
function ProfileModal({ profile, user, onClose, onSignOut }) {
  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="card p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-100 flex items-center justify-center">
            <span className="text-brand-700 font-semibold text-lg">{(profile?.full_name || user.email || 'U')[0].toUpperCase()}</span>
          </div>
          <div>
            <p className="font-medium text-gray-900">{profile?.full_name || 'User'}</p>
            <p className="text-xs text-gray-500">{user.email}</p>
          </div>
        </div>
        <div className="space-y-2 text-sm text-gray-600 mb-6">
          {[
            ['Education', profile?.education],
            ['Field', profile?.field],
            ['Experience', `${profile?.experience_years} year(s)`],
            ['Target roles', Array.isArray(profile?.target_roles) ? profile.target_roles.join(', ') : profile?.target_roles],
          ].map(([k, v]) => v && (
            <div key={k} className="flex justify-between">
              <span className="text-gray-400">{k}</span>
              <span className="font-medium text-gray-700 text-right max-w-[60%]">{v}</span>
            </div>
          ))}
        </div>
        <button onClick={onSignOut} className="btn-secondary w-full flex items-center justify-center gap-2 text-red-600 border-red-200 hover:bg-red-50">
          <LogOut className="w-4 h-4" /> Sign out
        </button>
      </div>
    </div>
  )
}

// ─── Demo profile ─────────────────────────────────────────────
const DEMO_PROFILE = {
  full_name: 'Demo User',
  education: 'Graduate Student',
  field: 'Data Science',
  experience_years: '1',
  target_roles: ['Data Scientist', 'ML Engineer', 'Analytics Engineer'],
  search_start_date: '2024-02-15',
  weekly_hours: 10,
  weekly_app_target: 5,
  onboarded: true,
}

// ─── Main App ─────────────────────────────────────────────────
export default function App() {
  const [profile] = useState(DEMO_PROFILE)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [showProfile, setShowProfile] = useState(false)

  const [applications, setApplications] = useState(SEED_APPLICATIONS)
  const [resumeVersions, setResumeVersions] = useState(SEED_RESUME_VERSIONS)
  const [roadmap, setRoadmap] = useState(SEED_ROADMAP)
  const [questions, setQuestions] = useState(SEED_QUESTIONS)

  const demoUser = { email: 'demo@careertrack.app' }

  const tabs = [
    { id: 'dashboard',    label: 'Dashboard',       icon: LayoutDashboard },
    { id: 'applications', label: 'Applications',    icon: Briefcase },
    { id: 'resumes',      label: 'Resume Versions', icon: FileText },
    { id: 'roadmap',      label: 'Roadmap',          icon: Map },
    { id: 'questions',    label: 'Question Bank',    icon: HelpCircle },
    { id: 'timetable',    label: 'Timetable',        icon: Calendar },
    { id: 'suggestions',  label: 'Suggestions',      icon: Lightbulb },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-brand-600 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-gray-900 hidden sm:block">CareerTrack</span>
            </div>
            <nav className="flex overflow-x-auto hide-scrollbar">
              {tabs.map(t => {
                const Icon = t.icon
                return (
                  <button key={t.id} onClick={() => setActiveTab(t.id)}
                    className={`nav-tab flex items-center gap-1.5 ${activeTab === t.id ? 'nav-tab-active' : 'nav-tab-inactive'}`}>
                    <Icon className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">{t.label}</span>
                  </button>
                )
              })}
            </nav>
            <button onClick={() => setShowProfile(true)}
              className="w-8 h-8 rounded-xl bg-brand-100 flex items-center justify-center text-brand-700 font-medium text-sm hover:bg-brand-200 transition-colors">
              {(profile?.full_name || demoUser.email || 'U')[0].toUpperCase()}
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'dashboard'    && <Dashboard profile={profile} applications={applications} roadmap={roadmap} questions={questions} />}
        {activeTab === 'applications' && <Applications applications={applications} setApplications={setApplications} resumeVersions={resumeVersions} userId="demo" />}
        {activeTab === 'resumes'      && <ResumeVersions resumeVersions={resumeVersions} setResumeVersions={setResumeVersions} applications={applications} userId="demo" />}
        {activeTab === 'roadmap'      && <Roadmap roadmap={roadmap} setRoadmap={setRoadmap} />}
        {activeTab === 'questions'    && <QuestionBank questions={questions} setQuestions={setQuestions} />}
        {activeTab === 'timetable'    && <Timetable profile={profile} roadmap={roadmap} />}
        {activeTab === 'suggestions'  && <Suggestions profile={profile} applications={applications} roadmap={roadmap} questions={questions} resumeVersions={resumeVersions} />}
      </main>

      {showProfile && (
        <ProfileModal profile={profile} user={demoUser} onClose={() => setShowProfile(false)} onSignOut={() => setShowProfile(false)} />
      )}
    </div>
  )
}
