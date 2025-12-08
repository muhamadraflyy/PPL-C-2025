import React from 'react';

export const RecommendationTable = ({ title, headers, data, type }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-100">
      <h3 className="text-base font-bold text-[#1D375B] mb-4">{title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              {headers.map((header, index) => (
                <th key={index} className="text-left py-2.5 px-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data && data.length > 0 ? (
              data.map((item, index) => (
                <tr key={index} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="py-3 px-3 text-sm text-gray-900">
                    {index + 1}. {item.userName || item.freelancerName || '-'}
                  </td>
                  <td className="py-3 px-3 text-sm font-medium text-gray-700">
                    {type === 'favorite'
                      ? (item.favoriteCount || 0).toLocaleString('id-ID')
                      : (item.transactionCount || 0).toLocaleString('id-ID')
                    }
                  </td>
                  <td className="py-3 px-3 text-sm text-gray-600">
                    {item.serviceName || item.category || '-'}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={headers.length} className="py-8 text-center text-sm text-gray-400">
                  Tidak ada data
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
