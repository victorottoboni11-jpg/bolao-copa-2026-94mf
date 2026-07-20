import { NextResponse } from "next/server";
import { getServerSupabase } from "../../../lib/serverSupabase";

export async function GET() {
  try {
    const serverSupabase = getServerSupabase();
    const { data, error } = await serverSupabase
      .from("pre_copa_predictions")
      .select("user_id, pre_copa_points");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data || [] });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro interno" },
      { status: 500 }
    );
  }
}
