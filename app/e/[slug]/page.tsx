import { notFound } from "next/navigation";
import { GuestApp } from "@/components/guest/guest-app";
import { createAdminClient } from "@/lib/supabase/admin";

// Misafir sayfası veriye bağlı → istek anında render edilir.
export const dynamic = "force-dynamic";

export default async function GuestPage(props: PageProps<"/e/[slug]">) {
  const { slug } = await props.params;
  const temizSlug = typeof slug === "string" ? slug.trim() : "";
  if (!temizSlug) {
    notFound();
  }

  // Etkinliği slug ile bul. (Yalnızca yükleme için gereken alanlar.)
  const admin = createAdminClient();
  const { data: ev } = await admin
    .from("events")
    .select("id, title, event_type, status, expires_at")
    .ilike("slug", temizSlug)
    .maybeSingle();

  if (!ev || ev.status === "taslak") {
    notFound();
  }

  // Arşivlenmiş VEYA süresi dolmuş etkinlik: sayfa açılır ama yükleme kapalı.
  const suresiDoldu =
    !!ev.expires_at && new Date(ev.expires_at as string).getTime() <= Date.now();
  const kapali = ev.status === "arsivlendi" || suresiDoldu;

  return (
    <GuestApp
      eventId={ev.id as string}
      slug={temizSlug}
      baslik={ev.title as string}
      tur={ev.event_type as string}
      kapali={kapali}
    />
  );
}
