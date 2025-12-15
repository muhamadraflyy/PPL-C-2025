import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../../services/authService";
import { serviceService } from "../../services/serviceService";
import Navbar from "../../components/Fragments/Common/Navbar";
import Footer from "../../components/Fragments/Common/Footer";
import ServiceCardItem from "../../components/Fragments/Service/ServiceCardItem";

export default function HiddenRecommendationsPage() {
  const navigate = useNavigate();
  const [hiddenServices, setHiddenServices] = useState([]);
  const [loading, setLoading] = useState(true);

  const user = authService.getCurrentUser();
  const isClient = user?.role === "client";

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (!isClient) {
      navigate("/");
      return;
    }
    loadHiddenServices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadHiddenServices = async () => {
    try {
      setLoading(true);

      // Get hidden recommendation IDs from localStorage
      const hiddenIds = JSON.parse(localStorage.getItem("hiddenRecommendations") || "[]");

      if (hiddenIds.length === 0) {
        setHiddenServices([]);
        setLoading(false);
        return;
      }

      // Fetch all services
      const result = await serviceService.getAllServices({
        limit: 100,
        status: "aktif"
      });

      if (result.success && result.services) {
        // Filter only hidden services
        const hidden = result.services
          .filter(service => hiddenIds.includes(service.id))
          .map(service => ({
            id: service.id,
            slug: service.slug,
            title: service.nama_layanan || service.judul || service.title,
            category: service.kategori_nama || service.category,
            freelancer: service.freelancer_name || service.freelancer || "Unknown",
            rating: parseFloat(service.rating_rata_rata || service.rating) || 0,
            reviews: parseInt(service.jumlah_rating || service.jumlah_ulasan || service.reviews) || 0,
            price: parseInt(service.harga || service.price) || 0,
            favoriteCount: parseInt(service.jumlah_favorit || service.favorite_count || service.favoriteCount) || 0,
          }));

        setHiddenServices(hidden);
      }
    } catch (err) {
      console.error("Error loading hidden services:", err);
      setHiddenServices([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = (serviceId) => {
    // Remove from hidden recommendations
    const hiddenIds = JSON.parse(localStorage.getItem("hiddenRecommendations") || "[]");
    const updatedHiddenIds = hiddenIds.filter(id => id !== serviceId);
    localStorage.setItem("hiddenRecommendations", JSON.stringify(updatedHiddenIds));

    // Remove from state
    setHiddenServices(prev => prev.filter(service => service.id !== serviceId));
  };

  const handleRestoreAll = () => {
    // Clear all hidden recommendations
    localStorage.setItem("hiddenRecommendations", "[]");
    setHiddenServices([]);
  };

  const handleServiceClick = (service) => {
    navigate(`/layanan/${service.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <i className="fas fa-spinner fa-spin text-4xl text-[#4782BE] mb-4"></i>
            <p className="text-neutral-600">Memuat layanan yang disembunyikan...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 mb-2">Layanan yang Disembunyikan</h1>
            <p className="text-neutral-600">Item yang Anda sembunyikan tidak akan muncul di daftar lagi</p>
          </div>

          {hiddenServices.length > 0 && (
            <button
              onClick={handleRestoreAll}
              className="px-6 py-2.5 bg-[#4782BE] text-white rounded-lg font-semibold hover:bg-[#1D375B] transition-colors"
            >
              Pulihkan Semua
            </button>
          )}
        </div>

        {/* Count */}
        {hiddenServices.length > 0 && (
          <div className="mb-4 text-sm text-neutral-600">
            {hiddenServices.length} layanan yang Anda sembunyikan
          </div>
        )}

        {/* Empty State */}
        {hiddenServices.length === 0 && (
          <div className="bg-white rounded-2xl shadow-md p-12 text-center">
            <i className="far fa-eye-slash text-6xl text-neutral-300 mb-4"></i>
            <h2 className="text-2xl font-bold text-neutral-900 mb-2">
              Tidak Ada Layanan yang Disembunyikan
            </h2>
            <p className="text-neutral-600 mb-6">
              Anda belum menyembunyikan layanan apapun dari rekomendasi
            </p>
            <button
              onClick={() => navigate("/")}
              className="bg-[#4782BE] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#1D375B] transition-colors"
            >
              Kembali ke Beranda
            </button>
          </div>
        )}

        {/* Hidden Services Grid */}
        {hiddenServices.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {hiddenServices.map((service) => (
              <div key={service.id} className="relative">
                {/* Restore Button */}
                <button
                  onClick={() => handleRestore(service.id)}
                  className="absolute -top-2 -right-2 z-20 w-10 h-10 rounded-full bg-[#4782BE] text-white flex items-center justify-center hover:bg-[#1D375B] transition-all duration-200 shadow-lg"
                  title="Pulihkan ke rekomendasi"
                >
                  <i className="fas fa-undo text-sm" />
                </button>

                <ServiceCardItem
                  service={service}
                  onClick={() => handleServiceClick(service)}
                  onFavoriteToggle={() => {}}
                  onBookmarkToggle={() => {}}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
