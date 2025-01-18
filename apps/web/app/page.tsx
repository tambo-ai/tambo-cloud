import { AnalyticsSection } from "@/components/sections/analytics-section";
import { SaasFeatures } from "@/components/sections/saas-features";
import { Features } from "@/components/sections/features";
import { Footer } from "@/components/sections/footer";
import { Hero } from "@/components/sections/hero";
import { Header } from "@/components/sections/header";
import { Community } from "@/components/sections/community";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      <Header />
      <div className="flex-1">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Hero />
          <AnalyticsSection />
          <SaasFeatures />
          <Features />
          <Community />
          <Footer />
        </div>
      </div>
    </main>
  );
}
