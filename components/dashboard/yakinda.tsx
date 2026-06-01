import { Sparkles } from "lucide-react";

export function Yakinda({
  baslik,
  aciklama,
}: {
  baslik: string;
  aciklama: string;
}) {
  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="font-display text-2xl font-semibold tracking-tight">
        {baslik}
      </h1>
      <div className="mt-8 flex flex-col items-center justify-center rounded-3xl border border-dashed border-primary/30 bg-card/60 px-6 py-20 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-soft text-primary">
          <Sparkles className="h-8 w-8" />
        </span>
        <h2 className="font-display mt-5 text-xl font-semibold">
          Bu modül yakında
        </h2>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">{aciklama}</p>
        <span className="mt-5 rounded-full bg-muted px-4 py-1.5 text-xs font-medium text-muted-foreground">
          Yol haritasında planlandı
        </span>
      </div>
    </div>
  );
}
