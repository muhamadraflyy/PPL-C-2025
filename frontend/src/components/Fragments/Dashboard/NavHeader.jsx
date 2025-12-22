import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import SearchBar from "../Search/SearchBar";
import Button from "../../Elements/Buttons/Button";
import Avatar from "../../Elements/Common/Avatar";
import ConfirmModal from "../../Elements/Common/ConfirmModal";
import useUserIdentity from "../../../hooks/useUserIdentity";
import { authService } from "../../../services/authService";
import { useToast } from "../Common/ToastProvider";
import NotificationBell from "../Common/NotificationBell";

const ROLE_HOME = {
  client: "/dashboard",
  freelancer: "/dashboard",
};

function ProfileDropdown({ name, email, avatarUrl, role, hasFreelancerProfile, onProfile, onDashboard, onFavorites, onBookmarks, onOrders, onSwitchRole, onRegisterFreelancer, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative z-10">
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex items-center gap-2 sm:gap-3 rounded-2xl px-1.5 sm:px-2 py-1 hover:bg-neutral-100" aria-haspopup="menu" aria-expanded={open}>
        <Avatar src={avatarUrl} alt={name} size="sm" />
        <div className="hidden md:flex flex-col items-start leading-tight text-left min-w-0">
          <span className="text-sm font-semibold text-neutral-900 truncate max-w-[120px]">{name}</span>
          <span className="text-[11px] text-neutral-500 truncate max-w-[120px]">{email}</span>
        </div>
        <svg className={`h-4 w-4 text-neutral-600 transition flex-shrink-0 ${open ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <div role="menu" className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-xl min-w-[280px]">
          {/* Header dengan Role Badge */}
          <div className="px-4 py-3 border-b border-neutral-200 bg-neutral-50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-neutral-500 uppercase">Role Aktif</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                role === "freelancer" 
                  ? "bg-[#E8F4FD] text-[#1D375B]" 
                  : "bg-green-100 text-green-700"
              }`}>
                {role === "freelancer" ? "👨‍💼 Freelancer" : "👤 Klien"}
              </span>
            </div>
          </div>

          <button type="button" role="menuitem" onClick={onProfile} className="w-full px-4 py-2.5 text-left text-sm hover:bg-neutral-50 transition-colors">
            Profile
          </button>
          <button type="button" role="menuitem" onClick={onDashboard} className="w-full px-4 py-2.5 text-left text-sm hover:bg-neutral-50 transition-colors">
            Dashboard
          </button>
          
          {/* Section Ganti Role */}
          {hasFreelancerProfile && (
            <>
              <div className="my-1 h-px bg-neutral-200" />
              <div className="px-4 py-2">
                <div className="text-xs font-semibold text-neutral-500 uppercase mb-2">Ganti Role</div>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => onSwitchRole("client")}
                  className={`w-full px-3 py-2.5 text-left text-sm rounded-md transition-colors flex items-center justify-between ${
                    role === "client" 
                      ? "bg-[#E8F4FD] text-[#1D375B] font-medium border border-[#9DBBDD]" 
                      : "hover:bg-neutral-50 border border-transparent"
                  }`}
                >
                  <span className="truncate">Sebagai Klien</span>
                  {role === "client" && (
                    <svg className="w-4 h-4 flex-shrink-0 ml-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => onSwitchRole("freelancer")}
                  className={`w-full px-3 py-2.5 text-left text-sm rounded-md transition-colors flex items-center justify-between mt-1.5 ${
                    role === "freelancer" 
                      ? "bg-[#E8F4FD] text-[#1D375B] font-medium border border-[#9DBBDD]" 
                      : "hover:bg-neutral-50 border border-transparent"
                  }`}
                >
                  <span className="truncate">Sebagai Freelancer</span>
                  {role === "freelancer" && (
                    <svg className="w-4 h-4 flex-shrink-0 ml-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              </div>
            </>
          )}
          
          {/* Tombol untuk user yang belum punya profil freelancer tapi ingin daftar */}
          {!hasFreelancerProfile && role === "client" && (
            <>
              <div className="my-1 h-px bg-neutral-200" />
              <button
                type="button"
                role="menuitem"
                onClick={onRegisterFreelancer}
                className="w-full px-4 py-2.5 text-left text-sm text-[#1D375B] hover:bg-[#E8F4FD] font-medium transition-colors"
              >
                <span className="truncate">Daftar sebagai Freelancer →</span>
              </button>
            </>
          )}
          {role === "client" && (
            <>
              <div className="my-1 h-px bg-neutral-200" />
              <button type="button" role="menuitem" onClick={onBookmarks} className="w-full px-4 py-2.5 text-left text-sm hover:bg-neutral-50 transition-colors">
                <i className="far fa-bookmark mr-2 text-gray-500"></i>
                Disimpan
              </button>
              <button type="button" role="menuitem" onClick={onFavorites} className="w-full px-4 py-2.5 text-left text-sm hover:bg-neutral-50 transition-colors">
                <i className="far fa-heart mr-2 text-gray-500"></i>
                Favorit
              </button>
              <button type="button" role="menuitem" onClick={onOrders} className="w-full px-4 py-2.5 text-left text-sm hover:bg-neutral-50 transition-colors">
                <i className="far fa-clock mr-2 text-gray-500"></i>
                <span className="truncate">Riwayat Pesanan</span>
              </button>
            </>
          )}
          <div className="my-1 h-px bg-neutral-200" />
          <button type="button" role="menuitem" onClick={onLogout} className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 transition-colors">
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

export default function NavHeader() {
  const navigate = useNavigate();
  const toast = useToast();
  const { loading, fullName, email, avatarUrl } = useUserIdentity();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [hasFreelancerProfile, setHasFreelancerProfile] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
    try {
      const activeRole = authService.getActiveRole();
      setUserRole(activeRole);
    } catch (e) {
      console.error("Failed to read active role", e);
    }

    // Check for pending toast message after reload
    const pendingMessage = sessionStorage.getItem('roleChangeMessage');
    if (pendingMessage) {
      try {
        const { message, type } = JSON.parse(pendingMessage);
        // Show toast after a short delay to ensure page is fully loaded
        setTimeout(() => {
          toast.show(message, type);
        }, 500);
        // Clear the message
        sessionStorage.removeItem('roleChangeMessage');
      } catch (e) {
        console.error('Error showing pending toast:', e);
      }
    }
  }, [toast]);

  // Cek apakah user memiliki profil freelancer
  useEffect(() => {
    if (isLoggedIn) {
      const checkFreelancerProfile = async () => {
        try {
          const profile = await authService.getProfile();
          if (profile.success && profile.data?.freelancerProfile) {
            setHasFreelancerProfile(!!profile.data.freelancerProfile);
          }
        } catch (error) {
          console.error("Failed to check freelancer profile", error);
        }
      };
      checkFreelancerProfile();
    }
  }, [isLoggedIn]);

  const handleLogin = () => navigate("/login");
  const handleRegister = () => navigate("/register/client");
  const handleRegisterFreelancer = () => navigate("/register/freelancer");
  const handleProfile = () => navigate("/profile");
  const handleDashboard = () => navigate("/dashboard");
  const handleFavorites = () => navigate("/favorit");
  const handleBookmarks = () => navigate("/bookmarks");
  const handleOrders = () => navigate("/orders");
  const handleSwitchRole = async (newRole) => {
    if (newRole === userRole) return; // Sudah pada role ini

    try {
      const result = await authService.switchRole(newRole);
      if (result.success) {
        if (result.data?.needsFreelancerRegistration) {
          toast.show(result.data.message || "Lengkapi profil freelancer terlebih dahulu", "info");
          navigate("/register/freelancer");
          return;
        }

        const updatedRole = result.data?.role || newRole;
        setUserRole(updatedRole);
        
        // Save toast message to sessionStorage to show after reload
        sessionStorage.setItem('roleChangeMessage', JSON.stringify({
          message: `Role berhasil diubah menjadi ${updatedRole === "client" ? "Klien" : "Freelancer"}`,
          type: 'success'
        }));

        // Force full page reload to ensure all components refresh with new role
        const destination = ROLE_HOME[updatedRole] || "/";
        window.location.href = destination;
      } else {
        toast.show(result.message || "Gagal mengubah role", "error");
      }
    } catch (error) {
      toast.show("Gagal mengubah role", "error");
    }
  };


  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const performLogout = async () => {
    try {
      await authService.logout();
      setIsLoggedIn(false);
      toast.show("Anda telah logout", "success");
      navigate("/login", { replace: true });
    } catch (error) {
      // Walaupun request API gagal, authService.logout tetap menghapus data di local storage
      toast.show("Logout gagal, tetapi sesi lokal dihapus", "warning");
      navigate("/login", { replace: true });
    } finally {
      setShowLogoutModal(false);
    }
  };

  return (
    <>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-2 sm:px-4">
        {/* Left side - Logo and Mobile Search */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0">
            <a href="/" className="flex items-center" aria-label="Ke beranda">
              <img src="/assets/logo.png" alt="SkillConnect Logo" className="h-10 sm:h-12 w-auto object-contain" />
            </a>
          </div>

          {/* Mobile search toggle - di sebelah kiri */}
          <button type="button" onClick={() => setMobileSearchOpen((v) => !v)} className="flex sm:hidden rounded-full p-1.5 hover:bg-neutral-100 flex-shrink-0" aria-label="Buka pencarian">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
              <path d="M21 21l-4.35-4.35m1.35-5.65a7 7 0 11-14 0 7 7 0 0114 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Center - Search Bar (Desktop only) */}
        <div className="hidden sm:flex flex-1 justify-center px-4 max-w-2xl">
          <SearchBar />
        </div>

        {/* Right side - Profile and buttons (always at the right edge) */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {loading ? (
            <div className="h-9 sm:h-10 w-20 sm:w-24 animate-pulse rounded-full bg-neutral-200" />
          ) : isLoggedIn ? (
            <>
              {/* Bookmark button - only for client */}
              {userRole === "client" && (
                <button
                  onClick={handleBookmarks}
                  className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-100 transition-colors"
                  title="Lihat Bookmark"
                >
                  <i className="far fa-bookmark text-lg" />
                  <span className="hidden lg:inline">Disimpan</span>
                </button>
              )}
              {!hasFreelancerProfile && (
                <Button
                  onClick={handleRegisterFreelancer}
                  variant="outline"
                  className="hidden sm:flex text-xs sm:text-sm md:text-base px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 md:py-2.5 whitespace-nowrap shadow-md hover:shadow-lg transition-all bg-[#E8F4FD] border-[#9DBBDD] text-[#1D375B] hover:bg-[#D8E3F3] hover:border-[#4782BE]"
                >
                  Daftar Freelancer
                </Button>
              )}
              
              {/* Messages/Chat Button */}
              <button
                onClick={() => navigate('/messages')}
                className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
                title="Messages"
                aria-label="Open messages"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </button>
              
              <NotificationBell />
              <ProfileDropdown
                name={fullName}
                email={email}
                avatarUrl={avatarUrl}
                role={userRole}
                hasFreelancerProfile={hasFreelancerProfile}
                onProfile={handleProfile}
                onDashboard={handleDashboard}
                onFavorites={handleFavorites}
                onBookmarks={handleBookmarks}
                onOrders={handleOrders}
                onSwitchRole={handleSwitchRole}
                onRegisterFreelancer={handleRegisterFreelancer}
                onLogout={() => setShowLogoutModal(true)}
              />
            </>
          ) : (
            <>
              <button onClick={handleLogin} className="text-sm sm:text-base text-neutral-900 hover:text-neutral-700 underline font-medium whitespace-nowrap transition-colors">
                Masuk
              </button>
              <Button
                onClick={handleRegister}
                variant="outline"
                className="text-xs sm:text-sm md:text-base px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 md:py-2.5 whitespace-nowrap shadow-md hover:shadow-lg transition-all bg-[#E8F4FD] border-[#9DBBDD] text-[#1D375B] hover:bg-[#D8E3F3] hover:border-[#4782BE]"
              >
                Daftar
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Mobile search slide-down */}
      {mobileSearchOpen && (
        <div className="sm:hidden border-t border-neutral-200 px-3 pb-3 pt-2">
          <SearchBar />
        </div>
      )}

      <ConfirmModal
        open={showLogoutModal}
        title="Konfirmasi Logout"
        message="Anda akan keluar dari akun. Apakah Anda yakin ingin melanjutkan?"
        onConfirm={performLogout}
        onCancel={() => setShowLogoutModal(false)}
        confirmText="Ya, keluar"
        cancelText="Batal"
      />
    </>
  );
}
