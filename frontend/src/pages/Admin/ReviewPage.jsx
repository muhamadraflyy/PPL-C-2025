import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Sidebar } from '../../components/Fragments/Admin/Sidebar';
import { Header } from '../../components/Fragments/Admin/Header';
import { ReportListSection } from '../../components/Fragments/Admin/ReportListSection';
import ReportDetailSection from '../../components/Fragments/Admin/ReportDetailSection';
import ReportConfirmationModal from '../../components/Elements/Common/ReportConfirmationModal';
import { reviewService } from '../../services/reviewService';

const ReviewPage = () => {
  const queryClient = useQueryClient();
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [timeFilter, setTimeFilter] = useState('all');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['reportedReviews', timeFilter],
    queryFn: async () => {
      const response = await reviewService.getLatestReviews();
      if (response.status === 'error') throw new Error(response.message);

      const list = response?.data?.items || response?.data || response || [];
      if (!Array.isArray(list)) return [];

      let filteredData = list.filter(item => 
        item.is_reported == 1 || item.is_reported == "1" || item.is_reported === true
      );

      if (timeFilter !== 'all') {
        const now = new Date();
        const daysLimit = parseInt(timeFilter);
        filteredData = filteredData.filter(item => {
          const reportDate = new Date(item.created_at);
          const diffInDays = (now - reportDate) / (1000 * 3600 * 24);
          return diffInDays <= daysLimit;
        });
      }

      return filteredData.map(item => ({
        id: item.id,
        freelancerName: "Freelancer", 
        reason: item.is_reported_reason || 'Laporan Pelanggaran', 
        date: item.created_at ? new Date(item.created_at).toLocaleDateString('id-ID') : '-',
        reviewContent: item.komentar || '(Tidak ada komentar)',
        status: item.is_approved == 1 ? 'reviewed' : 'pending' 
      }));
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => reviewService.deleteReview(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['reportedReviews']);
      setSelectedReportId(null);
      setSuccessMessage("Ulasan telah berhasil dihapus.");
      setShowSuccessModal(true);
    },
    onError: (err) => alert('Gagal menghapus: ' + err.message)
  });

  
  const rejectMutation = {
    isPending: false,
    mutate: () => {
      setSuccessMessage("Fitur 'Tolak Laporan' akan segera hadir.");
      setShowSuccessModal(true);
    }
  };

  const selectedReport = useMemo(() => {
    if (!selectedReportId || reports.length === 0) return null;
    return reports.find(r => r.id === selectedReportId) || null;
  }, [selectedReportId, reports]);

  useEffect(() => {
  }, [reports, selectedReportId]);

  if (isLoading) return (
    <div className="flex h-screen items-center justify-center bg-[#DBE2EF]">
      <div className="text-[#3F72AF] font-bold text-lg animate-pulse">Memuat Laporan</div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#DBE2EF]">
      <Sidebar activeMenu="reviews" />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header title="Tinjauan Laporan" subtitle={`Total: ${reports.length} laporan aktif`} />
        
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="flex gap-4 mb-6">
            {['all', '7', '30'].map((val) => (
              <button 
                key={val}
                onClick={() => setTimeFilter(val)}
                className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${
                  timeFilter === val ? 'bg-[#3F72AF] text-white shadow-md' : 'bg-white text-gray-500 hover:bg-gray-50'
                }`}
              >
                {val === 'all' ? 'Semua Waktu' : `${val} Hari Terakhir`}
              </button>
            ))}
          </div>

          {reports.length > 0 ? (
            <div className="grid grid-cols-12 gap-8 h-full">
              <section className="col-span-7">
                <ReportListSection
                  reports={reports}
                  onSelectReport={(id) => setSelectedReportId(id)}
                  selectedReportId={selectedReportId}
                />
              </section>
              <section className="col-span-5">
                <ReportDetailSection
                  report={selectedReport}
                  isDeleting={deleteMutation.isPending}
                  isRejecting={rejectMutation.isPending} 
                  onDelete={(id) => deleteMutation.mutate(id)}
                  onReject={() => rejectMutation.mutate()}
                />
              </section>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-96 bg-white/40 rounded-3xl border-2 border-dashed border-gray-400">
               <i className="fas fa-check-circle text-5xl text-[#3F72AF] mb-4"></i>
               <p className="text-xl font-bold text-gray-600">Tidak ada laporan</p>
            </div>
          )}
        </main>
      </div>

      <ReportConfirmationModal
        open={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Informasi"
        message={successMessage}
        onConfirm={() => setShowSuccessModal(false)}
        confirmText="Tutup"
        showCancel={false}
        isDestructive={false}
      />
    </div>
  );
};

export default ReviewPage;