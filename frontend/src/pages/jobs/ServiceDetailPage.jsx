import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../../components/Fragments/Common/Navbar";
import ServiceHeaderCard from "../../components/Fragments/Service/ServiceHeaderCard";
import OrderCard from "../../components/Fragments/Order/OrderCard";
import InteractionBar from "../../components/Fragments/Order/InteractionBar";
import ReviewsSection from "../../components/Fragments/Service/ReviewsSection";
import PortfolioGrid from "../../components/Fragments/Profile/PortfolioGrid";
import AboutFreelancerCard from "../../components/Fragments/Profile/AboutFreelancerCard";
import Footer from "../../components/Fragments/Common/Footer";
import SavedToast from "../../components/Fragments/Common/SavedToast";
import UnsaveConfirmModal from "../../components/Fragments/Common/UnsaveConfirmModal";
import { useServiceDetail } from "../../hooks/useServiceDetail";
import { bookmarkService } from "../../services/bookmarkService";
import { authService } from "../../services/authService";
import { reviewService } from "../../services/reviewService";
import NotFoundPage from "../Public/NotFoundPage";

export default function ServiceDetailPage() {
  const { slug } = useParams(); // route: /services/:slug
  const navigate = useNavigate();

  const [selectedPortfolio, setSelectedPortfolio] = useState(null);
  const [showPortfolioModal, setShowPortfolioModal] = useState(false);

  // Bookmark state
  const [user, setUser] = useState(() => authService.getCurrentUser());
  const isClient = user?.role === "client";
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isBookmarkLoading, setIsBookmarkLoading] = useState(false);
  const [showBookmarkToast, setShowBookmarkToast] = useState(false);
  const [showUnbookmarkModal, setShowUnbookmarkModal] = useState(false);
  const [isProcessingBookmark, setIsProcessingBookmark] = useState(false);

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  // Listen to user role changes
  useEffect(() => {
    const handleUserRoleChanged = (event) => {
      const updatedUser = event.detail?.user || authService.getCurrentUser();
      setUser(updatedUser);
    };

    window.addEventListener('userRoleChanged', handleUserRoleChanged);
    return () => {
      window.removeEventListener('userRoleChanged', handleUserRoleChanged);
    };
  }, []);

  if (!slug || slug === "undefined") {
    return <NotFoundPage />;
  }

  const {
    data: serviceData,
    isLoading,
    isError,
    error,
  } = useServiceDetail(slug);

  // Sync bookmark state from server
  useEffect(() => {
    if (!user || !isClient || !serviceData?.id) {
      return;
    }

    let cancelled = false;

    const hydrateBookmarkState = async () => {
      try {
        const res = await bookmarkService.isBookmarked(serviceData.id);
        if (cancelled) return;

        if (res?.success && typeof res.data?.isBookmarked === "boolean") {
          setIsBookmarked(res.data.isBookmarked);
        } else {
          setIsBookmarked(false);
        }
      } catch (err) {
        console.log('[ServiceDetailPage] Bookmark sync error:', err);
        setIsBookmarked(false);
      }
    };

    hydrateBookmarkState();
    return () => {
      cancelled = true;
    };
  }, [user?.id, isClient, serviceData?.id]);

  // Handle bookmark click
  const handleBookmarkClick = async (e) => {
    e.stopPropagation();
    e.preventDefault();

    if (isProcessingBookmark) {
      return;
    }

    if (!user || !isClient || !serviceData?.id) {
      return;
    }

    if (isBookmarked) {
      setShowUnbookmarkModal(true);
      return;
    }

    setIsProcessingBookmark(true);
    setIsBookmarkLoading(true);

    try {
      setIsBookmarked(true);
      setShowBookmarkToast(true);

      const res = await bookmarkService.addBookmark(serviceData.id);

      if (!res?.success) {
        if (!res?.message?.includes('sudah ada')) {
          setIsBookmarked(false);
        }
      }
    } catch (error) {
      console.error("[ServiceDetailPage] addBookmark error:", error);
      setIsBookmarked(false);
    } finally {
      setIsBookmarkLoading(false);
      setTimeout(() => setIsProcessingBookmark(false), 500);
    }
  };

  // Handle confirm unbookmark
  const handleConfirmUnbookmark = async () => {
    setShowUnbookmarkModal(false);
    setIsProcessingBookmark(true);
    setIsBookmarkLoading(true);

    try {
      setIsBookmarked(false);
      setShowBookmarkToast(true);

      const res = await bookmarkService.removeBookmark(serviceData.id);
      if (!res?.success) {
        setIsBookmarked(true);
      }
    } catch (error) {
      console.error("[ServiceDetailPage] removeBookmark error:", error);
      setIsBookmarked(true);
    } finally {
      setIsBookmarkLoading(false);
      setTimeout(() => setIsProcessingBookmark(false), 500);
    }
  };

  function handleBack() {
    navigate("/services");
  }

  function handleOrderNow() {
    if (!serviceData) return;
    navigate("/create-order", {
      state: {
        service: {
          id: serviceData.id,
          title: serviceData.title,
          price: serviceData.price,
          category: serviceData.category || "Lainnya",
          freelancer: serviceData.freelancer.name,
          thumbnail: serviceData.thumbnail,
        },
      },
    });
  }

  async function handleContact() {
    if (!serviceData) return;
    // Navigate dengan userId untuk create conversation, tapi autoSelect=false agar tidak langsung masuk room
    navigate(`/messages?userId=${serviceData.freelancer.id}&autoSelect=false`);
  }

  // Fetch reviews from API
  useEffect(() => {
    if (!serviceData?.id) return;

    let cancelled = false;

    const fetchReviews = async () => {
      setReviewsLoading(true);
      try {
        const res = await reviewService.getServiceReviews(serviceData.id);
        if (cancelled) return;

        if (res?.success || res?.status === 'success') {
          // Map reviews to format expected by ReviewsSection
          const reviewsData = res?.data?.reviews || res?.data || [];
          const mappedReviews = Array.isArray(reviewsData) ? reviewsData.map(r => ({
            rating: r.rating || 5,
            title: r.judul || r.title || '',
            content: r.komentar || r.content || r.comment || '',
            avatar: r.client_avatar || r.avatar || '/asset/default-avatar.png',
            name: r.client_name || r.nama || r.name || 'Anonymous',
          })) : [];
          setReviews(mappedReviews);
        }
      } catch (err) {
        console.error('[ServiceDetailPage] Error fetching reviews:', err);
      } finally {
        if (!cancelled) setReviewsLoading(false);
      }
    };

    fetchReviews();
    return () => { cancelled = true; };
  }, [serviceData?.id]);

  // ========================
  // UI: Loading skeleton
  // ========================
  const renderSkeleton = () => (
    <div className="grid grid-cols-1 gap-4 mt-4 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <div className="h-64 rounded-xl animate-pulse bg-neutral-200" />
        <div className="h-40 rounded-xl animate-pulse bg-neutral-200" />
        <div className="h-40 rounded-xl animate-pulse bg-neutral-200" />
      </div>
      <div className="space-y-3 lg:col-span-1">
        <div className="h-64 rounded-xl animate-pulse bg-neutral-200" />
        <div className="h-12 rounded-xl animate-pulse bg-neutral-200" />
        <div className="h-40 rounded-xl animate-pulse bg-neutral-200" />
      </div>
    </div>
  );

  // ========================
  // UI: Error (non-404)
  // ========================
  const renderErrorState = () => (
    <div className="px-4 py-4 mt-6 text-sm text-red-700 bg-red-50 rounded-xl border border-red-200">
      <p className="mb-1 font-semibold">Gagal memuat detail layanan</p>
      <p className="mb-3">
        {error?.message ||
          "Layanan tidak ditemukan atau terjadi kesalahan server."}
      </p>
      <button
        type="button"
        onClick={handleBack}
        className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
      >
        Kembali ke daftar layanan
      </button>
    </div>
  );

  // ========================
  // Routing ke 404 kalau benar-benar not found
  // ========================
  const isSlugNotFound =
    !isLoading &&
    ((isError && error?.statusCode === 404) || (!isError && !serviceData));

  if (isSlugNotFound) {
    return <NotFoundPage />;
  }

  // Helper gambar header (sudah dinormalisasi di hook)
  // Pastikan thumbnail selalu menjadi gambar pertama, kemudian diikuti gambar galeri
  const headerImages = (() => {
    if (!serviceData) return [];

    const thumbnail = serviceData.thumbnail;
    const galleryImages = Array.isArray(serviceData.gambar) ? serviceData.gambar : [];

    // Jika tidak ada thumbnail, gunakan gambar galeri saja
    if (!thumbnail) {
      return galleryImages.length > 0 ? galleryImages : [];
    }

    // Normalisasikan URL untuk perbandingan yang lebih akurat
    const normalizeForComparison = (url) => {
      const str = String(url || '').trim();
      // Extract filename/path untuk perbandingan (hilangkan query params dan fragment)
      return str.split('?')[0].split('#')[0].toLowerCase();
    };

    const thumbnailNormalized = normalizeForComparison(thumbnail);

    // Hapus duplikat thumbnail dari gallery images
    const filteredGallery = galleryImages.filter(img => {
      const imgNormalized = normalizeForComparison(img);
      return imgNormalized !== thumbnailNormalized;
    });

    // Thumbnail selalu di posisi pertama, diikuti gambar galeri (tanpa duplikat thumbnail)
    return [thumbnail, ...filteredGallery];
  })();

  // Portfolio harus ambil dari portofolio freelancer, bukan gambar layanan
  const allPortfolioItems = Array.isArray(serviceData?.freelancer?.portfolio)
    ? serviceData.freelancer.portfolio
    : [];

  // Limit portfolio display to 4 items
  const portfolioItems = allPortfolioItems.slice(0, 4);
  const hasMorePortfolio = allPortfolioItems.length > 4;

  // ========================
  // Render utama
  // ========================
  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      <Navbar />

      <main className="px-4 py-5 mx-auto max-w-6xl md:py-7">
        {/* Tombol kembali */}
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex gap-2 items-center mb-1 text-xs text-neutral-500 hover:text-neutral-700"
        >
          <span className="text-lg leading-none">←</span>
        </button>

        {/* Label kategori di bawah tombol kembali */}
        {serviceData && (
          <p className="mb-1 text-xs font-medium text-neutral-500">
            {serviceData.category}
          </p>
        )}

        {/* Title */}
        <h1 className="text-xl font-semibold text-neutral-900 sm:text-2xl">
          {serviceData?.title || (isLoading ? "Memuat layanan..." : "Layanan")}
        </h1>

        {/* State handling */}
        {isLoading && renderSkeleton()}
        {isError && error?.statusCode !== 404 && renderErrorState()}

        {/* Konten utama: hanya render kalau punya data & tidak error */}
        {!isLoading && !isError && serviceData && (
          <div className="grid grid-cols-1 gap-4 mt-4 lg:grid-cols-3">
            {/* Kolom kiri */}
            <div className="space-y-4 lg:col-span-2">
              {/* Header card: gambar + info freelancer */}
              <ServiceHeaderCard
                avatar={serviceData.freelancer.avatar}
                name={serviceData.freelancer.name}
                rating={serviceData.rating}
                reviewCount={serviceData.reviewCount}
                images={headerImages}
              />

              {/* Deskripsi */}
              <section className="bg-white rounded-xl border shadow-sm border-neutral-200">
                <div className="px-4 py-3 text-sm font-semibold border-b border-neutral-200 text-neutral-900">
                  Deskripsi
                </div>
                <div className="px-4 py-4 text-sm leading-6 whitespace-pre-line text-neutral-800">
                  {serviceData.description}
                </div>
              </section>

              {/* Portfolio */}
              <PortfolioGrid
                items={portfolioItems}
                showViewAll={hasMorePortfolio || allPortfolioItems.length > 0}
                onViewAll={() => {
                  // Navigate to freelancer profile to see all portfolio
                  if (serviceData?.freelancer?.id) {
                    navigate(`/freelancer/${serviceData.freelancer.id}`);
                  }
                }}
                onItemClick={(item) => {
                  // Store the index relative to allPortfolioItems for navigation
                  setSelectedPortfolio({ ...item, index: item.index });
                  setShowPortfolioModal(true);
                }}
              />

              {/* About Freelancer */}
              <section>
                <h3 className="mb-3 text-sm font-semibold text-neutral-900">
                  About the Freelancer
                </h3>
                <AboutFreelancerCard
                  avatar={serviceData.freelancer.avatar}
                  name={serviceData.freelancer.name}
                  role={serviceData.freelancer.role}
                  about={serviceData.freelancer.about}
                  projectCompleted={serviceData.freelancer.projectCompleted}
                  onViewProfile={() =>
                    navigate(`/freelancer/${serviceData.freelancer.id}`)
                  }
                />
              </section>
            </div>

            {/* Kolom kanan */}
            <div className="space-y-3 lg:col-span-1">
              <OrderCard
                price={serviceData.price}
                rating={serviceData.rating}
                reviewCount={serviceData.reviewCount}
                completed={serviceData.completed}
                waktu_pengerjaan={serviceData.waktu_pengerjaan}
                batas_revisi={serviceData.batas_revisi}
                onOrder={handleOrderNow}
                onContact={handleContact}
                serviceId={serviceData.id}
                isBookmarked={isBookmarked}
                onBookmarkClick={handleBookmarkClick}
                isClient={isClient}
                isBookmarkLoading={isBookmarkLoading}
              />

              <InteractionBar serviceId={serviceData.id} />

              <ReviewsSection items={reviews} />
            </div>
          </div>
        )}
      </main>

      <Footer />

      {/* Bookmark Toast */}
      <SavedToast
        isOpen={showBookmarkToast}
        onClose={() => setShowBookmarkToast(false)}
        isSaved={isBookmarked}
      />

      {/* Unbookmark Confirmation Modal */}
      <UnsaveConfirmModal
        isOpen={showUnbookmarkModal}
        onClose={() => setShowUnbookmarkModal(false)}
        onConfirm={handleConfirmUnbookmark}
        serviceName={serviceData?.title}
      />

      {showPortfolioModal && selectedPortfolio && (
        <div
          className="flex fixed inset-0 z-50 justify-center items-center p-4 bg-black/75"
          onClick={() => setShowPortfolioModal(false)}
        >
          <div
            className="relative p-6 w-full max-w-4xl bg-white rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              type="button"
              onClick={() => setShowPortfolioModal(false)}
              className="flex absolute top-4 right-4 z-10 justify-center items-center w-10 h-10 bg-gray-100 rounded-full transition-colors text-neutral-600 hover:bg-gray-200"
              aria-label="Close"
            >
              <i className="text-lg fas fa-times"></i>
            </button>

            {/* Image */}
            <img
              src={selectedPortfolio.url}
              alt="Portfolio"
              className="mb-4 w-full max-h-[55vh] rounded-lg object-contain bg-gray-50"
              onError={(e) => {
                e.currentTarget.src =
                  "https://via.placeholder.com/600x400?text=No+Image";
              }}
            />

            {/* Navigation and Counter */}
            <div className="flex justify-between items-center mb-4">
              {/* Previous button */}
              <button
                type="button"
                onClick={() => {
                  const prevIndex = selectedPortfolio.index - 1;
                  if (prevIndex >= 0) {
                    const prevItem = allPortfolioItems[prevIndex];
                    setSelectedPortfolio({
                      ...prevItem,
                      url: prevItem.url,
                      index: prevIndex,
                    });
                  }
                }}
                disabled={selectedPortfolio.index === 0}
                className="flex gap-2 items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                <i className="fas fa-arrow-left"></i>
                <span className="hidden sm:inline">Sebelumnya</span>
              </button>

              {/* Counter */}
              <span className="text-sm font-medium text-gray-600">
                {selectedPortfolio.index + 1} dari {allPortfolioItems.length} portfolio
              </span>

              {/* Next button */}
              <button
                type="button"
                onClick={() => {
                  const nextIndex = selectedPortfolio.index + 1;
                  if (nextIndex < allPortfolioItems.length) {
                    const nextItem = allPortfolioItems[nextIndex];
                    setSelectedPortfolio({
                      ...nextItem,
                      url: nextItem.url,
                      index: nextIndex,
                    });
                  }
                }}
                disabled={selectedPortfolio.index === allPortfolioItems.length - 1}
                className="flex gap-2 items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                <span className="hidden sm:inline">Selanjutnya</span>
                <i className="fas fa-arrow-right"></i>
              </button>
            </div>

            {/* Title and Description */}
            {(selectedPortfolio.judul || selectedPortfolio.deskripsi) && (
              <div className="pt-4 border-t border-gray-200">
                {selectedPortfolio.judul && (
                  <h2 className="text-lg font-semibold text-neutral-900">
                    {selectedPortfolio.judul}
                  </h2>
                )}
                {selectedPortfolio.deskripsi && (
                  <p className="mt-2 text-sm leading-relaxed text-neutral-700">
                    {selectedPortfolio.deskripsi}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
