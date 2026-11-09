import { DisplayTitle } from "@/components/layout/DisplayTitle";

type EmptyStateProps = {
  title: string;
  text?: string;
  action?: React.ReactNode;
};

export function EmptyState({ title, text, action }: EmptyStateProps) {
  return (
    <div className="panel panel-dashed flex flex-col items-start gap-3 p-7">
      <DisplayTitle as="p" size="sub">
        {title}
      </DisplayTitle>
      {text ? <p className="text-secondary max-w-prose text-soft">{text}</p> : null}
      {action}
    </div>
  );
}
