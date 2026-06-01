import { notFound } from "next/navigation";
import Link from "next/link";
import { Camera, Sparkles, Heart } from "lucide-react";
import { showroomVerisi } from "@/lib/oda/veri";
import { turEtiket, tarihTR } from "@/lib/etkinlik";

// Herkese açık vitrin — yalnızca müşterinin onayladığı fotoğraflar.
export const dynamic = "force-dynamic";

export default async function ShowroomPage(
  props: PageProps<"/showroom/[slug]">,
) {
  const { slug } = await props.params;
  const temiz = typeof slug === "string" ? slug.trim() : "";
  if (!temiz) notFound();

  const veri = await showroomVerisi(temiz);
  if (!veri) notFound();

  const { bilgi, fotograflar } = veri;

  return (
    <div className="bg-aura min-h-screen">
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-rose-soft via-primary-soft to-background opacity-70" />
        <div className="relative mx-auto max-w-5xl px-5 pb-12 pt-20 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-card/70 px-4 py-1.5 text-xs font-medium text-primary-deep">
            <Sparkles className="h-3.5 w-3.5" />
            {turEtiket(bilgi.event_type)}
            {bilgi.event_date ? ` · ${tarihTR(bilgi.event_date)}` : ""}
          </span>
          <h1 className="font-display mt-5 text-4xl font-semibold tracking-tight sm:text-5xl">
            {bilgi.title}
          </h1>
          <p className="mt-3 text-muted-foreground">
            Seçilmiş anların vitrini ✨
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 pb-20">
        {fotograflar.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card/50 p-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Camera className="h-8 w-8" />
            </div>
            <h3 className="font-display mt-5 text-xl font-semibold">
              Vitrin yakında
            </h3>
            <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
              Bu etkinlik için henüz vitrine eklenmiş fotoğraf yok.
            </p>
          </div>
        ) : (
          <div className="columns-2 gap-4 [column-fill:_balance] sm:columns-3 lg:columns-4">
            {fotograflar.map((f) => (
              <div key={f.id} className="mb-4 break-inside-avoid">
                <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={f.url}
                    alt="Anı"
                    loading="lazy"
                    className="w-full object-cover transition-transform duration-500 hover:scale-[1.03]"
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-14 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-deep hover:underline"
          >
            <Heart className="h-4 w-4" />
            <span className="font-display">WeddinAI</span> ile oluşturuldu
          </Link>
        </div>
      </main>
    </div>
  );
}
