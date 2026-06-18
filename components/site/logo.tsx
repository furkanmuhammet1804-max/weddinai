import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

// WeddinAI marka kilidi: altın işaret (şeffaf PNG) + kelime markası.
// width/height sabit → CLS yok; CSS ile yalnızca yükseklik ölçeklenir,
// en/boy oranı korunur (mark 706×306).
export function Logo({
  className,
  textClassName,
  imgClassName,
  showText = true,
  priority = false,
}: {
  className?: string;
  textClassName?: string;
  imgClassName?: string;
  showText?: boolean;
  priority?: boolean;
}) {
  return (
    <Link
      href="/"
      aria-label="WeddinAI ana sayfa"
      className={cn("inline-flex items-center gap-2.5", className)}
    >
      <Image
        src="/logo.png"
        alt="WeddinAI Logo"
        width={74}
        height={32}
        priority={priority}
        sizes="74px"
        className={cn("h-8 w-auto", imgClassName)}
      />
      {showText && (
        <span
          className={cn(
            "font-display text-xl font-semibold tracking-tight",
            textClassName,
          )}
        >
          WeddinAI
        </span>
      )}
    </Link>
  );
}
