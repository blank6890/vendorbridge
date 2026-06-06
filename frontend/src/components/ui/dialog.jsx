import { createContext, useContext, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const DialogContext = createContext(null);

function Dialog({ open, onOpenChange, children }) {
  return (
    <DialogContext.Provider value={{ open, onOpenChange }}>
      {children}
    </DialogContext.Provider>
  );
}

function DialogContent({ className, children, title, description }) {
  const { open, onOpenChange } = useContext(DialogContext);
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape") onOpenChange(false);
    };

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close dialog overlay"
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-[1px]"
        onClick={() => onOpenChange(false)}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "dialog-title" : undefined}
        aria-describedby={description ? "dialog-description" : undefined}
        className={cn(
          "relative z-10 w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-lg",
          className
        )}
      >
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="absolute right-3 top-3"
          aria-label="Close"
          onClick={() => onOpenChange(false)}
        >
          <X className="size-4" />
        </Button>
        {title ? (
          <h2 id="dialog-title" className="pr-8 text-lg font-medium text-foreground">
            {title}
          </h2>
        ) : null}
        {description ? (
          <p id="dialog-description" className="mt-1 text-sm text-muted-foreground">
            {description}
          </p>
        ) : null}
        <div className={title || description ? "mt-4" : ""}>{children}</div>
      </div>
    </div>
  );
}

function DialogFooter({ className, ...props }) {
  return (
    <div
      className={cn("mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)}
      {...props}
    />
  );
}

export { Dialog, DialogContent, DialogFooter };
