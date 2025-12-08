import { motion } from "framer-motion";
import { Heart, Bookmark } from "lucide-react";

export default function ServicePopularCard({
  service,
  onClick,
  onFavorite,
  onBookmark,
}) {
  // Build thumbnail URL
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";
  const thumbnailPath = service?.thumbnail || "/asset/layanan/Layanan.png";
  const thumbnailSrc = thumbnailPath.startsWith("http")
    ? thumbnailPath
    : thumbnailPath.startsWith("/asset")
    ? thumbnailPath
    : `${API_BASE_URL}/public/${thumbnailPath}`;

  // Ambil nama kategori dan judul layanan
  const highlightLine = service?.nama_kategori || "Kategori";
  const titleLine = service?.judul || "Layanan";

  const freelancerName = service?.freelancer_name || service?.freelancer || "Freelancer";
  const price = Number(service?.harga ?? 0);
  const rating = Number(service?.rating_rata_rata ?? 0);
  const reviews = Number(service?.jumlah_rating ?? 0);

  const handleCardClick = (e) => {
    // Jangan trigger onClick jika user klik button favorite/bookmark
    if (e.target.closest('button[aria-label*="favorit"], button[aria-label*="bookmark"]')) {
      return;
    }
    onClick?.();
  };

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ duration: 0.25 }}
      onClick={handleCardClick}
      className="group h-full w-full cursor-pointer text-left"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      aria-label={`Buka layanan: ${titleLine}`}
    >
      <div className="flex h-full flex-col overflow-hidden rounded-[22px] bg-white shadow-[0_16px_40px_rgba(15,23,42,0.08)] transition-shadow duration-300 group-hover:shadow-[0_22px_55px_rgba(15,23,42,0.12)]">
        {/* IMAGE */}
        <div className="relative h-44 w-full overflow-hidden bg-neutral-100">
          <img
            src={thumbnailSrc}
            alt={titleLine}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            onError={(e) => {
              e.target.src = "/asset/layanan/Layanan.png";
            }}
          />
          {/* badge kiri atas */}
          <div className="absolute left-3 top-3">
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-800 shadow-[0_4px_12px_rgba(15,23,42,0.16)]">
              {highlightLine}
            </span>
          </div>
        </div>

        {/* CONTENT */}
        <div className="flex flex-1 flex-col px-4 pb-4 pt-3">
          <h3 className="text-sm font-semibold leading-snug text-[#2563EB] line-clamp-1 group-hover:underline">
            {highlightLine}
          </h3>

          <p className="mt-1 text-sm font-semibold leading-snug text-slate-900 line-clamp-2">
            {titleLine}
          </p>

          {/* freelancer (kiri) + rating (kanan) */}
          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-slate-200">
                <span className="text-[10px] font-semibold text-slate-600">
                  {freelancerName.slice(0, 1).toUpperCase()}
                </span>
              </div>
              <span className="truncate text-xs text-slate-600">{freelancerName}</span>
            </div>

            {rating > 0 && (
              <div className="flex items-center gap-1 text-xs whitespace-nowrap">
                <i className="fas fa-star text-[#FBBF24]" aria-hidden="true" />
                <span className="font-semibold text-slate-900">{rating.toFixed(1)}</span>
                <span className="text-slate-500">({reviews.toLocaleString("id-ID")})</span>
              </div>
            )}
          </div>

          {/* harga (kiri) + love/bookmark (kanan) */}
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
                onClick={(e) => {
                  e.stopPropagation();
                  onFavorite?.(service);
                }}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-white hover:bg-neutral-50 transition-colors"
                aria-label="Tambah ke favorit"
              >
                <Heart className="h-5 w-5 text-slate-700" />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onBookmark?.(service);
                }}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-white hover:bg-neutral-50 transition-colors"
                aria-label="Simpan (bookmark)"
              >
                <Bookmark className="h-5 w-5 text-slate-700" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}