import { albumListe } from "@/lib/album/veri";
import { AlbumListe } from "@/components/admin/album-liste";

export const dynamic = "force-dynamic";

export default async function AdminAlbumPage() {
  const liste = await albumListe();
  return <AlbumListe liste={liste} />;
}
