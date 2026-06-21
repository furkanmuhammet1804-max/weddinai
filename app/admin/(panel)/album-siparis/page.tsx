import { albumSiparisListe } from "@/lib/album/veri";
import { AlbumSiparisListe } from "@/components/admin/album-siparis-liste";

export const dynamic = "force-dynamic";

export default async function AdminAlbumSiparisPage() {
  const liste = await albumSiparisListe();
  return <AlbumSiparisListe liste={liste} />;
}
