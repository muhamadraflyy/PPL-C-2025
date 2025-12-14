import React, { useState, useEffect } from "react";
import Button from "../../Elements/Buttons/Button";
import DetailItem from "./DetailItem";

import ReportConfirmationModal from '../../Elements/Common/ReportConfirmationModal';


export function ReportDetailSection({ report, onReject, onDelete, onSave }) {
 const [reviewContent, setReviewContent] = useState("");
 const [showRejectModal, setShowRejectModal] = useState(false);
 const [showDeleteModal, setShowDeleteModal] = useState(false);

 useEffect(() => {
   if (report) {
     setReviewContent(report.reviewContent || "");
   }
 }, [report]);

 if (!report) {
   return (
     <div className="p-6 bg-white rounded-xl shadow-lg h-full flex items-center justify-center">
       <p className="text-gray-500">
         Pilih laporan di sebelah kiri untuk melihat rincian.
       </p>
     </div>
   );
 }

 const handleConfirmReject = () => {
   onReject(report.id);
   setShowRejectModal(false);
 };

 const handleConfirmDelete = () => {
   onDelete(report.id);
   setShowDeleteModal(false);
 };

 return (
   <>
     <div className="p-6 bg-white rounded-xl shadow-lg h-full">
       <h3 className="text-xl font-bold mb-6 text-gray-800">
         Rincian Keterangan Laporan
       </h3>

       <DetailItem label="Nama Freelancer" value={report.freelancerName} />
       <DetailItem label="Tanggal Pelaporan" value={report.date} />
       <DetailItem label="Alasan Laporan" value={report.reason} />

       <div className="mb-6">
         <p className="text-sm font-semibold text-gray-500 mb-1">Isi Review</p>
         <textarea
           className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#3F72AF]"
           rows={5}
           placeholder="Tuliskan isi review di sini..."
           value={reviewContent}
           onChange={(e) => setReviewContent(e.target.value)}
         />
       </div>

       <div className="flex justify-end space-x-3 pt-4 border-t mt-4">
         <Button
           variant="primary"
           onClick={() => setShowRejectModal(true)}
           className="bg-[#3F72AF]"
         >
           Tolak Laporan
         </Button>

         <Button
           variant="primary"
           onClick={() => setShowDeleteModal(true)}
           className="bg-[#FF0000] hover:bg-red-600"
         >
           Hapus Review
         </Button>
       </div>
     </div>

     {/* ======================================= */}
     {}
     {/* ======================================= */}
     <ReportConfirmationModal
       open={showRejectModal}
       onClose={() => setShowRejectModal(false)}
       title="Konfirmasi Penolakan"
       message="Apakah anda yakin laporan akan di tolak?"
       onConfirm={handleConfirmReject}
       isDestructive={false}
     />

     {/* ======================================= */}
     {}
     {/* ======================================= */}
     <ReportConfirmationModal
       open={showDeleteModal}
       onClose={() => setShowDeleteModal(false)}
       title="Konfirmasi Penghapusan"
       message="Apakah anda yakin laporan akan di hapus?"
       onConfirm={handleConfirmDelete}
       isDestructive={true}
     />
   </>
 );
}

export default ReportDetailSection;