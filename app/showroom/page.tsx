import Link from "next/link";
import { Camera, Sparkles, ArrowLeft, Lock } from "lucide-react";
import { showroomGenelVerisi } from "@/lib/oda/veri";
import { ShowroomGaleri } from "@/components/showroom/showroom-galeri";

// Genel (herkese açık) vitrin — tüm odaların admin onaylı fotoğrafları.
export const dynamic = "force-dynamic";

export default async function GenelShowroomPage() {
  const fotograflar = await showroomGenelVerisi(80);

  return (
    <div className="bg-aura min-h-screen">
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-rose-soft via-primary-soft to-background opacity-70" />
        <div className="relative mx-auto max-w-5xl px-5 pb-12 pt-16 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-foreground/70 hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Ana sayfa
          </Link>
          <span className="mt-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-card/70 px-4 py-1.5 text-xs font-medium text-primary-deep">
            <Sparkles className="h-3.5 w-3.5" />
            Showroom
          </span>
          <h1 className="font-display mt-5 text-4xl font-semibold tracking-tight sm:text-5xl">
            Seçilmiş Anların Vitrini
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            WeddinAI ile düzenlenen etkinliklerden, sahiplerinin paylaşmayı
            seçtiği özel kareler. Anılar güvende, kontrol sizde.
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
              Vitrin yakında dolacak
            </h3>
            <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
              Henüz vitrine eklenmiş fotoğraf yok. Çok yakında en güzel anlar
              burada.
            </p>
          </div>
        ) : (
          <ShowroomGaleri
            fotograflar={fotograflar.map((f) => ({ id: f.id, url: f.url }))}
          />
        )}

        <div className="mt-14 flex flex-col items-center gap-3 text-center">
          <Link
            href="/musteri"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-5 py-2.5 text-sm font-medium hover:border-primary hover:text-primary"
          >
            <Lock className="h-4 w-4" /> Müşteri Girişi
          </Link>
          <span className="font-display text-sm text-muted-foreground">
            WeddinAI ✨
          </span>
        </div>
      </main>
    </div>
  );
}
