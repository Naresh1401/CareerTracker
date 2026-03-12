import { useState, useMemo, useEffect } from 'react'
import { useStore } from '../../store/useStore'
import { Card, Badge, Button, Input, Select, Textarea, Modal, EmptyState } from '../../components/ui'
import { STATUS_COLORS, STATUS_LIST, PIPELINE_STAGES, SOURCE_LIST, COMPANY_TYPES, TARGET_TYPES, ROLE_CATEGORIES, INTERVIEW_STAGES, TERMINAL_STATUSES, normalizeRoleCategory } from '../../constants/config'
import { cn, formatShortDate, downloadFile } from '../../lib/utils'
import { computeFunnel, computeConversions } from '../../lib/tracker-analytics'
import {
  Plus, Search, Edit3, Trash2, Check, RefreshCw,
  LayoutGrid, List, Briefcase, AlertCircle, Clock, Calendar, Eye, X,
  ArrowUpDown, ChevronRight, Download, Bell, CheckSquare, Square, MinusSquare
} from 'lucide-react'
import type { Application, ApplicationStatus, ApplicationSource, CompanyType, TargetType } from '../../types'
import { differenceInDays, parseISO, format } from 'date-fns'

const today = () => new Date().toISOString().split('T')[0]

const EMPTY_FORM: Omit<Application, 'id'> = {
  company: '', role: '', roleCategory: '', customRoleTag: '', department: '',
  jobLink: '', source: 'LinkedIn', location: '', workMode: 'Remote',
  salaryRange: '', dateSaved: today(), dateApplied: today(), lastStatusUpdate: today(),
  status: 'Applied', resumeVersion: '', coverLetter: '', contactName: '', contactEmail: '',
  referral: false, referralStatus: '', priority: 'Medium', followUpDate: '',
  interviewDate: '', rejectionReason: '', notes: '', outcomeNotes: '',
  confidenceLevel: 50, companyType: 'Startup', targetType: 'Realistic',
  statusHistory: [],
}

type SortKey = 'newest' | 'oldest' | 'company' | 'priority' | 'status'

