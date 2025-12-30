import Navbar from "../../components/Fragments/Common/Navbar";
import Footer from "../../components/Fragments/Common/Footer";
import PaymentHero from "../../components/Fragments/Payment/PaymentHero";
import PaymentMethods from "../../components/Fragments/Payment/PaymentMethods";
import PaymentFeatures from "../../components/Fragments/Payment/PaymentFeatures";
import PaymentFees from "../../components/Fragments/Payment/PaymentFees";
import PaymentEscrow from "../../components/Fragments/Payment/PaymentEscrow";
import PaymentCTA from "../../components/Fragments/Payment/PaymentCTA";

export default function PaymentPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <PaymentHero />
      <PaymentMethods />
      <PaymentFeatures />
      <PaymentFees />
      <PaymentEscrow />
      <PaymentCTA />
      <Footer />
    </div>
  );
}
