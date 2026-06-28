import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "../../../lib/serverSupabase";
import { generateBracket } from "../../../lib/bracket";

export async function GET(request: NextRequest) {
  try {
    const serverSupabase = getServerSupabase();
    const bracket = await generateBracket(serverSupabase);

    const results: any[] = [];

    for (const [matchNumber, { home_team_id, away_team_id }] of Object.entries(bracket)) {
      const updateData: Record<string, string> = {};
      if (home_team_id) updateData.home_team_id = home_team_id;
      if (away_team_id) updateData.away_team_id = away_team_id;

      const { data, error, count } = await serverSupabase
        .from("matches")
        .update(updateData)
        .eq("match_number", Number(matchNumber))
        .select();

      results.push({
        matchNumber,
        updateData,
        error: error?.message ?? null,
        dataReturned: data,
        rowsAffected: data?.length ?? 0,
      });
    }

    return NextResponse.json({ results });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro" },
      { status: 500 }
    );
  }
}
