import { EtkinlikSihirbazi } from "@/components/dashboard/etkinlik-sihirbazi";

export default function YeniEtkinlikPage() {
  return (
    <div>
      <h1 className="font-display mb-7 text-center text-2xl font-semibold tracking-tight">
        Yeni Etkinlik Oluştur
      </h1>
      <EtkinlikSihirbazi />
    </div>
  );
}
