import { useState, useEffect } from "react";
import { Heart, Share2, Check } from "lucide-react";
import { favoriteService } from "../../../services/favoriteService";
import { authService } from "../../../services/authService";

export default function InteractionBar({ serviceId }) {
  // Auth state
  const [user] = useState(() => authService.getCurrentUser());
  const isClient = user?.role === "client";

  // Favorite state
  const [isFavorite, setIsFavorite] = useState(false);
  const [loadingFavorite, setLoadingFavorite] = useState(false);

  // Share state
  const [showCopied, setShowCopied] = useState(false);

  // Check initial favorite status
  useEffect(() => {
    if (!isClient || !serviceId) return;

    const checkStatus = async () => {
      try {
        const res = await favoriteService.isFavorite(serviceId);
        if (res?.success && res?.data?.isFavorite) {
          setIsFavorite(true);
        }
      } catch (e) {
        console.log("[InteractionBar] Status check error:", e);
      }
    };

    checkStatus();
  }, [isClient, serviceId]);

  // Handle favorite toggle
  const handleFavorite = async () => {
    if (!isClient) {
      console.log("[InteractionBar] User is not client, cannot favorite");
      return;
    }

    if (!serviceId || loadingFavorite) return;
    setLoadingFavorite(true);

    try {
      if (isFavorite) {
        // Remove favorite
        const res = await favoriteService.removeFavorite(serviceId);
        if (res?.success) {
          setIsFavorite(false);
        }
      } else {
        // Add favorite
        const res = await favoriteService.addFavorite(serviceId);
        if (res?.success) {
          setIsFavorite(true);
        }
      }
    } catch (err) {
      console.error("[InteractionBar] Favorite error:", err);
    } finally {
      setLoadingFavorite(false);
    }
  };

  // Handle share with feedback
  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";

    try {
      // Try Web Share API first (mobile)
      if (navigator.share) {
        await navigator.share({
          title: document.title,
          url: url,
        });
      } else {
        // Fallback to clipboard
        await navigator.clipboard?.writeText(url);
        setShowCopied(true);
        setTimeout(() => setShowCopied(false), 2000);
      }
    } catch (err) {
      // If share was cancelled or failed, try clipboard
      if (err.name !== "AbortError") {
        try {
          await navigator.clipboard?.writeText(url);
          setShowCopied(true);
          setTimeout(() => setShowCopied(false), 2000);
        } catch {
          console.error("[InteractionBar] Copy failed:", err);
        }
      }
    }
  };

  return (
    <div className="mt-3 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 flex items-center justify-between">
      {/* Favorite */}
      <button
        type="button"
        onClick={handleFavorite}
        disabled={loadingFavorite || !isClient}
        className={`inline-flex items-center gap-2 text-sm font-medium transition ${isFavorite ? "text-red-500" : "text-neutral-900"
          } ${loadingFavorite ? "opacity-50" : ""} ${!isClient ? "opacity-40 cursor-not-allowed" : "hover:text-red-500"}`}
      >
        <Heart
          className={`w-5 h-5 transition-all ${isFavorite
              ? "text-red-500 fill-red-500"
              : "text-neutral-700 fill-transparent"
            }`}
        />
        <span>{isFavorite ? "Favorited" : "Favorite"}</span>
      </button>

      {/* Share */}
      <button
        type="button"
        onClick={handleShare}
        className="inline-flex items-center gap-2 text-sm font-medium text-neutral-900 hover:text-[#3B82F6] transition"
      >
        {showCopied ? (
          <>
            <Check className="w-5 h-5 text-green-500" />
            <span className="text-green-600">Link tersalin!</span>
          </>
        ) : (
          <>
            <Share2 className="w-5 h-5" />
            <span>Share</span>
          </>
        )}
      </button>
    </div>
  );
}
