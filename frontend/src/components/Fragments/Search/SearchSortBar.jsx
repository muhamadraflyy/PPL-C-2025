import React from "react";

const SORT_TABS = [
  { id: "relevance", label: "Terkait" },
  { id: "latest", label: "Terbaru" },
  { id: "bestseller", label: "Terlaris" },
];

export default function SearchSortBar({
  sortBy,
  onChangeSortTab,
  priceSort,
  onChangePriceSort,
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-[#112c4f] p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-white">
          Urutkan
        </span>
        {SORT_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChangeSortTab(tab.id)}
              className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition ${
                sortBy === tab.id
                  ? "bg-white shadow-sm"
                  : "text-white hover:bg-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
      </div>

      <div className="flex items-center gap-2">
        <select
          value={priceSort}
          onChange={(e) => onChangePriceSort(e.target.value)}
          className="h-9 rounded-lg border border-neutral-200 bg-white px-3 text-xs shadow-sm focus:border-[#2563EB] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
        >
          <option value="">Harga</option>
          <option value="price_desc">Harga : Tinggi ke Rendah</option>
          <option value="price_asc">Harga : Rendah ke Tinggi</option>
        </select>
      </div>
    </div>
  );
}
