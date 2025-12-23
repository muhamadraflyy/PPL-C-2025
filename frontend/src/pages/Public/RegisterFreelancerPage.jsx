import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/Elements/Buttons/Button";
import { validateName } from "../../utils/validators";
import LoadingOverlay from "../../components/Fragments/Common/LoadingOverlay";
import { useToast } from "../../components/Fragments/Common/ToastProvider";
import { authService } from "../../services/authService";

export default function RegisterFreelancerPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    nama_lengkap: "",
    gelar: "",
    no_telepon: "",
    deskripsi: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.show("Silakan login terlebih dahulu", "info");
      navigate("/login", { replace: true });
      return;
    }

    let cancelled = false;

    const verifyFreelancerProfile = async () => {
      try {
        const profile = await authService.getProfile();
        if (!cancelled && profile.success && profile.data?.freelancerProfile) {
          toast.show("Anda sudah terdaftar sebagai freelancer", "info");
          navigate("/dashboard", { replace: true });
        }
      } catch (err) {
        console.error("Failed to verify freelancer profile", err);
      }
    };

    verifyFreelancerProfile();
    return () => {
      cancelled = true;
    };
  }, [navigate, toast]);

  const onChange = (e) => {
    const { name, value } = e.target;
    
    // Validasi khusus untuk nomor telepon - hanya angka yang diizinkan
    if (name === 'no_telepon') {
      // Hanya izinkan angka (0-9)
      const numericValue = value.replace(/[^0-9]/g, '');
      setForm((s) => ({ ...s, [name]: numericValue }));
      
      // Validasi realtime untuk nomor telepon
      if (value !== numericValue && value !== '') {
        setErrors((prev) => ({ 
          ...prev, 
          [name]: "Nomor telepon hanya boleh berisi angka" 
        }));
      } else if (errors[name]) {
        setErrors((prev) => ({ ...prev, [name]: null }));
      }
    } else {
      setForm((s) => ({ ...s, [name]: value }));
      if (errors[name]) {
        setErrors((prev) => ({ ...prev, [name]: null }));
      }
    }
  };

  const handleNextStep = () => {
    if (step === 1) {
      const newErrors = {
        nama_lengkap: validateName(form.nama_lengkap, "Nama lengkap"),
        gelar: form.gelar.trim() ? null : "Gelar wajib diisi",
        no_telepon: validatePhoneNumber(form.no_telepon),
      };
      
      setErrors(newErrors);
      if (Object.values(newErrors).some(Boolean)) return;
      
      setErrors({});
      setStep(2);
    }
  };

  const handleBackStep = () => {
    if (step === 2) {
      setErrors({}); // Clear any errors when going back
      setStep(1);
    }
  };

  // Fungsi validasi nomor telepon
  const validatePhoneNumber = (phone) => {
    if (!phone.trim()) {
      return "Nomor telepon wajib diisi";
    }
    
    // Cek apakah hanya berisi angka
    if (!/^[0-9]+$/.test(phone)) {
      return "Nomor telepon hanya boleh berisi angka";
    }
    
    // Cek panjang minimal (opsional - sesuaikan dengan kebutuhan)
    if (phone.length < 10) {
      return "Nomor telepon minimal 10 digit";
    }
    
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.deskripsi.trim()) {
      setErrors({ deskripsi: "Deskripsi wajib diisi" });
      return;
    }

    setLoading(true);

    try {
      const result = await authService.createFreelancerProfile({
        nama_lengkap: form.nama_lengkap,
        gelar: form.gelar,
        no_telepon: form.no_telepon,
        deskripsi: form.deskripsi,
      });

      if (result.success) {
        toast.show("Profil freelancer berhasil dibuat!", "success");
        authService.setActiveRole("freelancer");
        navigate("/dashboard", { replace: true });
      } else {
        toast.show(result.message || "Gagal membuat profil freelancer", "error");
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Gagal membuat profil freelancer";
      toast.show(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col lg:flex-row overflow-hidden">
      <LoadingOverlay show={loading} text="Membuat profile..." />
      
      {/* Left Section - Form */}
      <div className="flex-1 bg-white flex flex-col h-full lg:h-screen overflow-y-auto">
        {/* Logo */}
        <div className="flex-shrink-0 p-4 sm:p-6 lg:p-8">
          <img src="/assets/logo.png" alt="Skill Connect Logo" className="h-10 sm:h-12 lg:h-14 w-auto object-contain" />
        </div>

        {/* Form Content */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-4 lg:py-0">
          <div className="w-full max-w-md">
            {step === 1 ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 lg:p-8 shadow-sm">
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-1.5 sm:mb-2">
                  Buat Profil Pekerja Lepas Anda
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6">
                  Berikan informasi dasar untuk membangun kredibilitas Anda
                </p>

                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <label htmlFor="nama_lengkap" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                      Nama Lengkap
                    </label>
                    <input
                      type="text"
                      id="nama_lengkap"
                      name="nama_lengkap"
                      value={form.nama_lengkap}
                      onChange={onChange}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm"
                    />
                    {errors.nama_lengkap && (
                      <p className="text-red-500 text-xs sm:text-sm mt-1 sm:mt-2">{errors.nama_lengkap}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="gelar" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                      Gelar
                    </label>
                    <input
                      type="text"
                      id="gelar"
                      name="gelar"
                      value={form.gelar}
                      onChange={onChange}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm"
                    />
                    {errors.gelar && (
                      <p className="text-red-500 text-xs sm:text-sm mt-1 sm:mt-2">{errors.gelar}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="no_telepon" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                      Nomor Telepon
                    </label>
                    <input
                      type="tel"
                      id="no_telepon"
                      name="no_telepon"
                      value={form.no_telepon}
                      onChange={onChange}
                      onBlur={(e) => {
                        const phoneError = validatePhoneNumber(e.target.value);
                        if (phoneError) {
                          setErrors((prev) => ({ ...prev, no_telepon: phoneError }));
                        }
                      }}
                      placeholder="Contoh: 08123456789"
                      className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent text-xs sm:text-sm ${
                        errors.no_telepon 
                          ? 'border-red-300 focus:ring-red-500' 
                          : 'border-gray-300 focus:ring-blue-500'
                      }`}
                    />
                    {errors.no_telepon && (
                      <p className="text-red-500 text-xs sm:text-sm mt-1 sm:mt-2">{errors.no_telepon}</p>
                    )}
                  </div>

                  <Button
                    type="button"
                    variant="neutral"
                    onClick={handleNextStep}
                    className="w-full"
                  >
                    Simpan dan Lanjut
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 lg:p-8 shadow-sm">
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-1.5 sm:mb-2 text-center">
                  Jelaskan diri Anda agar klien mengenal Anda lebih baik.
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6 text-center leading-relaxed">
                  Bagikan riwayat pekerjaan Anda seperti pengalaman kerja, latar belakang pendidikan, dan sertifikasi apa pun yang pernah Anda peroleh.
                </p>

                <form onSubmit={handleSubmit}>
                  <div className="mb-4 sm:mb-6">
                    <label htmlFor="deskripsi" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                      Deskripsi
                    </label>
                    <textarea
                      id="deskripsi"
                      name="deskripsi"
                      value={form.deskripsi}
                      onChange={onChange}
                      placeholder="Gunakan ruang ini untuk menunjukkan kepada klien bahwa Anda memiliki keterampilan dan pengalaman yang mereka cari."
                      rows={5}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm resize-none"
                    />
                    {errors.deskripsi && (
                      <p className="text-red-500 text-xs sm:text-sm mt-1 sm:mt-2">{errors.deskripsi}</p>
                    )}
                  </div>

                  <div className="space-y-3 sm:space-y-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleBackStep}
                      className="w-full"
                    >
                      Kembali
                    </Button>
                    
                    <Button
                      type="submit"
                      variant="neutral"
                      disabled={loading}
                      className="w-full"
                    >
                      {loading ? "Memproses..." : "Simpan dan Lanjut"}
                    </Button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Section - Illustration */}
      <div className="hidden lg:flex lg:flex-1 lg:h-screen items-center justify-center overflow-hidden">
        <img 
          src="/assets/handshake.png" 
          alt="Handshake Illustration" 
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  );
}
