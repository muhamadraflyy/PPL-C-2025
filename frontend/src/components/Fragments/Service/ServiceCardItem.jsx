import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { authService } from "../../../services/authService";
import { favoriteService } from "../../../services/favoriteService";
import { bookmarkService } from "../../../services/bookmarkService";
import { serviceService } from "../../../services/serviceService";
import FavoriteToast from "../Common/FavoriteToast";
import SavedToast from "../Common/SavedToast";
import UnfavoriteConfirmModal from "../Common/UnfavoriteConfirmModal";
import UnsaveConfirmModal from "../Common/UnsaveConfirmModal";

export default function ServiceCardItem({
  service,
  onClick,
  onFavoriteToggle,
  onBookmarkToggle,
  isCarousel = false,
}) {
  // Make user reactive by tracking it in state
  const [user, setUser] = useState(() => {
    const currentUser = authService.getCurrentUser();
    console.log('[ServiceCardItem INIT] Getting current user:', currentUser);
    return currentUser;
  });
  const isClient = user?.role === "client";

  // Listen to user role changes (custom event from authService)
  useEffect(() => {
    const handleUserRoleChanged = (event) => {
      console.log('[USER ROLE CHANGED EVENT]', event.detail);
      const updatedUser = event.detail?.user || authService.getCurrentUser();
      setUser(updatedUser);
    };

    // Listen to custom event
    window.addEventListener('userRoleChanged', handleUserRoleChanged);

    return () => {
      window.removeEventListener('userRoleChanged', handleUserRoleChanged);
    };
  }, []);

  // Debug logging
  useEffect(() => {
    console.log('==================================');
    console.log('[ServiceCardItem] Component state:', {
      serviceId: service?.id,
      serviceTitle: service?.title,
      userId: user?.id, // ← FIX: use user.id not user.userId
      userRole: user?.role,
      isClient,
      isFavorite,
      favoriteCount
    });
    console.log('==================================');
  });

  const initialBookmarked = Boolean(service?.isSaved || service?.isBookmarked);

  const [isFavorite, setIsFavorite] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(initialBookmarked);
  const [isLoading, setIsLoading] = useState(false);
  const [isBookmarkLoading, setIsBookmarkLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [showBookmarkToast, setShowBookmarkToast] = useState(false);
  const [showUnfavoriteModal, setShowUnfavoriteModal] = useState(false);
  const [showUnbookmarkModal, setShowUnbookmarkModal] = useState(false);
  const [favoriteCount, setFavoriteCount] = useState(service.favoriteCount || 0);
  const [isProcessingFavorite, setIsProcessingFavorite] = useState(false);
  const [isProcessingBookmark, setIsProcessingBookmark] = useState(false);

  // Sync favorite state from server - re-fetch when user or service changes
  useEffect(() => {
    // Skip if no user or not client
    if (!user || !isClient || !service?.id) {
      return;
    }

    let cancelled = false;

    const hydrateFavoriteState = async () => {
      console.log('[FAVORITE SYNC] Fetching favorite status from server for service:', service.id, 'user:', user.id);

      try {
        const res = await favoriteService.isFavorite(service.id);
        if (cancelled) return;

        console.log('[FAVORITE SYNC] Server response:', res);

        if (res?.success && typeof res.data?.isFavorite === "boolean") {
          console.log('[FAVORITE SYNC] Setting isFavorite to:', res.data.isFavorite);
          setIsFavorite(res.data.isFavorite);
        } else {
          setIsFavorite(false);
        }
      } catch (err) {
        console.log('[FAVORITE SYNC] Error:', err);
        setIsFavorite(false);
      }
    };

    hydrateFavoriteState();
    return () => {
      cancelled = true;
    };
  }, [user?.id, isClient, service?.id]);

  // Sync bookmark state from server - re-fetch when user or service changes
  useEffect(() => {
    // Skip if no user or not client
    if (!user || !isClient || !service?.id) {
      return;
    }

    let cancelled = false;

    const hydrateBookmarkState = async () => {
      console.log('[BOOKMARK SYNC] Fetching bookmark status from server for service:', service.id, 'user:', user.id);

      try {
        const res = await bookmarkService.isBookmarked(service.id);
        if (cancelled) return;

        console.log('[BOOKMARK SYNC] Server response:', res);

        if (res?.success && typeof res.data?.isBookmarked === "boolean") {
          console.log('[BOOKMARK SYNC] Setting isBookmarked to:', res.data.isBookmarked);
          setIsBookmarked(res.data.isBookmarked);
        } else {
          setIsBookmarked(false);
        }
      } catch (err) {
        console.log('[BOOKMARK SYNC] Error:', err);
        setIsBookmarked(false);
      }
    };

    hydrateBookmarkState();
    return () => {
      cancelled = true;
    };
  }, [user?.id, isClient, service?.id]);

  // Fetch fresh favoriteCount from backend when user or service changes
  useEffect(() => {
    let cancelled = false;

    const refreshFavoriteCount = async () => {
      if (!service?.id && !service?.slug) return;

      try {
        // Fetch service data to get latest favoriteCount
        const serviceId = service.id || service.slug;
        console.log('[FAVORITE COUNT REFRESH] Fetching count for service:', serviceId, 'user:', user?.id);

        const response = await serviceService.getServiceById(serviceId);

        if (cancelled) return;

        if (response?.success && response?.service) {
          const latestCount = parseInt(response.service.jumlah_favorit || response.service.favoriteCount) || 0;
          console.log('[FAVORITE COUNT REFRESH] ✅ Updated count from', favoriteCount, 'to', latestCount);
          setFavoriteCount(latestCount);
        } else {
          console.log('[FAVORITE COUNT REFRESH] ❌ Failed to get service data');
        }
      } catch (err) {
        console.log('[FAVORITE COUNT REFRESH] Error:', err);
        // Keep current count on error
      }
    };

    refreshFavoriteCount();

    return () => {
      cancelled = true;
    };
  }, [user?.id, service?.id, service?.slug]);

  const handleFavoriteClick = async (e) => {
    e.stopPropagation();
    e.preventDefault();

    const timestamp = new Date().toISOString();
    console.log(`[FAVORITE CLICK @ ${timestamp}] Triggered`, {
      serviceId: service.id,
      currentFavorite: isFavorite,
      currentBookmark: isBookmarked,
      isProcessingFavorite,
      isProcessingBookmark,
      eventTarget: e.target,
      eventCurrentTarget: e.currentTarget
    });

    // Prevent double clicks
    if (isProcessingFavorite) {
      console.log('[FAVORITE CLICK] Blocked - already processing');
      return;
    }

    if (!user || !isClient) {
      console.log('[FAVORITE CLICK] Blocked - not client');
      return; // Silent fail - better UX
    }

    // If unfavoriting, show confirmation modal
    if (isFavorite) {
      console.log('[FAVORITE CLICK] Opening unfavorite modal');
      setShowUnfavoriteModal(true);
      return;
    }

    console.log('[FAVORITE CLICK] Adding to favorites');
    // Adding to favorites (no confirmation needed)
    setIsProcessingFavorite(true);
    setIsLoading(true);

    try {
      // Update UI optimistically
      const oldCount = favoriteCount;
      setIsFavorite(true);
      setFavoriteCount(prev => {
        console.log('[FAVORITE CLICK] Optimistic update: count from', prev, 'to', prev + 1);
        return prev + 1;
      });

      if (onFavoriteToggle) {
        onFavoriteToggle(service.id, true);
      }

      // Show toast notification
      setShowToast(true);

      // Sync to backend
      console.log('[FAVORITE CLICK] Calling backend API...');
      const res = await favoriteService.toggleFavorite(service.id, true);
      console.log('[FAVORITE CLICK] Backend response:', res);

      if (!res?.success) {
        // Revert on failure
        console.log("Backend sync failed:", res?.message);
        setIsFavorite(false);
        setFavoriteCount(prev => Math.max(0, prev - 1));
        if (onFavoriteToggle) {
          onFavoriteToggle(service.id, false);
        }
      } else {
        // Success - wait longer to ensure backend increment completes
        console.log('[FAVORITE CLICK] Waiting 1 second before fetching real count...');
        setTimeout(async () => {
          try {
            console.log('[FAVORITE CLICK] Fetching real count now...');
            const serviceData = await serviceService.getServiceById(service.id);
            if (serviceData?.success && serviceData?.service) {
              const realCount = parseInt(serviceData.service.jumlah_favorit || serviceData.service.favoriteCount) || 0;
              console.log('[FAVORITE CLICK] ✅ Real count from backend:', realCount, '(was optimistic:', favoriteCount, ')');
              setFavoriteCount(realCount);
            } else {
              console.log('[FAVORITE CLICK] ❌ Failed to get service data');
            }
          } catch (err) {
            console.log('[FAVORITE CLICK] ❌ Error fetching real count:', err);
          }
        }, 1000); // 1 second delay
      }
    } catch (error) {
      console.error("Error:", error);
      // Revert on error
      setIsFavorite(false);
      setFavoriteCount(prev => Math.max(0, prev - 1));
      if (onFavoriteToggle) {
        onFavoriteToggle(service.id, false);
      }
    } finally {
      setIsLoading(false);
      setTimeout(() => setIsProcessingFavorite(false), 500);
    }
  };

  const handleConfirmUnfavorite = async () => {
    setShowUnfavoriteModal(false);
    setIsProcessingFavorite(true);
    setIsLoading(true);

    try {
      // Update UI optimistically
      setIsFavorite(false);
      setFavoriteCount(prev => Math.max(0, prev - 1));

      if (onFavoriteToggle) {
        onFavoriteToggle(service.id, false);
      }

      // Show toast notification
      setShowToast(true);

      // Sync to backend
      const res = await favoriteService.toggleFavorite(service.id, false);

      if (!res?.success) {
        // Revert on failure
        console.log("Backend sync failed:", res?.message);
        setIsFavorite(true);
        setFavoriteCount(prev => prev + 1);
        if (onFavoriteToggle) {
          onFavoriteToggle(service.id, true);
        }
      } else {
        // Success - wait a bit then fetch real count from backend
        // Delay untuk ensure backend sudah selesai decrement count
        setTimeout(async () => {
          try {
            const serviceData = await serviceService.getServiceById(service.id);
            if (serviceData?.success && serviceData?.service) {
              const realCount = parseInt(serviceData.service.jumlah_favorit || serviceData.service.favoriteCount) || 0;
              console.log('[UNFAVORITE] Real count from backend:', realCount);
              setFavoriteCount(realCount);
            }
          } catch (err) {
            console.log('[UNFAVORITE] Failed to fetch real count:', err);
          }
        }, 300); // 300ms delay
      }
    } catch (error) {
      console.error("Error:", error);
      // Revert on error
      setIsFavorite(true);
      setFavoriteCount(prev => prev + 1);
      if (onFavoriteToggle) {
        onFavoriteToggle(service.id, true);
      }
    } finally {
      setIsLoading(false);
      setTimeout(() => setIsProcessingFavorite(false), 500);
    }
  };

  const handleBookmarkClick = async (e) => {
    e.stopPropagation();
    e.preventDefault();

    const timestamp = new Date().toISOString();
    console.log(`[BOOKMARK CLICK @ ${timestamp}] Triggered`, {
      serviceId: service.id,
      currentFavorite: isFavorite,
      currentBookmark: isBookmarked,
      isProcessingFavorite,
      isProcessingBookmark,
      eventTarget: e.target,
      eventCurrentTarget: e.currentTarget
    });

    // Prevent double clicks
    if (isProcessingBookmark) {
      console.log('[BOOKMARK CLICK] Blocked - already processing');
      return;
    }

    if (!user || !isClient) {
      console.log('[BOOKMARK CLICK] Blocked - not client');
      return;
    }

    if (isBookmarked) {
      console.log('[BOOKMARK CLICK] Opening unbookmark modal');
      setShowUnbookmarkModal(true);
      return;
    }

    console.log('[BOOKMARK CLICK] Adding to bookmarks');
    setIsProcessingBookmark(true);
    setIsBookmarkLoading(true);

    try {
      setIsBookmarked(true);
      if (onBookmarkToggle) onBookmarkToggle(service.id, true);
      setShowBookmarkToast(true);

      const res = await bookmarkService.addBookmark(service.id);

      // If already bookmarked, keep the UI state (don't revert)
      if (!res?.success) {
        if (res?.message?.includes('sudah ada')) {
          console.log('[BOOKMARK CLICK] Already bookmarked - keeping UI state');
          // Keep isBookmarked = true, don't revert
        } else {
          // Other errors - revert state
          setIsBookmarked(false);
          if (onBookmarkToggle) onBookmarkToggle(service.id, false);
        }
      }
    } catch (error) {
      console.error("[ServiceCardItem] addBookmark error:", error);
      // On network error, revert state
      setIsBookmarked(false);
      if (onBookmarkToggle) onBookmarkToggle(service.id, false);
    } finally {
      setIsBookmarkLoading(false);
      setTimeout(() => setIsProcessingBookmark(false), 500);
    }
  };

  const handleConfirmUnbookmark = async () => {
    setShowUnbookmarkModal(false);
    setIsProcessingBookmark(true);
    setIsBookmarkLoading(true);

    try {
      setIsBookmarked(false);
      if (onBookmarkToggle) onBookmarkToggle(service.id, false);
      setShowBookmarkToast(true);

      const res = await bookmarkService.removeBookmark(service.id);
      if (!res?.success) {
        setIsBookmarked(true);
        if (onBookmarkToggle) onBookmarkToggle(service.id, true);
      }
    } catch (error) {
      console.error("[ServiceCardItem] removeBookmark error:", error);
      setIsBookmarked(true);
      if (onBookmarkToggle) onBookmarkToggle(service.id, true);
    } finally {
      setIsBookmarkLoading(false);
      setTimeout(() => setIsProcessingBookmark(false), 500);
    }
  };

  // Construct full URL for thumbnail - comprehensive fallback support
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
    // (many old files are stored directly in /public/layanan/)
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
      `${baseUrl}/public/${cleanPath}`,              // Most common for old files
      `${baseUrl}/public/uploads/${cleanPath}`,      // Most common for new files
      `${baseUrl}/uploads/${cleanPath}`,             // Alternative structure
      `${baseUrl}/${cleanPath}`,                     // Direct path
    ];
  };

  const thumbnailSrc = getImageUrl(service.thumbnail) || "/asset/layanan/Layanan.png";
  const thumbnailFallbacks = getImageFallbacks(service.thumbnail);

  const freelancerAvatarSrc = getImageUrl(service.freelancerAvatar) || "/asset/default-avatar.png";
  const avatarFallbacks = getImageFallbacks(service.freelancerAvatar);

  const handleCardClick = (e) => {
    // Jangan trigger onClick jika user klik favorite/bookmark button
    if (e.target.closest('button')) {
      console.log('[CARD CLICK] Blocked - clicked on button');
      return;
    }
    console.log('[CARD CLICK] Triggered - navigating to service');
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <>
      <motion.div
        whileHover={{ y: -8 }}
        transition={{ duration: 0.3 }}
        onClick={handleCardClick}
        className={`cursor-pointer group ${
          isCarousel ? "w-full sm:w-80 md:w-[320px] flex-shrink-0" : "w-full h-full"
        }`}
      >
        <div className="bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-neutral-100 h-full flex flex-col min-h-[480px]">
          {/* Image */}
          <div className="relative h-48 overflow-hidden flex-shrink-0">
            <img
              src={thumbnailSrc}
              alt={service.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
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
            {/* Category Badge */}
            <div className="absolute top-3 left-3">
              <span className="px-4 py-1.5 bg-white/95 backdrop-blur-sm rounded-full text-xs font-bold text-neutral-900 shadow-sm">
                {service.category}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="relative p-5 flex-1 flex flex-col">
            {/* Category Label */}
            <div className="mb-2">
              <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                {service.category}
              </span>
            </div>

            {/* Title */}
            <h3 className="font-bold text-xl text-neutral-900 mb-3 leading-tight group-hover:text-[#4782BE] transition-colors whitespace-nowrap overflow-hidden text-ellipsis h-7">
              {service.title}
            </h3>

            {/* Freelancer Info */}
            <div className="flex items-center gap-2 mb-4 h-7 flex-shrink-0">
              <img
                src={freelancerAvatarSrc}
                alt={service.freelancer}
                className="w-7 h-7 rounded-full object-cover border-2 border-neutral-200"
                onError={(e) => {
                  // Try fallback URLs in order
                  const currentSrc = e.target.src;
                  const nextFallback = avatarFallbacks.find(url => url !== currentSrc && !e.target.dataset[url]);
                  if (nextFallback) {
                    e.target.dataset[nextFallback] = 'tried';
                    e.target.src = nextFallback;
                  } else {
                    e.target.src = "/asset/default-avatar.png";
                  }
                }}
              />
              <span className="text-sm font-medium text-neutral-700 truncate">
                {service.freelancer}
              </span>
              <i className="fas fa-star text-yellow-400 text-xs ml-auto" />
              <span className="text-sm font-bold text-neutral-900">
                {service.rating}
              </span>
              <span className="text-xs text-neutral-500">
                ({service.reviews})
              </span>
            </div>

            {/* Price */}
            <div className="mb-4 mt-auto flex-shrink-0">
              <div className="text-xs text-neutral-500 mb-1">Mulai dari</div>
              <div className="text-2xl font-bold text-neutral-900 h-9 flex items-center">
                Rp {service.price.toLocaleString("id-ID")}
              </div>
            </div>

            {/* Favorite & Bookmark Section */}
            <div className="flex items-center justify-between pt-4 border-t border-neutral-100 flex-shrink-0">
              {/* Favorite with count */}
              {isClient ? (
                <button
                  type="button"
                  onClick={handleFavoriteClick}
                  disabled={isLoading}
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <i className="fas fa-spinner fa-spin text-neutral-600 text-2xl pointer-events-none" />
                  ) : (
                    <i
                      className={`${isFavorite ? "fas" : "far"} fa-heart ${
                        isFavorite ? "text-red-500" : "text-neutral-400"
                      } text-2xl pointer-events-none`}
                    />
                  )}
                  <span className="text-base font-semibold text-neutral-700 pointer-events-none">
                    {favoriteCount}
                  </span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <i className="far fa-heart text-neutral-400 text-2xl pointer-events-none" />
                  <span className="text-base font-semibold text-neutral-700 pointer-events-none">
                    {favoriteCount}
                  </span>
                </div>
              )}

              {/* Bookmark */}
              {isClient && (
                <button
                  type="button"
                  onClick={handleBookmarkClick}
                  disabled={isBookmarkLoading}
                  className="flex items-center justify-center hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isBookmarkLoading ? (
                    <i className="fas fa-spinner fa-spin text-neutral-600 text-2xl pointer-events-none" />
                  ) : (
                    <i
                      className={`${isBookmarked ? "fas" : "far"} fa-bookmark ${
                        isBookmarked ? "text-neutral-900" : "text-neutral-400"
                      } text-2xl pointer-events-none`}
                    />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Toast Notifications */}
      <FavoriteToast
        isOpen={showToast}
        onClose={() => setShowToast(false)}
        isFavorite={isFavorite}
      />

      <SavedToast
        isOpen={showBookmarkToast}
        onClose={() => setShowBookmarkToast(false)}
        isSaved={isBookmarked}
      />

      {/* Unfavorite Confirmation Modal */}
      <UnfavoriteConfirmModal
        isOpen={showUnfavoriteModal}
        onClose={() => setShowUnfavoriteModal(false)}
        onConfirm={handleConfirmUnfavorite}
        serviceName={service.title}
      />

      {/* Unbookmark Confirmation Modal */}
      <UnsaveConfirmModal
        isOpen={showUnbookmarkModal}
        onClose={() => setShowUnbookmarkModal(false)}
        onConfirm={handleConfirmUnbookmark}
        serviceName={service.title}
      />
    </>
  );
}
