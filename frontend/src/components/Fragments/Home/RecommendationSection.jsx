import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ServiceCardItem from "../Service/ServiceCardItem";
import RemoveRecommendationModal from "../Common/RemoveRecommendationModal";
import { serviceService } from "../../../services/serviceService";

function RecommendationCard({ service, onClick, onRemove, onFavoriteToggle }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
      className="relative flex-shrink-0 w-full sm:w-80 md:w-[320px]"
    >
      {/* Remove Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove(service);
        }}
        className="absolute -top-2 -right-2 z-20 w-8 h-8 rounded-full bg-white border-2 border-neutral-200 flex items-center justify-center hover:bg-[#D8E3F3] hover:border-[#4782BE] transition-all duration-200 shadow-lg"
        aria-label="Sembunyikan dari rekomendasi"
      >
        <i className="fas fa-eye-slash text-neutral-600 hover:text-[#4782BE] text-sm" />
      </button>

      {/* Service Card */}
      <ServiceCardItem
        service={service}
        onClick={onClick}
        onFavoriteToggle={onFavoriteToggle}
        isCarousel={true}
      />
    </motion.div>
  );
}

export default function RecommendationSection({ onServiceClick, onFavoriteToggle, onViewAllClick, onViewHiddenClick }) {
  const [recommendations, setRecommendations] = useState([]);
  const [allRecommendations, setAllRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [serviceToRemove, setServiceToRemove] = useState(null);
  const [hiddenCount, setHiddenCount] = useState(0);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showEmptyCategoryToast, setShowEmptyCategoryToast] = useState(false);
  const [emptyCategoryName, setEmptyCategoryName] = useState('');
  const scrollContainerRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch categories
        const categoriesResult = await serviceService.getCategories();
        console.log('[RecommendationSection] Categories result:', categoriesResult);
        if (categoriesResult.success && categoriesResult.categories) {
          console.log('[RecommendationSection] Setting categories:', categoriesResult.categories);
          setCategories(categoriesResult.categories);
        } else {
          console.log('[RecommendationSection] Failed to get categories or empty');
        }

        // Fetch random services for recommendations
        const result = await serviceService.getAllServices({
          limit: 20,
          status: "aktif"
        });

        if (result.success && result.services) {
          // Load hidden recommendations from localStorage
          const hiddenRecommendations = JSON.parse(localStorage.getItem("hiddenRecommendations") || "[]");

          // Update hidden count
          setHiddenCount(hiddenRecommendations.length);

          // Map services dengan favoriteCount dari backend (global count)
          const mappedServices = result.services.map(service => ({
            id: service.id,
            slug: service.slug,
            title: service.nama_layanan || service.judul || service.title,
            category: service.nama_kategori || service.kategori_nama || service.category,
            freelancer: service.freelancer_name || service.freelancer || "Unknown",
            rating: parseFloat(service.rating_rata_rata || service.rating) || 0,
            reviews: parseInt(service.jumlah_rating || service.jumlah_ulasan || service.reviews) || 0,
            price: parseInt(service.harga || service.price) || 0,
            favoriteCount: parseInt(service.jumlah_favorit || service.favorite_count || service.favoriteCount) || 0,
            thumbnail: service.thumbnail || null,
            freelancerAvatar: service.freelancer_avatar || service.avatar || null,
          }));

          // Filter out hidden recommendations
          const visibleServices = mappedServices.filter(service => !hiddenRecommendations.includes(service.id));

          // Sort berdasarkan favoriteCount (yang paling banyak dilike di atas)
          const sortedByFavorites = [...visibleServices].sort((a, b) => b.favoriteCount - a.favoriteCount);

          // Ambil 20 teratas untuk filtering
          const topFavorited = sortedByFavorites.slice(0, 20);

          setAllRecommendations(topFavorited);
          setRecommendations(topFavorited.slice(0, 8));
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Listen for user role changes and refetch data
    const handleUserRoleChanged = () => {
      console.log('[RecommendationSection] User role changed, refetching data');
      fetchData();
    };

    window.addEventListener('userRoleChanged', handleUserRoleChanged);
    return () => {
      window.removeEventListener('userRoleChanged', handleUserRoleChanged);
    };
  }, []);

  // Filter recommendations when category changes
  useEffect(() => {
    console.log('[RecommendationSection] Selected category:', selectedCategory);
    console.log('[RecommendationSection] All recommendations categories:', allRecommendations.map(s => s.category));

    if (!selectedCategory) {
      // Show all recommendations
      setRecommendations(allRecommendations.slice(0, 8));
    } else {
      // Filter by selected category
      const filtered = allRecommendations.filter(
        service => {
          console.log(`[RecommendationSection] Comparing: "${service.category}" === "${selectedCategory}"`, service.category === selectedCategory);
          return service.category === selectedCategory;
        }
      );
      console.log('[RecommendationSection] Filtered recommendations:', filtered.length, 'items');

      if (filtered.length === 0) {
        // Show toast for empty category
        setEmptyCategoryName(selectedCategory);
        setShowEmptyCategoryToast(true);
        // Reset to show all
        setSelectedCategory(null);
      } else {
        setRecommendations(filtered.slice(0, 8));
      }
    }
  }, [selectedCategory, allRecommendations]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowCategoryDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleRemoveClick = (service) => {
    setServiceToRemove(service);
    setShowRemoveModal(true);
  };

  const handleConfirmRemove = () => {
    if (serviceToRemove) {
      // Remove from current recommendations
      setRecommendations((prev) => prev.filter((item) => item.id !== serviceToRemove.id));

      // Save to hidden recommendations in localStorage
      const hiddenRecommendations = JSON.parse(localStorage.getItem("hiddenRecommendations") || "[]");
      if (!hiddenRecommendations.includes(serviceToRemove.id)) {
        hiddenRecommendations.push(serviceToRemove.id);
        localStorage.setItem("hiddenRecommendations", JSON.stringify(hiddenRecommendations));
        setHiddenCount(hiddenRecommendations.length);
      }
    }
    setShowRemoveModal(false);
    setServiceToRemove(null);
  };

  const handleCancelRemove = () => {
    setShowRemoveModal(false);
    setServiceToRemove(null);
  };

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === "left" ? -300 : 300;
      scrollContainerRef.current.scrollBy({
        left: scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const handleFavoriteToggleLocal = async (serviceId, isFavorite) => {
    // Update favorite count optimistically
    const updateCount = (items) =>
      items.map((service) => {
        if (service.id === serviceId) {
          return {
            ...service,
            favoriteCount: isFavorite
              ? service.favoriteCount + 1
              : Math.max(0, service.favoriteCount - 1),
          };
        }
        return service;
      });

    setRecommendations((prev) => updateCount(prev));
    setAllRecommendations((prev) => updateCount(prev));

    // Call parent handler jika ada
    if (onFavoriteToggle) {
      onFavoriteToggle(serviceId, isFavorite);
    }

    // Refresh data after a short delay to get updated count from backend
    setTimeout(async () => {
      try {
        const result = await serviceService.getAllServices({
          limit: 20,
          status: "aktif"
        });

        if (result.success && result.services) {
          const hiddenRecommendations = JSON.parse(localStorage.getItem("hiddenRecommendations") || "[]");

          const mappedServices = result.services.map(service => ({
            id: service.id,
            slug: service.slug,
            title: service.nama_layanan || service.judul || service.title,
            category: service.nama_kategori || service.kategori_nama || service.category,
            freelancer: service.freelancer_name || service.freelancer || "Unknown",
            rating: parseFloat(service.rating_rata_rata || service.rating) || 0,
            reviews: parseInt(service.jumlah_rating || service.jumlah_ulasan || service.reviews) || 0,
            price: parseInt(service.harga || service.price) || 0,
            favoriteCount: parseInt(service.jumlah_favorit || service.favorite_count || service.favoriteCount) || 0,
            thumbnail: service.thumbnail || null,
            freelancerAvatar: service.freelancer_avatar || service.avatar || null,
          }));

          const visibleServices = mappedServices.filter(service => !hiddenRecommendations.includes(service.id));
          const sortedByFavorites = [...visibleServices].sort((a, b) => b.favoriteCount - a.favoriteCount);
          const topFavorited = sortedByFavorites.slice(0, 20);

          setAllRecommendations(topFavorited);

          // Apply current category filter
          if (!selectedCategory) {
            setRecommendations(topFavorited.slice(0, 8));
          } else {
            const filtered = topFavorited.filter(service => service.category === selectedCategory);
            setRecommendations(filtered.slice(0, 8));
          }
        }
      } catch (error) {
        console.error("Error refreshing recommendations:", error);
      }
    }, 1000); // Wait 1 second for backend to process
  };

  if (loading) {
    return (
      <section className="py-12 px-4 bg-neutral-50">
        <div className="max-w-7xl mx-auto text-center">
          <i className="fas fa-spinner fa-spin text-2xl text-[#4782BE]" />
          <p className="text-neutral-600 mt-2">Memuat rekomendasi...</p>
        </div>
      </section>
    );
  }

  if (recommendations.length === 0) {
    return null; // Don't show section if no recommendations
  }

  return (
    <>
      <section className="py-12 px-4 bg-neutral-50">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="flex items-center justify-between mb-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-2">
                <span className="bg-gradient-to-r from-[#4782BE] to-[#1D375B] bg-clip-text text-transparent">
                  Rekomendasi Untuk Anda
                  {selectedCategory && ` - ${selectedCategory}`}
                </span>
              </h2>
              <div className="flex items-center gap-3">
                <p className="text-neutral-600">
                  {selectedCategory
                    ? `Layanan ${selectedCategory} yang mungkin Anda sukai`
                    : "Layanan yang mungkin Anda sukai berdasarkan aktivitas Anda"
                  }
                </p>
                {hiddenCount > 0 && (
                  <button
                    onClick={() => onViewHiddenClick && onViewHiddenClick()}
                    className="text-sm text-neutral-600 hover:text-[#4782BE] transition-colors"
                  >
                    ({hiddenCount} rekomendasi disembunyikan)
                  </button>
                )}
              </div>
            </motion.div>

            {/* Category Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowCategoryDropdown(!showCategoryDropdown);
                }}
                className="whitespace-nowrap rounded-full px-6 py-2.5 text-sm font-medium text-neutral-700 bg-[#D8E3F3] hover:bg-[#4782BE]/40 hover:text-[#1D375B] transition-all duration-200 flex items-center gap-2"
              >
                Lihat Berdasarkan Kategori
                <i className={`fas fa-chevron-down text-xs transition-transform ${showCategoryDropdown ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {showCategoryDropdown && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-neutral-200 py-2 z-50 max-h-96 overflow-y-auto">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('[RecommendationSection] Semua Kategori clicked');
                      setSelectedCategory(null);
                      setShowCategoryDropdown(false);
                    }}
                    className={`w-full px-4 py-2.5 text-left text-sm transition-colors font-medium ${
                      !selectedCategory
                        ? 'bg-[#D8E3F3] text-[#1D375B]'
                        : 'text-neutral-700 hover:bg-[#D8E3F3]'
                    }`}
                  >
                    <i className="fas fa-th-large mr-3 text-[#4782BE]" />
                    Semua Kategori
                  </button>
                  <div className="border-t border-neutral-100 my-2" />
                  {categories.length === 0 && (
                    <div className="px-4 py-2.5 text-sm text-neutral-500">
                      Tidak ada kategori
                    </div>
                  )}
                  {categories.map((category) => {
                    const categoryName = category.nama || category.nama_kategori || category.title;
                    console.log('[RecommendationSection] Rendering category:', category, 'Name:', categoryName);
                    return (
                      <button
                        type="button"
                        key={category.id}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('[RecommendationSection] Category clicked:', categoryName);
                          setSelectedCategory(categoryName);
                          setShowCategoryDropdown(false);
                        }}
                        className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
                          selectedCategory === categoryName
                            ? 'bg-[#D8E3F3] text-[#1D375B] font-medium'
                            : 'text-neutral-700 hover:bg-[#D8E3F3]'
                        }`}
                      >
                        {categoryName}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Recommendations Carousel */}
          <div className="flex items-center gap-4">
            {/* Scroll Left Button */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                scroll("left");
              }}
              className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-[#D8E3F3] to-[#9DBBDD] flex items-center justify-center hover:from-[#4782BE] hover:to-[#1D375B] transition-all duration-300 shadow-md hover:shadow-xl group"
            >
              <i className="fas fa-chevron-left text-lg text-[#1D375B] group-hover:text-white transition-colors" />
            </button>

            {/* Services Cards */}
            <AnimatePresence mode="popLayout">
              <div
                ref={scrollContainerRef}
                className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide flex-1"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {recommendations.map((service) => (
                  <RecommendationCard
                    key={service.id}
                    service={service}
                    onClick={() => onServiceClick && onServiceClick(service)}
                    onRemove={handleRemoveClick}
                    onFavoriteToggle={handleFavoriteToggleLocal}
                  />
                ))}
              </div>
            </AnimatePresence>

            {/* Scroll Right Button */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                scroll("right");
              }}
              className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-[#4782BE] to-[#1D375B] flex items-center justify-center hover:shadow-xl transition-all duration-300 shadow-md"
            >
              <i className="fas fa-chevron-right text-lg text-white" />
            </button>
          </div>
        </div>
      </section>

      {/* Remove Confirmation Modal */}
      <RemoveRecommendationModal
        isOpen={showRemoveModal}
        onClose={handleCancelRemove}
        onConfirm={handleConfirmRemove}
        serviceName={serviceToRemove?.title}
      />

      {/* Empty Category Toast */}
      {showEmptyCategoryToast && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-8 right-8 z-50 bg-white rounded-2xl shadow-2xl border border-neutral-200 p-6 max-w-md"
        >
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
              <i className="fas fa-info-circle text-yellow-600 text-xl" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg text-neutral-900 mb-1">
                Kategori Belum Tersedia
              </h3>
              <p className="text-sm text-neutral-600 mb-4">
                Belum ada layanan untuk kategori <span className="font-semibold text-[#4782BE]">{emptyCategoryName}</span>. Silakan pilih kategori lain atau lihat semua rekomendasi.
              </p>
              <button
                type="button"
                onClick={() => setShowEmptyCategoryToast(false)}
                className="w-full px-4 py-2 bg-gradient-to-r from-[#4782BE] to-[#1D375B] text-white rounded-lg font-medium hover:shadow-lg transition-all duration-200"
              >
                Mengerti
              </button>
            </div>
            <button
              type="button"
              onClick={() => setShowEmptyCategoryToast(false)}
              className="flex-shrink-0 w-8 h-8 rounded-full hover:bg-neutral-100 flex items-center justify-center transition-colors"
            >
              <i className="fas fa-times text-neutral-400" />
            </button>
          </div>
        </motion.div>
      )}
    </>
  );
}
