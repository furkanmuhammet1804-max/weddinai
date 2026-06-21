import { notFound } from "next/navigation";
import { albumGetir, albumHavuz } from "@/lib/album/veri";
import { AlbumEditor } from "@/components/admin/album-editor";

export const dynamic = "force-dynamic";

export default async function AdminAlbumEditorPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const album = await albumGetir(id);
  if (!album) notFound();

  const havuz = await albumHavuz(
    album.event_id,
    album.fotograflar.map((f) => f.media_id),
  );

  return (
    <AlbumEditor
      id={album.id}
      eventTitle={album.event_title}
      baslikIlk={album.baslik}
      paket={album.paket}
      durumIlk={album.durum}
      slugIlk={album.slug}
      kapakIlk={album.kapak_media_id}
      fotograflarIlk={album.fotograflar}
      havuz={havuz}
    />
  );
}
