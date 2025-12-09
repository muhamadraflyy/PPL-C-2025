import React, { useState, useEffect } from 'react';
import { Heart, ShoppingCart, FileText } from 'lucide-react';
import { Sidebar } from '../../components/Fragments/Admin/Sidebar';
import { Header } from '../../components/Fragments/Admin/Header';
import { StatsGrid } from '../../components/Fragments/Profile/StatsGrid';
import { RecommendationChart } from '../../components/Fragments/Admin/RecommendationChart';
import { RecommendationTable } from '../../components/Fragments/Admin/RecommendationTable';
import { adminService } from '../../services/adminService';

export default function RecommendationMonitoringPage() {
  const [stats, setStats] = useState([]);
  const [favoriteData, setFavoriteData] = useState([]);
  const [transactionData, setTransactionData] = useState([]);
  const [topServices, setTopServices] = useState([]);
  const [topFavoriteServices, setTopFavoriteServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeFilter, setTimeFilter] = useState('minggu_ini');

  useEffect(() => {
    fetchRecommendationData();
  }, [timeFilter]);

  const fetchRecommendationData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('[RecommendationMonitoring] Fetching data with timeRange:', timeFilter);

      // Fetch recommendation monitoring data
      const response = await adminService.getRecommendationMonitoring({ timeRange: timeFilter });

      console.log('[RecommendationMonitoring] Response:', response);
      console.log('[RecommendationMonitoring] Response status:', response?.status);
      console.log('[RecommendationMonitoring] Response success:', response?.success);

      if (!response.success) {
        const errorMsg = response.message || response.error || 'Failed to fetch recommendation data';
        console.error('[RecommendationMonitoring] Error:', errorMsg);
        throw new Error(errorMsg);
      }

      const data = response.data;
      console.log('[RecommendationMonitoring] Data received:', data);

      // Transform data ke format stats cards
      const transformedStats = [
        {
          title: "Total rekomendasi",
          value: data.totalRecommendations?.toLocaleString('id-ID') || "0",
          icon: <FileText size={30} />,
          bgColor: "bg-white"
        },
        {
          title: "Jumlah Favorit",
          value: data.totalFavorites?.toLocaleString('id-ID') || "0",
          icon: <Heart size={30} />,
          bgColor: "bg-white"
        },
        {
          title: "Total Transaksi",
          value: data.totalTransactions?.toLocaleString('id-ID') || "0",
          icon: <ShoppingCart size={30} />,
          bgColor: "bg-white"
        }
      ];

      setStats(transformedStats);
      setFavoriteData(data.favoriteChart || []);
      setTransactionData(data.transactionChart || []);
      setTopServices(data.topRecommendedServices || []);
      setTopFavoriteServices(data.topFavoriteDetails || []);

      setLoading(false);
    } catch (err) {
      console.error('[RecommendationMonitoring] Full error:', err);
      console.error('[RecommendationMonitoring] Error message:', err.message);
      console.error('[RecommendationMonitoring] Error response:', err.response);

      // Set default empty data jika error
      setStats([
        { title: "Total rekomendasi", value: "0", icon: <FileText size={30} />, bgColor: "bg-white" },
        { title: "Jumlah Favorit", value: "0", icon: <Heart size={30} />, bgColor: "bg-white" },
        { title: "Total Transaksi", value: "0", icon: <ShoppingCart size={30} />, bgColor: "bg-white" }
      ]);
      setFavoriteData([]);
      setTransactionData([]);
      setTopServices([]);
      setTopFavoriteServices([]);

      setError(err.message || 'Terjadi kesalahan saat memuat data rekomendasi.');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#DBE2EF]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#4782BE] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data rekomendasi...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#DBE2EF]">
        <div className="text-center max-w-md">
          <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg mb-4">
            <p className="font-bold text-lg mb-2">Gagal memuat data rekomendasi.</p>
            <p className="text-sm">{error}</p>
          </div>
          <button
            onClick={fetchRecommendationData}
            className="bg-[#4782BE] text-white px-6 py-2 rounded-lg hover:bg-[#1D375B] transition-all"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#DBE2EF]">
      <Sidebar activeMenu="recommendations" />
      <div className="flex-1 overflow-auto">
        <Header />
        <div className="p-6 bg-[#DBE2EF]">
          {/* Page Title - Direct on background */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-[#1D375B] mb-1">Rekomendasi</h1>
            <p className="text-sm text-gray-500">Mengelola model, memantau performa, dan mengevaluasi efektivitas rekomendasi.</p>
          </div>

          {/* Dashboard Title with Filter - Clean design */}
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-[#1D375B]">Dashboard Monitoring</h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Periode</span>
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4782BE] text-sm text-gray-700 cursor-pointer hover:border-[#4782BE] transition-all shadow-sm"
              >
                <option value="minggu_ini">Minggu ini</option>
                <option value="bulan_ini">Bulan ini</option>
                <option value="tahun_ini">Tahun ini</option>
              </select>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold text-[#1D375B]">{stat.value}</p>
                </div>
                <div className="text-[#4782BE] bg-[#E8F4FD] p-3 rounded-lg">
                  {stat.icon}
                </div>
              </div>
            ))}
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
            <RecommendationChart
              title="Jumlah Favorit"
              data={favoriteData}
              dataKey="count"
              color="#4782BE"
            />
            <RecommendationChart
              title="Total Transaksi"
              data={transactionData}
              dataKey="count"
              color="#4782BE"
            />
          </div>

          {/* Tables Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
            <RecommendationTable
              title="Detail Favorit Terakhir"
              headers={["Pengguna", "Jml Favorit", "Jasa"]}
              data={topFavoriteServices}
              type="favorite"
            />
            <RecommendationTable
              title="Detail Transaksi Terakhir"
              headers={["Pengguna", "Jml Transaksi", "Jasa"]}
              data={topFavoriteServices}
              type="transaction"
            />
          </div>

          {/* Top 10 Services Table */}
          <div className="mt-4">
            <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-100">
              <h3 className="text-base font-bold text-[#1D375B] mb-4">Top 10 layanan yang paling direkomendasikan</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Pengguna</th>
                      <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Rekomendasi</th>
                      <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Persentase</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topServices && topServices.length > 0 ? (
                      topServices.map((service, index) => (
                        <tr key={index} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                          <td className="py-3 px-3 text-sm text-gray-900">{index + 1}. {service.freelancerName}</td>
                          <td className="py-3 px-3 text-sm font-medium text-gray-700">{service.recommendationCount?.toLocaleString('id-ID')}</td>
                          <td className="py-3 px-3 text-sm text-gray-600">{service.percentage}%</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="py-8 text-center text-sm text-gray-400">
                          Tidak ada data
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
