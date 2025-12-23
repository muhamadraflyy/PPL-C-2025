import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Heart, Bookmark } from "lucide-react";
import { favoriteService } from "../../../services/favoriteService";
import { bookmarkService } from "../../../services/bookmarkService";
import { authService } from "../../../services/authService";

export default function SearchServiceCardItem({
  service,
  onClick,
  onFavoriteToggle,
  onBookmarkToggle,
}) {
  // Auth state
  const [user] = useState(() => authService.getCurrentUser());
  const isClient = user?.role === "client";

  // Favorite/Bookmark state
  const [isFavorite, setIsFavorite] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loadingFavorite, setLoadingFavorite] = useState(false);
  const [loadingBookmark, setLoadingBookmark] = useState(false);

  // Check initial favorite/bookmark status
  useEffect(() => {
    if (!isClient || !service?.id) return;

    const checkStatus = async () => {
      try {
        // Check favorite status
        const favRes = await favoriteService.isFavorite(service.id);
        if (favRes?.success && favRes?.data?.isFavorite) {
          setIsFavorite(true);
        }

        // Check bookmark status
        const bookRes = await bookmarkService.isBookmarked(service.id);
        if (bookRes?.success && bookRes?.data?.isBookmarked) {
          setIsBookmarked(true);
        }
      } catch (e) {
        console.log("[SearchServiceCardItem] Status check error:", e);
      }
    };

    checkStatus();
  }, [isClient, service?.id]);

  // Construct full URL for images - comprehensive fallback support
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

    // For relative paths like "layanan/xxx.jpg", try /public/layanan/ first
    return `${baseUrl}/public/${imagePath}`;
  };

  // Comprehensive fallback URLs for images with different path formats
  const getImageFallbacks = (imagePath) => {
    if (!imagePath || imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return [];
    }
    const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/api$/, '') || 'http://localhost:5000';
    const cleanPath = imagePath.replace(/^\/+/, ''); // Remove leading slashes

    // Try all possible path combinations
    return [
      `${baseUrl}/public/${cleanPath}`,
      `${baseUrl}/public/uploads/${cleanPath}`,
      `${baseUrl}/uploads/${cleanPath}`,
      `${baseUrl}/${cleanPath}`,
    ];
  };

  const thumbnailSrc = getImageUrl(service?.thumbnail) || "/asset/layanan/Layanan.png";
  const thumbnailFallbacks = getImageFallbacks(service?.thumbnail);

  const freelancerAvatarSrc = getImageUrl(service?.freelancerAvatar);
  const avatarFallbacks = getImageFallbacks(service?.freelancerAvatar);

  // Data mapping
  const badgeLabel = service?.category || service?.nama_kategori || "Website";
  const categoryLine = service?.highlight || service?.category || "UI/UX Desainer";
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

  // Handler: Toggle Favorite
  const handleFavorite = async (e) => {
    e.stopPropagation();

    if (!isClient) {
      console.log("[SearchServiceCardItem] User is not client, cannot favorite");
      return;
    }

    if (loadingFavorite) return;
    setLoadingFavorite(true);

    try {
      if (isFavorite) {
        // Remove favorite
        const res = await favoriteService.removeFavorite(service?.id);
        if (res?.success) {
          setIsFavorite(false);
          if (typeof onFavoriteToggle === "function") onFavoriteToggle(service?.id, false);
        }
      } else {
        // Add favorite
        const res = await favoriteService.addFavorite(service?.id);
        if (res?.success) {
          setIsFavorite(true);
          if (typeof onFavoriteToggle === "function") onFavoriteToggle(service?.id, true);
        }
      }
    } catch (err) {
      console.error("[SearchServiceCardItem] Favorite error:", err);
    } finally {
      setLoadingFavorite(false);
    }
  };

  // Handler: Toggle Bookmark
  const handleBookmark = async (e) => {
    e.stopPropagation();

    if (!isClient) {
      console.log("[SearchServiceCardItem] User is not client, cannot bookmark");
      return;
    }

    if (loadingBookmark) return;
    setLoadingBookmark(true);

    try {
      if (isBookmarked) {
        // Remove bookmark
        const res = await bookmarkService.removeBookmark(service?.id);
        if (res?.success) {
          setIsBookmarked(false);
          if (typeof onBookmarkToggle === "function") onBookmarkToggle(service?.id, false);
        }
      } else {
        // Add bookmark
        const res = await bookmarkService.addBookmark(service?.id);
        if (res?.success) {
          setIsBookmarked(true);
          if (typeof onBookmarkToggle === "function") onBookmarkToggle(service?.id, true);
        }
      }
    } catch (err) {
      console.error("[SearchServiceCardItem] Bookmark error:", err);
    } finally {
      setLoadingBookmark(false);
    }
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
      <div className="flex h-full flex-col overflow-hidden rounded-[22px] border border-[#E5E7EB] bg-white shadow-[0_4px_20px_rgba(0,0,0,0.06)] transition-all duration-300 group-hover:shadow-[0_12px_40px_rgba(0,0,0,0.12)] group-hover:border-[#3B82F6]/30">
        {/* === IMAGE BLOCK === */}
        <div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-neutral-100 to-neutral-50">
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

          {/* Badge kategori (kiri atas) - sesuai desain */}
          <div className="absolute left-3 top-3">
            <span className="rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-slate-800 shadow-md">
              {badgeLabel}
            </span>
          </div>
        </div>

        {/* === CONTENT === */}
        <div className="flex flex-1 flex-col px-5 pb-5 pt-4">
          {/* Kategori biru - sesuai desain */}
          <h3 className="text-[15px] font-bold leading-snug text-[#3B82F6]">
            {categoryLine}
          </h3>

          {/* Title hitam - max 2 line */}
          <p className="mt-1.5 text-[15px] font-bold leading-snug text-slate-900 line-clamp-2">
            {titleLine}
          </p>

          {/* Freelancer row: avatar + name + rating */}
          <div className="mt-4 flex items-center gap-2">
            {/* Avatar */}
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-blue-100 to-blue-200 ring-2 ring-white">
              {freelancerAvatarSrc ? (
                <img
                  src={freelancerAvatarSrc}
                  alt={freelancerName || "Freelancer"}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    const currentSrc = e.target.src;
                    const nextFallback = avatarFallbacks.find(url => url !== currentSrc && !e.target.dataset[url]);
                    if (nextFallback) {
                      e.target.dataset[nextFallback] = 'tried';
                      e.target.src = nextFallback;
                    } else {
                      e.target.style.display = 'none';
                    }
                  }}
                />
              ) : (
                <span className="text-xs font-bold text-blue-600">
                  {(freelancerName || "U").slice(0, 1).toUpperCase()}
                </span>
              )}
            </div>

            {/* Name */}
            <span className="truncate text-sm font-medium text-slate-700">
              {freelancerName || "Freelancer"}
            </span>

            {/* Rating */}
            <div className="ml-auto flex items-center gap-1 text-sm">
              <i className="fas fa-star text-[#FBBF24]" aria-hidden="true" />
              <span className="font-bold text-slate-900">{rating.toFixed(1)}</span>
              <span className="text-slate-500">({reviews.toLocaleString("id-ID")})</span>
            </div>
          </div>

          {/* Price row + favorite/bookmark icons */}
          <div className="mt-4 flex items-end justify-between">
            <div>
              <p className="text-xs text-slate-500">Mulai dari</p>
              <p className="text-lg font-bold text-[#3B82F6]">
                Rp {price.toLocaleString("id-ID")}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Favorite button (Heart) */}
              <button
                type="button"
                onClick={handleFavorite}
                disabled={loadingFavorite || !isClient}
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-200 ${isFavorite
                    ? "border-red-400 bg-red-50 text-red-500"
                    : "border-neutral-200 bg-white text-slate-600 hover:border-red-300 hover:bg-red-50 hover:text-red-500"
                  } ${loadingFavorite ? "opacity-50" : ""} ${!isClient ? "cursor-not-allowed opacity-40" : ""}`}
                aria-label={isFavorite ? "Hapus dari favorit" : "Tambah ke favorit"}
              >
                <Heart
                  className={`h-5 w-5 ${isFavorite ? "fill-current" : ""}`}
                />
              </button>

              {/* Bookmark button */}
              <button
                type="button"
                onClick={handleBookmark}
                disabled={loadingBookmark || !isClient}
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-200 ${isBookmarked
                    ? "border-slate-800 bg-slate-800 text-white"
                    : "border-neutral-200 bg-white text-slate-600 hover:border-slate-400 hover:bg-slate-100"
                  } ${loadingBookmark ? "opacity-50" : ""} ${!isClient ? "cursor-not-allowed opacity-40" : ""}`}
                aria-label={isBookmarked ? "Hapus dari bookmark" : "Simpan ke bookmark"}
              >
                <Bookmark
                  className={`h-5 w-5 ${isBookmarked ? "fill-current" : ""}`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.button>
  );
}
