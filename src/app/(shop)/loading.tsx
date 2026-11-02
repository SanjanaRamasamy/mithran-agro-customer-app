export default function ShopLoading() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6" aria-busy="true" aria-label="Loading page">
      <div className="shimmer h-40 rounded-3xl sm:h-56" />
      <div>
        <div className="shimmer mb-5 h-7 w-52 rounded-xl" />
        <div className="no-scrollbar flex gap-4 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="shrink-0">
              <div className="shimmer size-24 rounded-full" />
              <div className="shimmer mt-2 h-4 w-20 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
      <div>
        <div className="shimmer mb-5 h-7 w-40 rounded-xl" />
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="w-52 shrink-0">
              <div className="shimmer aspect-square rounded-2xl" />
              <div className="shimmer mt-2 h-4 w-4/5 rounded-lg" />
              <div className="shimmer mt-1.5 h-4 w-2/5 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
