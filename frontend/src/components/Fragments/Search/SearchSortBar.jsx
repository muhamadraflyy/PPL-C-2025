import React from "react";

const SORT_TABS = [
  { id: "relevance", label: "Terkait" },
  { id: "latest", label: "Terbaru" },
  { id: "bestseller", label: "Terlaris" },
];

export default function SearchSortBar({
  sortBy,
  onChangeSortTab,
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">
          Urutkan
        </span>
        {SORT_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChangeSortTab(tab.id)}
            className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition ${sortBy === tab.id
                ? "bg-white shadow-sm"
                : "text-white hover:bg-white"
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
