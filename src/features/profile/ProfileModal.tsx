import { useState } from 'react'
import { useStore } from '../../store/useStore'
import { Modal, Button, Input, Badge } from '../../components/ui'
import { DOMAIN_PRESETS } from '../../constants/domain-presets'
import type { DomainId } from '../../constants/domain-presets'
import { X, User, Briefcase, BookOpen, Globe, Github, Linkedin, Settings, RotateCcw, Repeat } from 'lucide-react'

export function ProfileModal() {
  const { profile, updateProfile, showProfile, setShowProfile, setShowOnboarding, loadDomainPreset } = useStore()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(profile)
  const [showDomainSwitcher, setShowDomainSwitcher] = useState(false)

  const handleSave = () => {
    updateProfile(form)
    setEditing(false)
  }

  const handleReset = () => {
    setShowProfile(false)
    setShowOnboarding(true)
  }

  return (
    <Modal open={showProfile} onClose={() => setShowProfile(false)} className="w-full max-w-lg">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center">
              <User className="w-6 h-6 text-brand-600 dark:text-brand-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">{profile.fullName || 'Your Profile'}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{profile.email || 'No email set'}</p>
            </div>
          </div>
          <button onClick={() => setShowProfile(false)} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" title="Close profile">
            <X className="w-5 h-5" />
          </button>
        </div>

        {editing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input label="Full Name" value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} />
              <Input label="Email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Field" value={form.field} onChange={e => setForm({ ...form, field: e.target.value })} />
              <Input label="Education" value={form.education} onChange={e => setForm({ ...form, education: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Weekly App Target" type="number" value={form.weeklyAppTarget} onChange={e => setForm({ ...form, weeklyAppTarget: +e.target.value })} />
              <Input label="Weekly Study Hours" type="number" value={form.weeklyStudyHours} onChange={e => setForm({ ...form, weeklyStudyHours: +e.target.value })} />
            </div>
            <Input label="Target Roles (comma-separated)" value={form.targetRoles.join(', ')} onChange={e => setForm({ ...form, targetRoles: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} />
            <Input label="Dream Companies (comma-separated)" value={form.dreamCompanies.join(', ')} onChange={e => setForm({ ...form, dreamCompanies: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} />
            <Input label="Skills to Improve (comma-separated)" value={form.skillsToImprove.join(', ')} onChange={e => setForm({ ...form, skillsToImprove: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} />
            <div className="grid grid-cols-3 gap-3">
              <Input label="LinkedIn" value={form.linkedIn} onChange={e => setForm({ ...form, linkedIn: e.target.value })} placeholder="URL" />
              <Input label="GitHub" value={form.github} onChange={e => setForm({ ...form, github: e.target.value })} placeholder="URL" />
              <Input label="Portfolio" value={form.portfolio} onChange={e => setForm({ ...form, portfolio: e.target.value })} placeholder="URL" />
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={handleSave}>Save Changes</Button>
              <Button variant="ghost" onClick={() => { setForm(profile); setEditing(false) }}>Cancel</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Info sections */}
            <Section icon={<Briefcase className="w-4 h-4" />} title="Job Search">
              <InfoRow label="Status" value={profile.currentStatus} />
              <InfoRow label="Target Roles">{profile.targetRoles.map(r => <Badge key={r} className="bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300 mr-1 mb-1">{r}</Badge>)}</InfoRow>
              <InfoRow label="Dream Companies">{profile.dreamCompanies.map(c => <Badge key={c} className="bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 mr-1 mb-1">{c}</Badge>)}</InfoRow>
              <InfoRow label="Weekly Target" value={`${profile.weeklyAppTarget} applications`} />
              <InfoRow label="Work Mode" value={profile.workMode} />
            </Section>

            <Section icon={<BookOpen className="w-4 h-4" />} title="Education & Learning">
              <InfoRow label="Education" value={profile.education} />
              <InfoRow label="Field" value={profile.field} />
              <InfoRow label="Experience" value={`${profile.experienceYears} year${profile.experienceYears !== 1 ? 's' : ''}`} />
              <InfoRow label="Study Hours" value={`${profile.weeklyStudyHours}h/week`} />
              <InfoRow label="Skills to Improve">{profile.skillsToImprove.map(s => <Badge key={s} className="bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 mr-1 mb-1">{s}</Badge>)}</InfoRow>
            </Section>

            <Section icon={<Globe className="w-4 h-4" />} title="Links">
              {profile.linkedIn && <LinkRow icon={<Linkedin className="w-3.5 h-3.5" />} label="LinkedIn" href={profile.linkedIn} />}
              {profile.github && <LinkRow icon={<Github className="w-3.5 h-3.5" />} label="GitHub" href={profile.github} />}
              {profile.portfolio && <LinkRow icon={<Globe className="w-3.5 h-3.5" />} label="Portfolio" href={profile.portfolio} />}
              {!profile.linkedIn && !profile.github && !profile.portfolio && (
                <p className="text-xs text-gray-400 italic">No links added yet</p>
              )}
            </Section>

            <div className="flex items-center gap-2 border-t border-gray-100 dark:border-gray-800 pt-4">
              <Button size="sm" onClick={() => { setForm(profile); setEditing(true) }}>
                <Settings className="w-3.5 h-3.5" /> Edit Profile
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setShowDomainSwitcher(!showDomainSwitcher)}>
                <Repeat className="w-3.5 h-3.5" /> Switch Domain
              </Button>
              <Button size="sm" variant="ghost" onClick={handleReset}>
                <RotateCcw className="w-3.5 h-3.5" /> Restart
              </Button>
            </div>

            {showDomainSwitcher && (
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 mt-3">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-2">
                  Switch career domain — this replaces all demo data
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {DOMAIN_PRESETS.map(d => (
                    <button
                      key={d.id}
                      onClick={() => {
                        loadDomainPreset(d.id as DomainId)
                        setShowDomainSwitcher(false)
                      }}
                      className={`flex items-center gap-2 p-2 rounded-lg text-left transition-colors text-xs ${
                        profile.activeDomain === d.id
                          ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300 font-medium'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      <span>{d.emoji}</span>
                      <span className="truncate">{d.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {icon} {title}
      </div>
      <div className="space-y-1.5 pl-6">{children}</div>
    </div>
  )
}

function InfoRow({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <span className="text-gray-400 dark:text-gray-500 min-w-[120px] text-xs">{label}</span>
      {value ? <span className="text-gray-700 dark:text-gray-200 text-xs">{value}</span> : <div className="flex flex-wrap">{children}</div>}
    </div>
  )
}

function LinkRow({ icon, label, href }: { icon: React.ReactNode; label: string; href: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      {icon}
      <span className="text-gray-500 dark:text-gray-400">{label}:</span>
      <span className="text-brand-600 dark:text-brand-400 truncate">{href}</span>
    </div>
  )
}
