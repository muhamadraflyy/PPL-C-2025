import React, { useState, useEffect } from "react";
import Button from "../../Elements/Buttons/Button";
import DetailItem from "./DetailItem";
import ReportConfirmationModal from '../../Elements/Common/ReportConfirmationModal';

export function ReportDetailSection({ report, onReject, onDelete, isDeleting, isRejecting }) {
  const [reviewContent, setReviewContent] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successData, setSuccessData] = useState({ title: "", message: "" });

  useEffect(() => {
    if (report) {
      setReviewContent(report.reviewContent || "");
    }
  }, [report]);

  if (!report) {
  return (
    <div className="p-6 bg-white rounded-xl shadow-lg h-full flex flex-col items-center justify-center border-2 border-dashed border-gray-200">
      <div className="bg-gray-100 p-4 rounded-full mb-4">
        <i className="fas fa-mouse-pointer text-2xl text-gray-400"></i>
      </div>
      <p className="text-gray-400 font-medium text-center">
        Pilih laporan di sebelah kiri untuk melihat rincian keterangan
      </p>
    </div>
  );
}

  const handleConfirmReject = async () => {
  await onReject(report.id); 
  setShowRejectModal(false);
};

  const handleConfirmDelete = async () => {
    await onDelete(report.id);
    setShowDeleteModal(false);
    setSuccessData({
      title: "Terima Kasih",
      message: "Ulasan telah berhasil dihapus"
    });
    setShowSuccessModal(true);
  };

  return (
    <>
      <div className="p-6 bg-white rounded-xl shadow-lg h-full flex flex-col">
        <h3 className="text-xl font-bold mb-6 text-[#112D4E]">
          Rincian Keterangan Laporan
        </h3>

        <div className="space-y-4 flex-grow">
          <DetailItem label="Nama Freelancer" value={report.freelancerName} />
          <DetailItem label="Tanggal Pelaporan" value={report.date} />
          <DetailItem label="Alasan Laporan" value={report.reason} />

          <div className="mb-6">
            <p className="text-sm font-semibold text-gray-500 mb-1">Isi Review Terlapor</p>
            <textarea
              className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#3F72AF] resize-none"
              rows={5}
              readOnly
              value={reviewContent}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t mt-auto">
          <Button
            variant="secondary"
            onClick={() => setShowRejectModal(true)}
            className="bg-[#3F72AF] text-white hover:bg-[#4a82c4] border-none"
          >
            Tolak Laporan
          </Button>

          <Button
            variant="primary"
            onClick={() => setShowDeleteModal(true)}
            className="bg-[#FF0000] hover:bg-red-700 text-white border-none shadow-md"
          >
            Hapus Review
          </Button>
        </div>
      </div>

      
      <ReportConfirmationModal
        open={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        title="Konfirmasi Penolakan"
        message="Apakah Anda yakin laporan ini akan ditolak?"
        onConfirm={handleConfirmReject}
        isDestructive={false}
        isLoading={isRejecting} 
      />

      
      <ReportConfirmationModal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Konfirmasi Penghapusan"
        message={`Apakah Anda yakin ingin menghapus ulasan dari ${report.freelancerName}?`}
        onConfirm={handleConfirmDelete}
        isDestructive={true}
        isLoading={isDeleting} 
      />


<ReportConfirmationModal
  open={showSuccessModal}
  onClose={() => setShowSuccessModal(false)}
  title={successData.title}
  message={successData.message}
  onConfirm={() => setShowSuccessModal(false)} 
  confirmText="Tutup"     
  showCancel={false}       
  isDestructive={false}    
/>
    </>
  );
}

export default ReportDetailSection;