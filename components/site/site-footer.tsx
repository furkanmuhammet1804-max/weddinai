import Link from "next/link";
import { Logo } from "./logo";
import { Camera, Mail, Heart } from "lucide-react";

const gruplar = [
  {
    baslik: "Platform",
    linkler: [
      { href: "/#ozellikler", label: "Özellikler" },
      { href: "/#nasil-calisir", label: "Nasıl Çalışır" },
      { href: "/panel", label: "Yönetim Paneli" },
    ],
  },
  {
    baslik: "Etkinlikler",
    linkler: [
      { href: "/e/elif-mert", label: "Düğün" },
      { href: "/e/zeynep-kina", label: "Kına Gecesi" },
      { href: "/e/atlas-gala-2026", label: "Kurumsal Gala" },
    ],
  },
  {
    baslik: "Kurumsal",
    linkler: [
      { href: "#", label: "Hakkımızda" },
      { href: "#", label: "Gizlilik Politikası" },
      { href: "#", label: "İletişim" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border bg-card/60">
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Özel anlarınızı tek bir buluta toplayan premium etkinlik medya
              platformu. Misafirleriniz uygulama indirmeden saniyeler içinde
              katılır.
            </p>
            <div className="mt-5 flex gap-3">
              <a
                href="#"
                className="rounded-full border border-border p-2.5 text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                aria-label="Instagram"
              >
                <Camera className="h-4 w-4" />
              </a>
              <a
                href="mailto:merhaba@weddinai.com"
                className="rounded-full border border-border p-2.5 text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                aria-label="E-posta"
              >
                <Mail className="h-4 w-4" />
              </a>
            </div>
          </div>

          {gruplar.map((g) => (
            <div key={g.baslik}>
              <h4 className="font-display text-sm font-semibold">{g.baslik}</h4>
              <ul className="mt-4 space-y-3">
                {g.linkler.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-sm text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} WeddinAI. Tüm hakları saklıdır.</p>
          <p className="inline-flex items-center gap-1.5">
            Türkiye&apos;de <Heart className="h-3.5 w-3.5 fill-rose text-rose" /> ile
            tasarlandı
          </p>
        </div>
      </div>
    </footer>
  );
}
