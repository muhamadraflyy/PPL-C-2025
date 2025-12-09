// Map backend service object to frontend shape expected by cards and detail pages
// Keeps naming consistent: price, category, freelancer, rating, reviews, orders, estimasi, revisi, thumbnail
// Includes media URL normalization for thumbnail/gambar

// Helper to build absolute media URL (align with service list & detail mapping)
const buildMediaUrl = (raw) => {
  const fallback = '/asset/layanan/Layanan.png';

  if (!raw) return fallback;

  const url = String(raw).trim();
  if (!url) return fallback;

  // Already absolute
  if (/^https?:\/\//i.test(url)) return url;

  // FE static asset
  if (url.startsWith('/asset/') || url.startsWith('/assets/')) {
    return url;
  }

  // Backend base URL (strip /api)
  const apiBase = import.meta.env.VITE_API_BASE_URL || '';
  const backendBase = apiBase.replace(/\/api\/?$/, '') || 'http://localhost:5000';

  // Remove leading slash and optional public/ prefix
  const cleanPath = url.replace(/^\/+/, '').replace(/^public\//, '');

  return `${backendBase}/public/${cleanPath}`;
};
export const mapServiceDetailToFrontend = (backendService) => {
  if (!backendService || typeof backendService !== 'object') return null;

  const formatWaktuPengerjaan = (days) => {
    if (!days) return '7-14 hari';
    if (typeof days === 'number') {
      if (days === 1) return '1 hari';
      if (days <= 7) return `${days} hari`;
      if (days <= 14) return `7-14 hari`;
      if (days <= 30) return `${Math.ceil(days / 7)} minggu`;
      return `${Math.ceil(days / 30)} bulan`;
    }
    return days;
  };

  const formatBatasRevisi = (revisi) => {
    if (!revisi) return '2x Revisi';
    if (typeof revisi === 'number') {
      return `${revisi}x Revisi`;
    }
    return revisi;
  };

  const thumbnailRaw =
    backendService.thumbnail ||
    backendService.cover_image ||
    backendService.image ||
    backendService.thumbnail_url ||
    (Array.isArray(backendService.gambar) && backendService.gambar.length
      ? backendService.gambar[0]
      : null);

  const gambarNormalized = Array.isArray(backendService.gambar)
    ? backendService.gambar.map((img) => buildMediaUrl(img))
    : [];

  return {
    id: backendService.id,
    title: backendService.judul || backendService.title || '',
    slug: backendService.slug || '',
    description: backendService.deskripsi || backendService.description || '',
    price: backendService.harga ?? backendService.price ?? 0,
    category: backendService.kategori?.nama_kategori || backendService.category || 'Lainnya',
    freelancer: backendService.freelancer?.nama_lengkap || backendService.freelancer || 'Freelancer',
    rating: backendService.rating_rata_rata ?? backendService.rating ?? 0,
    reviews: backendService.jumlah_rating ?? backendService.jumlah_review ?? backendService.reviews ?? 0,
    orders: backendService.total_pesanan ?? backendService.orders ?? 0,
    estimasi: formatWaktuPengerjaan(backendService.waktu_pengerjaan),
    revisi: formatBatasRevisi(backendService.batas_revisi),
    thumbnail: buildMediaUrl(thumbnailRaw),
    gambar: gambarNormalized,
    // Keep original for reference
    waktu_pengerjaan: backendService.waktu_pengerjaan,
    batas_revisi: backendService.batas_revisi
  };
};