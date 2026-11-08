type CategoryRailProps = {
  anchors: Array<{ anchor: string; name: string }>;
};

/**
 * Vertical "Catégories +" label with an anchor list, desktop only.
 */
export function CategoryRail({ anchors }: CategoryRailProps) {
  return (
    <nav
      aria-label="Catégories de la liste"
      className="hidden md:flex md:flex-col md:items-start md:gap-6"
    >
      <p className="vertical-label micro text-ink">Catégories +</p>
      {anchors.length > 0 ? (
        <ul className="vertical-label flex flex-row-reverse flex-wrap gap-4">
          {anchors.map((item) => (
            <li key={item.anchor}>
              <a
                href={`#${item.anchor}`}
                className="micro text-ink-soft underline-offset-4 hover:text-ink hover:underline"
              >
                {item.name}
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </nav>
  );
}
