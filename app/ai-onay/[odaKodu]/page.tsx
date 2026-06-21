// =============================================================
// /ai-onay/<token> — Müşteri KVKK AI medya işleme onay sayfası (PUBLIC).
// Token odaya özeldir; onaylanınca yalnızca o etkinlikte ai_medya_onay=true.
// =============================================================
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { onayOdaBul } from "@/lib/kvkk/onay";
import { AiOnayKutusu } from "@/components/kvkk/ai-onay";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "AI Medya İşleme Onayı — WeddinAI",
  robots: { index: false, follow: false },
};

export default async function AiOnayPage(props: {
  params: Promise<{ odaKodu: string }>;
}) {
  const { odaKodu } = await props.params;
  const oda = await onayOdaBul(odaKodu);
  if (!oda) notFound();

  return (
    <main className="bg-aura flex min-h-screen flex-col items-center px-5 py-12">
      <div className="w-full max-w-xl">
        <div className="rounded-3xl border border-border bg-card p-7 shadow-elegant sm:p-9">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-deep">
            KVKK Aydınlatma & Açık Rıza
          </p>
          <h1 className="font-display mt-2 text-2xl font-semibold tracking-tight">
            AI Medya İşleme Onayı
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{oda.title}</span>
            {oda.customer_name ? ` · ${oda.customer_name}` : ""}
          </p>

          <div className="mt-6 space-y-4 text-sm leading-relaxed text-foreground/80">
            <p>
              Bu etkinliğe yüklenen fotoğrafların{" "}
              <strong>tekli / toplu</strong> şeklinde otomatik düzenlenebilmesi için,
              fotoğraflarda <strong>yüz sayısı tespiti</strong> yapılır.
            </p>
            <ul className="list-inside list-disc space-y-1.5 text-foreground/70">
              <li>
                Yüz tespiti <strong>tamamen kendi sunucumuzda</strong> yapılır;
                fotoğraflarınız üçüncü taraf bir yapay zekâ servisine{" "}
                <strong>gönderilmez</strong>.
              </li>
              <li>
                Yalnızca <strong>yüz sayısı</strong> ve <strong>kategori</strong>{" "}
                (tekli/toplu/video) saklanır; yüz tanıma/kimliklendirme yapılmaz.
              </li>
              <li>Bu onay yalnızca bu etkinlik için geçerlidir ve istenildiğinde geri alınabilir.</li>
              <li>Onay vermezseniz fotoğraflar düzenlenmez; yöneticiniz elle düzenleyebilir.</li>
            </ul>
            <p className="text-xs text-muted-foreground">
              6698 sayılı KVKK kapsamında, biyometrik nitelikli olabilecek bu işleme için
              açık rızanız alınmaktadır. Onay tarihiniz ve IP adresiniz yalnızca ispat
              amacıyla kaydedilir.
            </p>
          </div>

          <div className="mt-7">
            <AiOnayKutusu
              token={odaKodu}
              zatenOnayli={oda.ai_medya_onay}
              onayTarihi={oda.ai_medya_onay_at}
            />
          </div>
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          <span className="font-display">WeddinAI</span> · Verileriniz şifreli ve izole saklanır
        </p>
      </div>
    </main>
  );
}
