import { useStore } from '../../store/useStore'
import { Card, Badge } from '../../components/ui'
import { PRIORITY_STYLES, INTERVIEW_STAGES } from '../../constants/config'
import { cn } from '../../lib/utils'
import { generateTrackerSuggestions } from '../../lib/tracker-analytics'
import { Lightbulb, ChevronRight } from 'lucide-react'
import type { SuggestionTip, TabId } from '../../types'

export function Suggestions() {
  const { profile, applications, roadmap, questions, resumeVersions, setActiveTab } = useStore()

  const weekly = profile.weeklyAppTarget
  const thisWeekApps = applications.filter(a => (Date.now() - new Date(a.dateApplied).getTime()) / 86400000 < 7).length
  const totalApps = applications.length
  const interviewStatuses = [...INTERVIEW_STAGES, 'Offer', 'Accepted']
  const interviews = applications.filter(a => interviewStatuses.includes(a.status)).length
  const convRate = totalApps > 0 ? (interviews / totalApps) * 100 : 0
  const rejected = applications.filter(a => a.status === 'Rejected').length
  const ghosted = applications.filter(a => a.status === 'Ghosted').length
  const activeWeek = roadmap.find(r => !r.completed)
  const roadmapPct = roadmap.length > 0 ? Math.round(roadmap.filter(r => r.completed).length / roadmap.length * 100) : 0
  const notStartedQ = questions.filter(q => q.status === 'Not Started').length
  const needsWorkQ = questions.filter(q => q.status === 'Needs Work').length
  const confidentPct = questions.length > 0 ? Math.round(questions.filter(q => q.status === 'Confident').length / questions.length * 100) : 0
  const followUps = applications.filter(a => a.followUpDate && new Date(a.followUpDate) <= new Date()).length
  const dreamApps = profile.dreamCompanies.filter(c => applications.some(a => a.company.toLowerCase().includes(c.toLowerCase()))).length
  const bestVersion = resumeVersions.reduce<{ name: string; rate: number }>((best, rv) => {
    const apps = applications.filter(a => a.resumeVersion === rv.name)
    if (apps.length === 0) return best
    const rate = apps.filter(a => interviewStatuses.includes(a.status)).length / apps.length
    return rate > best.rate ? { name: rv.name, rate } : best
  }, { name: '', rate: 0 })

  const tips: (SuggestionTip & { tab?: TabId })[] = []

  if (thisWeekApps < weekly) tips.push({
    priority: 'high', icon: '📤',
    title: 'Behind weekly application target',
    body: `You've sent ${thisWeekApps} application${thisWeekApps !== 1 ? 's' : ''} this week but your goal is ${weekly}. Apply to ${weekly - thisWeekApps} more before the week ends.`,
    action: 'Go to Applications', tab: 'applications',
  })

  if (convRate < 15 && totalApps >= 5) tips.push({
    priority: 'high', icon: '📄',
    title: 'Low interview conversion rate',
    body: `Your interview rate is ${convRate.toFixed(0)}%, below the typical 15–20%. Consider tailoring your resume per role type or focusing on ${bestVersion.name || 'your best-performing resume'}.`,
    tab: 'resumes',
  })

  if (followUps > 0) tips.push({
    priority: 'high', icon: '📬',
    title: `${followUps} overdue follow-up${followUps > 1 ? 's' : ''}`,
    body: 'You have applications with follow-up dates that have passed. Sending a polite follow-up can increase your response rate.',
    tab: 'applications',
  })

  if (rejected + ghosted > totalApps * 0.5 && totalApps >= 5) tips.push({
    priority: 'high', icon: '🔄',
    title: 'High rejection/ghost rate',
    body: `${rejected + ghosted} of ${totalApps} applications resulted in rejection or no response. Consider adjusting your targeting strategy or resume.`,
    tab: 'resumes',
  })

  if (activeWeek) tips.push({
    priority: 'medium', icon: '📚',
    title: `Current milestone: Week ${activeWeek.week} — ${activeWeek.title}`,
    body: `Topics: ${activeWeek.topics}. Block time in your calendar for focused study.`,
    tab: 'roadmap',
  })

  if (roadmapPct < 40) tips.push({
    priority: 'medium', icon: '🗺️',
    title: 'Roadmap progress is slow',
    body: `You're ${roadmapPct}% through your learning plan. Consistent progress here improves interview confidence.`,
    tab: 'roadmap',
  })

  if (notStartedQ > 5) tips.push({
    priority: 'medium', icon: '🎯',
    title: `${notStartedQ} interview questions untouched`,
    body: 'Spend 20–30 minutes today in practice mode to start building confidence across categories.',
    action: 'Practice now', tab: 'questions',
  })

  if (needsWorkQ > 3) tips.push({
    priority: 'medium', icon: '🔧',
    title: `${needsWorkQ} questions marked "Needs Work"`,
    body: 'Revisit these questions and practice until they feel natural. These are your biggest improvement areas.',
    tab: 'questions',
  })

  if (dreamApps < profile.dreamCompanies.length && profile.dreamCompanies.length > 0) tips.push({
    priority: 'medium', icon: '🏢',
    title: `Applied to ${dreamApps}/${profile.dreamCompanies.length} dream companies`,
    body: `You haven't applied to all your dream companies yet: ${profile.dreamCompanies.filter(c => !applications.some(a => a.company.toLowerCase().includes(c.toLowerCase()))).join(', ')}.`,
    tab: 'applications',
  })

  if (bestVersion.name && bestVersion.rate > 0) tips.push({
    priority: 'low', icon: '⭐',
    title: `Best resume: ${bestVersion.name}`,
    body: `This version has a ${Math.round(bestVersion.rate * 100)}% interview rate. Prioritize it for your next applications.`,
    tab: 'resumes',
  })

  tips.push({
    priority: 'low', icon: '🌐',
    title: 'Networking tip',
    body: 'Reach out to 2 people on LinkedIn this week — alumni, former classmates, or employees at target companies. Referrals increase interview odds by 4×.',
  })

  if (confidentPct >= 70) tips.push({
    priority: 'low', icon: '🌟',
    title: 'Strong interview readiness',
    body: `You're confident on ${confidentPct}% of questions. Great work! Consider doing full mock interviews to tie it all together.`,
  })

  // Merge tracker-analytics suggestions
  const trackerTips = generateTrackerSuggestions(applications, weekly)
  for (const t of trackerTips) {
    if (!tips.some(existing => existing.title === t.title)) {
      tips.push({ priority: t.priority, icon: t.icon, title: t.title, body: `${t.body} ${t.recommendation}`, tab: t.tab as TabId | undefined })
    }
  }

  return (
    <div className="space-y-4 max-w-3xl animate-fade-in">
      <div className="flex items-center gap-2">
        <Lightbulb className="w-5 h-5 text-amber-400" />
        <div>
          <h2 className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">Personalized Insights</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Updated based on your current data</p>
        </div>
      </div>

      <div className="space-y-3">
        {tips.map((tip, i) => (
          <Card key={i} className={cn('p-5 border', PRIORITY_STYLES[tip.priority].card)}>
            <div className="flex items-start gap-4">
              <span className="text-2xl flex-shrink-0">{tip.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <p className="font-medium text-sm text-gray-900 dark:text-white">{tip.title}</p>
                  <Badge className={cn(PRIORITY_STYLES[tip.priority].badge, 'text-[10px]')}>{tip.priority}</Badge>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{tip.body}</p>
                {tip.tab && (
                  <button
                    onClick={() => setActiveTab(tip.tab!)}
                    className="inline-flex items-center gap-1 text-xs text-brand-600 dark:text-brand-400 font-medium mt-2 hover:underline"
                  >
                    {tip.action || 'Go to section'} <ChevronRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
