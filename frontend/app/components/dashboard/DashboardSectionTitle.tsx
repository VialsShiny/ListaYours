type DashboardSectionTitleProps = {
  id: string;
  index: string;
  title: string;
  aside?: React.ReactNode;
};

/**
 * Hairline, accent index tag and display title opening a dashboard section.
 */
export function DashboardSectionTitle({ id, index, title, aside }: DashboardSectionTitleProps) {
  return (
    <div className="hairline mb-5 flex flex-wrap items-end justify-between gap-4 pt-5 md:mb-7 md:pt-6">
      <div className="flex min-w-0 items-baseline gap-2.5 md:gap-4">
        <span className="index-tag">{index}</span>
        <h2 id={id} className="display display-section min-w-0 text-[32px] md:text-[56px]">
          {title}
        </h2>
      </div>
      {aside}
    </div>
  );
}
