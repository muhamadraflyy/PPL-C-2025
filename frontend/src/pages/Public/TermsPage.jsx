import Navbar from "../../components/Fragments/Common/Navbar";
import Footer from "../../components/Fragments/Common/Footer";
import LegalHero from "../../components/Fragments/Legal/LegalHero";
import TermsContent from "../../components/Fragments/Legal/TermsContent";
import LegalContact from "../../components/Fragments/Legal/LegalContact";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <LegalHero title="Syarat dan Ketentuan" />
      <TermsContent />
      <LegalContact />
      <Footer />
    </div>
  );
}
