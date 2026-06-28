import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "../../../lib/serverSupabase";

export async function GET(request: NextRequest) {
  try {
    const serverSupabase = getServerSupabase();
    const { data, error } = await serverSupabase
      .from("matches")
      .select(`
        id, match_number, phase, kickoff_at,
        home_team_info:home_team_id (id, name),
        away_team_info:away_team_id (id, name)
      `)
      .eq("phase", "round_of_32")
      .order("match_number", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro" },
      { status: 500 }
    );
  }
}
