import {
  LayoutDashboard, Briefcase, FileText, Map, HelpCircle,
  Calendar, Lightbulb, TrendingUp, Moon, Sun, User,
  Plus, Search, Shield
} from 'lucide-react'
import { useStore } from '../../store/useStore'
import type { TabId } from '../../types'
import { cn } from '../../lib/utils'
import type { ReactNode } from 'react'

const ICON_MAP: Record<string, typeof LayoutDashboard> = {
  LayoutDashboard, Briefcase, FileText, Map, HelpCircle, Calendar, Lightbulb, Shield,
}

const navItems: { id: TabId; label: string; icon: string }[] = [
  { id: 'dashboard',    label: 'Dashboard',    icon: 'LayoutDashboard' },
  { id: 'applications', label: 'Applications', icon: 'Briefcase' },
  { id: 'resumes',      label: 'Resumes',      icon: 'FileText' },
  { id: 'roadmap',      label: 'Roadmap',      icon: 'Map' },
  { id: 'questions',    label: 'Questions',     icon: 'HelpCircle' },
  { id: 'timetable',    label: 'Timetable',     icon: 'Calendar' },
  { id: 'suggestions',  label: 'Insights',      icon: 'Lightbulb' },
  { id: 'admin',         label: 'Admin',          icon: 'Shield' },
]

export function Layout({ children }: { children: ReactNode }) {
  const { activeTab, setActiveTab, theme, toggleTheme, setShowProfile, profile } = useStore()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors">
      {/* ── Header ───────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/60 dark:border-gray-800">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-brand-700 rounded-lg flex items-center justify-center shadow-sm">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900 dark:text-white hidden sm:block tracking-tight">
              CareerTrack<span className="text-brand-500">Pro</span>
            </span>
          </div>

          {/* Search (placeholder) */}
          <div className="hidden md:flex items-center gap-2 bg-gray-100/80 dark:bg-gray-800/80 rounded-lg px-3 py-1.5 text-sm text-gray-400 w-64 border border-gray-200/50 dark:border-gray-700/50">
            <Search className="w-3.5 h-3.5" />
            <span className="text-xs">Search anything...</span>
            <kbd className="ml-auto text-[10px] bg-white dark:bg-gray-700 px-1.5 py-0.5 rounded border border-gray-200/80 dark:border-gray-600 font-mono">⌘K</kbd>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => { setActiveTab('applications'); }}
              className="hidden sm:flex items-center gap-1.5 text-xs font-medium bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-300 px-3 py-1.5 rounded-lg hover:bg-brand-100 dark:hover:bg-brand-900/50 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Quick add
            </button>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setShowProfile(true)}
              className="w-8 h-8 rounded-lg bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center text-brand-700 dark:text-brand-300 font-semibold text-sm hover:bg-brand-200 dark:hover:bg-brand-900/60 transition-colors"
            >
              {profile.fullName ? profile.fullName[0].toUpperCase() : <User className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      <div className="flex max-w-[1400px] mx-auto">
        {/* ── Sidebar (desktop) ──────────────────── */}
        <aside className="hidden lg:flex flex-col w-56 shrink-0 sticky top-14 h-[calc(100vh-3.5rem)] border-r border-gray-200/60 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 py-4 px-3">
          <nav className="space-y-0.5 flex-1">
            {navItems.map(item => {
              const Icon = ICON_MAP[item.icon]
              const isActive = activeTab === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150',
                    isActive
                      ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 shadow-xs'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100/80 dark:hover:bg-gray-800'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              )
            })}
          </nav>
          <div className="mt-auto pt-3 border-t border-gray-200/60 dark:border-gray-800">
            <div className="px-3 py-2 text-xs text-gray-400 dark:text-gray-500">
              <p className="font-medium text-gray-500 dark:text-gray-400">{profile.fullName}</p>
              <p className="truncate">{profile.email}</p>
            </div>
          </div>
        </aside>

        {/* ── Main content ───────────────────────── */}
        <main className="flex-1 min-w-0 px-4 sm:px-6 py-6 pb-20 lg:pb-6">
          {children}
        </main>
      </div>

      {/* ── Bottom nav (mobile) ──────────────────── */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-t border-gray-200/60 dark:border-gray-800 z-40">
        <div className="flex justify-around py-1 overflow-x-auto">
          {navItems.map(item => {
            const Icon = ICON_MAP[item.icon]
            const isActive = activeTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  'flex flex-col items-center gap-0.5 px-3 py-2 text-[10px] font-medium transition-colors',
                  isActive ? 'text-brand-600 dark:text-brand-400' : 'text-gray-400 dark:text-gray-500'
                )}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
