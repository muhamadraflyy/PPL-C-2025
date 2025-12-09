import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ServicePopularCarousel from "./ServicePopularCarousel";
import { serviceService } from "../../../services/Service/serviceService";

export default function ServicePopular() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(0);

  useEffect(() => {
    fetchPopularServices();
  }, []);

  const fetchPopularServices = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await serviceService.getPopularServices({
        limit: 10, // Top 10 per kategori
      });

      if (result.success && result.categories.length > 0) {
        setCategories(result.categories);
        if (import.meta.env.DEV) {
          console.log("[ServicePopular] Loaded categories:", result.categories);
        }
      } else {
        setError(result.message || "Tidak ada layanan populer");
      }
    } catch (err) {
      console.error("[ServicePopular] Error:", err);
      setError("Gagal memuat layanan populer");
    } finally {
      setLoading(false);
    }
  };

  const handleServiceClick = (service) => {
    if (service?.slug) {
      navigate(`/services/${service.slug}`);
    }
  };

  const handleFavorite = (service) => {
    // TODO: Implementasi favorite
    console.log("Favorite:", service);
  };

  const handleBookmark = (service) => {
    // TODO: Implementasi bookmark
    console.log("Bookmark:", service);
  };

  const handleCategoryChange = (index) => {
    setSelectedCategory(index);
  };

  const handleViewMore = () => {
    const currentCategory = categories[selectedCategory];
    if (currentCategory?.kategori_id) {
      navigate(`/services?kategori_id=${currentCategory.kategori_id}`);
    }
  };

  if (loading) {
    return (
      <section className="py-20 px-4 bg-gradient-to-r from-[#88abfc] to-white">
        <h2 className="py-6 text-center text-4xl font-bold text-[#1e5efe]">
          Layanan Terpopuler
        </h2>
        <div className="mx-auto max-w-7xl p-6">
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#1e5efe] border-t-transparent" />
          </div>
        </div>
      </section>
    );
  }

  if (error || categories.length === 0) {
    return (
      <section className="py-20 px-4 bg-gradient-to-r from-[#88abfc] to-white">
        <h2 className="py-6 text-center text-4xl font-bold text-[#1e5efe]">
          Layanan Terpopuler
        </h2>
        <div className="mx-auto max-w-7xl p-6">
          <div className="flex items-center justify-center py-12">
            <p className="text-[#1d387e]">
              {error || "Belum ada layanan populer tersedia"}
            </p>
          </div>
        </div>
      </section>
    );
  }

  const currentCategory = categories[selectedCategory];
  const services = currentCategory?.services || [];

  return (
    <section className="py-20 px-4 bg-gradient-to-r from-[#88abfc] to-white">
      <h2 className="py-6 text-center text-4xl font-bold text-[#1e5efe]">
        Layanan Terpopuler
      </h2>
      <p className="text-center text-[#1d387e]">
        Jelajahi berbagai layanan professional dari freelancer terbaik
      </p>

      <div className="mx-auto max-w-7xl p-6">
        {/* Category Tabs */}
        {categories.length > 1 && (
          <div className="mb-6 flex flex-wrap gap-2 justify-center">
            {categories.map((category, index) => (
              <button
                key={category.kategori_id}
                type="button"
                onClick={() => handleCategoryChange(index)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                  selectedCategory === index
                    ? "bg-[#1e5efe] text-white shadow-md"
                    : "bg-white text-[#1e5efe] hover:bg-[#1e5efe]/10"
                }`}
              >
                {category.nama_kategori}
              </button>
            ))}
          </div>
        )}

        {/* Category Header */}
        <div className="flex items-end justify-between gap-4">
          <div>
            <h3 className="text-2xl font-bold text-[#0f1b4d]">
              {currentCategory.nama_kategori}
            </h3>
            <p className="text-sm text-[#1d387e]">
              {services.length} layanan populer
            </p>
          </div>

          <div className="hidden sm:block">
            <button
              type="button"
              onClick={handleViewMore}
              className="inline-block rounded-lg bg-white px-3 py-2 text-sm font-semibold text-[#1e5efe] shadow-sm hover:bg-[#1e5efe]/10 transition-colors"
            >
              Lainnya
            </button>
          </div>
        </div>

        {/* Services Carousel */}
        <div className="mt-6">
          <ServicePopularCarousel
            services={services}
            onServiceClick={handleServiceClick}
            onFavorite={handleFavorite}
            onBookmark={handleBookmark}
          />
        </div>
      </div>
    </section>
  );
}