export function GiftCardSkeleton() {
  return (
    <div aria-hidden="true" className="card w-[280px]">
      <div className="skeleton aspect-[4/5] w-full rounded-none" />
      <div className="card-body">
        <div className="skeleton h-7 w-24 rounded-full" />
        <div className="skeleton h-6 w-3/4" />
        <div className="skeleton h-5 w-20" />
        <div className="skeleton h-4 w-full" />
        <div className="skeleton h-4 w-5/6" />
        <div className="skeleton mt-2 h-11 w-full rounded-full" />
      </div>
    </div>
  );
}
