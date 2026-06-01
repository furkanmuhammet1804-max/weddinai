import Link from "next/link";
import { Cloud } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  textClassName,
}: {
  className?: string;
  textClassName?: string;
}) {
  return (
    <Link href="/" className={cn("inline-flex items-center gap-2.5", className)}>
      <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-elegant">
        <Cloud className="h-5 w-5" strokeWidth={2.2} />
      </span>
      <span
        className={cn(
          "font-display text-xl font-semibold tracking-tight",
          textClassName,
        )}
      >
        WeddinAI
      </span>
    </Link>
  );
}
