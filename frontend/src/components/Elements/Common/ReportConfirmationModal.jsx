import React from "react";
import Modal from "../../Elements/Common/Modal";
import Button from "../../Elements/Buttons/Button";

export default function ReportConfirmationModal({
 open,
 onClose,
 title,
 message,
 onConfirm,
 isDestructive = false,
 isLoading = false,
}) {
 return (
   <Modal open={open} onClose={onClose}>
     <div className="p-8 text-center">
       
       <h3 className="text-xl font-bold text-gray-800 mb-6">{title}</h3>
       <p className="text-lg text-gray-700 mb-8 font-medium">{message}</p>

       {/* Tombol Aksi */}
       <div className="flex justify-center space-x-6">
         {/* Tombol Yakin (Confirm) */}
         <button
           onClick={onConfirm}
           disabled={isLoading}
           className={`
             px-8 py-3 rounded-lg text-lg font-medium transition-colors w-32
             ${isLoading
               ? 'bg-gray-300 text-gray-500 cursor-not-allowed'               : isDestructive
                 ? 'bg-red-500 text-white hover:bg-red-600'
                 : 'bg-[#3F72AF] text-white hover:bg-[#325c8f]'
             }
           `}
         >
           {isLoading ? "Memproses..." : "Yakin"}
         </button>

         {/* Tombol Tidak (Cancel) */}
         <button
           onClick={onClose}
           disabled={isLoading}
           className="px-8 py-3 rounded-lg text-lg font-medium transition-colors bg-gray-200 text-gray-700 hover:bg-gray-300 w-32"
         >
           Tidak
         </button>
       </div>
     </div>
   </Modal>
 );
}
