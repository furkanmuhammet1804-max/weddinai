import { notFound } from "next/navigation";
import { hatiraGetirId } from "@/lib/hatira/veri";
import { HatiraEditor } from "@/components/admin/hatira-editor";

export const dynamic = "force-dynamic";

export default async function AdminHatiraEditorPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const defter = await hatiraGetirId(id);
  if (!defter) notFound();

  return (
    <HatiraEditor
      id={defter.id}
      eventId={defter.event_id}
      baslikIlk={defter.baslik}
      icerikIlk={defter.icerik ?? ""}
      durumIlk={defter.durum}
      slugIlk={defter.slug}
      eventTitle={defter.event_title}
    />
  );
}
