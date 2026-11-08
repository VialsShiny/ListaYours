type EmptyStateProps = {
  title: string;
  text?: string;
  action?: React.ReactNode;
};

export function EmptyState({ title, text, action }: EmptyStateProps) {
  return (
    <div className="hairline-frame flex flex-col items-start gap-3 border-dashed p-6">
      <p className="micro text-ink-soft">Rien à afficher</p>
      <p className="display display-card">{title}</p>
      {text ? <p className="max-w-prose text-sm text-ink-soft">{text}</p> : null}
      {action}
    </div>
  );
}
