import { AnalyticsSection } from "@/components/sections/analytics-section";
import { Community } from "@/components/sections/community";
import { ControlBarSection } from "@/components/sections/control-bar-section";
import { Features } from "@/components/sections/features";
import { Footer } from "@/components/sections/footer";
import { Header } from "@/components/sections/header";
import { Hero } from "@/components/sections/hero";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      <Header />
      <div className="flex-1">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <Hero />
          <AnalyticsSection />
          <ControlBarSection />
          <Features />
          <Community />
          <Footer />
        </div>
      </div>
    </main>
  );
}
