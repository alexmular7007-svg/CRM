import Navbar from '../components/landing/Navbar'
import HeroSection from '../components/landing/HeroSection'
import PlatformStrip from '../components/landing/PlatformStrip'
import PlatformStatement from '../components/landing/PlatformStatement'
import ProjectShowcase from '../components/landing/ProjectShowcase'
import CRMShowcase from '../components/landing/CRMShowcase'
import CollaborationShowcase from '../components/landing/CollaborationShowcase'
import IntelligenceShowcase from '../components/landing/IntelligenceShowcase'
import MarketingEngineSection from '../components/landing/MarketingEngineSection'
import WorkflowStrip from '../components/landing/WorkflowStrip'
import TechnicalCredibility from '../components/landing/TechnicalCredibility'
import Pricing from '../components/landing/Pricing'
import FinalCTA from '../components/landing/FinalCTA'
import Footer from '../components/landing/Footer'
import FloatingCopilot from '../components/landing/FloatingCopilot'
import { useThemeContext } from '../contexts/ThemeContext'

export default function Landing() {
  const { theme } = useThemeContext()

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'dark' : ''} bg-[#F7F5F0] dark:bg-[#071A3A] antialiased overflow-x-hidden selection:bg-[#0052FF] selection:text-white`}>
      {/* 1. Navbar */}
      <Navbar />

      {/* 2. Hero Section */}
      <HeroSection />

      {/* 3. Platform Capabilities Proof Strip */}
      <PlatformStrip />

      {/* 4. Large Platform Statement (#features) */}
      <PlatformStatement />

      {/* 5. Project Management & Kanban Showcase (Soft Pink block) */}
      <ProjectShowcase />

      {/* 6. CRM Sales Pipeline Showcase (Deep Navy block) */}
      <CRMShowcase />

      {/* 7. Team Collaboration Showcase (Light Blue block) */}
      <CollaborationShowcase />

      {/* 8. Operational Intelligence Showcase (#ai) */}
      <IntelligenceShowcase />

      {/* 9. Marketing & Growth Engine Showcase */}
      <MarketingEngineSection />

      {/* 10. Three-Step Workflow (#workflow) */}
      <WorkflowStrip />

      {/* 11. Technical Architecture & Credibility */}
      <TechnicalCredibility />

      {/* 12. Transparent Pricing & Plans (#pricing) + FAQ */}
      <Pricing />

      {/* 13. Final Call to Action */}
      <FinalCTA />

      {/* 14. Footer */}
      <Footer />

      {/* Floating Copilot Chatbot */}
      <FloatingCopilot />
    </div>
  )
}
