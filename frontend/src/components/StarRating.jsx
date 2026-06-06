import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export default function StarRating({
  value = 0,
  max = 5,
  onChange,
  size = "md",
  readOnly = false,
  className,
}) {
  const sizes = {
    sm: "size-3.5",
    md: "size-4",
    lg: "size-5",
  };

  const iconSize = sizes[size] ?? sizes.md;

  const handleSelect = (rating) => {
    if (readOnly || !onChange) return;
    onChange(rating);
  };

  return (
    <div
      className={cn("inline-flex items-center gap-0.5", className)}
      role={readOnly ? "img" : "radiogroup"}
      aria-label={readOnly ? `Rating: ${value} out of ${max}` : "Rate out of 5 stars"}
    >
      {Array.from({ length: max }, (_, index) => {
        const starValue = index + 1;
        const filled = starValue <= Math.round(value);

        return (
          <button
            key={starValue}
            type="button"
            disabled={readOnly}
            role={readOnly ? undefined : "radio"}
            aria-checked={readOnly ? undefined : starValue === Math.round(value)}
            aria-label={`${starValue} star${starValue > 1 ? "s" : ""}`}
            onClick={() => handleSelect(starValue)}
            className={cn(
              "rounded-sm transition-colors",
              !readOnly && "cursor-pointer hover:scale-105",
              readOnly && "cursor-default"
            )}
          >
            <Star
              className={cn(
                iconSize,
                filled
                  ? "fill-amber-400 text-amber-400"
                  : "fill-transparent text-slate-300"
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
