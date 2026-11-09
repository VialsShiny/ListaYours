export function WishlistHeaderSkeleton() {
  return (
    <header aria-hidden="true" className="container pt-8 md:pt-14">
      <div className="skeleton h-4 w-40 rounded-md" />
      <div className="skeleton mt-6 h-16 w-3/4 md:h-32" />
      <div className="skeleton mt-6 h-12 w-56 rounded-full" />
    </header>
  );
}
