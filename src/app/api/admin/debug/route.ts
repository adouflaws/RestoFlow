import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  const { data: rows, error: selectError } = await supabaseAdmin
    .from("restaurants")
    .select("*")
    .limit(1);

  const columns = rows && rows.length > 0 ? Object.keys(rows[0]) : [];

  const { data: sqlResult, error: sqlError } = await supabaseAdmin.rpc("exec_sql", {
    query: "SELECT column_name FROM information_schema.columns WHERE table_name = 'restaurants' ORDER BY ordinal_position"
  }).maybeSingle();

  // Try notify to reload cache
  await supabaseAdmin.rpc("pg_notify", { channel: "pgrst", payload: "reload schema" }).maybeSingle();

  return NextResponse.json({
    api_columns: columns,
    sql_check: sqlResult,
    sql_error: sqlError?.message,
    select_error: selectError?.message,
  });
}
