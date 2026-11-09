type EmptyStateProps = {
  title: string;
  text?: string;
  action?: React.ReactNode;
};

export function EmptyState({ title, text, action }: EmptyStateProps) {
  return (
    <div className="panel panel-dashed flex flex-col items-start gap-3 p-6">
      <p className="eyebrow">Rien à afficher</p>
      <p className="display-card">{title}</p>
      {text ? <p className="text-secondary max-w-prose text-soft">{text}</p> : null}
      {action}
    </div>
  );
}
