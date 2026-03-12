import { useState } from 'react'
import { useStore } from '../../store/useStore'
import { Button, Input, Card } from '../../components/ui'
import { EDUCATION_OPTIONS, STATUS_OPTIONS, WORK_MODES } from '../../constants/config'
import { DOMAIN_PRESETS } from '../../constants/domain-presets'
import type { DomainId } from '../../constants/domain-presets'
import { ArrowRight, ArrowLeft, Sparkles, Cpu, User, Target, BookOpen, Clock } from 'lucide-react'

const STEPS = [
  { icon: Cpu, title: 'Choose Your Domain', desc: 'Pick your career focus area' },
  { icon: User, title: 'About You', desc: 'Tell us about yourself' },
  { icon: Target, title: 'Job Search Goals', desc: 'Define your targets' },
  { icon: BookOpen, title: 'Learning Plan', desc: 'Set up your roadmap' },
  { icon: Clock, title: 'Availability', desc: 'Plan your schedule' },
]

export function Onboarding() {
  const { updateProfile, setShowOnboarding, loadDomainPreset } = useStore()
  const [step, setStep] = useState(0)
  const [selectedDomain, setSelectedDomain] = useState<DomainId>('gen-ai')
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    education: "Bachelor's",
    field: '',
    experienceYears: 0,
    currentStatus: 'Student',
    targetRoles: '',
    preferredIndustries: '',
    preferredLocations: '',
    workMode: 'Remote',
    weeklyAppTarget: 50,
    dreamCompanies: '',
    courses: '',
    weeklyStudyHours: 10,
    skillsToImprove: '',
    linkedIn: '',
    github: '',
    portfolio: '',
  })

  const set = (key: string, val: string | number) => setForm(f => ({ ...f, [key]: val }))

  const handleFinish = () => {
    loadDomainPreset(selectedDomain)
    // Only override preset values for fields the user actually filled in
    const targetRoles = form.targetRoles.split(',').map(s => s.trim()).filter(Boolean)
    const dreamCompanies = form.dreamCompanies.split(',').map(s => s.trim()).filter(Boolean)
    const skillsToImprove = form.skillsToImprove.split(',').map(s => s.trim()).filter(Boolean)
    const courses = form.courses.split(',').map(s => s.trim()).filter(Boolean)
    const preferredIndustries = form.preferredIndustries.split(',').map(s => s.trim()).filter(Boolean)
    const preferredLocations = form.preferredLocations.split(',').map(s => s.trim()).filter(Boolean)
    const overrides: Record<string, unknown> = {
      fullName: form.fullName || 'User',
      email: form.email,
      education: form.education,
      field: form.field,
      experienceYears: form.experienceYears,
      currentStatus: form.currentStatus,
      workMode: form.workMode,
      weeklyAppTarget: form.weeklyAppTarget,
      weeklyStudyHours: form.weeklyStudyHours,
      linkedIn: form.linkedIn,
      github: form.github,
      portfolio: form.portfolio,
      searchStartDate: new Date().toISOString().split('T')[0],
      onboarded: true,
      activeDomain: selectedDomain,
    }
    if (targetRoles.length) overrides.targetRoles = targetRoles
    if (dreamCompanies.length) overrides.dreamCompanies = dreamCompanies
    if (skillsToImprove.length) overrides.skillsToImprove = skillsToImprove
    if (courses.length) overrides.courses = courses
    if (preferredIndustries.length) overrides.preferredIndustries = preferredIndustries
    if (preferredLocations.length) overrides.preferredLocations = preferredLocations
    updateProfile(overrides)
    setShowOnboarding(false)
  }

  return (
    <div className="fixed inset-0 z-50 bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Welcome to CareerTrack Pro</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Let's set up your career dashboard</p>
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <button
                onClick={() => setStep(i)}
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium transition-all ${
                  i === step
                    ? 'bg-brand-600 text-white shadow-sm'
                    : i < step
                    ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300'
                    : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
                }`}
              >
                {i + 1}
              </button>
              {i < STEPS.length - 1 && (
                <div className={`hidden sm:block w-12 h-0.5 rounded ${i < step ? 'bg-brand-200 dark:bg-brand-800' : 'bg-gray-200 dark:bg-gray-700'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step subtitle */}
        <div className="text-center mb-4">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{STEPS[step].title}</p>
          <p className="text-xs text-gray-400">{STEPS[step].desc}</p>
        </div>

        <Card className="p-6">
          {step === 0 && (
            <div className="space-y-3">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                Select your career focus. This loads tailored applications, interview questions, roadmap, and resume templates.
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                {DOMAIN_PRESETS.map(d => (
                  <button
                    key={d.id}
                    onClick={() => setSelectedDomain(d.id)}
                    className={`text-left p-3.5 rounded-lg border transition-all ${
                      selectedDomain === d.id
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/30 dark:border-brand-400 ring-1 ring-brand-200 dark:ring-brand-700'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <span className="text-xl">{d.emoji}</span>
                    <p className="text-sm font-medium text-gray-900 dark:text-white mt-1.5 leading-tight">{d.name}</p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 leading-snug line-clamp-2">{d.description}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Input label="Full Name *" value={form.fullName} onChange={e => set('fullName', e.target.value)} placeholder="Alex Chen" />
                <Input label="Email" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="alex@email.com" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Education</label>
                  <select value={form.education} onChange={e => set('education', e.target.value)} title="Education level" className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100">
                    {EDUCATION_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <Input label="Field of Study" value={form.field} onChange={e => set('field', e.target.value)} placeholder="Computer Science" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Years of Experience" type="number" value={form.experienceYears} onChange={e => set('experienceYears', +e.target.value)} min={0} />
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Current Status</label>
                  <select value={form.currentStatus} onChange={e => set('currentStatus', e.target.value)} title="Current status" className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100">
                    {STATUS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <Input label="Target Roles (comma-separated)" value={form.targetRoles} onChange={e => set('targetRoles', e.target.value)} placeholder="Data Scientist, ML Engineer, Data Analyst" />
              <Input label="Preferred Industries (comma-separated)" value={form.preferredIndustries} onChange={e => set('preferredIndustries', e.target.value)} placeholder="Tech, Finance, Healthcare" />
              <Input label="Preferred Locations (comma-separated)" value={form.preferredLocations} onChange={e => set('preferredLocations', e.target.value)} placeholder="San Francisco, New York, Remote" />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Work Mode</label>
                  <select value={form.workMode} onChange={e => set('workMode', e.target.value)} title="Work mode" className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100">
                    {WORK_MODES.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <Input label="Weekly Application Target" type="number" value={form.weeklyAppTarget} onChange={e => set('weeklyAppTarget', +e.target.value)} min={1} />
              </div>
              <Input label="Dream Companies (comma-separated)" value={form.dreamCompanies} onChange={e => set('dreamCompanies', e.target.value)} placeholder="Google, OpenAI, Stripe" />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <Input label="Courses / Resources (comma-separated)" value={form.courses} onChange={e => set('courses', e.target.value)} placeholder="MIT OCW 6.006, Neetcode 150, Andrew Ng ML" />
              <Input label="Skills to Improve (comma-separated)" value={form.skillsToImprove} onChange={e => set('skillsToImprove', e.target.value)} placeholder="Python, SQL, System Design, ML" />
              <Input label="Weekly Study Hours" type="number" value={form.weeklyStudyHours} onChange={e => set('weeklyStudyHours', +e.target.value)} min={1} />
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <Input label="LinkedIn URL" value={form.linkedIn} onChange={e => set('linkedIn', e.target.value)} placeholder="https://linkedin.com/in/alexchen" />
              <Input label="GitHub URL" value={form.github} onChange={e => set('github', e.target.value)} placeholder="https://github.com/alexchen" />
              <Input label="Portfolio URL" value={form.portfolio} onChange={e => set('portfolio', e.target.value)} placeholder="https://alexchen.dev" />
              <div className="mt-4 p-4 rounded-lg bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-800">
                <p className="text-sm font-medium text-brand-800 dark:text-brand-200 mb-1">🎉 You&apos;re all set!</p>
                <p className="text-xs text-brand-600 dark:text-brand-400">Click &quot;Get Started&quot; to launch your dashboard with demo data. You can customize everything later.</p>
              </div>
            </div>
          )}
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <div>
            {step > 0 ? (
              <Button variant="ghost" size="sm" onClick={() => setStep(step - 1)}>
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => setShowOnboarding(false)}>
                Skip setup
              </Button>
            )}
          </div>
          <div>
            {step < STEPS.length - 1 ? (
              <Button size="sm" onClick={() => setStep(step + 1)}>
                Next <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button size="sm" onClick={handleFinish}>
                <Sparkles className="w-4 h-4" /> Get Started
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
