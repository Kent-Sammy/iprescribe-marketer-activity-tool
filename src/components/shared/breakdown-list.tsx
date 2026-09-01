import { cn } from "@/lib/utils";

interface BreakdownItem {
  label: string;
  count: number;
}

export function BreakdownList({
  items,
  total,
  emptyLabel = "No data",
  className,
}: {
  items: BreakdownItem[];
  total?: number;
  emptyLabel?: string;
  className?: string;
}) {
  const max = Math.max(1, ...items.map((i) => i.count));
  const denom = total ?? items.reduce((sum, i) => sum + i.count, 0);

  if (items.length === 0) {
    return <p className={cn("text-sm text-muted-foreground", className)}>{emptyLabel}</p>;
  }

  return (
    <ul className={cn("space-y-2.5", className)}>
      {items.map((item) => (
        <li key={item.label} className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span>{item.label}</span>
            <span className="tabular-nums text-muted-foreground">
              {item.count}
              {denom ? ` · ${Math.round((item.count / denom) * 100)}%` : ""}
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${(item.count / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
