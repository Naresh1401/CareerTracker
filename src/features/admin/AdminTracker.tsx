import { useState, useMemo, useCallback } from 'react'
import {
  Users, Eye, Monitor, Globe, Clock, Trash2, RefreshCw,
  Smartphone, Tablet, MonitorSmartphone, ArrowUpRight, Activity,
  ChevronDown, ChevronUp, Lock, LogOut, Shield,
} from 'lucide-react'
import { Card, Button, Badge, Input } from '../../components/ui'
import { cn } from '../../lib/utils'
import { getVisitLog, clearVisitLog, getUniqueVisitors, type VisitEvent } from '../../lib/visitor-tracker'
import { format, subDays, isAfter, parseISO, startOfDay } from 'date-fns'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts'

const CHART_COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#f43f5e', '#a1a1aa']
const DEVICE_ICONS = { mobile: Smartphone, tablet: Tablet, desktop: Monitor }

function StatCard({ label, value, icon: Icon, sub, color = 'brand' }: {
  label: string; value: string | number; icon: typeof Users; sub?: string; color?: string
}) {
  const colorMap: Record<string, string> = {
    brand: 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
    violet: 'bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400',
    cyan: 'bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400',
    amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
  }
  return (
    <Card className="p-5 hover:shadow-elevated transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className={cn('p-2 rounded-lg', colorMap[color] || colorMap.brand)}>
          <Icon className="w-4 h-4" />
        </div>
        <ArrowUpRight className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600" />
      </div>
      <p className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">{value}</p>
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-1">{label}</p>
      {sub && <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">{sub}</p>}
    </Card>
  )
}

function tooltipStyle() {
  return {
    fontSize: 12,
    borderRadius: 10,
    border: '1px solid rgba(99,102,241,0.15)',
    boxShadow: '0 8px 24px -4px rgba(0,0,0,0.12)',
  }
}

// Admin credentials
const ADMIN_USERNAME = 'admin'
const ADMIN_PASSWORD = 'CareerTrack@2026'
const AUTH_KEY = 'ct-admin-auth'

function AdminLogin({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      sessionStorage.setItem(AUTH_KEY, 'true')
      onLogin()
    } else {
      setError('Invalid username or password')
      setPassword('')
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh] animate-fade-in">
      <Card className="w-full max-w-sm p-8">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 bg-brand-50 dark:bg-brand-900/20 rounded-xl flex items-center justify-center mb-3">
            <Shield className="w-6 h-6 text-brand-600 dark:text-brand-400" />
          </div>
          <h2 className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">Admin Access</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Enter credentials to continue</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Username"
            value={username}
            onChange={e => { setUsername(e.target.value); setError('') }}
            placeholder="Enter username"
            autoComplete="username"
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={e => { setPassword(e.target.value); setError('') }}
            placeholder="Enter password"
            autoComplete="current-password"
          />
          {error && (
            <p className="text-xs text-rose-500 dark:text-rose-400 flex items-center gap-1.5">
              <Lock className="w-3 h-3" /> {error}
            </p>
          )}
          <Button type="submit" className="w-full">
            <Lock className="w-4 h-4" /> Sign in
          </Button>
        </form>
      </Card>
    </div>
  )
}

