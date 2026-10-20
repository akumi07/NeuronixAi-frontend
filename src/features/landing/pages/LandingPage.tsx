import { AgentCapabilitiesSection } from '../components/AgentCapabilitiesSection'
import { CoreCapabilitiesSection } from '../components/CoreCapabilitiesSection'
import { FinalCtaSection } from '../components/FinalCtaSection'
import { HeroSection } from '../components/HeroSection'
import { HowItWorksSection } from '../components/HowItWorksSection'
import { LandingFooter } from '../components/LandingFooter'
import { LandingNavbar } from '../components/LandingNavbar'
import { WorkflowExamplesSection } from '../components/WorkflowExamplesSection'

export default function LandingPage() {
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2">
        Skip to content
      </a>
      <LandingNavbar />
      <main id="main">
        <HeroSection />
        <WorkflowExamplesSection />
        <AgentCapabilitiesSection />
        <HowItWorksSection />
        <CoreCapabilitiesSection />
        <FinalCtaSection />
      </main>
      <LandingFooter />
    </>
  )
}
