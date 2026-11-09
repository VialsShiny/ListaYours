import { DisplayTitle } from "@/components/layout/DisplayTitle";

type DashboardSectionTitleProps = {
  id: string;
  index: string;
  title: string;
  aside?: React.ReactNode;
};

export function DashboardSectionTitle({ id, index, title, aside }: DashboardSectionTitleProps) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="index-tag mb-2">{index}</p>
        <DisplayTitle as="h2" size="section" id={id}>
          {title}
        </DisplayTitle>
      </div>
      {aside}
    </div>
  );
}