export function AdminTracker() {
  const [isAuthed, setIsAuthed] = useState(() => sessionStorage.getItem(AUTH_KEY) === 'true')
  const [visits, setVisits] = useState<VisitEvent[]>(getVisitLog)
  const [range, setRange] = useState<7 | 14 | 30 | 90>(30)
  const [showRecent, setShowRecent] = useState(true)

  const handleLogout = useCallback(() => {
    sessionStorage.removeItem(AUTH_KEY)
    setIsAuthed(false)
  }, [])

  const refresh = () => setVisits(getVisitLog())

  const filtered = useMemo(() => {
    const cutoff = subDays(new Date(), range)
    return visits.filter(v => isAfter(parseISO(v.timestamp), cutoff))
  }, [visits, range])

  const uniqueVisitors = getUniqueVisitors(filtered)
  const todayVisits = useMemo(() => {
    const today = startOfDay(new Date())
    return filtered.filter(v => isAfter(parseISO(v.timestamp), today)).length
  }, [filtered])

  // ── Daily visits chart data ──
  const dailyData = useMemo(() => {
    const days: Record<string, { visits: number; unique: Set<string> }> = {}
    for (let i = range - 1; i >= 0; i--) {
      const key = format(subDays(new Date(), i), 'MMM dd')
      days[key] = { visits: 0, unique: new Set() }
    }
    filtered.forEach(v => {
      const key = format(parseISO(v.timestamp), 'MMM dd')
      if (days[key]) {
        days[key].visits++
        days[key].unique.add(v.visitorId)
      }
    })
    return Object.entries(days).map(([date, d]) => ({
      date,
      visits: d.visits,
      visitors: d.unique.size,
    }))
  }, [filtered, range])

  // ── Browser breakdown ──
  const browserData = useMemo(() => {
    const map: Record<string, number> = {}
    filtered.forEach(v => { map[v.browser] = (map[v.browser] || 0) + 1 })
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }))
  }, [filtered])

  // ── Device breakdown ──
  const deviceData = useMemo(() => {
    const map: Record<string, number> = {}
    filtered.forEach(v => { map[v.device] = (map[v.device] || 0) + 1 })
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }))
  }, [filtered])

  // ── OS breakdown ──
  const osData = useMemo(() => {
    const map: Record<string, number> = {}
    filtered.forEach(v => { map[v.os] = (map[v.os] || 0) + 1 })
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }))
  }, [filtered])

  // ── Peak hours ──
  const hourData = useMemo(() => {
    const hours = Array(24).fill(0)
    filtered.forEach(v => {
      const h = parseISO(v.timestamp).getHours()
      hours[h]++
    })
    return hours.map((count, hour) => ({
      hour: `${hour.toString().padStart(2, '0')}:00`,
      visits: count,
    }))
  }, [filtered])

  // ── Recent activity (last 50) ──
  const recentVisits = useMemo(() => {
    return [...filtered].sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 50)
  }, [filtered])

  const handleClear = () => {
    if (window.confirm('Clear all visit logs? This cannot be undone.')) {
      clearVisitLog()
      setVisits([])
    }
  }

  if (!isAuthed) {
    return <AdminLogin onLogin={() => setIsAuthed(true)} />
  }

  return (
    <div className="space-y-6 max-w-6xl animate-fade-in">
      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">Admin Tracker</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Monitor visitor activity and usage analytics</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Range selector */}
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
            {([7, 14, 30, 90] as const).map(d => (
              <button
                key={d}
                onClick={() => setRange(d)}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded-md transition-all',
                  range === d
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                )}
              >
                {d}d
              </button>
            ))}
          </div>
          <Button variant="secondary" size="sm" onClick={refresh}>
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </Button>
          <Button variant="secondary" size="sm" onClick={handleClear}>
            <Trash2 className="w-3.5 h-3.5" /> Clear
          </Button>
          <Button variant="secondary" size="sm" onClick={handleLogout}>
            <LogOut className="w-3.5 h-3.5" /> Logout
          </Button>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard label="Total Visits" value={filtered.length} icon={Eye} sub={`Last ${range} days`} color="brand" />
        <StatCard label="Unique Visitors" value={uniqueVisitors} icon={Users} sub={`${filtered.length ? Math.round((uniqueVisitors / filtered.length) * 100) : 0}% unique`} color="violet" />
        <StatCard label="Today" value={todayVisits} icon={Activity} sub="Visits today" color="emerald" />
        <StatCard label="Avg / Day" value={filtered.length ? (filtered.length / range).toFixed(1) : '0'} icon={Clock} sub="Sessions per day" color="cyan" />
        <StatCard label="All Time" value={visits.length} icon={Globe} sub={`${getUniqueVisitors(visits)} unique total`} color="amber" />
      </div>

      {/* ── Daily Visits Chart ── */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-bold tracking-tight text-gray-900 dark:text-white">Daily Activity</p>
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-brand-500" /> Visits</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-violet-500" /> Visitors</span>
          </div>
        </div>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dailyData} margin={{ left: 0, right: 0, top: 4, bottom: 0 }}>
              <defs>
                <linearGradient id="visitGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#a1a1aa' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11, fill: '#a1a1aa' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle()} />
              <Area type="monotone" dataKey="visits" stroke="#6366f1" fill="url(#visitGrad)" strokeWidth={2} name="Visits" />
              <Area type="monotone" dataKey="visitors" stroke="#8b5cf6" fill="none" strokeWidth={2} strokeDasharray="5 5" name="Unique Visitors" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* ── Breakdown Charts ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Browser */}
        <Card className="p-5">
          <p className="text-sm font-bold tracking-tight text-gray-900 dark:text-white mb-4">Browsers</p>
          {browserData.length > 0 ? (
            <>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={browserData} cx="50%" cy="50%" innerRadius={35} outerRadius={60} dataKey="value" paddingAngle={3} stroke="none">
                      {browserData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle()} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1.5 mt-2">
                {browserData.map((b, i) => (
                  <div key={b.name} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                      <span className="text-gray-600 dark:text-gray-300">{b.name}</span>
                    </span>
                    <span className="font-mono text-gray-400">{b.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-xs text-gray-400 text-center py-12">No data yet</p>
          )}
        </Card>

        {/* Devices */}
        <Card className="p-5">
          <p className="text-sm font-bold tracking-tight text-gray-900 dark:text-white mb-4">Devices</p>
          {deviceData.length > 0 ? (
            <div className="space-y-3 pt-2">
              {deviceData.map((d, i) => {
                const DevIcon = DEVICE_ICONS[d.name.toLowerCase() as keyof typeof DEVICE_ICONS] || MonitorSmartphone
                const pct = filtered.length ? Math.round((d.value / filtered.length) * 100) : 0
                return (
                  <div key={d.name}>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                        <DevIcon className="w-4 h-4 text-gray-400" />
                        {d.name}
                      </span>
                      <span className="text-xs font-mono text-gray-400">{d.value} ({pct}%)</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-xs text-gray-400 text-center py-12">No data yet</p>
          )}
        </Card>

        {/* OS */}
        <Card className="p-5">
          <p className="text-sm font-bold tracking-tight text-gray-900 dark:text-white mb-4">Operating Systems</p>
          {osData.length > 0 ? (
            <div className="space-y-3 pt-2">
              {osData.map((o, i) => {
                const pct = filtered.length ? Math.round((o.value / filtered.length) * 100) : 0
                return (
                  <div key={o.name}>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="text-gray-700 dark:text-gray-300">{o.name}</span>
                      <span className="text-xs font-mono text-gray-400">{o.value} ({pct}%)</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-xs text-gray-400 text-center py-12">No data yet</p>
          )}
        </Card>
      </div>

      {/* ── Peak Hours ── */}
      <Card className="p-5">
        <p className="text-sm font-bold tracking-tight text-gray-900 dark:text-white mb-4">Peak Hours</p>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hourData} margin={{ left: 0, right: 0 }}>
              <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#a1a1aa' }} axisLine={false} tickLine={false} interval={2} />
              <YAxis tick={{ fontSize: 10, fill: '#a1a1aa' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle()} />
              <Bar dataKey="visits" fill="#6366f1" radius={[4, 4, 0, 0]} name="Visits" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* ── Recent Activity ── */}
      <Card className="p-5">
        <button onClick={() => setShowRecent(v => !v)} className="flex items-center gap-2 w-full">
          <p className="text-sm font-bold tracking-tight text-gray-900 dark:text-white">Recent Activity</p>
          <Badge className="bg-gray-100 dark:bg-gray-800 text-gray-500 text-[10px]">{recentVisits.length}</Badge>
          {showRecent ? <ChevronUp className="w-4 h-4 text-gray-400 ml-auto" /> : <ChevronDown className="w-4 h-4 text-gray-400 ml-auto" />}
        </button>
        {showRecent && (
          <div className="mt-4 overflow-x-auto">
            {recentVisits.length > 0 ? (
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-gray-800">
                    <th className="pb-2 px-2 font-medium">Visitor</th>
                    <th className="pb-2 px-2 font-medium">Time</th>
                    <th className="pb-2 px-2 font-medium">Device</th>
                    <th className="pb-2 px-2 font-medium">Browser</th>
                    <th className="pb-2 px-2 font-medium">OS</th>
                    <th className="pb-2 px-2 font-medium">Screen</th>
                  </tr>
                </thead>
                <tbody>
                  {recentVisits.map(v => {
                    const DevIcon = DEVICE_ICONS[v.device as keyof typeof DEVICE_ICONS] || MonitorSmartphone
                    return (
                      <tr key={v.id} className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                        <td className="py-2.5 px-2">
                          <span className="font-mono text-gray-500 dark:text-gray-400">{v.visitorId.slice(0, 8)}</span>
                        </td>
                        <td className="py-2.5 px-2 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                          {format(parseISO(v.timestamp), 'MMM dd, HH:mm:ss')}
                        </td>
                        <td className="py-2.5 px-2">
                          <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                            <DevIcon className="w-3.5 h-3.5 text-gray-400" />
                            {v.device}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-gray-600 dark:text-gray-300">{v.browser}</td>
                        <td className="py-2.5 px-2 text-gray-600 dark:text-gray-300">{v.os}</td>
                        <td className="py-2.5 px-2 font-mono text-gray-400">{v.screenWidth}×{v.screenHeight}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            ) : (
              <p className="text-xs text-gray-400 text-center py-8">No visits recorded yet. Activity will appear here as visitors use the app.</p>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}
