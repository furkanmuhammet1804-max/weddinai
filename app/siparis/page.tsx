import { SiparisForm } from "@/components/site/siparis-form";

export default async function SiparisPage(props: PageProps<"/siparis">) {
  const sp = await props.searchParams;
  const ham = Array.isArray(sp.paket) ? sp.paket[0] : sp.paket;
  const paket = ["baslangic", "standart", "premium"].includes(ham ?? "")
    ? (ham as string)
    : "standart";
  return <SiparisForm paket={paket} />;
}
