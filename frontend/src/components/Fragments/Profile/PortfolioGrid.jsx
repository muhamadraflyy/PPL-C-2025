const getItemSrc = (item) => {
  if (!item) return "";
  if (typeof item === "string") return item;
  if (typeof item === "object") {
    return (
      item.url ||
      item.src ||
      item.path ||
      item.image_url ||
      item.imageUrl ||
      item.image ||
      ""
    );
  }
  return "";
};

export default function PortfolioGrid({
  items = [],
  showViewAll = false,
  onViewAll,
  onItemClick,
}) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-neutral-900">Portfolio</h3>
        {showViewAll && (
          <button
            type="button"
            onClick={onViewAll}
            className="text-xs font-medium text-blue-600 hover:text-blue-700"
          >
            Lihat semua
          </button>
        )}
      </div>

      {(!items || items.length === 0) && (
        <div className="rounded-lg border border-dashed border-neutral-300 bg-neutral-50 px-4 py-6 text-center text-sm text-neutral-600">
          Belum ada portfolio
        </div>
      )}

      {items && items.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
          {items.map((item, i) => {
            const src = getItemSrc(item);
            const isClickable = typeof onItemClick === "function";

            return (
              <div
                key={i}
                role={isClickable ? "button" : undefined}
                tabIndex={isClickable ? 0 : undefined}
                onClick={
                  isClickable
                    ? () => {
                        if (!src) return;
                        onItemClick({
                          ...(typeof item === "object" ? item : {}),
                          url: src,
                          index: i,
                        });
                      }
                    : undefined
                }
                onKeyDown={
                  isClickable
                    ? (e) => {
                        if (e.key !== "Enter" && e.key !== " ") return;
                        if (!src) return;
                        onItemClick({
                          ...(typeof item === "object" ? item : {}),
                          url: src,
                          index: i,
                        });
                      }
                    : undefined
                }
                className={
                  "group relative h-24 overflow-hidden rounded-lg border border-neutral-200 bg-white sm:h-28 md:h-32" +
                  (isClickable
                    ? " cursor-pointer transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    : "")
                }
              >
                {src ? (
                  <img
                    src={src}
                    alt={`Portfolio ${i + 1}`}
                    className={
                      "h-full w-full object-cover" +
                      (isClickable
                        ? " transition-transform duration-300 group-hover:scale-110"
                        : "")
                    }
                    onError={(e) => {
                      e.currentTarget.src =
                        "https://via.placeholder.com/150?text=No+Image";
                    }}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-neutral-100 text-xs text-neutral-500">
                    No Image
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
