/**
 * Quiet monochrome decoration: thin horizontal stripes and grey scalloped circles.
 */
export function HeroMotif({ className }: { className?: string }) {
  const scallops = Array.from({ length: 12 }, (_, index) => {
    const angle = (index / 12) * Math.PI * 2;
    return { cx: 100 + Math.cos(angle) * 78, cy: 100 + Math.sin(angle) * 78 };
  });

  return (
    <div aria-hidden="true" className={className}>
      <div className="stripes absolute top-0 right-0 h-20 w-[42%] opacity-30" />
      <svg
        viewBox="0 0 200 200"
        className="absolute right-0 bottom-0 size-40 text-block md:size-56"
        fill="currentColor"
      >
        <circle cx="100" cy="100" r="78" />
        {scallops.map((point) => (
          <circle key={`${point.cx}-${point.cy}`} cx={point.cx} cy={point.cy} r="18" />
        ))}
        <circle cx="100" cy="100" r="44" fill="var(--surface)" />
        <circle cx="100" cy="100" r="22" />
      </svg>
      <svg
        viewBox="0 0 200 200"
        className="absolute bottom-20 right-36 hidden size-20 text-block md:block"
        fill="currentColor"
      >
        <circle cx="100" cy="100" r="78" />
        {scallops.map((point) => (
          <circle key={`s-${point.cx}-${point.cy}`} cx={point.cx} cy={point.cy} r="18" />
        ))}
        <circle cx="100" cy="100" r="40" fill="var(--surface)" />
      </svg>
    </div>
  );
}
