import Navbar from "./Navbar";
import HeroSection from "./landing-page/HeroSection";
import Features from "./landing-page/Feature";
import Footer from "./landing-page/footer";
import { PAGE_BG } from "@/components/dash/ui";

export default function LandingPage() {
  return (
    <div className="dash-light min-h-screen" style={{ background: PAGE_BG }}>
      <Navbar />
      <HeroSection />
      <Features />
      <Footer />
    </div>
  );
}
