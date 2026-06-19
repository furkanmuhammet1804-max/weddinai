// Admin — AI İşlem Geçmişi (Faz 0).
// Tüm AI çağrılarının kaydı: işlem türü, model, durum, token, maliyet, IP.
import { Sparkles, CheckCircle2, AlertTriangle, Coins } from "lucide-react";
import { aiLogListe, aiLogOzet } from "@/lib/ai/logger";
import { maliyetFormatla } from "@/lib/ai/cost";

export const dynamic = "force-dynamic";

const ISLEM_ETIKET: Record<string, string> = {
  "davetiye-oneri": "Davetiye Önerisi",
};

function tarihFormat(iso: string): string {
  return new Date(iso).toLocaleString("tr-TR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AiGecmisPage() {
  const [loglar, ozet] = await Promise.all([aiLogListe(150), aiLogOzet()]);

  const kartlar = [
    { icon: Sparkles, etiket: "Toplam İşlem", deger: String(ozet.toplam) },
    { icon: CheckCircle2, etiket: "Başarılı", deger: String(ozet.basarili) },
    { icon: AlertTriangle, etiket: "Hatalı", deger: String(ozet.hatali) },
    { icon: Coins, etiket: "Toplam Maliyet", deger: maliyetFormatla(ozet.toplamMaliyet) },
  ];

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary-deep">
          <Sparkles className="h-5 w-5" />
        </span>
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            AI İşlem Geçmişi
          </h1>
          <p className="text-sm text-muted-foreground">
            Yapay zekâ çağrılarının kullanım ve maliyet kaydı.
          </p>
        </div>
      </div>

      <div className="mt-7 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {kartlar.map((k) => {
          const Icon = k.icon;
          return (
            <div
              key={k.etiket}
              className="rounded-2xl border border-border bg-card p-5 text-center shadow-sm"
            >
              <Icon className="mx-auto h-5 w-5 text-primary" />
              <p className="font-display mt-2 text-2xl font-semibold">{k.deger}</p>
              <p className="text-xs text-muted-foreground">{k.etiket}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-7 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-medium">Tarih</th>
                <th className="px-4 py-3 font-medium">İşlem</th>
                <th className="px-4 py-3 font-medium">Model</th>
                <th className="px-4 py-3 font-medium">Durum</th>
                <th className="px-4 py-3 text-right font-medium">Token</th>
                <th className="px-4 py-3 text-right font-medium">Maliyet</th>
                <th className="px-4 py-3 text-right font-medium">Süre</th>
                <th className="px-4 py-3 font-medium">IP</th>
              </tr>
            </thead>
            <tbody>
              {loglar.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-10 text-center text-muted-foreground"
                  >
                    Henüz AI işlemi kaydedilmedi.
                  </td>
                </tr>
              )}
              {loglar.map((l) => (
                <tr
                  key={l.id}
                  className="border-b border-border/60 last:border-0"
                >
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                    {tarihFormat(l.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    {ISLEM_ETIKET[l.islem_tip] ?? l.islem_tip}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                    {l.model}
                  </td>
                  <td className="px-4 py-3">
                    {l.basari ? (
                      <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                        Başarılı
                      </span>
                    ) : (
                      <span
                        className="inline-flex items-center rounded-full bg-rose-soft px-2 py-0.5 text-xs font-medium text-rose"
                        title={l.hata ?? undefined}
                      >
                        Hata
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-muted-foreground">
                    {(l.input_token + l.output_token).toLocaleString("tr-TR")}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-muted-foreground">
                    {maliyetFormatla(Number(l.maliyet_usd) || 0)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-muted-foreground">
                    {l.sure_ms != null ? `${(l.sure_ms / 1000).toFixed(1)}s` : "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                    {l.ip ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
