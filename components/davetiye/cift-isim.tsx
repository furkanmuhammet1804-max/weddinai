// =============================================================
// Çift ismi — daima merkez eksende, dikey hizalı:
//     Üst İsim
//        &
//     Alt İsim
// Kalp yok; ortada büyük, zarif bir "&". İsimler asla aynı satıra
// alınmaz — kısa/uzun her isimde simetri korunur.
// =============================================================

interface Props {
  gelin: string;
  damat: string;
  className?: string;
  isimClassName?: string;
  ampClassName?: string;
  isimStyle?: React.CSSProperties;
  ampStyle?: React.CSSProperties;
}

export function CiftIsim({
  gelin,
  damat,
  className = "",
  isimClassName = "font-display text-3xl leading-[1.12]",
  ampClassName = "font-display text-2xl italic",
  isimStyle,
  ampStyle,
}: Props) {
  return (
    <div className={`flex flex-col items-center text-center ${className}`}>
      <span className={`block break-words ${isimClassName}`} style={isimStyle}>
        {gelin}
      </span>
      <span
        className={`my-1.5 block leading-none ${ampClassName}`}
        style={ampStyle}
        aria-hidden
      >
        &amp;
      </span>
      <span className={`block break-words ${isimClassName}`} style={isimStyle}>
        {damat}
      </span>
    </div>
  );
}
