import { useState } from 'react'
import { useStore } from '../../store/useStore'
import { Card, Badge, Progress } from '../../components/ui'
import { cn } from '../../lib/utils'
import { Check, ChevronDown, Clock, BookOpen, ArrowDown } from 'lucide-react'

/* ── Node status helpers ── */
function nodeColor(item: { completed: boolean }, isActive: boolean) {
  if (item.completed) return { ring: 'ring-emerald-400 dark:ring-emerald-500', bg: 'bg-emerald-500', text: 'text-white', glow: 'shadow-emerald-500/25' }
  if (isActive) return { ring: 'ring-blue-400 dark:ring-blue-500', bg: 'bg-blue-500', text: 'text-white', glow: 'shadow-blue-500/25' }
  return { ring: 'ring-gray-300 dark:ring-gray-600', bg: 'bg-gray-200 dark:bg-gray-700', text: 'text-gray-400 dark:text-gray-500', glow: '' }
}

function connectorColor(from: boolean) {
  return from ? 'bg-emerald-400 dark:bg-emerald-500' : 'bg-gray-200 dark:bg-gray-700'
}

export function Roadmap() {
  const { roadmap, toggleRoadmapComplete, toggleRoadmapTask, profile } = useStore()
  const [expandedWeek, setExpandedWeek] = useState<number | null>(null)

  const completedCount = roadmap.filter(r => r.completed).length
  const pct = roadmap.length > 0 ? Math.round(completedCount / roadmap.length * 100) : 0
  const totalHours = roadmap.reduce((sum, r) => sum + r.estimatedHours, 0)
  const completedHours = roadmap.filter(r => r.completed).reduce((sum, r) => sum + r.estimatedHours, 0)
  const themes = [...new Set(roadmap.map(r => r.theme))]

  return (
    <div className="space-y-6 max-w-5xl animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">Learning Roadmap</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {completedCount}/{roadmap.length} complete · {completedHours}/{totalHours}h
          </p>
        </div>
        <span className="text-2xl font-bold font-mono text-brand-600 dark:text-brand-400">{pct}%</span>
      </div>

      {/* Overall progress */}
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <Progress value={pct} className="flex-1 h-3" barClass="bg-gradient-to-r from-brand-400 to-brand-600" />
          <span className="text-sm font-mono text-gray-500 dark:text-gray-400 min-w-[3rem] text-right">{pct}%</span>
        </div>
        <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1.5"><Clock className="w-3 h-3" />{profile.weeklyStudyHours}h/week budget</div>
          <div className="flex items-center gap-1.5"><BookOpen className="w-3 h-3" />~{Math.ceil((totalHours - completedHours) / Math.max(profile.weeklyStudyHours, 1))} weeks remaining</div>
        </div>
      </Card>

      {/* ── Visual Roadmap Tree ── */}
      {themes.map(theme => {
        const themeItems = roadmap.filter(r => r.theme === theme)
        return (
          <div key={theme}>
            {/* Theme header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
              <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-2">{theme}</span>
              <div className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
            </div>

            {/* Nodes */}
            <div className="relative flex flex-col items-center">
              {themeItems.map((item, idx) => {
                const globalIdx = roadmap.indexOf(item)
                const firstIncomplete = roadmap.findIndex(r => !r.completed)
                const isActive = globalIdx === firstIncomplete
                const colors = nodeColor(item, isActive)
                const isExpanded = expandedWeek === item.id
                const tasksDone = (item.completedTasks || []).length
                const taskProgress = item.tasks.length > 0 ? Math.round((item.completed ? item.tasks.length : tasksDone) / item.tasks.length * 100) : 0
                const isLast = idx === themeItems.length - 1

                return (
                  <div key={item.id} className="relative w-full max-w-2xl mx-auto">
                    {/* Main node row */}
                    <div className={cn(
                      'relative flex items-start gap-4 p-5 rounded-xl border transition-all cursor-pointer',
                      item.completed
                        ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800'
                        : isActive
                          ? 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800 shadow-md'
                          : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 opacity-75 hover:opacity-100',
                    )} onClick={() => setExpandedWeek(isExpanded ? null : item.id)}>

                      {/* Circle node */}
                      <button
                        onClick={e => { e.stopPropagation(); toggleRoadmapComplete(item.id) }}
                        className={cn(
                          'w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ring-4 transition-all shadow-lg',
                          colors.ring, colors.bg, colors.glow,
                        )}
                      >
                        {item.completed
                          ? <Check className="w-5 h-5 text-white" />
                          : <span className={cn('text-sm font-bold', colors.text)}>{item.week}</span>
                        }
                      </button>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className={cn(
                            'font-bold tracking-tight',
                            item.completed ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-900 dark:text-white',
                          )}>
                            Week {item.week}: {item.title}
                          </p>
                          {isActive && <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 text-[10px]">Current</Badge>}
                          {item.completed && <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 text-[10px]">Complete</Badge>}
                        </div>

                        {/* Topics as chips */}
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {item.topics.split(',').map((t, ti) => (
                            <Badge key={ti} className={cn(
                              'text-[10px]',
                              item.completed
                                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
                            )}>{t.trim()}</Badge>
                          ))}
                        </div>

                        {/* Meta row */}
                        <div className="flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{item.estimatedHours}h</span>
                          <span>{tasksDone}/{item.tasks.length} tasks</span>
                          <div className="flex-1 max-w-[100px]">
                            <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                              <div
                                className={cn('h-full rounded-full transition-all duration-500',
                                  item.completed ? 'bg-emerald-500' : isActive ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                                )}
                                style={{ width: `${taskProgress}%` }}
                              />
                            </div>
                          </div>
                          <span className="font-mono text-[10px]">{taskProgress}%</span>
                        </div>
                      </div>

                      {/* Expand arrow */}
                      <ChevronDown className={cn('w-5 h-5 text-gray-400 flex-shrink-0 mt-1 transition-transform', isExpanded && 'rotate-180')} />
                    </div>

                    {/* Expanded tasks */}
                    {isExpanded && (
                      <div className="mt-2 ml-16 mr-4 mb-2 space-y-3 animate-in slide-in-from-top-2">
                        {/* Tasks checklist */}
                        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800 p-4">
                          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Tasks</p>
                          <ul className="space-y-2">
                            {item.tasks.map((task, ti) => {
                              const taskDone = item.completed || (item.completedTasks || []).includes(ti)
                              return (
                                <li key={ti} className="flex items-center gap-3">
                                  <button
                                    onClick={() => toggleRoadmapTask(item.id, ti)}
                                    className={cn(
                                      'w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-all',
                                      taskDone
                                        ? 'bg-emerald-500 border-emerald-500'
                                        : 'border-gray-300 dark:border-gray-600 hover:border-emerald-400',
                                    )}
                                  >
                                    {taskDone && <Check className="w-3 h-3 text-white" />}
                                  </button>
                                  <span className={cn(
                                    'text-sm',
                                    taskDone ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-300',
                                  )}>{task}</span>
                                </li>
                              )
                            })}
                          </ul>
                        </div>
                        {item.notes && (
                          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 border border-amber-100 dark:border-amber-800">
                            <p className="text-xs text-amber-700 dark:text-amber-300">{item.notes}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Connector line between nodes */}
                    {!isLast && (
                      <div className="flex flex-col items-center py-1">
                        <div className={cn('w-0.5 h-6 rounded-full', connectorColor(item.completed))} />
                        <ArrowDown className={cn('w-4 h-4 -mt-1', item.completed ? 'text-emerald-400' : 'text-gray-300 dark:text-gray-600')} />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
