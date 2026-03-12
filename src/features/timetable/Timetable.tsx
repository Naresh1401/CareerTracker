import { useState } from 'react'
import { useStore } from '../../store/useStore'
import { Card, Badge, Button, Modal, Input, Select } from '../../components/ui'
import { Download, Calendar, Plus, Pencil, Trash2, RotateCcw } from 'lucide-react'
import { generateICS, downloadFile, cn } from '../../lib/utils'
import type { TimetableBlock } from '../../types'

const SCHEDULE_TYPES: Record<string, { color: string; darkColor: string }> = {
  Learning:        { color: 'bg-blue-100 text-blue-700 border-blue-200', darkColor: 'dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800' },
  Applications:    { color: 'bg-green-100 text-green-700 border-green-200', darkColor: 'dark:bg-green-900/30 dark:text-green-300 dark:border-green-800' },
  'Interview Prep':{ color: 'bg-amber-100 text-amber-700 border-amber-200', darkColor: 'dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800' },
  Networking:      { color: 'bg-purple-100 text-purple-700 border-purple-200', darkColor: 'dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800' },
  Projects:        { color: 'bg-pink-100 text-pink-700 border-pink-200', darkColor: 'dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-800' },
  Rest:            { color: 'bg-gray-100 text-gray-600 border-gray-200', darkColor: 'dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700' },
}

const TYPE_OPTIONS = Object.keys(SCHEDULE_TYPES)
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function buildDefault(activeTitle: string): Record<string, TimetableBlock[]> {
  const t = activeTitle || 'Study'
  return {
    Mon: [
      { type: 'Learning', time: '9 – 11 AM', task: t, hours: [9, 11] },
      { type: 'Applications', time: '2 – 3 PM', task: 'Apply to 2 jobs', hours: [14, 15] },
      { type: 'Interview Prep', time: '7 – 8 PM', task: 'Practice questions', hours: [19, 20] },
    ],
    Tue: [
      { type: 'Learning', time: '9 – 11 AM', task: t, hours: [9, 11] },
      { type: 'Networking', time: '12 – 1 PM', task: 'LinkedIn outreach', hours: [12, 13] },
      { type: 'Projects', time: '7 – 9 PM', task: 'Portfolio project', hours: [19, 21] },
    ],
    Wed: [
      { type: 'Applications', time: '9 – 10 AM', task: 'Apply + follow up', hours: [9, 10] },
      { type: 'Learning', time: '10 AM – 12 PM', task: t, hours: [10, 12] },
      { type: 'Interview Prep', time: '7 – 8 PM', task: 'Mock interview', hours: [19, 20] },
    ],
    Thu: [
      { type: 'Learning', time: '9 – 11 AM', task: t, hours: [9, 11] },
      { type: 'Applications', time: '2 – 3 PM', task: 'Apply to 2 jobs', hours: [14, 15] },
      { type: 'Interview Prep', time: '7 – 8 PM', task: 'Behavioral prep', hours: [19, 20] },
    ],
    Fri: [
      { type: 'Applications', time: '9 – 10 AM', task: 'Apply + networking', hours: [9, 10] },
      { type: 'Learning', time: '2 – 4 PM', task: 'Review week', hours: [14, 16] },
      { type: 'Projects', time: '7 – 9 PM', task: 'Side project', hours: [19, 21] },
    ],
    Sat: [
      { type: 'Learning', time: '10 AM – 1 PM', task: 'Deep work — ' + t, hours: [10, 13] },
      { type: 'Interview Prep', time: '3 – 5 PM', task: 'Coding challenges', hours: [15, 17] },
    ],
    Sun: [
      { type: 'Rest', time: 'Morning', task: 'Recharge & reflect', hours: [9, 10] },
      { type: 'Applications', time: '5 – 6 PM', task: 'Plan next week', hours: [17, 18] },
    ],
  }
}

function fmtHour(h: number) {
  if (h === 0 || h === 12) return `12 ${h < 12 ? 'AM' : 'PM'}`
  return `${h > 12 ? h - 12 : h} ${h >= 12 ? 'PM' : 'AM'}`
}

const EMPTY_FORM: TimetableBlock = { type: 'Learning', time: '', task: '', hours: [9, 10] }

