import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../../components/Fragments/Common/Navbar";
import ServiceHeaderCard from "../../components/Fragments/Service/ServiceHeaderCard";
import OrderCard from "../../components/Fragments/Service/OrderCard";
import InteractionBar from "../../components/Fragments/Service/InteractionBar";
import ReviewsSection from "../../components/Fragments/Service/ReviewsSection";
import PortfolioGrid from "../../components/Fragments/Profile/PortfolioGrid";
import AboutFreelancerCard from "../../components/Fragments/Profile/AboutFreelancerCard";
import Footer from "../../components/Fragments/Common/Footer";
import { useServiceDetail } from "../../hooks/useServiceDetail";
import NotFoundPage from "./NotFoundPage";

export default function ServiceDetailPage() {
  const { slug } = useParams(); // route: /services/:slug
  const navigate = useNavigate();

  if (!slug || slug === "undefined") {
    return <NotFoundPage />;
  }

  const {
    data: serviceData,
    isLoading,
    isError,
    error,
  } = useServiceDetail(slug);

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

  function handleContact() {
    if (!serviceData) return;
    // Navigate dengan userId untuk create conversation, tapi autoSelect=false agar tidak langsung masuk room
    navigate(`/messages?userId=${serviceData.freelancer.id}&autoSelect=false`);
  }

  // Untuk sekarang ulasan belum diambil dari API → kosong dulu
  const reviews = [];

  // ========================
  // UI: Loading skeleton
  // ========================
  const renderSkeleton = () => (
    <div className="grid grid-cols-1 gap-4 mt-4 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <div className="h-64 rounded-xl bg-neutral-200 animate-pulse" />
        <div className="h-40 rounded-xl bg-neutral-200 animate-pulse" />
        <div className="h-40 rounded-xl bg-neutral-200 animate-pulse" />
      </div>
      <div className="space-y-3 lg:col-span-1">
        <div className="h-64 rounded-xl bg-neutral-200 animate-pulse" />
        <div className="h-12 rounded-xl bg-neutral-200 animate-pulse" />
        <div className="h-40 rounded-xl bg-neutral-200 animate-pulse" />
      </div>
    </div>
  );

  // ========================
  // UI: Error (non-404)
  // ========================
  const renderErrorState = () => (
    <div className="px-4 py-4 mt-6 text-sm text-red-700 border border-red-200 rounded-xl bg-red-50">
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

  // Helper gambar header & portfolio (sudah dinormalisasi di hook)
  const headerImages =
    serviceData &&
    Array.isArray(serviceData.gambar) &&
    serviceData.gambar.length > 0
      ? serviceData.gambar
      : serviceData?.thumbnail
      ? [serviceData.thumbnail]
      : [];

  const portfolioItems = headerImages;

  // ========================
  // Render utama
  // ========================
  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      <Navbar />

      <main className="max-w-6xl px-4 py-5 mx-auto md:py-7">
        {/* Tombol kembali */}
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-2 mb-1 text-xs text-neutral-500 hover:text-neutral-700"
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
              <section className="bg-white border shadow-sm rounded-xl border-neutral-200">
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
                showViewAll
                onViewAll={() => {
                  if (import.meta.env.DEV) {
                    console.log(
                      "[ServiceDetailPage] View all portfolio clicked"
                    );
                  }
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
              />

              <InteractionBar />

              <ReviewsSection items={reviews} />
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
