export default function PagePlaceholder({ title, description }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-10 text-center">
      <h2 className="text-xl font-medium text-foreground">{title}</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        {description ?? "Page implementation pending — see frontend/src/pages/"}
      </p>
    </div>
  );
}
