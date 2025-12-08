import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ServicePopularCard from "./ServicePopularCard";

export default function ServicePopularCarousel({
  services = [],
  onServiceClick,
  onFavorite,
  onBookmark,
}) {
  // State untuk pagination
  const [start, setStart] = useState(0);
  const itemsPerPage = 5;

  // Hitung apakah bisa prev/next
  const canPrev = start > 0;
  const canNext = start + itemsPerPage < services.length;

  // Ambil services untuk ditampilkan
  const visibleServices = useMemo(() => {
    if (services.length <= itemsPerPage) return services;
    return services.slice(start, start + itemsPerPage);
  }, [services, start]);

  const handlePrev = () => {
    if (canPrev) {
      setStart((s) => Math.max(0, s - 1));
    }
  };

  const handleNext = () => {
    if (canNext) {
      setStart((s) => Math.min(services.length - itemsPerPage, s + 1));
    }
  };

  // Jika tidak ada services
  if (services.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-slate-500">Belum ada layanan populer</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Left Arrow */}
      {services.length > itemsPerPage && (
        <button
          type="button"
          onClick={handlePrev}
          disabled={!canPrev}
          className="absolute -left-5 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/80 bg-white/90 p-2 shadow-sm transition-all hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Sebelumnya"
        >
          <ChevronLeft className="h-5 w-5 text-[#1e5efe]" />
        </button>
      )}

      {/* Right Arrow */}
      {services.length > itemsPerPage && (
        <button
          type="button"
          onClick={handleNext}
          disabled={!canNext}
          className="absolute -right-5 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/80 bg-white/90 p-2 shadow-sm transition-all hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Berikutnya"
        >
          <ChevronRight className="h-5 w-5 text-[#1e5efe]" />
        </button>
      )}

      {/* Grid 5 kolom (desktop) */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
        {visibleServices.map((service) => (
          <ServicePopularCard
            key={service.id}
            service={service}
            onClick={() => onServiceClick?.(service)}
            onFavorite={onFavorite}
            onBookmark={onBookmark}
          />
        ))}
      </div>

      {/* Pagination Indicator (optional) */}
      {services.length > itemsPerPage && (
        <div className="mt-4 flex items-center justify-center gap-2">
          {Array.from({
            length: Math.ceil(services.length / itemsPerPage),
          }).map((_, index) => {
            const isActive = Math.floor(start / itemsPerPage) === index;
            return (
              <button
                key={index}
                type="button"
                onClick={() => setStart(index * itemsPerPage)}
                className={`h-2 rounded-full transition-all ${
                  isActive
                    ? "w-6 bg-[#1e5efe]"
                    : "w-2 bg-[#1e5efe]/30 hover:bg-[#1e5efe]/50"
                }`}
                aria-label={`Halaman ${index + 1}`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}