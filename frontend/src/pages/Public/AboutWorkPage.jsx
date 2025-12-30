import Navbar from "../../components/Fragments/Common/Navbar";
import Footer from "../../components/Fragments/Common/Footer";
import AboutHero from "../../components/Fragments/About/AboutHero";
import AboutStats from "../../components/Fragments/About/AboutStats";
import AboutMission from "../../components/Fragments/About/AboutMission";
import AboutBenefits from "../../components/Fragments/About/AboutBenefits";
import AboutTestimonials from "../../components/Fragments/About/AboutTestimonials";
import AboutCTA from "../../components/Fragments/About/AboutCTA";

export default function AboutWorkPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <AboutHero />
      <AboutStats />
      <AboutMission />
      <AboutBenefits />
      <AboutTestimonials />
      <AboutCTA />
      <Footer />
    </div>
  );
}
