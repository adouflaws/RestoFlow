import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/supabase/server-auth";

export async function POST() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await supabase.rpc("reload_schema_cache");

  if (error) {
    const { error: notifyError } = await supabase.from("restaurants").select("id").limit(0);
    return NextResponse.json({
      message: "RPC failed, try reloading manually in Supabase Dashboard → Settings → API",
      rpc_error: error.message,
      fallback_error: notifyError?.message,
    }, { status: 500 });
  }

  return NextResponse.json({ message: "Schema cache reloaded" });
}
