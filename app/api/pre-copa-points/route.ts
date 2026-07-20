import { NextResponse } from "next/server";
import { supabase } from "../../lib/supabase";

export async function GET() {
  try {
    const { data, error } = await supabase
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
