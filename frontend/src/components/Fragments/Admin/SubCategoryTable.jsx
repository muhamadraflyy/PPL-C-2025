// frontend/src/components/organisms/SubCategoryTable.jsx

import React from 'react';
import Badge from '../../Elements/Common/Badge'; 
import { Search, Edit2, Trash2, Eye, ToggleLeft, ToggleRight } from 'lucide-react';

export function SubCategoryTable({ 
  subCategories, 
  onEdit, 
  onDelete, 
  onToggle,
  onDetail,
  loading,
  formatDate 
}) {
  if (loading) {
    return (
      <div className="p-12 text-center">
        <div className="w-16 h-16 border-4 border-[#4782BE] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Memuat data sub kategori...</p>
      </div>
    );
  }

  if (subCategories.length === 0) {
    return (
      <div className="p-12 text-center">
        <div className="text-gray-400 mb-2">
          <Search size={48} className="mx-auto" />
        </div>
        <p className="text-gray-600">Tidak ada sub kategori yang ditemukan</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden"> 
      <table className="w-full table-fixed divide-y divide-gray-200">
        <thead className="bg-gray-50 border-b border-[#D8E3F3]">
          <tr>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[16%]">
              Nama Sub Kategori
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[14%]">
              Kategori 
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[12%]">
              Slug
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[22%]">
              Deskripsi
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[8%]">
              Status
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[13%]">
              Dibuat
            </th>
            <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-[15%]">
              Aksi
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {subCategories.map((subCategory) => {
            const isActive = subCategory.is_active;
            
            return (
              <tr key={subCategory.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-3 py-3">
                  <div className="text-sm font-medium text-gray-900">
                    {subCategory.nama || 'N/A'}
                  </div>
                </td>
                <td className="px-3 py-3">
                  <div className="text-sm font-medium text-gray-700">
                    {subCategory.kategori?.nama || subCategory.kategoriInduk || '-'}
                  </div>
                </td>
                <td className="px-3 py-3">
                  <div className="text-sm text-gray-600">
                    {subCategory.slug || '-'}
                  </div>
                </td>
                <td className="px-3 py-3">
                  <div className="text-sm text-gray-600">
                    {subCategory.deskripsi ? (
                      subCategory.deskripsi.length > 70 
                        ? subCategory.deskripsi.slice(0, 70) + '...' 
                        : subCategory.deskripsi
                    ) : '-'}
                  </div>
                </td>
                <td className="px-3 py-3">
                  <Badge variant={isActive ? 'success' : 'error'}>
                    {isActive ? 'Aktif' : 'Nonaktif'}
                  </Badge>
                </td>
                <td className="px-3 py-3 text-sm text-gray-600">
                  {formatDate(subCategory.created_at)}
                </td>
                <td className="px-3 py-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => onDetail(subCategory)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Lihat Detail"
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      onClick={() => onEdit(subCategory)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => onToggle(subCategory)}
                      className={`p-2 ${isActive ? 'text-orange-600 hover:bg-orange-50' : 'text-indigo-600 hover:bg-indigo-50'} rounded-lg transition-colors`}
                      title={isActive ? 'Nonaktifkan' : 'Aktifkan'}
                    >
                      {isActive ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                    </button>
                    <button
                      onClick={() => onDelete(subCategory)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Hapus"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}