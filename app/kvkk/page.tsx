import type { Metadata } from "next";
import { SiteNav } from "@/components/site/site-nav";
import { SiteFooter } from "@/components/site/site-footer";

export const metadata: Metadata = {
  title: "Gizlilik & KVKK — WeddinAI",
  description:
    "WeddinAI gizlilik politikası ve KVKK aydınlatma metni. Verileriniz şifreli, izole ve süreli saklanır.",
};

const bolumler: { baslik: string; icerik: string[] }[] = [
  {
    baslik: "1. Veri Sorumlusu",
    icerik: [
      "WeddinAI olarak kişisel verilerinizin güvenliğine önem veriyoruz. Bu metin, 6698 sayılı KVKK kapsamında bilgilendirme amacı taşır.",
    ],
  },
  {
    baslik: "2. Toplanan Veriler",
    icerik: [
      "Misafirlerin etkinlik odasına yüklediği fotoğraf, video, sesli ve yazılı anılar.",
      "Sipariş/iletişim sırasında paylaşılan ad, telefon ve e-posta bilgileri.",
    ],
  },
  {
    baslik: "3. İşleme Amacı",
    icerik: [
      "İçerikler yalnızca ilgili etkinliğin sahibine (müşteriye) sunulmak ve talep halinde indirilmek için işlenir.",
      "İletişim bilgileri yalnızca sipariş ve destek süreçleri için kullanılır.",
    ],
  },
  {
    baslik: "4. Gizlilik ve İzolasyon",
    icerik: [
      "Her etkinlik şifreli, izole bir odadır. Bir müşterinin içeriğine başka müşteri erişemez.",
      "Misafirler birbirlerinin yüklediği içerikleri göremez; misafir ekranı yalnızca yükleme amaçlıdır.",
      "Showroom vitrininde yalnızca müşterinin seçip yöneticinin onayladığı içerikler yayınlanır.",
    ],
  },
  {
    baslik: "5. Saklama Süresi",
    icerik: [
      "Gizlilik gereği her oda, oluşturulduktan 7 gün sonra tüm içerikleriyle birlikte otomatik ve kalıcı olarak silinir.",
      "Bu süre içinde içeriklerinizi indirebilirsiniz. Süre, talep üzerine uzatılabilir.",
    ],
  },
  {
    baslik: "6. Haklarınız",
    icerik: [
      "Verilerinizin silinmesini, düzeltilmesini veya kendinize aktarılmasını talep edebilirsiniz.",
      "Talepleriniz için WhatsApp/iletişim kanallarımızdan bize ulaşabilirsiniz.",
    ],
  },
];

export default function KvkkPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteNav />
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-16 sm:px-8">
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Gizlilik &amp; KVKK
        </h1>
        <p className="mt-3 text-muted-foreground">
          Anılar güvende, kontrol sizde. Verilerinizi nasıl koruduğumuzun özeti.
        </p>
        <div className="mt-10 space-y-8">
          {bolumler.map((b) => (
            <section key={b.baslik}>
              <h2 className="font-display text-lg font-semibold">{b.baslik}</h2>
              <div className="mt-2 space-y-2">
                {b.icerik.map((p, i) => (
                  <p key={i} className="text-sm leading-relaxed text-muted-foreground">
                    {p}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
