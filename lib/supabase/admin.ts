// =============================================================
// SERVICE-ROLE Supabase istemcisi — YALNIZCA SUNUCU TARAFI.
// RLS'i bypass eder; asla istemciye (tarayıcıya) import edilmemeli.
// Müşteri ve misafir Supabase'de kimliklenmediği için onların verisi
// bu istemci üzerinden, oda kimliği KOD İÇİNDE doğrulanarak okunur.
// =============================================================
import { createClient } from "@supabase/supabase-js";

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "Supabase service-role yapılandırması eksik (URL / SERVICE_ROLE_KEY).",
    );
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
