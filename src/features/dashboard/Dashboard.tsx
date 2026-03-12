import { useState, useEffect, useMemo } from 'react'
import { useStore } from '../../store/useStore'
import { Card, Badge, Progress } from '../../components/ui'
import { cn, calculateHealthScore, getScoreColor, getScoreLabel, getGreeting, daysSinceDate } from '../../lib/utils'
import { STATUS_COLORS, PIPELINE_STAGES, INTERVIEW_STAGES, TERMINAL_STATUSES } from '../../constants/config'
import { DOMAIN_PRESETS } from '../../constants/domain-presets'
import {
  computeFunnel, computeConversions, computeRoleBreakdowns,
  computeSourcePerformance, computeVelocity, computeTrackerHealth,
  computeActionQueue, computeWeeklyMomentum, computeTargetTypeBreakdown,
  generateTrackerSuggestions, computeRolePipelineHeatmap,
  computeFollowUpUrgency, computeRoleConversionRanking, computeSourceInsights,
} from '../../lib/tracker-analytics'
import {
  Briefcase, Users, Trophy, XCircle, Target, Zap,
  ChevronRight, Plus, BookOpen, Download, ArrowRight,
  Brain, TrendingUp, Clock, Star, Flame, ArrowUpRight,
  BarChart3, CalendarDays, CalendarRange, Calendar,
  AlertCircle, Activity, Layers, ShieldAlert, Eye,
} from 'lucide-react'
import {
  RadialBarChart, RadialBar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ReferenceLine,
  PieChart, Pie, AreaChart, Area, CartesianGrid,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts'

/* ── Animated counter hook ── */
function useAnimatedNumber(target: number, duration = 700) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (target === 0) { setValue(0); return }
    let start = 0
    const step = Math.ceil(target / (duration / 16))
    const timer = setInterval(() => {
      start += step
      if (start >= target) { setValue(target); clearInterval(timer) }
      else setValue(start)
    }, 16)
    return () => clearInterval(timer)
  }, [target, duration])
  return value
}

/* ── Stat Card (interactive) ── */
function InteractiveStatCard({ label, value, sub, color, icon, onClick }: {
  label: string; value: number | string; sub: string; color: string; icon: React.ReactNode; onClick?: () => void
}) {
  const numVal = typeof value === 'number' ? value : parseInt(value) || 0
  const animated = useAnimatedNumber(numVal)
  const display = typeof value === 'string' && value.includes('/') ? value : animated

  return (
    <button
      onClick={onClick}
      className="text-left bg-white dark:bg-gray-900 border border-gray-200/60 dark:border-gray-800 rounded-xl p-4 hover:shadow-elevated hover:border-brand-300/50 dark:hover:border-brand-700 transition-all duration-300 group"
    >
      <div className="flex items-center justify-between mb-2">
        <span className={`${color} opacity-60 group-hover:opacity-100 transition-opacity`}>{icon}</span>
        <ArrowUpRight className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 group-hover:text-brand-500 transition-colors" />
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white font-mono tabular-nums">{display}</p>
      <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium mt-0.5 uppercase tracking-wide">{label}</p>
      <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">{sub}</p>
    </button>
  )
}

type ProgressPeriod = 'daily' | 'weekly' | 'monthly'

