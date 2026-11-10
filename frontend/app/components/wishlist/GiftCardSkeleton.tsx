export function GiftCardSkeleton() {
  return (
    <div aria-hidden="true" className="card">
      <div className="skeleton aspect-square w-full rounded-[20px]" />
      <div className="skeleton h-4 w-4/5 rounded-md" />
      <div className="skeleton h-4 w-2/5 rounded-md" />
      <div className="skeleton h-11 w-full rounded-full" />
    </div>
  );
}

export function GiftGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <ul className="gift-grid" aria-busy="true" aria-label="Chargement des cadeaux">
      {Array.from({ length: count }, (_, index) => (
        <li key={index}>
          <GiftCardSkeleton />
        </li>
      ))}
    </ul>
  );
}
