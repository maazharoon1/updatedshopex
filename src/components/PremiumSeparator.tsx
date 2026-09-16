interface PremiumSeparatorProps {
  label?: string;
  detail?: string;
}

export function PremiumSeparator({
  label = "Selected work",
  detail = "Explore the collection",
}: PremiumSeparatorProps) {
  return (
    <div
      className="container-wide relative z-20 bg-background"
      role="separator"
      aria-label={label}
    >
      <div className="flex items-center gap-4 border-y border-separator py-4 md:gap-7 md:py-5">
        <div className="flex shrink-0 items-center gap-3">
          <span className="relative grid size-5 place-items-center border border-foreground/25 md:size-6" aria-hidden="true">
            <span className="size-1.5 bg-accent md:size-2" />
          </span>
          <span className="font-sans text-[10px] font-medium uppercase tracking-[0.24em] text-foreground md:text-xs">
            {label}
          </span>
        </div>

        <span className="h-px flex-1 bg-separator" aria-hidden="true" />

        <div className="hidden shrink-0 items-center gap-4 sm:flex">
          <span className="font-sans text-[9px] uppercase tracking-[0.2em] text-muted-foreground md:text-[10px]">
            {detail}
          </span>
         
        </div>
      </div>
    </div>
  );
}
