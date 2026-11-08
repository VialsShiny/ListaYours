export function WishlistHeaderSkeleton() {
  return (
    <header
      aria-hidden="true"
      className="bg-surface px-4 pt-12 pb-16 md:px-12 md:pt-20 md:pb-24 lg:px-16"
    >
      <div className="skeleton mb-6 h-3 w-32" />
      <div className="skeleton h-20 w-3/4 md:h-36" />
      <div className="skeleton mt-8 h-4 w-full max-w-xl" />
      <div className="skeleton mt-2 h-4 w-2/3 max-w-md" />
    </header>
  );
}
