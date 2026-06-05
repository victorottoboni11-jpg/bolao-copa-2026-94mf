import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../lib/supabase";

/**
 * POST /api/predictions
 * Body: { matchId, predictedHome, predictedAway, predictedWinner?, predictedPenalties? }
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: userData } = await supabase.auth.getUser(token);
    if (!userData?.user?.id) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const body = await request.json();
    const { matchId, predictedHome, predictedAway, predictedWinner, predictedPenalties } = body || {};

    if (!matchId || predictedHome === undefined || predictedAway === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: matchId, predictedHome, predictedAway" },
        { status: 400 }
      );
    }

    if (typeof predictedHome !== "number" || typeof predictedAway !== "number") {
      return NextResponse.json({ error: "Predictions must be numbers" }, { status: 400 });
    }

    // Fetch match kickoff_at and phase from DB
    const { data: match, error: matchError } = await supabase
      .from("matches")
      .select("id, kickoff_at, phase")
      .eq("id", matchId)
      .single();

    if (matchError || !match) {
      return NextResponse.json({ error: `Match not found: ${matchError?.message}` }, { status: 404 });
    }

    const kickoff = match.kickoff_at;
    if (kickoff) {
      const kickoffTime = new Date(kickoff).getTime();
      if (!Number.isNaN(kickoffTime)) {
        const cutoff = kickoffTime - 30 * 60 * 1000;
        if (Date.now() >= cutoff) {
          return NextResponse.json(
            { error: "Predictions are locked 30 minutes before kickoff" },
            { status: 403 }
          );
        }
      }
    }

    const KNOCKOUT_PHASES = ["round_of_32", "round_of_16", "quarterfinal", "semifinal", "third_place", "final"];
    const isKnockout = KNOCKOUT_PHASES.includes(match.phase);

    const upsertRow: Record<string, unknown> = {
      user_id: userData.user.id,
      match_id: matchId,
      predicted_home: predictedHome,
      predicted_away: predictedAway,
      updated_at: new Date().toISOString(),
    };

    // Salvar classificado e pênaltis apenas no mata-mata
    if (isKnockout) {
      upsertRow.predicted_winner = predictedWinner ?? null;
      upsertRow.predicted_penalties = predictedPenalties ?? false;
    }

    const { data, error } = await supabase
      .from("predictions")
      .upsert([upsertRow], { onConflict: "user_id,match_id" })
      .select("*")
      .single();

    if (error) {
      console.error("Error saving prediction (server):", error);
      return NextResponse.json({ error: `Failed to save prediction: ${error.message}` }, { status: 400 });
    }

    return NextResponse.json({ success: true, prediction: data });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
  }
}