export function Applications() {
  const { applications, addApplication, updateApplication, deleteApplication, resumeVersions, applicationsView, setApplicationsView, dashboardFilter, setDashboardFilter } = useStore()
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [filterStatus, setFilterStatus] = useState<string>('All')
  const [filterSource, setFilterSource] = useState<string>('All')
  const [filterRole, setFilterRole] = useState<string>('All')
  const [filterTarget, setFilterTarget] = useState<string>('All')
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<SortKey>('newest')
  const [detailApp, setDetailApp] = useState<Application | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [batchStatus, setBatchStatus] = useState<ApplicationStatus | ''>('')
  const [showNeedsAttention, setShowNeedsAttention] = useState(false)
  const [statusDropdownId, setStatusDropdownId] = useState<number | null>(null)
  const [filterPriority, setFilterPriority] = useState<string>('All')

  // Consume dashboard filter when navigating from Dashboard
  useEffect(() => {
    if (!dashboardFilter) return
    if (dashboardFilter.status) setFilterStatus(dashboardFilter.status)
    if (dashboardFilter.priority) setFilterPriority(dashboardFilter.priority)
    if (dashboardFilter.source) setFilterSource(dashboardFilter.source)
    if (dashboardFilter.needsAttention) setShowNeedsAttention(true)
    if (dashboardFilter.openForm) { setShowForm(true); setEditId(null); setForm(EMPTY_FORM) }
    setDashboardFilter(null)
  }, [dashboardFilter, setDashboardFilter])

  const priorityOrder: Record<string, number> = { High: 0, Medium: 1, Low: 2 }
  const statusOrder = Object.fromEntries(STATUS_LIST.map((s, i) => [s, i]))

  function isStale(app: Application) {
    if (TERMINAL_STATUSES.includes(app.status) || app.status === 'Saved' || app.status === 'Preparing') return false
    return differenceInDays(new Date(), parseISO(app.lastStatusUpdate)) > 14
  }
  function isFollowUpDue(app: Application) {
    return app.followUpDate && app.followUpDate <= today()
  }

  const filtered = useMemo(() => {
    let list = applications
      .filter(a => {
        if (filterStatus === 'All') return true
        if (filterStatus === '_active') return !TERMINAL_STATUSES.includes(a.status) && a.status !== 'Saved' && a.status !== 'Preparing'
        if (filterStatus === '_interviews') return INTERVIEW_STAGES.includes(a.status)
        return a.status === filterStatus
      })
      .filter(a => filterSource === 'All' || a.source === filterSource)
      .filter(a => filterRole === 'All' || a.roleCategory === filterRole)
      .filter(a => filterTarget === 'All' || a.targetType === filterTarget)
      .filter(a => filterPriority === 'All' || a.priority === filterPriority)
      .filter(a => {
        if (!search) return true
        const q = search.toLowerCase()
        return a.company.toLowerCase().includes(q) || a.role.toLowerCase().includes(q) || a.location.toLowerCase().includes(q)
      })
      .filter(a => {
        if (!showNeedsAttention) return true
        return isStale(a) || isFollowUpDue(a)
      })

    switch (sortBy) {
      case 'newest': list = [...list].sort((a, b) => b.dateApplied.localeCompare(a.dateApplied)); break
      case 'oldest': list = [...list].sort((a, b) => a.dateApplied.localeCompare(b.dateApplied)); break
      case 'company': list = [...list].sort((a, b) => a.company.localeCompare(b.company)); break
      case 'priority': list = [...list].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]); break
      case 'status': list = [...list].sort((a, b) => statusOrder[a.status] - statusOrder[b.status]); break
    }
    return list
  }, [applications, filterStatus, filterSource, filterRole, filterTarget, filterPriority, search, sortBy, showNeedsAttention])

  // Upcoming interviews
  const upcomingInterviews = useMemo(() =>
    applications
      .filter(a => a.interviewDate && a.interviewDate >= today() && !TERMINAL_STATUSES.includes(a.status))
      .sort((a, b) => a.interviewDate.localeCompare(b.interviewDate))
      .slice(0, 5),
    [applications]
  )

  const needsAttentionCount = useMemo(() =>
    applications.filter(a => isStale(a) || isFollowUpDue(a)).length,
    [applications]
  )

  const counts = STATUS_LIST.reduce<Record<string, number>>((acc, s) => {
    acc[s] = applications.filter(a => a.status === s).length
    return acc
  }, {})

  // Quick stats
  const funnel = useMemo(() => computeFunnel(applications), [applications])
  const conversions = useMemo(() => computeConversions(applications), [applications])

  function startEdit(app: Application) {
    const { id, ...rest } = app
    setForm(rest)
    setEditId(id)
    setShowForm(true)
  }

  function handleSave() {
    if (!form.company || !form.role) return
    setLoading(true)
    const enriched = { ...form, roleCategory: form.roleCategory || normalizeRoleCategory(form.role) }
    if (editId) {
      updateApplication(editId, enriched)
      setEditId(null)
    } else {
      addApplication(enriched)
    }
    setForm(EMPTY_FORM)
    setShowForm(false)
    setLoading(false)
  }

  function handleDelete(id: number) {
    if (!confirm('Delete this application?')) return
    deleteApplication(id)
    setSelectedIds(prev => { const next = new Set(prev); next.delete(id); return next })
  }

  // Bulk actions
  function toggleSelect(id: number) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  function toggleSelectAll() {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filtered.map(a => a.id)))
    }
  }
  function handleBatchStatusChange() {
    if (!batchStatus || selectedIds.size === 0) return
    selectedIds.forEach(id => updateApplication(id, { status: batchStatus }))
    setSelectedIds(new Set())
    setBatchStatus('')
  }
  function handleBatchDelete() {
    if (selectedIds.size === 0) return
    if (!confirm(`Delete ${selectedIds.size} application(s)?`)) return
    selectedIds.forEach(id => deleteApplication(id))
    setSelectedIds(new Set())
  }

  // CSV export
  function exportCSV() {
    const headers = ['Company','Role','Status','Priority','Source','Target Type','Date Applied','Last Update','Location','Work Mode','Salary','Referral','Contact','Notes']
    const rows = filtered.map(a => [
      a.company, a.role, a.status, a.priority, a.source, a.targetType,
      a.dateApplied, a.lastStatusUpdate, a.location, a.workMode,
      a.salaryRange, a.referral ? 'Yes' : 'No',
      a.contactName || '', a.notes.replace(/[\n,]/g, ' ')
    ])
    const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
    downloadFile(csvContent, `applications-${format(new Date(), 'yyyy-MM-dd')}.csv`, 'text/csv')
  }

  // Quick inline status change
  function handleQuickStatusChange(appId: number, newStatus: ApplicationStatus) {
    updateApplication(appId, { status: newStatus })
    setStatusDropdownId(null)
  }

  const setField = <K extends keyof typeof form>(key: K, value: typeof form[K]) =>
    setForm(f => ({ ...f, [key]: value }))

  const activeFilters = [filterStatus, filterSource, filterRole, filterTarget, filterPriority].filter(f => f !== 'All').length + (showNeedsAttention ? 1 : 0)

  return (
    <div className="space-y-4 max-w-7xl animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">Applications</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{applications.length} total · {filtered.length} shown</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={exportCSV} size="sm" disabled={filtered.length === 0}>
            <Download className="w-3.5 h-3.5" /> Export
          </Button>
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
            <button onClick={() => setApplicationsView('table')} className={cn('p-1.5 rounded-md transition-colors', applicationsView === 'table' ? 'bg-white dark:bg-gray-700 shadow-xs' : 'text-gray-400')} title="Table view">
              <List className="w-4 h-4" />
            </button>
            <button onClick={() => setApplicationsView('kanban')} className={cn('p-1.5 rounded-md transition-colors', applicationsView === 'kanban' ? 'bg-white dark:bg-gray-700 shadow-xs' : 'text-gray-400')} title="Kanban view">
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
          <Button onClick={() => { setShowForm(true); setEditId(null); setForm(EMPTY_FORM) }} size="sm">
            <Plus className="w-4 h-4" /> Add
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      {applications.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {[
            { label: 'Total', value: applications.length, color: 'text-gray-700 dark:text-gray-300' },
            { label: 'Active', value: funnel.applied + funnel.assessment + funnel.interviewRounds + funnel.finalRounds, color: 'text-brand-600 dark:text-brand-400' },
            { label: 'Interviews', value: funnel.interviewRounds + funnel.finalRounds, color: 'text-blue-600 dark:text-blue-400' },
            { label: 'Offers', value: funnel.offers, color: 'text-green-600 dark:text-green-400' },
            { label: 'Response', value: `${conversions.appliedToResponse}%`, color: 'text-purple-600 dark:text-purple-400' },
            { label: 'Referrals', value: applications.filter(a => a.referral).length, color: 'text-amber-600 dark:text-amber-400' },
          ].map(s => (
            <Card key={s.label} className="p-3 text-center">
              <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-0.5">{s.label}</p>
              <p className={cn('text-lg font-bold font-mono', s.color)}>{s.value}</p>
            </Card>
          ))}
        </div>
      )}

      {/* Upcoming Interviews */}
      {upcomingInterviews.length > 0 && (
        <Card className="p-4 border-l-4 border-l-blue-500">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-blue-500" />
            <p className="text-xs font-semibold text-gray-800 dark:text-gray-100">Upcoming Interviews</p>
            <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 text-[10px]">{upcomingInterviews.length}</Badge>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {upcomingInterviews.map(app => (
              <div key={app.id} onClick={() => setDetailApp(app)} className="flex-shrink-0 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 rounded-lg p-3 min-w-[180px] cursor-pointer hover:shadow-card transition-shadow">
                <p className="text-xs font-medium text-gray-800 dark:text-gray-100 truncate">{app.company}</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{app.role}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Calendar className="w-3 h-3 text-blue-500" />
                  <span className="text-[10px] font-mono text-blue-600 dark:text-blue-400">{formatShortDate(app.interviewDate)}</span>
                  <Badge className={cn('text-[9px]', STATUS_COLORS[app.status]?.bg, STATUS_COLORS[app.status]?.text, STATUS_COLORS[app.status]?.darkBg, STATUS_COLORS[app.status]?.darkText)}>{app.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Search & Filters */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              className="pl-9 pr-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 w-52 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-all"
              placeholder="Search company, role, location..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <Select label="" value={filterSource} onChange={e => setFilterSource(e.target.value)} options={[{ value: 'All', label: 'All Sources' }, ...SOURCE_LIST.map(s => ({ value: s, label: s }))]} />
          <Select label="" value={filterRole} onChange={e => setFilterRole(e.target.value)} options={[{ value: 'All', label: 'All Roles' }, ...ROLE_CATEGORIES.map(r => ({ value: r, label: r }))]} />
          <Select label="" value={filterTarget} onChange={e => setFilterTarget(e.target.value)} options={[{ value: 'All', label: 'All Targets' }, ...TARGET_TYPES.map(t => ({ value: t, label: t }))]} />
          <Select label="" value={filterPriority} onChange={e => setFilterPriority(e.target.value)} options={[{ value: 'All', label: 'All Priorities' }, { value: 'High', label: 'High' }, { value: 'Medium', label: 'Medium' }, { value: 'Low', label: 'Low' }]} />
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <ArrowUpDown className="w-3 h-3" />
            <Select label="" value={sortBy} onChange={e => setSortBy(e.target.value as SortKey)} options={[
              { value: 'newest', label: 'Newest' }, { value: 'oldest', label: 'Oldest' },
              { value: 'company', label: 'Company' }, { value: 'priority', label: 'Priority' }, { value: 'status', label: 'Status' },
            ]} />
          </div>
          {activeFilters > 0 && (
            <button onClick={() => { setFilterStatus('All'); setFilterSource('All'); setFilterRole('All'); setFilterTarget('All'); setFilterPriority('All'); setSearch(''); setShowNeedsAttention(false) }} className="text-xs text-brand-600 dark:text-brand-400 hover:underline">
              Clear {activeFilters} filter{activeFilters > 1 ? 's' : ''}
            </button>
          )}
          {needsAttentionCount > 0 && (
            <button
              onClick={() => setShowNeedsAttention(!showNeedsAttention)}
              className={cn('flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition-colors',
                showNeedsAttention
                  ? 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/30 dark:border-red-800 dark:text-red-300'
                  : 'border-gray-200 text-gray-500 hover:border-red-200 hover:text-red-600 dark:border-gray-700 dark:hover:border-red-800 dark:hover:text-red-400'
              )}
            >
              <Bell className="w-3 h-3" />
              Needs Attention ({needsAttentionCount})
            </button>
          )}
        </div>
        {/* Status pills */}
        <div className="flex flex-wrap gap-1.5">
          <button onClick={() => setFilterStatus('All')} className={cn('badge-btn text-[11px]', filterStatus === 'All' && 'ring-2 ring-brand-500')}>
            All ({applications.length})
          </button>
          <button onClick={() => setFilterStatus(filterStatus === '_active' ? 'All' : '_active')} className={cn('badge-btn text-[11px] bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300', filterStatus === '_active' && 'ring-2 ring-brand-500')}>
            Active ({applications.filter(a => !TERMINAL_STATUSES.includes(a.status) && a.status !== 'Saved' && a.status !== 'Preparing').length})
          </button>
          <button onClick={() => setFilterStatus(filterStatus === '_interviews' ? 'All' : '_interviews')} className={cn('badge-btn text-[11px] bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300', filterStatus === '_interviews' && 'ring-2 ring-brand-500')}>
            Interviews ({applications.filter(a => INTERVIEW_STAGES.includes(a.status)).length})
          </button>
          {STATUS_LIST.filter(s => counts[s] > 0).map(s => (
            <button key={s} onClick={() => setFilterStatus(filterStatus === s ? 'All' : s)} className={cn('badge-btn text-[11px]', STATUS_COLORS[s].bg, STATUS_COLORS[s].text, STATUS_COLORS[s].darkBg, STATUS_COLORS[s].darkText, filterStatus === s && 'ring-2 ring-brand-500')}>
              {s} ({counts[s]})
            </button>
          ))}
        </div>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <Card className="p-6 border border-brand-200/60 dark:border-brand-700/60">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
              {editId ? 'Edit application' : 'New application'}
            </h3>
            <button onClick={() => { setShowForm(false); setEditId(null) }} className="text-gray-400 hover:text-gray-600" title="Close form"><X className="w-4 h-4" /></button>
          </div>
          {/* Core Fields */}
          <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-2">Core Details</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Input label="Company" value={form.company} onChange={e => setField('company', e.target.value)} placeholder="Google" />
            <Input label="Role" value={form.role} onChange={e => setField('role', e.target.value)} placeholder="ML Engineer" />
            <Select label="Status" value={form.status} onChange={e => setField('status', e.target.value as ApplicationStatus)} options={STATUS_LIST.map(s => ({ value: s, label: s }))} />
            <Input label="Job Link" value={form.jobLink} onChange={e => setField('jobLink', e.target.value)} placeholder="https://..." />
            <Input label="Location" value={form.location} onChange={e => setField('location', e.target.value)} placeholder="San Francisco, CA" />
            <Select label="Work Mode" value={form.workMode} onChange={e => setField('workMode', e.target.value as Application['workMode'])} options={[{ value: 'Remote', label: 'Remote' }, { value: 'Hybrid', label: 'Hybrid' }, { value: 'Onsite', label: 'Onsite' }]} />
            <Input label="Date Applied" type="date" value={form.dateApplied} onChange={e => setField('dateApplied', e.target.value)} />
            <Input label="Salary Range" value={form.salaryRange} onChange={e => setField('salaryRange', e.target.value)} placeholder="$120k-$150k" />
            <Input label="Department" value={form.department} onChange={e => setField('department', e.target.value)} placeholder="Engineering" />
          </div>
          {/* Classification */}
          <p className="text-[10px] uppercase tracking-wide text-gray-400 mt-4 mb-2">Classification</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Select label="Source" value={form.source} onChange={e => setField('source', e.target.value as ApplicationSource)} options={SOURCE_LIST.map(s => ({ value: s, label: s }))} />
            <Select label="Company Type" value={form.companyType} onChange={e => setField('companyType', e.target.value as CompanyType)} options={COMPANY_TYPES.map(t => ({ value: t, label: t }))} />
            <Select label="Target Type" value={form.targetType} onChange={e => setField('targetType', e.target.value as TargetType)} options={TARGET_TYPES.map(t => ({ value: t, label: t }))} />
            <Select label="Priority" value={form.priority} onChange={e => setField('priority', e.target.value as Application['priority'])} options={[{ value: 'Low', label: 'Low' }, { value: 'Medium', label: 'Medium' }, { value: 'High', label: 'High' }]} />
            <Select label="Resume Version" value={form.resumeVersion} onChange={e => setField('resumeVersion', e.target.value)} options={[{ value: '', label: '— Select —' }, ...resumeVersions.map(r => ({ value: r.name, label: r.name }))]} />
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Confidence ({form.confidenceLevel}%)</label>
              <input type="range" min={0} max={100} value={form.confidenceLevel} onChange={e => setField('confidenceLevel', Number(e.target.value))} className="mt-1" title="Confidence level" />
            </div>
          </div>
          {/* Contact & Dates */}
          <p className="text-[10px] uppercase tracking-wide text-gray-400 mt-4 mb-2">Contact & Dates</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Input label="Contact Name" value={form.contactName} onChange={e => setField('contactName', e.target.value)} placeholder="Recruiter name" />
            <Input label="Contact Email" value={form.contactEmail} onChange={e => setField('contactEmail', e.target.value)} placeholder="recruiter@company.com" />
            <Input label="Follow-up Date" type="date" value={form.followUpDate} onChange={e => setField('followUpDate', e.target.value)} />
            <Input label="Interview Date" type="date" value={form.interviewDate} onChange={e => setField('interviewDate', e.target.value)} />
            <div className="flex items-end gap-4 pb-0.5">
              <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300 cursor-pointer">
                <input type="checkbox" checked={form.referral} onChange={e => setField('referral', e.target.checked)} className="rounded" />
                Referral
              </label>
            </div>
            {form.referral && (
              <Input label="Referral Status" value={form.referralStatus} onChange={e => setField('referralStatus', e.target.value)} placeholder="Pending / Submitted" />
            )}
          </div>
          {/* Notes */}
          <p className="text-[10px] uppercase tracking-wide text-gray-400 mt-4 mb-2">Notes</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Textarea label="Notes" value={form.notes} onChange={e => setField('notes', e.target.value)} placeholder="Any notes..." rows={2} />
            <Textarea label="Rejection / Outcome Notes" value={form.rejectionReason} onChange={e => setField('rejectionReason', e.target.value)} placeholder="Why rejected/accepted..." rows={2} />
          </div>
          <div className="flex gap-3 mt-4">
            <Button onClick={handleSave} disabled={loading || !form.company || !form.role} size="sm">
              {loading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
              {editId ? 'Save changes' : 'Add application'}
            </Button>
            <Button variant="secondary" onClick={() => { setShowForm(false); setEditId(null) }} size="sm">Cancel</Button>
          </div>
        </Card>
      )}

      {/* Bulk Actions Toolbar */}
      {selectedIds.size > 0 && (
        <Card className="p-3 border border-brand-200/60 dark:border-brand-700/60 bg-brand-50/50 dark:bg-brand-900/10">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              <span className="text-xs font-medium text-brand-700 dark:text-brand-300">{selectedIds.size} selected</span>
            </div>
            <div className="flex items-center gap-2">
              <Select
                label=""
                value={batchStatus}
                onChange={e => setBatchStatus(e.target.value as ApplicationStatus | '')}
                options={[{ value: '', label: 'Change status to...' }, ...STATUS_LIST.map(s => ({ value: s, label: s }))]}
              />
              <Button size="sm" onClick={handleBatchStatusChange} disabled={!batchStatus}>
                <Check className="w-3 h-3" /> Apply
              </Button>
            </div>
            <Button size="sm" variant="danger" onClick={handleBatchDelete}>
              <Trash2 className="w-3 h-3" /> Delete
            </Button>
            <button onClick={() => setSelectedIds(new Set())} className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 ml-auto">
              Clear selection
            </button>
          </div>
        </Card>
      )}

      {/* Table View */}
      {applicationsView === 'table' && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                  <th className="w-10 px-3 py-3">
                    <button onClick={toggleSelectAll} className="text-gray-400 hover:text-brand-600 dark:hover:text-brand-400">
                      {selectedIds.size === filtered.length && filtered.length > 0 ? <CheckSquare className="w-4 h-4" /> : selectedIds.size > 0 ? <MinusSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                    </button>
                  </th>
                  {['Company', 'Role', 'Date', 'Status', 'Priority', 'Source', 'Target', 'Resume', ''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={10}><EmptyState icon={<Briefcase className="w-6 h-6" />} title="No applications" description="Add your first application to start tracking." /></td></tr>
                ) : filtered.map(app => {
                  const stale = isStale(app)
                  const followUp = isFollowUpDue(app)
                  const isSelected = selectedIds.has(app.id)
                  return (
                    <tr key={app.id} className={cn('border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors', stale && 'bg-amber-50/40 dark:bg-amber-900/10', isSelected && 'bg-brand-50/30 dark:bg-brand-900/10')}>
                      <td className="w-10 px-3 py-3">
                        <button onClick={() => toggleSelect(app.id)} className={cn('text-gray-400 hover:text-brand-600 dark:hover:text-brand-400', isSelected && 'text-brand-600 dark:text-brand-400')}>
                          {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {app.referral && <span className="text-amber-400 text-xs" title="Referral">★</span>}
                          <span className="font-medium text-gray-900 dark:text-white">{app.company}</span>
                          {stale && <span title="Stale — no update in 14+ days"><AlertCircle className="w-3 h-3 text-amber-500" /></span>}
                          {followUp && <span title="Follow-up due"><Clock className="w-3 h-3 text-red-500" /></span>}
                        </div>
                        {app.location && <p className="text-[10px] text-gray-400">{app.location}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-gray-600 dark:text-gray-300">{app.role}</span>
                        {app.roleCategory && <p className="text-[10px] text-gray-400">{app.roleCategory}</p>}
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs font-mono">{formatShortDate(app.dateApplied)}</td>
                      <td className="px-4 py-3 relative">
                        <button
                          onClick={() => setStatusDropdownId(statusDropdownId === app.id ? null : app.id)}
                          className="cursor-pointer"
                        >
                          <Badge className={cn(STATUS_COLORS[app.status]?.bg, STATUS_COLORS[app.status]?.text, STATUS_COLORS[app.status]?.darkBg, STATUS_COLORS[app.status]?.darkText, 'hover:ring-2 hover:ring-brand-300 transition-shadow')}>{app.status}</Badge>
                        </button>
                        {statusDropdownId === app.id && (
                          <div className="absolute z-50 top-full left-2 mt-1 bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700 rounded-lg shadow-elevated p-1.5 max-h-64 overflow-y-auto w-44">
                            {STATUS_LIST.map(s => (
                              <button
                                key={s}
                                onClick={() => handleQuickStatusChange(app.id, s)}
                                className={cn('w-full text-left px-2.5 py-1.5 text-xs rounded-lg flex items-center gap-2 transition-colors',
                                  s === app.status ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300 font-medium' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                                )}
                              >
                                <span className={cn('w-2 h-2 rounded-full flex-shrink-0', STATUS_COLORS[s]?.dot)} />
                                {s}
                                {s === app.status && <Check className="w-3 h-3 ml-auto" />}
                              </button>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={cn(app.priority === 'High' ? 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400' : app.priority === 'Medium' ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400')}>{app.priority}</Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">{app.source || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={cn('text-xs', app.targetType === 'Dream' ? 'text-purple-600 dark:text-purple-400 font-medium' : app.targetType === 'Stretch' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400')}>{app.targetType}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">{app.resumeVersion || '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => setDetailApp(app)} className="text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors" title="View details"><Eye className="w-3.5 h-3.5" /></button>
                          <button onClick={() => startEdit(app)} className="text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors" title="Edit"><Edit3 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleDelete(app.id)} className="text-gray-400 hover:text-red-500 transition-colors" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Kanban View — organized by PIPELINE_STAGES */}
      {applicationsView === 'kanban' && (
        <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4">
          {/* Pre-pipeline columns */}
          {(['Saved', 'Preparing'] as ApplicationStatus[]).filter(s => applications.some(a => a.status === s)).map(status => (
            <KanbanColumn key={status} status={status} apps={filtered.filter(a => a.status === status)} onView={setDetailApp} onEdit={startEdit} />
          ))}
          {/* Pipeline columns */}
          {PIPELINE_STAGES.filter(s => applications.some(a => a.status === s)).map(status => (
            <KanbanColumn key={status} status={status} apps={filtered.filter(a => a.status === status)} onView={setDetailApp} onEdit={startEdit} />
          ))}
          {/* Terminal columns */}
          {(['Accepted', 'Rejected', 'Ghosted', 'Withdrawn'] as ApplicationStatus[]).filter(s => applications.some(a => a.status === s)).map(status => (
            <KanbanColumn key={status} status={status} apps={filtered.filter(a => a.status === status)} onView={setDetailApp} onEdit={startEdit} />
          ))}
        </div>
      )}

      {/* Detail Drawer */}
      {detailApp && (
        <Modal open={!!detailApp} onClose={() => setDetailApp(null)}>
          <div className="max-w-lg mx-auto">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">{detailApp.company}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{detailApp.role}</p>
              </div>
              <Badge className={cn(STATUS_COLORS[detailApp.status]?.bg, STATUS_COLORS[detailApp.status]?.text, STATUS_COLORS[detailApp.status]?.darkBg, STATUS_COLORS[detailApp.status]?.darkText)}>{detailApp.status}</Badge>
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs mb-4">
              {[
                ['Location', detailApp.location], ['Work Mode', detailApp.workMode],
                ['Source', detailApp.source], ['Company Type', detailApp.companyType],
                ['Target', detailApp.targetType], ['Priority', detailApp.priority],
                ['Salary', detailApp.salaryRange], ['Resume', detailApp.resumeVersion],
                ['Applied', formatShortDate(detailApp.dateApplied)], ['Last Update', formatShortDate(detailApp.lastStatusUpdate)],
                ['Confidence', `${detailApp.confidenceLevel}%`], ['Referral', detailApp.referral ? `Yes${detailApp.referralStatus ? ` (${detailApp.referralStatus})` : ''}` : 'No'],
              ].filter(([, v]) => v).map(([label, value]) => (
                <div key={label}>
                  <span className="text-gray-400">{label}: </span>
                  <span className="text-gray-700 dark:text-gray-300 font-medium">{value}</span>
                </div>
              ))}
            </div>

            {/* Contact */}
            {(detailApp.contactName || detailApp.contactEmail) && (
              <div className="text-xs border-t border-gray-100 dark:border-gray-800 pt-3 mb-3">
                <p className="text-gray-400 mb-1">Contact</p>
                {detailApp.contactName && <p className="text-gray-700 dark:text-gray-300">{detailApp.contactName}</p>}
                {detailApp.contactEmail && <p className="text-gray-500">{detailApp.contactEmail}</p>}
              </div>
            )}

            {/* Notes */}
            {detailApp.notes && (
              <div className="text-xs border-t border-gray-100 dark:border-gray-800 pt-3 mb-3">
                <p className="text-gray-400 mb-1">Notes</p>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{detailApp.notes}</p>
              </div>
            )}
            {detailApp.rejectionReason && (
              <div className="text-xs border-t border-gray-100 dark:border-gray-800 pt-3 mb-3">
                <p className="text-gray-400 mb-1">Outcome</p>
                <p className="text-gray-700 dark:text-gray-300">{detailApp.rejectionReason}</p>
              </div>
            )}

            {/* Status History Timeline */}
            {detailApp.statusHistory && detailApp.statusHistory.length > 0 && (
              <div className="border-t border-gray-100 dark:border-gray-800 pt-3">
                <p className="text-xs text-gray-400 mb-3">Status History</p>
                <div className="relative ml-3">
                  <div className="absolute left-0 top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-700" />
                  {detailApp.statusHistory.map((entry, i) => (
                    <div key={i} className="relative pl-5 pb-3 last:pb-0">
                      <div className={cn('absolute left-0 top-1 w-2 h-2 rounded-full -translate-x-[3.5px]', STATUS_COLORS[entry.status]?.dot || 'bg-gray-400')} />
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{entry.status}</p>
                      <p className="text-[10px] text-gray-400 font-mono">{formatShortDate(entry.date)}</p>
                      {entry.note && <p className="text-[10px] text-gray-500 mt-0.5">{entry.note}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
              <Button size="sm" onClick={() => { startEdit(detailApp); setDetailApp(null) }}><Edit3 className="w-3 h-3" /> Edit</Button>
              <Button size="sm" variant="secondary" onClick={() => setDetailApp(null)}>Close</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Stats bar */}
      {applications.length > 0 && (
        <Card className="p-4">
          <div className="flex flex-wrap gap-6 text-xs text-gray-500 dark:text-gray-400">
            <div>Response Rate: <span className="font-mono font-medium text-gray-700 dark:text-gray-300">{conversions.appliedToResponse}%</span></div>
            <div>Interview Rate: <span className="font-mono font-medium text-gray-700 dark:text-gray-300">{conversions.responseToInterview}%</span></div>
            <div>Offer Rate: <span className="font-mono font-medium text-gray-700 dark:text-gray-300">{conversions.finalToOffer}%</span></div>
            <div>Accepted: <span className="font-mono font-medium text-gray-700 dark:text-gray-300">{funnel.accepted}</span></div>
            <div>Rejected: <span className="font-mono font-medium text-gray-700 dark:text-gray-300">{funnel.rejected}</span></div>
            <div>Ghosted: <span className="font-mono font-medium text-gray-700 dark:text-gray-300">{funnel.ghosted}</span></div>
          </div>
        </Card>
      )}
    </div>
  )
}

/** Kanban column component */
function KanbanColumn({ status, apps, onView, onEdit }: { status: ApplicationStatus; apps: Application[]; onView: (a: Application) => void; onEdit: (a: Application) => void }) {
  return (
    <div className="flex-shrink-0 w-64">
      <div className="flex items-center gap-2 mb-3">
        <div className={cn('w-2 h-2 rounded-full', STATUS_COLORS[status].dot)} />
        <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{status}</p>
        <Badge className="bg-gray-100 dark:bg-gray-800 text-gray-500 text-[10px]">{apps.length}</Badge>
      </div>
      <div className="space-y-2">
        {apps.map(app => (
          <Card key={app.id} className="p-3 cursor-pointer hover:shadow-md transition-shadow" onClick={() => onView(app)}>
            <div className="flex items-start justify-between mb-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">{app.company}</p>
              <div className="flex items-center gap-1">
                {app.priority === 'High' && <span className="text-red-400 text-xs">●</span>}
                <button onClick={e => { e.stopPropagation(); onEdit(app) }} className="text-gray-300 hover:text-brand-500" title="Edit"><Edit3 className="w-3 h-3" /></button>
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{app.role}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] text-gray-400 font-mono">{formatShortDate(app.dateApplied)}</span>
              {app.referral && <span className="text-[10px] text-amber-500">★</span>}
              {app.targetType === 'Dream' && <span className="text-[10px] text-purple-500">♦</span>}
              {app.source && <span className="text-[10px] text-gray-400">{app.source}</span>}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
