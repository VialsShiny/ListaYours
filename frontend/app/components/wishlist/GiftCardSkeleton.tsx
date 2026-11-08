export function GiftCardSkeleton() {
  return (
    <div aria-hidden="true" className="flex w-[280px] flex-col gap-3 bg-white p-4 shadow-soft">
      <div className="skeleton h-3 w-20" />
      <div className="skeleton aspect-[3/4] w-full" />
      <div className="skeleton h-6 w-3/4" />
      <div className="skeleton h-4 w-24" />
      <div className="hairline" />
      <div className="skeleton h-3 w-full" />
      <div className="skeleton h-3 w-5/6" />
      <div className="skeleton mt-2 h-11 w-full" />
    </div>
  );
}
