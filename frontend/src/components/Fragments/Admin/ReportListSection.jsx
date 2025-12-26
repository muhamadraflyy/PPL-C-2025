import React from 'react';
import Input from '../../Elements/Inputs/Input';
import ReportTable from './ReportTable';

export function ReportListSection({ reports, onSelectReport, selectedReportId }){
 
 const dummyReports = [
   { id: 1, freelancerName: 'Kamala .P', reason: 'Penilaian bersifat spam', date: '21 Okt 2025', reviewContent: 'Client banyak bicara dan terlalu banyak nanya untuk hal detail' },
   { id: 2, freelancerName: 'Buddy', reason: 'Penilaian menyebarkan informasi pribadi', date: '21 Okt 2025', reviewContent: 'Dia menulis alamat rumah saya di komentar publik.' },
   { id: 3, freelancerName: 'Chris', reason: 'Penilaian menyesatkan atau berisi informasi palsu', date: '21 Okt 2025', reviewContent: 'Semua klaim dia tentang kecepatan kerjanya bohong besar.' },
   { id: 4, freelancerName: 'Matter', reason: 'Penilaian mengandung unsur pornografi', date: '21 Okt 2025', reviewContent: 'Saya tidak akan menulis isinya di sini.' },
   
 ];

 return (
   <div className="flex flex-col bg-white rounded-xl shadow-lg p-6 h-full">
     <div className="flex justify-between items-center mb-4 space-x-4">
       <div className="relative flex-grow">
         <Input
           placeholder="Cari nama freelancer atau alasan pelaporan"
           className="pl-10"
         />
       </div>
     </div>

     <div className="flex-grow overflow-y-auto">
       <ReportTable
         reports={reports || dummyReports}
         onSelectReport={onSelectReport}
         selectedReportId={selectedReportId}
       />
     </div>
   </div>
 );
};

export default ReportListSection;