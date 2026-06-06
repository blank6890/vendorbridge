export default function PageShell({ title, description, children }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-medium text-foreground">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children}
    </div>
  );
}
