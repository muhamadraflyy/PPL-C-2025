import Navbar from "../../components/Fragments/Common/Navbar";
import Footer from "../../components/Fragments/Common/Footer";
import LegalHero from "../../components/Fragments/Legal/LegalHero";
import PrivacyHighlights from "../../components/Fragments/Legal/PrivacyHighlights";
import PrivacyContent from "../../components/Fragments/Legal/PrivacyContent";
import LegalContact from "../../components/Fragments/Legal/LegalContact";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <LegalHero title="Kebijakan Privasi" />
      <PrivacyHighlights />
      <PrivacyContent />
      <LegalContact />
      <Footer />
    </div>
  );
}
