import Navbar from '../components/landing/Navbar'
import HeroSection from '../components/landing/HeroSection'
import ScrollableFeatures from '../components/landing/ScrollableFeatures'
import WorkflowTimeline from '../components/landing/WorkflowTimeline'
import CRMEducationSection from '../components/landing/CRMEducationSection'
import ProjectsEducationSection from '../components/landing/ProjectsEducationSection'
import CollaborationEducationSection from '../components/landing/CollaborationEducationSection'
import AIEducationSection from '../components/landing/AIEducationSection'
import Testimonials from '../components/landing/Testimonials'
import Pricing from '../components/landing/Pricing'
import Footer from '../components/landing/Footer'
import FloatingCopilot from '../components/landing/FloatingCopilot'
import { useThemeContext } from '../contexts/ThemeContext'

const Landing = () => {
  const { theme } = useThemeContext()

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'dark' : ''} bg-white dark:bg-gray-900 antialiased`}>
      <Navbar />
      <HeroSection />
      <ScrollableFeatures />
      <WorkflowTimeline />
      <CRMEducationSection />
      <ProjectsEducationSection />
      <CollaborationEducationSection />
      <AIEducationSection />
      <Testimonials />
      <Pricing />
      <Footer />
      <FloatingCopilot />
    </div>
  )
}

export default Landing
