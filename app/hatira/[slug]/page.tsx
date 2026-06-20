import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BookHeart } from "lucide-react";
import { hatiraSlugIle } from "@/lib/hatira/veri";
import { HatiraYazdir } from "@/components/hatira/hatira-yazdir";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await props.params;
  const d = await hatiraSlugIle(slug);
  if (!d) return { title: "Hatıra Defteri" };
  return {
    title: d.baslik,
    description: `${d.event_title} hatıra defteri`,
    robots: { index: false }, // gizlilik: arama motorlarına açma
  };
}

// İçeriği basit biçimde render eder: "## " / "# " başlık, boş satır boşluk,
// diğerleri paragraf. (AI çıktısı düz metin/hafif Markdown.)
function Icerik({ metin }: { metin: string }) {
  const satirlar = metin.split(/\r?\n/);
  return (
    <>
      {satirlar.map((s, i) => {
        const t = s.trim();
        if (!t) return <div key={i} className="h-3" />;
        if (t.startsWith("## "))
          return (
            <h2
              key={i}
              className="font-display mt-8 text-xl font-semibold tracking-tight text-foreground"
            >
              {t.slice(3)}
            </h2>
          );
        if (t.startsWith("# "))
          return (
            <h2
              key={i}
              className="font-display mt-8 text-2xl font-semibold tracking-tight text-foreground"
            >
              {t.slice(2)}
            </h2>
          );
        return (
          <p key={i} className="mt-3 leading-relaxed text-foreground/85">
            {t}
          </p>
        );
      })}
    </>
  );
}

export default async function HatiraPublicPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  const d = await hatiraSlugIle(slug);
  if (!d || d.icerik == null) notFound();

  const tarih = d.published_at
    ? new Date(d.published_at).toLocaleDateString("tr-TR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <main className="bg-aura min-h-screen px-5 py-12 print:bg-white print:py-0">
      <article className="mx-auto max-w-2xl rounded-3xl border border-border bg-card p-8 shadow-elegant print:border-0 print:shadow-none sm:p-12">
        <header className="text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-soft text-primary-deep print:hidden">
            <BookHeart className="h-6 w-6" />
          </span>
          <h1 className="font-display mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            {d.baslik}
          </h1>
          {tarih && (
            <p className="mt-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
              {tarih}
            </p>
          )}
          <div className="divider-gold my-8" />
        </header>

        <div className="text-[15px]">
          <Icerik metin={d.icerik} />
        </div>

        <footer className="mt-10 flex flex-col items-center gap-4 print:hidden">
          <HatiraYazdir />
          <p className="text-center text-[11px] text-muted-foreground">
            <span className="font-display">WeddinAI</span> ile hazırlandı
          </p>
        </footer>
      </article>
    </main>
  );
}
