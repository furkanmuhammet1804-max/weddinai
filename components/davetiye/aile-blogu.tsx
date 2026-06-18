// =============================================================
// Aile takdimi — iki simetrik kolon:
//     [ Gelin tarafı ]        [ Damat tarafı ]
//        Ad                       Ad
//        Soyad                    Soyad
// Sol = gelin, sağ = damat. Her kolon kendi içinde ortalı; soyisim adın
// tam altında. İki kolon arasında nefes alan boşluk. Tek taraf girildiyse
// ortada tek kolon gösterilir. Premium, simetrik, responsive.
// =============================================================

interface Props {
  gelinAile: string | null;
  damatAile: string | null;
  className?: string;
  adStyle?: React.CSSProperties; // ad/soyad rengi (tema)
  ayracStyle?: React.CSSProperties; // ince dikey ayraç rengi (tema vurgu)
}

// Bir tarafın serbest metnini satırlara böler:
//  - Açık satır sonu varsa onu kullan (kullanıcı kendi düzenini girmiş).
//  - Yoksa son kelimeyi "soyisim" satırı, kalanı "ad" satırı yap
//    ("Ayşe Yılmaz" → "Ayşe" / "Yılmaz").
function satirlara(metin: string): string[] {
  const t = metin.trim();
  if (t.includes("\n")) {
    return t.split("\n").map((s) => s.trim()).filter(Boolean);
  }
  const parcalar = t.split(/\s+/);
  if (parcalar.length <= 1) return [t];
  const soyad = parcalar.pop() as string;
  return [parcalar.join(" "), soyad];
}

function Taraf({
  metin,
  adStyle,
}: {
  metin: string;
  adStyle?: React.CSSProperties;
}) {
  const satirlar = satirlara(metin);
  return (
    <div className="flex min-w-0 flex-col items-center text-center">
      {satirlar.map((s, i) => (
        <span
          key={i}
          className="font-display block break-words leading-[1.25]"
          style={adStyle}
        >
          {s}
        </span>
      ))}
    </div>
  );
}

export function AileBlogu({
  gelinAile,
  damatAile,
  className = "",
  adStyle,
  ayracStyle,
}: Props) {
  const sol = gelinAile?.trim() || "";
  const sag = damatAile?.trim() || "";
  if (!sol && !sag) return null;

  // Tek taraf → ortada tek kolon.
  if (!sol || !sag) {
    return (
      <div className={`flex justify-center ${className}`}>
        <Taraf metin={sol || sag} adStyle={adStyle} />
      </div>
    );
  }

  // İki taraf → simetrik iki kolon + nefes alan boşluk + ince ayraç.
  return (
    <div
      className={`mx-auto grid w-full max-w-md grid-cols-[1fr_auto_1fr] items-start gap-x-6 sm:gap-x-10 ${className}`}
    >
      <Taraf metin={sol} adStyle={adStyle} />
      <span
        aria-hidden
        className="mt-1 h-10 w-px self-center justify-self-center sm:h-12"
        style={{ background: "currentColor", opacity: 0.25, ...ayracStyle }}
      />
      <Taraf metin={sag} adStyle={adStyle} />
    </div>
  );
}
