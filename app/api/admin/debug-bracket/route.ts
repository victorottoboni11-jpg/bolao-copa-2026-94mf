import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "../../../lib/serverSupabase";
import { calculateGroupStandings, rankGroup } from "../../../lib/bracket";

export async function GET(request: NextRequest) {
  try {
    const serverSupabase = getServerSupabase();
    const allStandings = await calculateGroupStandings(serverSupabase);

    const groupA = allStandings.filter(t => t.group_name === "A");
    const rankedA = rankGroup(groupA);

    return NextResponse.json({
      totalStandings: allStandings.length,
      groupA: groupA,
      rankedA: rankedA,
      sampleStanding: allStandings[0] ?? null,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro" },
      { status: 500 }
    );
  }
}
