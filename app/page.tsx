import Hero from "@/components/sections/Hero";
import ProblemStatement from "@/components/sections/ProblemStatement";
import ServiceCards from "@/components/sections/ServiceCards";
import CtaSection from "@/components/sections/CtaSection";

export default function Home() {
  return (
    <>
      <Hero />
      <ProblemStatement />
      <ServiceCards />
      <CtaSection />
    </>
  );
}
