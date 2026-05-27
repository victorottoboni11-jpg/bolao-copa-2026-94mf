import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../lib/supabase";

/**
 * POST /api/predictions
 * Body: { matchId, predictedHome, predictedAway }
 * Requires Authorization: Bearer <access_token>
 * Enforces server-side locking: predictions immutable 5 minutes before kickoff_at
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
    const { matchId, predictedHome, predictedAway } = body || {};

    if (!matchId || predictedHome === undefined || predictedAway === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: matchId, predictedHome, predictedAway" },
        { status: 400 }
      );
    }

    if (typeof predictedHome !== "number" || typeof predictedAway !== "number") {
      return NextResponse.json({ error: "Predictions must be numbers" }, { status: 400 });
    }

    // Fetch match kickoff_at from DB
    const { data: match, error: matchError } = await supabase
      .from("matches")
      .select("id, kickoff_at")
      .eq("id", matchId)
      .single();

    if (matchError || !match) {
      return NextResponse.json({ error: `Match not found: ${matchError?.message}` }, { status: 404 });
    }

    const kickoff = match.kickoff_at;
    if (kickoff) {
      const kickoffTime = new Date(kickoff).getTime();
      if (!Number.isNaN(kickoffTime)) {
        const cutoff = kickoffTime - 5 * 60 * 1000; // 5 minutes before kickoff
        const now = Date.now();
        if (now >= cutoff) {
          return NextResponse.json(
            { error: "Predictions are locked 5 minutes before kickoff" },
            { status: 403 }
          );
        }
      }
    }

    // Upsert prediction (use authenticated user id to avoid spoofing)
    const upsertRow = {
      user_id: userData.user.id,
      match_id: matchId,
      predicted_home: predictedHome,
      predicted_away: predictedAway,
      updated_at: new Date().toISOString(),
    };

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
