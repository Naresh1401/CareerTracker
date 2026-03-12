import { useStore } from './store/useStore'
import { Layout } from './components/layout/Layout'
import { Dashboard } from './features/dashboard/Dashboard'
import { Applications } from './features/applications/Applications'
import { ResumeVersions } from './features/resumes/ResumeIntelligence'
import { Roadmap } from './features/roadmap/Roadmap'
import { QuestionBank } from './features/questions/QuestionBank'
import { Timetable } from './features/timetable/Timetable'
import { Suggestions } from './features/suggestions/Suggestions'
import { ProfileModal } from './features/profile/ProfileModal'
import { Onboarding } from './features/onboarding/Onboarding'
import { Chatbot } from './features/chatbot/Chatbot'
import { AdminTracker } from './features/admin/AdminTracker'
import { trackVisit } from './lib/visitor-tracker'

const TAB_COMPONENTS: Record<string, React.FC> = {
  dashboard: Dashboard,
  applications: Applications,
  resumes: ResumeVersions,
  roadmap: Roadmap,
  questions: QuestionBank,
  timetable: Timetable,
  suggestions: Suggestions,
  admin: AdminTracker,
}

// Track visit on app load
if (typeof window !== 'undefined') {
  trackVisit(window.location.pathname)
}

export default function App() {
  const { activeTab, showOnboarding } = useStore()

  if (showOnboarding) return <Onboarding />

  const ActivePage = TAB_COMPONENTS[activeTab] || Dashboard

  return (
    <>
      <Layout>
        <ActivePage />
      </Layout>
      <ProfileModal />
      <Chatbot />
    </>
  )
}
