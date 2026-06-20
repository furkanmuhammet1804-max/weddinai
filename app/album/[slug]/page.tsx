import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { albumSlugIle, type AlbumFoto } from "@/lib/album/veri";
import { BOLUM_DUZEN } from "@/lib/album/sabit";
import { HatiraYazdir } from "@/components/hatira/hatira-yazdir";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await props.params;
  const a = await albumSlugIle(slug);
  if (!a) return { title: "Albüm" };
  return {
    title: a.baslik,
    description: `${a.event_title} dijital albümü`,
    robots: { index: false },
  };
}

// Fotoğrafları bölüme göre, hikâye akışı sırasıyla grupla.
function bolumlere(fotograflar: AlbumFoto[]): { bolum: string; fotograflar: AlbumFoto[] }[] {
  const harita = new Map<string, AlbumFoto[]>();
  for (const f of fotograflar) {
    const b = f.bolum ?? "Diğer";
    const arr = harita.get(b);
    if (arr) arr.push(f);
    else harita.set(b, [f]);
  }
  const sirali = [...harita.entries()].sort((a, b) => {
    const ia = BOLUM_DUZEN.indexOf(a[0]);
    const ib = BOLUM_DUZEN.indexOf(b[0]);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  });
  return sirali.map(([bolum, fotograflar]) => ({ bolum, fotograflar }));
}

export default async function AlbumPublicPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  const a = await albumSlugIle(slug);
  if (!a) notFound();

  const kapak =
    a.fotograflar.find((f) => f.media_id === a.kapak_media_id) ?? a.fotograflar[0];
  const gruplar = bolumlere(a.fotograflar);

  return (
    <main className="bg-aura min-h-screen pb-16 print:bg-white">
      {/* Kapak */}
      <header className="relative">
        {kapak?.url && (
          <div className="relative h-[52vh] w-full overflow-hidden print:h-64">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={kapak.url} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 p-6 text-center text-white sm:p-10">
          <h1 className="font-display text-3xl font-semibold tracking-tight drop-shadow sm:text-5xl">
            {a.baslik}
          </h1>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 print:hidden">
          <HatiraYazdir />
        </div>

        {gruplar.map((g) => (
          <section key={g.bolum} className="mt-12">
            <h2 className="font-display text-center text-2xl font-semibold tracking-tight">
              {g.bolum}
            </h2>
            <div className="divider-gold mx-auto my-6 max-w-xs" />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {g.fotograflar.map((f) => (
                <div
                  key={f.media_id}
                  className="overflow-hidden rounded-2xl border border-border bg-card print:break-inside-avoid"
                >
                  <div className="aspect-square bg-muted">
                    {f.url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={f.url}
                        alt=""
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}

        <footer className="mt-14 text-center text-[11px] text-muted-foreground print:hidden">
          <span className="font-display">WeddinAI</span> ile hazırlandı
        </footer>
      </div>
    </main>
  );
}
