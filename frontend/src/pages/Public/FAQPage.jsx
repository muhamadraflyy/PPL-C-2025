import { useState } from 'react';
import Navbar from "../../components/Fragments/Common/Navbar";
import Footer from "../../components/Fragments/Common/Footer";
import FAQHero from "../../components/Fragments/FAQ/FAQHero";
import FAQCategories from "../../components/Fragments/FAQ/FAQCategories";
import FAQList from "../../components/Fragments/FAQ/FAQList";
import FAQContact from "../../components/Fragments/FAQ/FAQContact";

export default function FAQPage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <FAQHero searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      <FAQCategories activeCategory={activeCategory} setActiveCategory={setActiveCategory} />
      <FAQList activeCategory={activeCategory} searchQuery={searchQuery} />
      <FAQContact />
      <Footer />
    </div>
  );
}
