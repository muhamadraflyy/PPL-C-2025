import { useState, useEffect } from 'react';
import { useToast } from '../../components/Fragments/Common/ToastProvider';
import { Sidebar } from '../../components/Fragments/Admin/Sidebar';
import { Header } from '../../components/Fragments/Admin/Header';

const PlatformSettingsPage = () => {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [configs, setConfigs] = useState([]);
  const [platformFee, setPlatformFee] = useState('5.0');
  const [gatewayFee, setGatewayFee] = useState('2.5');

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api'}/platform-config/category/payment`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const data = await response.json();

      if (data.success) {
        setConfigs(data.data);

        // Set values
        const platformFeeConfig = data.data.find(c => c.config_key === 'platform_fee_percentage');
        const gatewayFeeConfig = data.data.find(c => c.config_key === 'payment_gateway_fee_percentage');

        if (platformFeeConfig) setPlatformFee(platformFeeConfig.config_value);
        if (gatewayFeeConfig) setGatewayFee(gatewayFeeConfig.config_value);
      } else {
        toast.show('Gagal memuat konfigurasi', 'error');
      }
    } catch (error) {
      console.error('Error fetching configs:', error);
      toast.show('Terjadi kesalahan saat memuat data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      // Validate
      const feeValue = parseFloat(platformFee);
      if (isNaN(feeValue) || feeValue < 0 || feeValue > 100) {
        toast.show('Biaya operasional harus antara 0-100%', 'error');
        return;
      }

      setSaving(true);
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api'}/platform-config/platform_fee_percentage`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ value: feeValue })
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.show('Biaya operasional berhasil diperbarui', 'success');
        fetchConfigs(); // Reload configs
      } else {
        toast.show(data.message || 'Gagal menyimpan perubahan', 'error');
      }
    } catch (error) {
      console.error('Error saving config:', error);
      toast.show('Terjadi kesalahan saat menyimpan', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-[#DBE2EF]">
        <Sidebar activeMenu="platform-settings" />
        <div className="flex-1 overflow-auto">
          <Header />
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-[#4782BE] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Memuat konfigurasi...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#DBE2EF]">
      <Sidebar activeMenu="platform-settings" />
      <div className="flex-1 overflow-auto">
        <Header />
        <div className="p-6">
          <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Pengaturan Platform
          </h1>
          <p className="text-gray-600">
            Kelola biaya operasional dan konfigurasi payment gateway
          </p>
        </div>

        {/* Settings Card */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Platform Fee Section */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-1">
                  Biaya Operasional Platform
                </h2>
                <p className="text-sm text-gray-600">
                  Persentase biaya yang dikenakan untuk setiap transaksi
                </p>
              </div>
              <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                Dapat Diubah
              </span>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Persentase Biaya (%)
              </label>
              <div className="flex items-center space-x-4">
                <div className="relative flex-1 max-w-xs">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={platformFee}
                    onChange={(e) => setPlatformFee(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                    placeholder="5.0"
                  />
                  <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg">
                    %
                  </span>
                </div>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-save mr-2"></i>
                      Simpan
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Contoh: Jika biaya operasional 5%, maka untuk transaksi Rp 100.000 akan dikenakan biaya Rp 5.000
              </p>
            </div>
          </div>

          {/* Gateway Fee Section (Locked) */}
          <div className="p-6 bg-gray-50">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-1 flex items-center">
                  Biaya Payment Gateway
                  <i className="fas fa-lock ml-2 text-gray-400 text-sm"></i>
                </h2>
                <p className="text-sm text-gray-600">
                  Biaya yang dikenakan oleh payment gateway (tidak dapat diubah)
                </p>
              </div>
              <span className="px-3 py-1 bg-gray-200 text-gray-700 text-xs font-semibold rounded-full">
                Terkunci
              </span>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Persentase Biaya (%)
              </label>
              <div className="relative max-w-xs">
                <input
                  type="text"
                  value={gatewayFee}
                  disabled
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 text-lg cursor-not-allowed"
                />
                <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg">
                  %
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Biaya gateway 2.5% sudah ditetapkan dan tidak dapat diubah
              </p>
            </div>
          </div>

          {/* Info Section */}
          <div className="p-6 bg-blue-50 border-t border-blue-100">
            <div className="flex items-start space-x-3">
              <i className="fas fa-info-circle text-blue-600 mt-1"></i>
              <div>
                <h3 className="text-sm font-semibold text-blue-900 mb-1">
                  Informasi Total Biaya
                </h3>
                <p className="text-sm text-blue-800">
                  Total biaya yang dikenakan kepada client = <strong>Biaya Operasional Platform ({platformFee}%) + Biaya Payment Gateway (2.5%)</strong>
                </p>
                <p className="text-sm text-blue-800 mt-1">
                  Total: <strong>{(parseFloat(platformFee) + 2.5).toFixed(1)}%</strong>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Calculation Example */}
        <div className="mt-6 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Contoh Perhitungan
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-200">
              <span className="text-gray-700">Harga Layanan</span>
              <span className="font-semibold text-gray-900">Rp 100.000</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-200">
              <span className="text-gray-700">Biaya Operasional ({platformFee}%)</span>
              <span className="font-semibold text-gray-900">
                Rp {(100000 * parseFloat(platformFee) / 100).toLocaleString('id-ID')}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-200">
              <span className="text-gray-700">Biaya Gateway (2.5%)</span>
              <span className="font-semibold text-gray-900">Rp 2.500</span>
            </div>
            <div className="flex justify-between items-center py-3 bg-blue-50 px-4 rounded-lg">
              <span className="text-lg font-bold text-gray-900">Total yang Dibayar Client</span>
              <span className="text-lg font-bold text-blue-600">
                Rp {(100000 + (100000 * parseFloat(platformFee) / 100) + 2500).toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
    </div>
  );
};

export default PlatformSettingsPage;
