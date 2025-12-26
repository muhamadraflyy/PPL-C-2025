import React, { useState } from "react";
import { Funnel, ChevronDown, ChevronUp, RotateCcw } from "lucide-react";

function FilterSection({ title, isOpen, onToggle, children }) {
  return (
    <div className="border p-2 rounded-lg border-black">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between text-left text-sm font-semibold text-[#626365]"
      >
        <span>{title}</span>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-neutral-500" />
        ) : (
          <ChevronDown className="h-4 w-4 text-neutral-500" />
        )}
      </button>
      {isOpen && <div className="mt-3">{children}</div>}
    </div>
  );
}

function RatingRow({ stars, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-[13px] ${active ? "bg-[#EEF2FF]" : "hover:bg-neutral-50"
        }`}
    >
      <span className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <i
            key={i}
            className={`fas fa-star text-[11px] ${i < stars ? "text-[#FBBF24]" : "text-neutral-300"
              }`}
          />
        ))}
      </span>
      <span className="text-[11px] text-neutral-600">Ke atas</span>
    </button>
  );
}

export default function SearchFilterSidebar({
  categories,
  selectedCategories,
  onToggleCategory,
  priceOptions,
  selectedPriceId,
  onChangePrice,
  minRating,
  onChangeRating,
  priceMin,
  priceMax,
  onChangePriceMin,
  onChangePriceMax,
  onApplyPriceFilter,
  priceSort,
  onChangePriceSort,
  onResetFilters,
}) {
  const [openCategory, setOpenCategory] = useState(true);
  const [openPrice, setOpenPrice] = useState(false);
  const [openRating, setOpenRating] = useState(false);

  return (
    <aside className="w-full rounded-2xl bg-white p-4 shadow-sm lg:w-60 xl:w-64">
      <div className="mb-4 flex items-center gap-2">
        <Funnel className="h-4 w-4" />
        <h2 className="text-sm font-semibold text-neutral-900">
          Filter Layanan
        </h2>
      </div>

      <div className="space-y-4 text-sm">
        {/* Kategori */}
        <FilterSection
          title="Pilih kategori"
          isOpen={openCategory}
          onToggle={() => setOpenCategory((v) => !v)}
        >
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-neutral-500">
            Kategori Layanan
          </p>
          <div className="max-h-52 space-y-2 overflow-y-auto pr-1">
            {categories.map((cat) => (
              <label
                key={cat}
                className="flex items-center gap-2 text-[13px] text-neutral-700"
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-neutral-300 text-[#2563EB] focus:ring-[#2563EB]"
                  checked={selectedCategories.includes(cat)}
                  onChange={() => onToggleCategory(cat)}
                />
                <span>{cat}</span>
              </label>
            ))}
            {categories.length === 0 && (
              <p className="text-[11px] text-neutral-400">
                Kategori akan muncul setelah hasil pencarian tersedia.
              </p>
            )}
          </div>
        </FilterSection>

        {/* Harga */}
        <FilterSection
          title="Harga Layanan"
          isOpen={openPrice}
          onToggle={() => setOpenPrice((v) => !v)}
        >
          {/* Preset range */}
          <div className="space-y-2">
            {priceOptions.map((opt) => (
              <label
                key={opt.id}
                className="flex items-center gap-2 text-[13px] text-neutral-700"
              >
                <input
                  type="radio"
                  name="price-range"
                  className="h-4 w-4 border-neutral-300 text-[#2563EB] focus:ring-[#2563EB]"
                  checked={selectedPriceId === opt.id}
                  onChange={() => onChangePrice(opt.id)}
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>

          {/* Urutan Harga (dipindahkan dari SortBar) */}
          <div className="mt-4 space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-wide text-neutral-500">
              Urutan Harga
            </p>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[13px] text-neutral-700">
                <input
                  type="radio"
                  name="price-sort"
                  className="h-4 w-4 border-neutral-300 text-[#2563EB] focus:ring-[#2563EB]"
                  checked={priceSort === ""}
                  onChange={() => onChangePriceSort("")}
                />
                <span>Default</span>
              </label>
              <label className="flex items-center gap-2 text-[13px] text-neutral-700">
                <input
                  type="radio"
                  name="price-sort"
                  className="h-4 w-4 border-neutral-300 text-[#2563EB] focus:ring-[#2563EB]"
                  checked={priceSort === "price_desc"}
                  onChange={() => onChangePriceSort("price_desc")}
                />
                <span>Harga: Tinggi ke Rendah</span>
              </label>
              <label className="flex items-center gap-2 text-[13px] text-neutral-700">
                <input
                  type="radio"
                  name="price-sort"
                  className="h-4 w-4 border-neutral-300 text-[#2563EB] focus:ring-[#2563EB]"
                  checked={priceSort === "price_asc"}
                  onChange={() => onChangePriceSort("price_asc")}
                />
                <span>Harga: Rendah ke Tinggi</span>
              </label>
            </div>
          </div>

          {/* Input range custom */}
          <div className="mt-4 space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-wide text-neutral-500">
              Batas Harga
            </p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                value={priceMin}
                onChange={(e) => onChangePriceMin(e.target.value)}
                placeholder="Rp MIN"
                className="h-9 w-full rounded-lg border border-neutral-200 px-3 text-xs text-neutral-800 focus:border-[#2563EB] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
              />
              <input
                type="number"
                min={0}
                value={priceMax}
                onChange={(e) => onChangePriceMax(e.target.value)}
                placeholder="Rp MAKS"
                className="h-9 w-full rounded-lg border border-neutral-200 px-3 text-xs text-neutral-800 focus:border-[#2563EB] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
              />
            </div>

            <button
              type="button"
              onClick={onApplyPriceFilter}
              className="mt-1 w-full rounded-lg bg-[#112c4f] px-3 py-1.5 text-xs font-semibold text-white hover:bg-black"
            >
              Terapkan Harga
            </button>
          </div>
        </FilterSection>

        {/* Rating */}
        <FilterSection
          title="Rating Layanan"
          isOpen={openRating}
          onToggle={() => setOpenRating((v) => !v)}
        >
          <div className="space-y-1.5">
            {[5, 4, 3, 2, 1].map((stars) => (
              <RatingRow
                key={stars}
                stars={stars}
                active={minRating === stars}
                onClick={() => onChangeRating(stars)}
              />
            ))}
          </div>
        </FilterSection>
      </div>

      {/* Reset Filter Button */}
      <div className="mt-4 pt-4 border-t border-neutral-200">
        <button
          type="button"
          onClick={onResetFilters}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-black bg-[#102d4f] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-neutral-50 hover:border-neutral-400"
        >
          <RotateCcw className="h-4 w-4 text-white" />
          Reset Filter
        </button>
      </div>
    </aside>
  );
}
