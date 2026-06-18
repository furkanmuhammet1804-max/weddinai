import Link from "next/link";
import { Cloud, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="bg-aura flex min-h-screen flex-col items-center justify-center px-5 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-elegant">
        <Cloud className="h-8 w-8" />
      </span>
      <p className="font-display mt-8 text-7xl font-semibold text-gradient-gold">
        404
      </p>
      <h1 className="font-display mt-2 text-2xl font-semibold tracking-tight">
        Bu anı bulunamadı
      </h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Aradığınız sayfa taşınmış veya hiç var olmamış olabilir. Hadi sizi güvenli
        bir yere götürelim.
      </p>
      <div className="mt-7 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-elegant transition-all hover:brightness-110"
        >
          <Home className="h-4 w-4" /> Ana Sayfa
        </Link>
        <Link
          href="/showroom"
          className="inline-flex items-center justify-center gap-2 rounded-full border border-primary/40 px-6 py-3 text-sm font-medium hover:bg-primary-soft/50"
        >
          <ArrowLeft className="h-4 w-4" /> Showroom
        </Link>
      </div>
    </div>
  );
}
