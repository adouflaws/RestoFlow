import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/guards";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { data: rows, error: selectError } = await supabaseAdmin
    .from("restaurants")
    .select("*")
    .limit(1);

  const columns = rows && rows.length > 0 ? Object.keys(rows[0]) : [];

  const { data: sqlResult, error: sqlError } = await supabaseAdmin.rpc("exec_sql", {
    query: "SELECT column_name FROM information_schema.columns WHERE table_name = 'restaurants' ORDER BY ordinal_position"
  }).maybeSingle();

  await supabaseAdmin.rpc("pg_notify", { channel: "pgrst", payload: "reload schema" }).maybeSingle();

  return NextResponse.json({
    api_columns: columns,
    sql_check: sqlResult,
    sql_error: sqlError?.message,
    select_error: selectError?.message,
  });
}
