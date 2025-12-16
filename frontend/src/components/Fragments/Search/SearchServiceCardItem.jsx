import { motion } from "framer-motion";
import { Heart, Bookmark } from "lucide-react";

export default function SearchServiceCardItem({
  service,
  onClick,
  onFavoriteToggle,
  onBookmarkToggle,
}) {
  // Construct full URL for images - try multiple fallback paths
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    // If already a full URL, return as is
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }

    const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/api$/, '') || 'http://localhost:5000';

    // If path starts with /uploads/, prepend /public
    if (imagePath.startsWith('/uploads/')) {
      return `${baseUrl}/public${imagePath}`;
    }

    // If path already starts with /public/, just prepend base URL
    if (imagePath.startsWith('/public/')) {
      return `${baseUrl}${imagePath}`;
    }

    // If path starts with /, prepend base URL
    if (imagePath.startsWith('/')) {
      return `${baseUrl}${imagePath}`;
    }

    // Otherwise, assume it's a relative path like "layanan/xxx.jpg"
    // Try /public/uploads/ first (most common for new uploads)
    return `${baseUrl}/public/uploads/${imagePath}`;
  };

  // Fallback URLs for images with different path formats
  const getImageFallbacks = (imagePath) => {
    if (!imagePath || imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return [];
    }
    const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/api$/, '') || 'http://localhost:5000';
    const cleanPath = imagePath.replace(/^\/+/, ''); // Remove leading slashes

    return [
      `${baseUrl}/public/uploads/${cleanPath}`,
      `${baseUrl}/public/${cleanPath}`,
      `${baseUrl}/uploads/${cleanPath}`,
      `${baseUrl}/${cleanPath}`,
    ];
  };

  const thumbnailSrc = getImageUrl(service?.thumbnail) || "/asset/layanan/Layanan.png";
  const thumbnailFallbacks = getImageFallbacks(service?.thumbnail);

  const freelancerAvatarSrc = getImageUrl(service?.freelancerAvatar);
  const avatarFallbacks = getImageFallbacks(service?.freelancerAvatar);

  // Figma mapping (yang kamu minta): baris 1 = highlight (biru), baris 2 = title (hitam)
  const highlightLine = service?.highlight || service?.category || "Website";
  const titleLine =
    service?.title ||
    service?.subtitle ||
    "Pembuatan Website Company Profile Modern & Profesional";

  const freelancerName =
    service?.freelancer ||
    service?.freelancer_name ||
    [service?.nama_depan, service?.nama_belakang].filter(Boolean).join(" ");

  const price = Number(service?.price ?? service?.harga ?? 0);
  const rating = Number(service?.rating ?? service?.rating_rata_rata ?? 0);
  const reviews = Number(service?.reviews ?? service?.jumlah_rating ?? 0);

  const handleFavorite = (e) => {
    e.stopPropagation();
    if (typeof onFavoriteToggle === "function") onFavoriteToggle(service?.id);
  };

  const handleBookmark = (e) => {
    e.stopPropagation();
    if (typeof onBookmarkToggle === "function") onBookmarkToggle(service?.id);
  };

  return (
    <motion.button
      type="button"
      whileHover={{ y: -6 }}
      transition={{ duration: 0.25 }}
      onClick={onClick}
      className="group h-full w-full cursor-pointer text-left"
      aria-label={`Buka layanan: ${titleLine}`}
    >
      <div className="flex h-full flex-col overflow-hidden rounded-[22px] bg-white shadow-[0_16px_40px_rgba(15,23,42,0.08)] transition-shadow duration-300 group-hover:shadow-[0_22px_55px_rgba(15,23,42,0.12)]">
        {/* === IMAGE BLOCK === */}
        <div className="relative h-44 w-full overflow-hidden bg-neutral-100">
          <img
            src={thumbnailSrc}
            alt={titleLine}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            onError={(e) => {
              // Try fallback URLs in order
              const currentSrc = e.target.src;
              const nextFallback = thumbnailFallbacks.find(url => url !== currentSrc && !e.target.dataset[url]);
              if (nextFallback) {
                e.target.dataset[nextFallback] = 'tried';
                e.target.src = nextFallback;
              } else {
                e.target.src = "/asset/layanan/Layanan.png";
              }
            }}
          />

          {/* Badge kategori (kiri atas) */}
          <div className="absolute left-3 top-3">
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-800 shadow-[0_4px_12px_rgba(15,23,42,0.16)]">
              {highlightLine}
            </span>
          </div>
        </div>

        {/* === CONTENT === */}
        <div className="flex flex-1 flex-col px-4 pb-4 pt-3">
          {/* Baris 1 (biru) + Baris 2 (hitam) */}
          <h3 className="text-sm font-semibold leading-snug text-[#2563EB] line-clamp-1 group-hover:underline">
            {highlightLine}
          </h3>

          <p className="mt-1 text-sm font-semibold leading-snug text-slate-900 line-clamp-2">
            {titleLine}
          </p>

          {/* Baris: freelancer (kiri) + rating (kanan) */}
          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-slate-200">
                {freelancerAvatarSrc ? (
                  <img
                    src={freelancerAvatarSrc}
                    alt={freelancerName || "Freelancer"}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      // Try fallback URLs in order
                      const currentSrc = e.target.src;
                      const nextFallback = avatarFallbacks.find(url => url !== currentSrc && !e.target.dataset[url]);
                      if (nextFallback) {
                        e.target.dataset[nextFallback] = 'tried';
                        e.target.src = nextFallback;
                      } else {
                        // If all fallbacks fail, hide image and show initial
                        e.target.style.display = 'none';
                      }
                    }}
                  />
                ) : (
                  <span className="text-[10px] font-semibold text-slate-600">
                    {(freelancerName || "U").slice(0, 1).toUpperCase()}
                  </span>
                )}
              </div>
              <span className="truncate text-xs text-slate-600">
                {freelancerName || "Freelancer"}
              </span>
            </div>

            <div className="flex items-center gap-1 text-xs whitespace-nowrap">
              <i className="fas fa-star text-[#FBBF24]" aria-hidden="true" />
              <span className="font-semibold text-slate-900">{rating}</span>
              <span className="text-slate-500">({reviews.toLocaleString("id-ID")})</span>
            </div>
          </div>

          {/* Baris harga (kiri) + icon love & bookmark (kanan) */}
          <div className="mt-3 flex items-end justify-between gap-3">
            <div>
              <p className="text-[11px] text-slate-500">Mulai dari</p>
              <p className="text-sm font-bold text-[#2563EB]">
                Rp {price.toLocaleString("id-ID")}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleFavorite}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-white hover:bg-neutral-50"
                aria-label="Tambah ke favorit"
              >
                <Heart className="h-5 w-5 text-slate-700" />
              </button>

              <button
                type="button"
                onClick={handleBookmark}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-white hover:bg-neutral-50"
                aria-label="Simpan (bookmark)"
              >
                <Bookmark className="h-5 w-5 text-slate-700" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.button>
  );
}