export function Dashboard() {
  const { profile, applications, roadmap, questions, resumeVersions, setActiveTab, tailoringSessions, setDashboardFilter } = useStore()
  const [progressPeriod, setProgressPeriod] = useState<ProgressPeriod>('weekly')

  /** Navigate to a tab with an optional filter context */
  const goTo = (tab: string, filter?: Record<string, unknown>) => {
    if (filter) setDashboardFilter(filter)
    setActiveTab(tab as any)
  }

  const daysSince = profile.searchStartDate ? daysSinceDate(profile.searchStartDate) : 0

  // ── Tracker analytics ──
  const weeklyTarget = profile.weeklyAppTarget
  const funnel = useMemo(() => computeFunnel(applications), [applications])
  const conversions = useMemo(() => computeConversions(applications), [applications])
  const roleBreakdowns = useMemo(() => computeRoleBreakdowns(applications), [applications])
  const sourcePerf = useMemo(() => computeSourcePerformance(applications), [applications])
  const velocity = useMemo(() => computeVelocity(applications), [applications])
  const trackerHealth = useMemo(() => computeTrackerHealth(applications, weeklyTarget), [applications, weeklyTarget])
  const actionQueue = useMemo(() => computeActionQueue(applications), [applications])
  const momentum = useMemo(() => computeWeeklyMomentum(applications, weeklyTarget), [applications, weeklyTarget])
  const targetBreakdown = useMemo(() => computeTargetTypeBreakdown(applications), [applications])
  const trackerSuggestions = useMemo(() => generateTrackerSuggestions(applications, weeklyTarget), [applications, weeklyTarget])
  const rolePipelineHeatmap = useMemo(() => computeRolePipelineHeatmap(applications), [applications])
  const followUpUrgency = useMemo(() => computeFollowUpUrgency(applications), [applications])
  const roleConversions = useMemo(() => computeRoleConversionRanking(applications), [applications])
  const sourceInsights = useMemo(() => computeSourceInsights(applications), [applications])

  const interviews = applications.filter(a => INTERVIEW_STAGES.includes(a.status)).length
  const offers = funnel.offers
  const rejected = funnel.rejected
  const thisWeekApps = momentum.appliedThisWeek
  const roadmapPct = roadmap.length > 0 ? Math.round(roadmap.filter(r => r.completed).length / roadmap.length * 100) : 0
  const confidentPct = questions.length > 0 ? Math.round(questions.filter(q => q.status === 'Confident').length / questions.length * 100) : 0
  const score = calculateHealthScore(applications, questions, roadmap, resumeVersions)
  const scoreColor = getScoreColor(score)
  const gaugeData = [{ value: score, fill: scoreColor }]

  // Current domain info
  const currentDomain = DOMAIN_PRESETS.find(d => d.id === profile.activeDomain) || DOMAIN_PRESETS[0]

  // Pipeline data
  const pipelineData = PIPELINE_STAGES.map(stage => ({
    name: stage.replace(' Interview', '').replace('Recruiter ', 'Recr. '),
    count: applications.filter(a => a.status === stage).length,
    color: STATUS_COLORS[stage]?.dot || 'bg-gray-300',
  }))

  // Status distribution for pie chart
  const statusGroups = [
    { name: 'Active', value: applications.filter(a => !TERMINAL_STATUSES.includes(a.status) && a.status !== 'Saved' && a.status !== 'Preparing').length, fill: '#6366f1' },
    { name: 'Offers', value: offers, fill: '#10b981' },
    { name: 'Rejected', value: rejected, fill: '#f43f5e' },
    { name: 'Ghosted', value: applications.filter(a => a.status === 'Ghosted').length, fill: '#a1a1aa' },
    { name: 'Saved', value: applications.filter(a => a.status === 'Saved' || a.status === 'Preparing').length, fill: '#8b5cf6' },
  ].filter(s => s.value > 0)

  // ── Progress tracking data ──
  const dailyTarget = Math.max(1, Math.ceil(profile.weeklyAppTarget / 5))
  const monthlyTarget = profile.weeklyAppTarget * 4

  function getProgressData(period: ProgressPeriod) {
    const now = new Date()
    if (period === 'daily') {
      return Array.from({ length: 7 }, (_, i) => {
        const day = new Date(now)
        day.setDate(day.getDate() - (6 - i))
        const dayStr = day.toISOString().split('T')[0]
        const count = applications.filter(a => a.dateApplied === dayStr).length
        const label = day.toLocaleDateString('en-US', { weekday: 'short' })
        return { label, actual: count, target: dailyTarget }
      })
    }
    if (period === 'weekly') {
      return Array.from({ length: 4 }, (_, i) => {
        const weekStart = new Date(now)
        weekStart.setDate(weekStart.getDate() - (3 - i) * 7)
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekEnd.getDate() + 7)
        const count = applications.filter(a => {
          const d = new Date(a.dateApplied)
          return d >= weekStart && d < weekEnd
        }).length
        return { label: `Week ${i + 1}`, actual: count, target: weeklyTarget }
      })
    }
    return Array.from({ length: 3 }, (_, i) => {
      const month = new Date(now.getFullYear(), now.getMonth() - (2 - i), 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - (2 - i) + 1, 0)
      const count = applications.filter(a => {
        const d = new Date(a.dateApplied)
        return d >= month && d <= monthEnd
      }).length
      return { label: month.toLocaleDateString('en-US', { month: 'short' }), actual: count, target: monthlyTarget }
    })
  }

  const progressData = getProgressData(progressPeriod)
  const currentPeriodActual = progressData[progressData.length - 1]?.actual ?? 0
  const currentPeriodTarget = progressPeriod === 'daily' ? dailyTarget : progressPeriod === 'weekly' ? weeklyTarget : monthlyTarget
  const progressPct = currentPeriodTarget > 0 ? Math.min(100, Math.round((currentPeriodActual / currentPeriodTarget) * 100)) : 0

  // Question confidence radar
  const categoryNames = [...new Set(questions.map(q => q.category))]
  const radarData = categoryNames.slice(0, 8).map(cat => {
    const catQs = questions.filter(q => q.category === cat)
    const confident = catQs.filter(q => q.status === 'Confident').length
    return {
      category: cat.length > 12 ? cat.slice(0, 10) + '…' : cat,
      confidence: catQs.length > 0 ? Math.round((confident / catQs.length) * 100) : 0,
      total: catQs.length,
    }
  })

  // Streak calculation
  const starredQs = questions.filter(q => q.starred).length

  // Suggestions
  const suggestions: { icon: string; text: string; tab?: string }[] = []
  if (thisWeekApps < profile.weeklyAppTarget) {
    suggestions.push({ icon: '📤', text: `You've sent ${thisWeekApps}/${profile.weeklyAppTarget} applications this week. Apply to ${profile.weeklyAppTarget - thisWeekApps} more!`, tab: 'applications' })
  }
  if (conversions.appliedToResponse < 15 && applications.length >= 5) {
    suggestions.push({ icon: '📄', text: `Response rate is ${conversions.appliedToResponse}% (below 15%). Try tailoring resumes per role.`, tab: 'resumes' })
  }
  if (roadmapPct < 50) {
    suggestions.push({ icon: '📚', text: `You're ${roadmapPct}% through your roadmap. Keep the momentum!`, tab: 'roadmap' })
  }
  if (confidentPct < 40) {
    suggestions.push({ icon: '🎯', text: `Only ${confidentPct}% of interview questions marked confident. Practice more!`, tab: 'questions' })
  }
  const activeWeek = roadmap.find(r => !r.completed)
  if (activeWeek) {
    suggestions.push({ icon: '🗓', text: `Current focus: Week ${activeWeek.week} — ${activeWeek.title}`, tab: 'roadmap' })
  }
  if (trackerHealth.staleApplications > 0) {
    suggestions.push({ icon: '⏰', text: `${trackerHealth.staleApplications} application${trackerHealth.staleApplications > 1 ? 's' : ''} stale (no update in 21+ days). Follow up!`, tab: 'applications' })
  }
  if (trackerHealth.needsFollowUp > 0) {
    suggestions.push({ icon: '🔔', text: `${trackerHealth.needsFollowUp} follow-up${trackerHealth.needsFollowUp > 1 ? 's' : ''} overdue. Check your applications.`, tab: 'applications' })
  }
  // Merge tracker analytics suggestions (deduplicate)
  for (const ts of trackerSuggestions) {
    if (!suggestions.some(s => s.text === ts.title)) {
      suggestions.push({ icon: ts.icon, text: ts.title, tab: ts.tab })
    }
  }
  if (suggestions.length === 0) {
    suggestions.push({ icon: '🌟', text: 'Great progress! Keep applying consistently and practicing questions.' })
  }

  return (
    <div className="space-y-6 max-w-7xl animate-fade-in">
      {/* Greeting + Domain badge */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
            {getGreeting()}, {profile.fullName?.split(' ')[0] || 'there'} 👋
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Day {daysSince} of your job search · {profile.currentStatus}
          </p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r ${currentDomain.color} bg-opacity-10`}>
          <span className="text-sm">{currentDomain.emoji}</span>
          <span className="text-xs font-semibold text-white">{currentDomain.name.split(' ')[0]}</span>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <InteractiveStatCard
          label="Applications" value={applications.length} sub={`+${thisWeekApps} this week`}
          color="text-blue-600 dark:text-blue-400" icon={<Briefcase className="w-5 h-5" />}
          onClick={() => goTo('applications')}
        />
        <InteractiveStatCard
          label="Active Pipeline" value={trackerHealth.activePipeline} sub={`${trackerHealth.staleApplications} stale`}
          color="text-brand-600 dark:text-brand-400" icon={<Activity className="w-5 h-5" />}
          onClick={() => goTo('applications', { status: '_active' })}
        />
        <InteractiveStatCard
          label="Interviews" value={interviews} sub={`Target: ${profile.monthlyInterviewTarget ?? 3}/month · ${conversions.appliedToResponse}% response`}
          color="text-orange-600 dark:text-orange-400" icon={<Users className="w-5 h-5" />}
          onClick={() => goTo('applications', { status: '_interviews' })}
        />
        <InteractiveStatCard
          label="Offers" value={offers} sub={offers > 0 ? 'Congrats! 🎉' : 'Keep going!'}
          color="text-emerald-600 dark:text-emerald-400" icon={<Trophy className="w-5 h-5" />}
          onClick={() => goTo('applications', { status: 'Offer' })}
        />
        <InteractiveStatCard
          label="Rejected" value={rejected} sub={`${funnel.ghosted} ghosted`}
          color="text-red-500 dark:text-red-400" icon={<XCircle className="w-5 h-5" />}
          onClick={() => goTo('applications', { status: 'Rejected' })}
        />
        <InteractiveStatCard
          label="Weekly Goal" value={`${thisWeekApps}/${profile.weeklyAppTarget}`}
          sub={thisWeekApps >= profile.weeklyAppTarget ? '✅ On track' : 'Behind target'}
          color="text-purple-600 dark:text-purple-400" icon={<Target className="w-5 h-5" />}
          onClick={() => goTo('applications')}
        />
      </div>

      {/* Main grid: 3 columns */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Health Score */}
        <Card className="p-6 flex flex-col items-center">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Career Health Score</p>
          <div className="w-36 h-36 relative">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart innerRadius="65%" outerRadius="100%" data={gaugeData} startAngle={90} endAngle={-270}>
                <RadialBar dataKey="value" cornerRadius={8} background={{ fill: 'var(--gauge-bg, #f3f4f6)' }} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-3xl font-bold font-mono" style={{ color: scoreColor }}>{score}</p>
              <p className="text-[10px] text-gray-400 font-medium">/100</p>
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2 font-medium" style={{ color: scoreColor }}>
            {getScoreLabel(score)}
          </p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 mt-4 text-xs text-gray-500 dark:text-gray-400 w-full">
            <span>Applications</span><span className="text-right font-mono text-gray-700 dark:text-gray-300">{Math.min(applications.length, 20)}/20</span>
            <span>Interviews</span><span className="text-right font-mono text-gray-700 dark:text-gray-300">{conversions.responseToInterview}%</span>
            <span>Roadmap</span><span className="text-right font-mono text-gray-700 dark:text-gray-300">{roadmapPct}%</span>
            <span>Confidence</span><span className="text-right font-mono text-gray-700 dark:text-gray-300">{confidentPct}%</span>
            <span>Resumes</span><span className="text-right font-mono text-gray-700 dark:text-gray-300">{resumeVersions.length}</span>
            <span>Starred Qs</span><span className="text-right font-mono text-gray-700 dark:text-gray-300">{starredQs}</span>
          </div>
        </Card>

        {/* Pipeline */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Application Pipeline</p>
            <button onClick={() => goTo('applications')} className="text-xs text-brand-600 hover:underline dark:text-brand-400">View all</button>
          </div>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pipelineData} layout="vertical" margin={{ left: 0, right: 0 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={70} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 10, border: '1px solid rgba(0,0,0,0.04)', boxShadow: '0 8px 24px -4px rgba(0,0,0,0.12)' }}
                  cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                />
                <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={16}>
                  {pipelineData.map((_, i) => (
                    <Cell key={i} fill={['#6366f1','#8b5cf6','#06b6d4','#eab308','#f97316','#ec4899','#10b981'][i] || '#94a3b8'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {PIPELINE_STAGES.map(stage => {
              const count = applications.filter(a => a.status === stage).length
              if (count === 0) return null
              return (
                <Badge key={stage} className={`${STATUS_COLORS[stage].bg} ${STATUS_COLORS[stage].text} ${STATUS_COLORS[stage].darkBg} ${STATUS_COLORS[stage].darkText}`}>
                  {stage.replace(' Interview', '')}: {count}
                </Badge>
              )
            })}
          </div>
        </Card>

        {/* Today's Focus */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Today's Focus</p>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="space-y-2.5">
            {suggestions.slice(0, 5).map((s, i) => (
                <button
                key={i}
                onClick={() => s.tab && goTo(s.tab)}
                className="w-full flex gap-3 p-3 bg-gray-50 dark:bg-gray-800/60 rounded-lg text-left hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
              >
                <span className="text-base flex-shrink-0">{s.icon}</span>
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed flex-1">{s.text}</p>
                {s.tab && <ChevronRight className="w-3 h-3 text-gray-300 group-hover:text-gray-500 mt-0.5 flex-shrink-0" />}
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* Second row: Progress + Radar + Status */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Application Progress Tracker */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Application Progress</p>
            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
              {([['daily', CalendarDays], ['weekly', CalendarRange], ['monthly', Calendar]] as const).map(([period, Icon]) => (
                <button
                  key={period}
                  onClick={() => setProgressPeriod(period)}
                  className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-colors ${
                    progressPeriod === period
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Current period progress */}
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-500 dark:text-gray-400">Current {progressPeriod === 'daily' ? 'day' : progressPeriod === 'weekly' ? 'week' : 'month'}</span>
                <span className="font-mono font-medium text-gray-700 dark:text-gray-300">{currentPeriodActual}/{currentPeriodTarget}</span>
              </div>
              <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${progressPct >= 100 ? 'bg-emerald-500' : progressPct >= 50 ? 'bg-blue-500' : 'bg-amber-500'}`}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
            <span className={`text-sm font-bold font-mono ${progressPct >= 100 ? 'text-emerald-500' : progressPct >= 50 ? 'text-blue-500' : 'text-amber-500'}`}>
              {progressPct}%
            </span>
          </div>

          {/* Bar chart: actual vs target */}
          <div className="h-28">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={progressData} margin={{ top: 5, right: 0, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 10, border: '1px solid rgba(0,0,0,0.04)', boxShadow: '0 8px 24px -4px rgba(0,0,0,0.12)' }} />
                <ReferenceLine y={currentPeriodTarget} stroke="#ef4444" strokeDasharray="4 4" strokeWidth={1.5} label={{ value: 'Target', fontSize: 9, fill: '#ef4444', position: 'right' }} />
                <Bar dataKey="actual" name="Applications" radius={[4, 4, 0, 0]} barSize={progressPeriod === 'daily' ? 20 : 28}>
                  {progressData.map((entry, i) => (
                    <Cell key={i} fill={entry.actual >= entry.target ? '#10b981' : '#6366f1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1"><BarChart3 className="w-3 h-3" /> Total: {applications.length}</span>
            <span className="flex items-center gap-1"><Flame className="w-3 h-3 text-orange-400" /> This week: {thisWeekApps}</span>
          </div>
        </Card>

        {/* Question Confidence Radar */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Question Confidence</p>
            <button onClick={() => goTo('questions')} className="text-xs text-brand-600 hover:underline dark:text-brand-400">Practice</button>
          </div>
          {radarData.length > 2 ? (
            <div className="h-[170px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} outerRadius="70%">
                  <PolarGrid stroke="#e5e7eb" opacity={0.4} />
                  <PolarAngleAxis dataKey="category" tick={{ fontSize: 9, fill: '#9ca3af' }} />
                  <PolarRadiusAxis tick={false} axisLine={false} domain={[0, 100]} />
                  <Radar dataKey="confidence" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[170px] flex items-center justify-center text-xs text-gray-400">Add more questions to see the radar chart</div>
          )}
          <div className="flex items-center gap-4 mt-1 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1"><Brain className="w-3 h-3" /> {confidentPct}% confident</span>
            <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-400" /> {starredQs} starred</span>
          </div>
        </Card>

        {/* Status Distribution + Quick Actions */}
        <Card className="p-6">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Status Overview</p>
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusGroups} cx="50%" cy="50%" innerRadius={24} outerRadius={40} dataKey="value" stroke="none">
                    {statusGroups.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: 'none' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-1.5">
              {statusGroups.map(g => (
                <div key={g.name} className="flex items-center gap-2 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: g.fill }} />
                  <span className="text-gray-500 dark:text-gray-400 flex-1">{g.name}</span>
                  <span className="font-mono text-gray-700 dark:text-gray-300">{g.value}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Quick Actions below */}
          <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
            {[
              { label: 'Add application', icon: Plus, tab: 'applications' as const, color: 'bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400', filter: { openForm: true } },
              { label: 'Practice questions', icon: BookOpen, tab: 'questions' as const, color: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400', filter: undefined },
              { label: 'View roadmap', icon: ArrowRight, tab: 'roadmap' as const, color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400', filter: undefined },
              { label: 'Export calendar', icon: Download, tab: 'timetable' as const, color: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400', filter: undefined },
            ].map(action => (
              <button
                key={action.label}
                onClick={() => goTo(action.tab, action.filter)}
                className={`flex items-center gap-2 p-2.5 rounded-lg text-[11px] font-medium ${action.color} hover:opacity-80 transition-opacity`}
              >
                <action.icon className="w-3.5 h-3.5" />
                {action.label}
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* ── Analytics Row: Funnel + Conversions + Velocity ── */}
      {applications.length > 0 && (
        <div className="grid md:grid-cols-3 gap-4">
          {/* Application Funnel */}
          <Card className="p-6">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Application Funnel</p>
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { stage: 'Saved', count: funnel.saved, fill: '#a78bfa' },
                  { stage: 'Applied', count: funnel.applied, fill: '#6366f1' },
                  { stage: 'Assessment', count: funnel.assessment, fill: '#06b6d4' },
                  { stage: 'Interview', count: funnel.interviewRounds, fill: '#f59e0b' },
                  { stage: 'Final', count: funnel.finalRounds, fill: '#f97316' },
                  { stage: 'Offers', count: funnel.offers, fill: '#10b981' },
                ]} margin={{ top: 5, right: 0, bottom: 0, left: -15 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="stage" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 10, border: '1px solid rgba(0,0,0,0.04)', boxShadow: '0 8px 24px -4px rgba(0,0,0,0.12)' }} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={28}>
                    {[
                      { fill: '#a78bfa' }, { fill: '#6366f1' }, { fill: '#06b6d4' },
                      { fill: '#f59e0b' }, { fill: '#f97316' }, { fill: '#10b981' },
                    ].map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Stage Conversion Rates */}
          <Card className="p-6">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Conversion Rates</p>
            <div className="space-y-3">
              {[
                { label: 'Saved → Applied', value: conversions.savedToApplied },
                { label: 'Applied → Response', value: conversions.appliedToResponse },
                { label: 'Response → Interview', value: conversions.responseToInterview },
                { label: 'Interview → Final', value: conversions.interviewToFinal },
                { label: 'Final → Offer', value: conversions.finalToOffer },
                { label: 'Offer Acceptance', value: conversions.offerAcceptance },
              ].map(c => (
                <div key={c.label}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-500 dark:text-gray-400">{c.label}</span>
                    <span className="font-mono font-medium text-gray-700 dark:text-gray-300">{c.value}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div className={cn('h-full rounded-full transition-all', c.value >= 50 ? 'bg-emerald-500' : c.value >= 25 ? 'bg-blue-500' : 'bg-amber-500')} style={{ width: `${Math.min(100, c.value)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Response Velocity */}
          <Card className="p-6">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Response Velocity</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center">
                <p className="text-lg font-bold font-mono text-blue-600 dark:text-blue-400">{velocity.avgDaysToResponse || '—'}</p>
                <p className="text-[10px] text-blue-600/70 dark:text-blue-400/70">Avg Days to Response</p>
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 text-center">
                <p className="text-lg font-bold font-mono text-amber-600 dark:text-amber-400">{velocity.avgDaysToOffer || '—'}</p>
                <p className="text-[10px] text-amber-600/70 dark:text-amber-400/70">Avg Days to Offer</p>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 text-center">
                <p className="text-lg font-bold font-mono text-red-600 dark:text-red-400">{velocity.avgDaysToRejection || '—'}</p>
                <p className="text-[10px] text-red-600/70 dark:text-red-400/70">Avg Days to Rejection</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900/20 rounded-lg p-3 text-center">
                <p className="text-lg font-bold font-mono text-gray-600 dark:text-gray-400">{velocity.stalledCount}</p>
                <p className="text-[10px] text-gray-600/70 dark:text-gray-400/70">Stalled Apps</p>
              </div>
            </div>
            {/* Action Queue Preview */}
            {actionQueue.length > 0 && (
              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
                <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-2">Action Queue ({actionQueue.length})</p>
                <div className="space-y-1.5">
                  {actionQueue.slice(0, 3).map((item, i) => (
                    <button key={i} onClick={() => goTo('applications', { needsAttention: true })} className="w-full flex items-center gap-2 text-xs text-left hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg p-1 -m-1 transition-colors">
                      <AlertCircle className={cn('w-3 h-3 flex-shrink-0', item.urgency === 'high' ? 'text-red-500' : item.urgency === 'medium' ? 'text-amber-500' : 'text-gray-400')} />
                      <span className="text-gray-600 dark:text-gray-300 flex-1 truncate">{item.app.company} — {item.type.replace('-', ' ')}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ── Analytics Row: Role Intelligence + Source + Target ── */}
      {applications.length > 0 && (
        <div className="grid md:grid-cols-3 gap-4">
          {/* Role Intelligence */}
          <Card className="p-6">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Role Intelligence</p>
            <div className="space-y-2">
              {roleBreakdowns.slice(0, 6).map(r => (
                <div key={r.category}>
                  <div className="flex items-center justify-between text-xs mb-0.5">
                    <span className="text-gray-600 dark:text-gray-300 truncate flex-1">{r.category}</span>
                    <span className="font-mono text-gray-500 ml-2">{r.total}</span>
                  </div>
                  <div className="flex gap-0.5 h-2">
                    {r.active > 0 && <div className="bg-blue-500 rounded-sm" style={{ width: `${(r.active / r.total) * 100}%` }} title={`Active: ${r.active}`} />}
                    {r.interviews > 0 && <div className="bg-amber-500 rounded-sm" style={{ width: `${(r.interviews / r.total) * 100}%` }} title={`Interviews: ${r.interviews}`} />}
                    {r.offers > 0 && <div className="bg-emerald-500 rounded-sm" style={{ width: `${(r.offers / r.total) * 100}%` }} title={`Offers: ${r.offers}`} />}
                    {r.rejected > 0 && <div className="bg-red-400 rounded-sm" style={{ width: `${(r.rejected / r.total) * 100}%` }} title={`Rejected: ${r.rejected}`} />}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-3 text-[10px] text-gray-400">
              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-blue-500 rounded-sm" /> Active</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-amber-500 rounded-sm" /> Interview</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-emerald-500 rounded-sm" /> Offer</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-red-400 rounded-sm" /> Rejected</span>
            </div>
          </Card>

          {/* Source Performance */}
          <Card className="p-6">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Source Performance</p>
            <div className="space-y-2.5">
              {sourcePerf.slice(0, 6).map(s => (
                <div key={s.source} className="flex items-center gap-3 text-xs">
                  <span className="text-gray-600 dark:text-gray-300 w-24 truncate">{s.source}</span>
                  <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-500 rounded-full" style={{ width: `${s.conversionRate}%` }} />
                  </div>
                  <span className="font-mono text-gray-500 w-10 text-right">{s.conversionRate}%</span>
                  <span className="text-gray-400">({s.total})</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Company Strategy */}
          <Card className="p-6">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Target Strategy</p>
            <div className="h-[140px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={targetBreakdown.map(t => ({ name: t.type, count: t.total, interviews: t.interviews }))} margin={{ left: -15, right: 0, top: 5, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 10, border: '1px solid rgba(0,0,0,0.04)', boxShadow: '0 8px 24px -4px rgba(0,0,0,0.12)' }} />
                  <Bar dataKey="count" name="Applications" radius={[6, 6, 0, 0]} barSize={32}>
                    {targetBreakdown.map((_, i) => <Cell key={i} fill={['#8b5cf6', '#6366f1', '#10b981', '#94a3b8'][i] || '#94a3b8'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {targetBreakdown.map((t, i) => (
                <span key={t.type} className="text-[10px] text-gray-400">
                  <span className="inline-block w-2 h-2 rounded-sm mr-1" style={{ backgroundColor: ['#8b5cf6', '#6366f1', '#10b981', '#94a3b8'][i] }} />
                  {t.type}: {t.interviews} interviews
                </span>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ═══════ ROLE APPLICATION INTELLIGENCE ═══════ */}
      {roleConversions.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">Role Application Intelligence</p>
                <p className="text-[10px] text-gray-400">Conversion analysis across {roleConversions.length} role categories</p>
              </div>
            </div>
            <div className="flex gap-1.5">
              {(() => {
                const strong = roleConversions.filter(r => r.verdict === 'strong').length
                const weak = roleConversions.filter(r => r.verdict === 'weak').length
                return (
                  <>
                    {strong > 0 && <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 text-[10px]">{strong} strong</Badge>}
                    {weak > 0 && <Badge className="bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-300 text-[10px]">{weak} weak</Badge>}
                  </>
                )
              })()}
            </div>
          </div>

          {/* Role Conversion Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <th className="text-left py-2 pr-3 text-gray-400 font-medium">Role Category</th>
                  <th className="text-center py-2 px-2 text-gray-400 font-medium">Apps</th>
                  <th className="text-center py-2 px-2 text-gray-400 font-medium">Response</th>
                  <th className="text-center py-2 px-2 text-gray-400 font-medium">Interview</th>
                  <th className="text-center py-2 px-2 text-gray-400 font-medium">Offers</th>
                  <th className="text-center py-2 px-2 text-gray-400 font-medium">Ghosted</th>
                  <th className="text-center py-2 px-2 text-gray-400 font-medium">Avg Days</th>
                  <th className="text-right py-2 pl-2 text-gray-400 font-medium">Verdict</th>
                </tr>
              </thead>
              <tbody>
                {roleConversions.map(r => (
                  <tr key={r.category} className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                    <td className="py-2.5 pr-3 font-medium text-gray-700 dark:text-gray-200">{r.category}</td>
                    <td className="text-center py-2.5 px-2 font-mono text-gray-600 dark:text-gray-300">{r.total}</td>
                    <td className="text-center py-2.5 px-2">
                      <span className={cn('font-mono', r.responseRate >= 40 ? 'text-emerald-600 dark:text-emerald-400' : r.responseRate >= 20 ? 'text-amber-600 dark:text-amber-400' : 'text-red-500')}>
                        {r.responseRate}%
                      </span>
                    </td>
                    <td className="text-center py-2.5 px-2">
                      <span className={cn('font-mono', r.interviewRate >= 30 ? 'text-emerald-600 dark:text-emerald-400' : r.interviewRate >= 15 ? 'text-amber-600 dark:text-amber-400' : 'text-red-500')}>
                        {r.interviewRate}%
                      </span>
                    </td>
                    <td className="text-center py-2.5 px-2 font-mono text-gray-600 dark:text-gray-300">{r.offers}</td>
                    <td className="text-center py-2.5 px-2 font-mono text-gray-400">{r.ghosted}</td>
                    <td className="text-center py-2.5 px-2 font-mono text-gray-500">{r.avgDaysToProgress > 0 ? `${r.avgDaysToProgress}d` : '—'}</td>
                    <td className="text-right py-2.5 pl-2">
                      <Badge className={cn('text-[10px]',
                        r.verdict === 'strong' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' :
                        r.verdict === 'average' ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' :
                        r.verdict === 'weak' ? 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-300' :
                        'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
                      )}>
                        {r.verdict}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Best & Worst Role Callouts */}
          {roleConversions.filter(r => r.verdict !== 'insufficient').length >= 2 && (
            <div className="grid md:grid-cols-2 gap-3 mt-4">
              {(() => {
                const ranked = roleConversions.filter(r => r.verdict !== 'insufficient')
                const best = ranked[0]
                const worst = ranked[ranked.length - 1]
                return (
                  <>
                    <div className="bg-emerald-50 dark:bg-emerald-900/15 border border-emerald-100 dark:border-emerald-800/30 rounded-xl p-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-[10px] font-medium text-emerald-700 dark:text-emerald-300">Best Converting Role</span>
                      </div>
                      <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">{best.category}</p>
                      <p className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 mt-0.5">
                        {best.interviewRate}% interview rate · {best.responseRate}% response · {best.total} apps
                      </p>
                    </div>
                    {worst.category !== best.category && (
                      <div className="bg-red-50 dark:bg-red-900/15 border border-red-100 dark:border-red-800/30 rounded-xl p-3">
                        <div className="flex items-center gap-1.5 mb-1">
                          <AlertCircle className="w-3.5 h-3.5 text-red-500 dark:text-red-400" />
                          <span className="text-[10px] font-medium text-red-600 dark:text-red-300">Needs Improvement</span>
                        </div>
                        <p className="text-sm font-semibold text-red-700 dark:text-red-200">{worst.category}</p>
                        <p className="text-[10px] text-red-500/80 dark:text-red-400/80 mt-0.5">
                          {worst.interviewRate}% interview rate · {worst.ghosted} ghosted · {worst.total} apps
                        </p>
                      </div>
                    )}
                  </>
                )
              })()}
            </div>
          )}
        </Card>
      )}

      {/* ═══════ FOLLOW-UP URGENCY BOARD ═══════ */}
      {followUpUrgency.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <ShieldAlert className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">Follow-Up Urgency Board</p>
                <p className="text-[10px] text-gray-400">{followUpUrgency.length} applications need attention</p>
              </div>
            </div>
            <div className="flex gap-1.5 text-[10px]">
              <span className="flex items-center gap-1 text-red-500"><span className="w-2 h-2 rounded-full bg-red-500" /> Critical</span>
              <span className="flex items-center gap-1 text-amber-500"><span className="w-2 h-2 rounded-full bg-amber-500" /> Medium</span>
              <span className="flex items-center gap-1 text-blue-500"><span className="w-2 h-2 rounded-full bg-blue-500" /> Low</span>
            </div>
          </div>
          <div className="space-y-2">
            {followUpUrgency.slice(0, 8).map(item => {
              const urgencyColor = item.urgencyScore >= 70 ? 'red' : item.urgencyScore >= 40 ? 'amber' : 'blue'
              const urgencyBg = urgencyColor === 'red' ? 'bg-red-50 dark:bg-red-900/15 border-red-100 dark:border-red-800/30' :
                urgencyColor === 'amber' ? 'bg-amber-50 dark:bg-amber-900/15 border-amber-100 dark:border-amber-800/30' :
                'bg-blue-50 dark:bg-blue-900/15 border-blue-100 dark:border-blue-800/30'
              return (
                <button
                  key={item.app.id}
                  onClick={() => goTo('applications', { needsAttention: true })}
                  className={cn('w-full flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 text-left hover:shadow-md', urgencyBg)}
                >                  <div className="flex-shrink-0">
                    <div className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center text-white text-xs font-bold',
                      urgencyColor === 'red' ? 'bg-red-500' : urgencyColor === 'amber' ? 'bg-amber-500' : 'bg-blue-500',
                    )}>
                      {item.urgencyScore}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-medium text-gray-800 dark:text-gray-100 truncate">{item.app.company}</p>
                      <Badge className={`text-[9px] ${STATUS_COLORS[item.app.status]?.bg} ${STATUS_COLORS[item.app.status]?.text} ${STATUS_COLORS[item.app.status]?.darkBg} ${STATUS_COLORS[item.app.status]?.darkText}`}>
                        {item.app.status}
                      </Badge>
                    </div>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{item.app.role}</p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-[10px] font-medium text-gray-600 dark:text-gray-300">{item.label}</p>
                    <p className="text-[10px] text-gray-400">{item.daysSinceUpdate}d since update</p>
                  </div>
                </button>
              )
            })}
          </div>
        </Card>
      )}

      {/* ═══════ ROLE-WISE PIPELINE HEATMAP ═══════ */}
      {rolePipelineHeatmap.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                <Layers className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">Pipeline Heatmap by Role</p>
                <p className="text-[10px] text-gray-400">{rolePipelineHeatmap.length} categories across all pipeline stages</p>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[10px]">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <th className="text-left py-2 pr-2 text-gray-400 font-medium sticky left-0 bg-white dark:bg-gray-900 min-w-[100px]">Role</th>
                  {PIPELINE_STAGES.map(stage => (
                    <th key={stage} className="text-center py-2 px-1 text-gray-400 font-medium whitespace-nowrap">
                      {stage.replace(' Interview', '').replace('Recruiter ', 'R.')}
                    </th>
                  ))}
                  <th className="text-center py-2 px-1 text-gray-400 font-medium">Rej</th>
                  <th className="text-center py-2 px-1 text-gray-400 font-medium">Ghost</th>
                  <th className="text-center py-2 px-1 text-emerald-500 font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {rolePipelineHeatmap.slice(0, 10).map(row => {
                  const maxCount = Math.max(...Object.values(row.stages), 1)
                  return (
                    <tr key={row.role} className="border-b border-gray-50 dark:border-gray-800/50">
                      <td className="py-2 pr-2 font-medium text-gray-700 dark:text-gray-200 sticky left-0 bg-white dark:bg-gray-900 truncate max-w-[120px]">{row.role}</td>
                      {PIPELINE_STAGES.map(stage => {
                        const count = row.stages[stage] || 0
                        const intensity = count > 0 ? Math.max(0.15, count / maxCount) : 0
                        return (
                          <td key={stage} className="text-center py-2 px-1">
                            {count > 0 ? (
                              <span
                                className="inline-flex items-center justify-center w-6 h-6 rounded-md text-[10px] font-mono font-semibold"
                                style={{
                                  backgroundColor: `rgba(99, 102, 241, ${intensity})`,
                                  color: intensity > 0.5 ? 'white' : '#6366f1',
                                }}
                              >
                                {count}
                              </span>
                            ) : (
                              <span className="text-gray-200 dark:text-gray-700">·</span>
                            )}
                          </td>
                        )
                      })}
                      <td className="text-center py-2 px-1">
                        {(row.stages['Rejected'] || 0) > 0 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-md text-[10px] font-mono font-semibold bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                            {row.stages['Rejected']}
                          </span>
                        ) : <span className="text-gray-200 dark:text-gray-700">·</span>}
                      </td>
                      <td className="text-center py-2 px-1">
                        {(row.stages['Ghosted'] || 0) > 0 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-md text-[10px] font-mono font-semibold bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                            {row.stages['Ghosted']}
                          </span>
                        ) : <span className="text-gray-200 dark:text-gray-700">·</span>}
                      </td>
                      <td className="text-center py-2 px-1 font-mono font-semibold text-emerald-600 dark:text-emerald-400">{row.total}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ═══════ SOURCE DEEP INSIGHTS ═══════ */}
      {sourceInsights.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center">
                <Eye className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">Source Deep Insights</p>
                <p className="text-[10px] text-gray-400">Performance breakdown across {sourceInsights.length} application sources</p>
              </div>
            </div>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {sourceInsights.map(s => {
              const verdictStyle = s.verdict === 'best' ? 'border-emerald-200 dark:border-emerald-800/40 bg-emerald-50/50 dark:bg-emerald-900/10' :
                s.verdict === 'good' ? 'border-blue-200 dark:border-blue-800/40 bg-blue-50/50 dark:bg-blue-900/10' :
                s.verdict === 'average' ? 'border-amber-200 dark:border-amber-800/40 bg-amber-50/50 dark:bg-amber-900/10' :
                s.verdict === 'poor' ? 'border-red-200 dark:border-red-800/40 bg-red-50/50 dark:bg-red-900/10' :
                'border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/10'
              const verdictBadge = s.verdict === 'best' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' :
                s.verdict === 'good' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                s.verdict === 'average' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' :
                s.verdict === 'poor' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
              return (
                <div key={s.source} className={cn('rounded-lg border p-4 transition-all duration-200 hover:shadow-md', verdictStyle)}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold text-gray-800 dark:text-gray-100">{s.source}</p>
                    <Badge className={cn('text-[9px]', verdictBadge)}>{s.verdict}</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-lg font-bold font-mono text-gray-800 dark:text-gray-100">{s.total}</p>
                      <p className="text-[9px] text-gray-400">Applied</p>
                    </div>
                    <div>
                      <p className={cn('text-lg font-bold font-mono', s.responseRate >= 40 ? 'text-emerald-600 dark:text-emerald-400' : s.responseRate >= 20 ? 'text-amber-600 dark:text-amber-400' : 'text-red-500')}>
                        {s.responseRate}%
                      </p>
                      <p className="text-[9px] text-gray-400">Response</p>
                    </div>
                    <div>
                      <p className={cn('text-lg font-bold font-mono', s.interviewRate >= 25 ? 'text-emerald-600 dark:text-emerald-400' : s.interviewRate >= 10 ? 'text-amber-600 dark:text-amber-400' : 'text-red-500')}>
                        {s.interviewRate}%
                      </p>
                      <p className="text-[9px] text-gray-400">Interview</p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-gray-400">Offers / Rejected / Ghosted</span>
                      <span className="font-mono text-gray-600 dark:text-gray-300">{s.offers} / {s.rejected} / {s.ghosted}</span>
                    </div>
                    {s.avgDaysToResponse > 0 && (
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-gray-400">Avg response time</span>
                        <span className="font-mono text-gray-600 dark:text-gray-300">{s.avgDaysToResponse}d</span>
                      </div>
                    )}
                    {s.topRole && (
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-gray-400">Top role</span>
                        <span className="text-gray-600 dark:text-gray-300 truncate ml-2">{s.topRole}</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Resume Intelligence Analytics */}
      {(resumeVersions.length > 0 || tailoringSessions.length > 0) && (
        <div className="grid md:grid-cols-3 gap-4">
          {/* Resume Overview */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Resume Intelligence</p>
              <button onClick={() => goTo('resumes')} className="text-xs text-brand-600 hover:underline dark:text-brand-400">Manage</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-brand-50 dark:bg-brand-900/20 rounded-lg p-3 text-center">
                <p className="text-xl font-bold font-mono text-brand-600 dark:text-brand-400">{resumeVersions.length}</p>
                <p className="text-[10px] text-brand-600/70 dark:text-brand-400/70">Versions</p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 text-center">
                <p className="text-xl font-bold font-mono text-purple-600 dark:text-purple-400">{resumeVersions.filter(r => r.isTailored).length}</p>
                <p className="text-[10px] text-purple-600/70 dark:text-purple-400/70">AI Tailored</p>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3 text-center">
                <p className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                  {(() => {
                    const scored = resumeVersions.filter(r => r.atsScore && r.atsScore > 0)
                    return scored.length > 0 ? Math.max(...scored.map(r => r.atsScore!)) : '—'
                  })()}
                </p>
                <p className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70">Best ATS</p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center">
                <p className="text-xl font-bold font-mono text-blue-600 dark:text-blue-400">{tailoringSessions.length}</p>
                <p className="text-[10px] text-blue-600/70 dark:text-blue-400/70">Tailored</p>
              </div>
            </div>
          </Card>

          {/* Tailoring Score Trend */}
          {tailoringSessions.length > 0 && (
            <Card className="p-6">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">ATS Score Improvement</p>
              <div className="h-[140px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={tailoringSessions.slice(-5).map(s => ({
                    name: s.name.slice(0, 10),
                    before: s.originalScore,
                    after: s.tailoredScore,
                  }))} margin={{ left: -15, right: 0, top: 5, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false} domain={[0, 100]} />
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 10, border: '1px solid rgba(0,0,0,0.04)', boxShadow: '0 8px 24px -4px rgba(0,0,0,0.12)' }} />
                    <Bar dataKey="before" fill="#94a3b8" name="Before" radius={[3, 3, 0, 0]} barSize={10} />
                    <Bar dataKey="after" fill="#10b981" name="After" radius={[3, 3, 0, 0]} barSize={10} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-400">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-400 inline-block" /> Before</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> After</span>
              </div>
            </Card>
          )}

          {/* Application Conversion */}
          <Card className="p-6">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Resume → Application</p>
            <div className="space-y-2">
              {tailoringSessions.slice(-4).map(s => (
                <div key={s.id} className="flex items-center gap-2 text-xs">
                  <div className={cn(
                    'w-2 h-2 rounded-full flex-shrink-0',
                    s.status === 'applied' ? 'bg-emerald-500' : s.status === 'saved' ? 'bg-blue-500' : 'bg-gray-300',
                  )} />
                  <span className="text-gray-600 dark:text-gray-300 flex-1 truncate">{s.name}</span>
                  <Badge className={cn('text-[9px]',
                    s.status === 'applied' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' :
                    s.status === 'saved' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                    'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
                  )}>{s.status}</Badge>
                  <span className="font-mono text-gray-400 text-[10px]">{s.tailoredScore}</span>
                </div>
              ))}
              {tailoringSessions.length === 0 && (
                <p className="text-xs text-gray-400 italic text-center py-4">No tailoring sessions yet</p>
              )}
            </div>
            {tailoringSessions.filter(s => s.status === 'draft').length > 0 && (
              <button
                onClick={() => goTo('resumes')}
                className="mt-3 w-full text-center text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg py-1.5 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
              >
                {tailoringSessions.filter(s => s.status === 'draft').length} draft(s) pending application
              </button>
            )}
          </Card>
        </div>
      )}

      {/* Bottom row: Learning + High-priority apps */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Learning Progress */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Learning Progress</p>
            <button onClick={() => goTo('roadmap')} className="text-xs text-brand-600 dark:text-brand-400 hover:underline">View all</button>
          </div>
          <Progress value={roadmapPct} className="mb-3 h-2.5" />
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            {roadmap.filter(r => r.completed).length} of {roadmap.length} weeks complete ({roadmapPct}%)
          </p>
          {activeWeek && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-100 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-1">
                <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-300 text-[10px]">Current</Badge>
                <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">Week {activeWeek.week}</span>
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{activeWeek.title}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{activeWeek.topics}</p>
              <div className="mt-2">
                <div className="flex items-center gap-1 text-[10px] text-gray-400">
                  <Clock className="w-3 h-3" /> {activeWeek.estimatedHours}h estimated
                  <span className="mx-1">·</span>
                  {activeWeek.completedTasks.length}/{activeWeek.tasks.length} tasks done
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* High Priority Applications */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">High Priority Applications</p>
            <button onClick={() => goTo('applications', { priority: 'High' })} className="text-xs text-brand-600 dark:text-brand-400 hover:underline">Manage</button>
          </div>
          <div className="space-y-2">
            {applications
              .filter(a => a.priority === 'High' && !['Rejected', 'Ghosted'].includes(a.status))
              .slice(0, 5)
              .map(app => (
                <div
                  key={app.id}
                  className="flex items-center gap-3 p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/60 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                  onClick={() => goTo('applications', { priority: 'High' })}
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-100 to-brand-200 dark:from-brand-900/40 dark:to-brand-800/40 flex items-center justify-center text-xs font-bold text-brand-700 dark:text-brand-300">
                    {app.company.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{app.company}</p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate">{app.role}</p>
                  </div>
                  <Badge className={`text-[10px] ${STATUS_COLORS[app.status]?.bg} ${STATUS_COLORS[app.status]?.text} ${STATUS_COLORS[app.status]?.darkBg} ${STATUS_COLORS[app.status]?.darkText}`}>
                    {app.status}
                  </Badge>
                </div>
              ))}
            {applications.filter(a => a.priority === 'High' && !['Rejected', 'Ghosted'].includes(a.status)).length === 0 && (
              <p className="text-xs text-gray-400 italic py-4 text-center">No high-priority active applications</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
