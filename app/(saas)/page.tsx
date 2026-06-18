import { SaaSHero } from '@/components/organisms/SaaSHero'
import { SaaSFeatureGrid } from '@/components/organisms/SaaSFeatureGrid'
import { SaaSPricingSection } from '@/components/organisms/SaaSPricingSection'

export default function SaaSHomePage() {
  return (
    <>
      <SaaSHero />
      <SaaSFeatureGrid />
      <SaaSPricingSection />
    </>
  )
}