export function Timetable() {
  const { profile, roadmap, timetable, updateTimetable } = useStore()
  const activeWeek = roadmap.find(r => !r.completed) || roadmap[0]
  const defaults = buildDefault(activeWeek?.title || 'Study')

  // merge: use store data if present, else defaults
  const schedule: Record<string, TimetableBlock[]> = {}
  for (const day of DAYS) schedule[day] = timetable[day] ?? defaults[day] ?? []

  const [editModal, setEditModal] = useState<{ day: string; idx: number | null } | null>(null)
  const [form, setForm] = useState<TimetableBlock>(EMPTY_FORM)

  function openAdd(day: string) {
    setForm({ ...EMPTY_FORM })
    setEditModal({ day, idx: null })
  }
  function openEdit(day: string, idx: number) {
    setForm({ ...schedule[day][idx] })
    setEditModal({ day, idx })
  }
  function save() {
    if (!editModal) return
    const { day, idx } = editModal
    const blocks = [...(schedule[day] || [])]
    const block: TimetableBlock = { ...form, time: `${fmtHour(form.hours[0])} – ${fmtHour(form.hours[1])}` }
    if (idx === null) blocks.push(block)
    else blocks[idx] = block
    blocks.sort((a, b) => a.hours[0] - b.hours[0])
    updateTimetable(day, blocks)
    setEditModal(null)
  }
  function remove(day: string, idx: number) {
    const blocks = schedule[day].filter((_, i) => i !== idx)
    updateTimetable(day, blocks)
  }
  function resetAll() {
    for (const day of DAYS) updateTimetable(day, defaults[day])
  }

  function exportICS() {
    const now = new Date()
    const monday = new Date(now)
    monday.setDate(now.getDate() - now.getDay() + 1)
    const dayMap: Record<string, number> = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 }
    const events = Object.entries(schedule).flatMap(([day, blocks]) =>
      blocks.map(block => {
        const start = new Date(monday)
        start.setDate(monday.getDate() + dayMap[day])
        start.setHours(block.hours[0], 0, 0)
        const end = new Date(start)
        end.setHours(block.hours[1], 0, 0)
        return { title: `[${block.type}] ${block.task}`, start, end, description: `CareerTrack Pro — ${block.type} block` }
      })
    )
    const ics = generateICS(events)
    downloadFile(ics, 'career-track-week.ics', 'text/calendar')
  }

  return (
    <div className="space-y-4 max-w-6xl animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">Weekly Timetable</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Based on {profile.weeklyStudyHours}h/week · {activeWeek?.title || 'Study plan'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={resetAll} size="sm" variant="secondary"><RotateCcw className="w-3.5 h-3.5" /> Reset</Button>
          <Button onClick={exportICS} size="sm" variant="secondary"><Download className="w-4 h-4" /> Export .ics</Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(SCHEDULE_TYPES).map(([type, style]) => (
          <Badge key={type} className={`border ${style.color} ${style.darkColor} text-[10px]`}>{type}</Badge>
        ))}
      </div>

      {/* Calendar grid */}
      <Card className="p-3 overflow-x-auto">
        <div className="grid grid-cols-7 gap-1.5 min-w-[700px]">
          {DAYS.map(day => (
            <div key={day} className="space-y-1.5">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 text-center py-2 bg-gray-50 dark:bg-gray-800 rounded-lg">{day}</p>
              {(schedule[day] || []).map((block, i) => {
                const style = SCHEDULE_TYPES[block.type] || SCHEDULE_TYPES.Rest
                return (
                  <div key={i} className={cn('group relative p-2.5 rounded-lg border text-xs', style.color, style.darkColor)}>
                    <p className="font-medium text-[10px] opacity-70 mb-0.5">{block.time}</p>
                    <p className="leading-tight font-medium pr-8">{block.task}</p>
                    {/* Edit / delete overlays */}
                    <div className="absolute top-1 right-1 hidden group-hover:flex gap-0.5">
                      <button onClick={() => openEdit(day, i)} className="p-1 rounded hover:bg-black/10" title="Edit block"><Pencil className="w-3 h-3" /></button>
                      <button onClick={() => remove(day, i)} className="p-1 rounded hover:bg-black/10" title="Delete block"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  </div>
                )
              })}
              {/* Add block */}
              <button
                onClick={() => openAdd(day)}
                className="w-full p-2 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg text-gray-400 hover:border-brand-400 hover:text-brand-500 transition-colors flex items-center justify-center gap-1 text-[10px]"
              >
                <Plus className="w-3 h-3" /> Add
              </button>
            </div>
          ))}
        </div>
      </Card>

      {/* Tip */}
      <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <div className="flex gap-3">
          <Calendar className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900 dark:text-blue-200">Fully editable</p>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">
              Hover any block to edit or delete it. Click "+ Add" to add a new block. Hit "Reset" to restore defaults.
              Use "Export .ics" to import into Google Calendar / Apple Calendar / Outlook.
            </p>
          </div>
        </div>
      </Card>

      {/* Edit / Add modal */}
      {editModal && (
        <Modal open onClose={() => setEditModal(null)} className="w-full max-w-md p-6">
          <div className="space-y-4">
            <h3 className="text-base font-bold tracking-tight text-gray-900 dark:text-white">
              {editModal.idx === null ? `Add Block — ${editModal.day}` : `Edit Block — ${editModal.day}`}
            </h3>
            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">Type</label>
              <Select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} options={TYPE_OPTIONS.map(t => ({ value: t, label: t }))} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">Task</label>
              <Input value={form.task} onChange={e => setForm(f => ({ ...f, task: e.target.value }))} placeholder="e.g. Study Transformers" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">Start hour (0-23)</label>
                <Input type="number" min={0} max={23} value={form.hours[0]} onChange={e => setForm(f => ({ ...f, hours: [Number(e.target.value), f.hours[1]] }))} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">End hour (0-23)</label>
                <Input type="number" min={0} max={23} value={form.hours[1]} onChange={e => setForm(f => ({ ...f, hours: [f.hours[0], Number(e.target.value)] }))} />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" size="sm" onClick={() => setEditModal(null)}>Cancel</Button>
              <Button size="sm" onClick={save} disabled={!form.task.trim() || form.hours[0] >= form.hours[1]}>Save</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
