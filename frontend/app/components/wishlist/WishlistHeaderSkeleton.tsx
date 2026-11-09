export function WishlistHeaderSkeleton() {
  return (
    <header aria-hidden="true" className="container pt-4 md:pt-6">
      <div className="hero">
        <div className="skeleton h-4 w-40 bg-water/20" />
        <div className="skeleton mt-6 h-20 w-3/4 bg-water/20 md:h-36" />
        <div className="skeleton mt-6 h-5 w-full max-w-xl bg-water/20" />
        <div className="skeleton mt-2 h-5 w-2/3 max-w-md bg-water/20" />
      </div>
    </header>
  );
}
