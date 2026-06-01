import { Palette, Sparkles } from "lucide-react";
import { TemaSecici } from "@/components/theme/tema-secici";

export default function AyarlarPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-8">
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          Ayarlar
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Görünümü kişiselleştirin. Profil ve plan yönetimi yakında eklenecek.
        </p>
      </header>

      {/* Görünüm / Tema */}
      <section className="rounded-2xl border border-border bg-card p-6 shadow-elegant sm:p-7">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary-deep">
            <Palette className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-display text-lg font-semibold">Renk Teması</h2>
            <p className="text-sm text-muted-foreground">
              Tüm panele ve siteye anında uygulanır, tercihiniz hatırlanır.
            </p>
          </div>
        </div>

        <div className="my-6 divider-gold" />

        <TemaSecici variant="tam" />
      </section>

      {/* Yakında */}
      <section className="mt-5 flex items-center gap-3 rounded-2xl border border-dashed border-border bg-muted/40 px-6 py-5">
        <Sparkles className="h-4 w-4 shrink-0 text-primary-deep" />
        <p className="text-sm text-muted-foreground">
          Profil bilgileri, plan yönetimi ve moderasyon tercihleri yakında bu
          sayfada olacak.
        </p>
      </section>
    </div>
  );
}
