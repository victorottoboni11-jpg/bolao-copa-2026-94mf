/**
 * API Route: /api/admin/results
 * Handles listing matches and finalizing match results
 */

import { supabase } from "../../../lib/supabase";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/admin/results?phase=group&status=pending
 * List matches with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const authHeader = request.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify token and admin status
    const { data: userData } = await supabase.auth.getUser(token);

    if (!userData?.user?.id) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { data: user } = await supabase
      .from("users")
      .select("is_admin")
      .eq("id", userData.user.id)
      .single();

    if (!user?.is_admin) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const phase = searchParams.get("phase");
    const status = searchParams.get("status");

    // Build query
    let query = supabase
      .from("matches")
      .select(
        `
        id,
        match_number,
        phase,
        group_name,
        home_team_id,
        away_team_id,
        home_score,
        away_score,
        status,
        is_finished,
        kickoff_at,
        stadium,
        home_team:home_team_id (id, name, fifa_code, flag_url),
        away_team:away_team_id (id, name, fifa_code, flag_url)
      `
      )
      .order("kickoff_at", { ascending: true });

    // Apply filters
    if (phase && phase !== "all") {
      query = query.eq("phase", phase);
    }
    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    const { data: matches, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      matches: matches || [],
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/results
 * Finalize a match result and recalculate predictions/rankings
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const authHeader = request.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: userData } = await supabase.auth.getUser(token);

    if (!userData?.user?.id) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { data: user } = await supabase
      .from("users")
      .select("is_admin")
      .eq("id", userData.user.id)
      .single();

    if (!user?.is_admin) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    // Get request body
    const { matchId, homeScore, awayScore } = await request.json();

    if (!matchId || homeScore === undefined || awayScore === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: matchId, homeScore, awayScore" },
        { status: 400 }
      );
    }

    // Validate scores
    if (typeof homeScore !== "number" || typeof awayScore !== "number") {
      return NextResponse.json(
        { error: "Scores must be numbers" },
        { status: 400 }
      );
    }

    if (homeScore < 0 || awayScore < 0) {
      return NextResponse.json(
        { error: "Scores cannot be negative" },
        { status: 400 }
      );
    }

    // Get the match
    const { data: match, error: matchError } = await supabase
      .from("matches")
      .select("*")
      .eq("id", matchId)
      .single();

    if (matchError || !match) {
      return NextResponse.json(
        { error: `Match not found: ${matchError?.message}` },
        { status: 404 }
      );
    }

    // Update match with result
    const { error: updateError } = await supabase
      .from("matches")
      .update({
        home_score: homeScore,
        away_score: awayScore,
        status: "finished",
        is_finished: true,
        finished_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", matchId);

    if (updateError) {
      return NextResponse.json(
        { error: `Failed to update match: ${updateError.message}` },
        { status: 400 }
      );
    }

    // Recalculate all predictions for this match
    const { data: predictions, error: predError } = await supabase
      .from("predictions")
      .select("*")
      .eq("match_id", matchId);

    if (predError) {
      console.error("Error fetching predictions:", predError);
      return NextResponse.json(
        { error: `Failed to recalculate predictions: ${predError.message}` },
        { status: 400 }
      );
    }

    if (predictions && predictions.length > 0) {
      // Import scoring function
      const { calculateMatchPoints } = await import("../../../lib/scoring");

      // Calculate points for each prediction
      const updates = predictions.map((pred) => {
        const scoring = calculateMatchPoints(pred, { ...match, home_score: homeScore, away_score: awayScore });
        return {
          id: pred.id,
          points: scoring.points,
          updated_at: new Date().toISOString(),
        };
      });

      // Update predictions
      const { error: updatePredError } = await supabase
        .from("predictions")
        .upsert(updates, { onConflict: "id" });

      if (updatePredError) {
        console.error("Error updating predictions:", updatePredError);
      }

      // Recalculate rankings for affected users
      const userIds = [...new Set(predictions.map((p) => p.user_id))];

      for (const userId of userIds) {
        const { data: userPreds } = await supabase
          .from("predictions")
          .select("points")
          .eq("user_id", userId);

        const matchPoints = userPreds?.reduce((sum, p) => sum + (p.points || 0), 0) || 0;

        const { data: preCopaData } = await supabase
          .from("pre_copa_predictions")
          .select("points")
          .eq("user_id", userId)
          .single();

        const preCopaPoints = preCopaData?.points || 0;
        const totalPoints = matchPoints + preCopaPoints;

        await supabase
          .from("rankings")
          .upsert(
            {
              user_id: userId,
              total_points: totalPoints,
              pre_copa_points: preCopaPoints,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" }
          );
      }
    }

    return NextResponse.json({
      success: true,
      message: "Match result finalized and rankings updated",
      updatedPredictions: predictions?.length || 0,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
