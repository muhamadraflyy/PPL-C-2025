import { useEffect, useMemo, useState } from "react";
import api from "../utils/axiosConfig";

export function useUserIdentity() {
  const [state, setState] = useState({
    firstName: "",
    lastName: "",
    email: "",
    avatarUrl: "",
    role: "",
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const token =
          typeof window !== "undefined" ? localStorage.getItem("token") : null;

        if (token) {
          try {
            const response = await api.get("/users/profile");
            if (response.data?.success && response.data?.data && !cancelled) {
              const profile = response.data.data;
              
              // Construct avatar URL from server
              let avatarUrl = null;
              if (profile.avatar) {
                const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/api$/, '') || 'http://localhost:5000';
                avatarUrl = `${baseUrl}${profile.avatar}`;
              }
              
              setState({
                firstName: profile.nama_depan || "",
                lastName: profile.nama_belakang || "",
                email: profile.email || "",
                avatarUrl: avatarUrl || null, // null will show initial in Avatar component
                role: profile.role || "",
                loading: false,
              });
              return;
            }
          } catch (error) {
            console.error('API Error:', error);
          }
        }

        const user =
          typeof window !== "undefined"
            ? JSON.parse(localStorage.getItem("user") || "null")
            : null;

        setState({
          firstName: user?.nama_depan || "",
          lastName: user?.nama_belakang || "",
          email: user?.email || "",
          avatarUrl: user?.avatar || null,
          role: user?.role || "",
          loading: false,
        });
      } catch {
        setState((prev) => ({ ...prev, loading: false }));
      }
    }

    load();
    
    // Reload when window gains focus (user returns from profile edit)
    const handleFocus = () => {
      load();
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      cancelled = true;
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const fullName = useMemo(() => {
    const f = (state.firstName || "").trim();
    const l = (state.lastName || "").trim();
    return [f, l].filter(Boolean).join(" ") || "User";
  }, [state.firstName, state.lastName]);

  return {
    loading: state.loading,
    fullName,
    email: state.email,
    avatarUrl: state.avatarUrl,
    role: state.role,
  };
}

// Default export for backward compatibility
export default useUserIdentity;
