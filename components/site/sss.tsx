"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, HelpCircle } from "lucide-react";
import { Reveal } from "./reveal";

const sorular: { soru: string; cevap: string }[] = [
  {
    soru: "WeddinAI nedir, nasıl çalışır?",
    cevap:
      "Düğün ve etkinliklerde misafirlerin QR kod okutarak fotoğraf, video, sesli ve yazılı anı bıraktığı özel bir anı toplama platformudur. Masalara koyduğunuz QR'ı misafir okutur, anılar anında sizin özel odanıza akar.",
  },
  {
    soru: "Misafirlerin uygulama indirmesi gerekiyor mu?",
    cevap:
      "Hayır. Misafir QR'ı okutur, telefonun tarayıcısı açılır ve doğrudan yükleme yapar. Hesap açma, giriş yapma veya uygulama indirme yok.",
  },
  {
    soru: "Fotoğraflarım güvende ve gizli mi?",
    cevap:
      "Evet. Her etkinlik şifreli, izole özel bir odadır. Sadece size verilen oda kodu ve şifreyle girilir. Hiçbir müşteri başka bir müşterinin içeriğini göremez.",
  },
  {
    soru: "Misafirler birbirinin yüklediğini görebilir mi?",
    cevap:
      "Hayır. Misafir ekranı yalnızca yükleme ekranıdır. Misafirler galeriyi veya başkalarının yüklediklerini göremez, birbirleriyle etkileşime giremez.",
  },
  {
    soru: "Showroom'da fotoğraflarımı herkes görür mü?",
    cevap:
      "Sadece sizin seçip yayınlamak istediğiniz ve yöneticinin onayladığı fotoğraflar vitrine çıkar. Onaylamadığınız hiçbir içerik herkese açık olmaz.",
  },
  {
    soru: "İçerikler ne kadar süre saklanır?",
    cevap:
      "Gizlilik için her oda kurulduktan 7 gün sonra tüm içerikleriyle otomatik silinir. Bu süre içinde tüm anılarınızı tek tek veya toplu olarak indirebilirsiniz. İsterseniz süre uzatılabilir.",
  },
  {
    soru: "Anılarımı nasıl indiririm?",
    cevap:
      "Müşteri panelinizden tek bir içeriği indirebilir ya da hepsini seçip tek seferde ZIP olarak toplu indirebilirsiniz. Fotoğraflara tıklayıp büyütebilirsiniz.",
  },
  {
    soru: "Odama nasıl giriş yaparım?",
    cevap:
      "Size verilen özel linke tıklayın ya da ana sayfadaki Müşteri Girişi'nden oda kodunuzu ve şifrenizi girin.",
  },
  {
    soru: "Kaç fotoğraf veya video yüklenebilir?",
    cevap:
      "Etkinliğiniz boyunca yüzlerce fotoğraf ve video rahatça toplanır. Tek dosya boyutu makul sınırlar içinde tutulur; yoğun düğünler için sorun olmaz.",
  },
  {
    soru: "Nasıl başlarım?",
    cevap:
      "Fiyatlar sayfasından paketi seçip sipariş bırakın; sizin için özel odanız, müşteri linkiniz ve misafir QR kodunuz hazırlanır.",
  },
];

export function SSS() {
  const [acik, setAcik] = useState<number | null>(0);

  return (
    <section id="sss" className="mx-auto max-w-3xl px-5 py-20 sm:px-8">
      <Reveal className="text-center">
        <p className="text-sm font-medium uppercase tracking-widest text-primary-deep">
          Sık Sorulan Sorular
        </p>
        <h2 className="font-display mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          Aklınızdaki her şey
        </h2>
        <p className="mt-4 text-muted-foreground">
          Anılar güvende, kontrol sizde. Merak ettiklerinizin yanıtları burada.
        </p>
      </Reveal>

      <div className="mt-12 space-y-3">
        {sorular.map((s, i) => {
          const open = acik === i;
          return (
            <Reveal key={s.soru} delay={i * 0.04}>
              <div className="overflow-hidden rounded-2xl border border-border bg-card">
                <button
                  type="button"
                  onClick={() => setAcik(open ? null : i)}
                  aria-expanded={open}
                  className="flex w-full items-center gap-3 px-5 py-4 text-left"
                >
                  <HelpCircle className="h-5 w-5 shrink-0 text-primary" />
                  <span className="font-display flex-1 font-semibold">
                    {s.soru}
                  </span>
                  <Plus
                    className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-300 ${
                      open ? "rotate-45 text-primary" : ""
                    }`}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {open && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <p className="px-5 pb-5 pl-[3.25rem] text-sm leading-relaxed text-muted-foreground">
                        {s.cevap}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
