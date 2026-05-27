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
    const phase = (searchParams.get("phase") || "all").toLowerCase();
    const status = (searchParams.get("status") || "all").toLowerCase();

    const phaseAliases: Record<string, string[]> = {
      all: [],
      friendly: ["friendly"],
      group: ["group", "group_stage"],
      knockout: ["round_of_32", "round_of_16", "quarterfinal", "quarterfinals", "semifinal", "semifinals", "third_place", "final"],
    };

    const statusAliases: Record<string, string[]> = {
      all: [],
      pending: ["pending", "scheduled"],
      scheduled: ["scheduled", "pending"],
      live: ["live"],
      finished: ["finished", "complete", "completed"],
    };

    const normalizedPhaseValues = phaseAliases[phase] || [phase];
    const normalizedStatusValues = statusAliases[status] || [status];

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
        match_date,
        stadium,
        home_team:teams!home_team_id (id, name, fifa_code, flag_url),
        away_team:teams!away_team_id (id, name, fifa_code, flag_url)
      `
      )
      .order("match_date", { ascending: true });

    // Apply filters
    if (normalizedPhaseValues.length > 0) {
      query = query.in("phase", normalizedPhaseValues);
    }
    if (normalizedStatusValues.length > 0) {
      query = query.in("status", normalizedStatusValues);
    }

    const { data: matches, error } = await query;

    if (error) {
      console.error("[admin/results] query failed", {
        error: error.message,
        phase,
        status,
        phaseValues: normalizedPhaseValues,
        statusValues: normalizedStatusValues,
      });
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const phasesFound = Array.from(new Set((matches || []).map((match: any) => match.phase).filter(Boolean))).sort();
    const statusesFound = Array.from(new Set((matches || []).map((match: any) => match.status || (match.is_finished ? "finished" : "pending")).filter(Boolean))).sort();

    console.log("[admin/results] debug", {
      totalRows: (matches || []).length,
      filters: { phase, status },
      phasesFound,
      statusesFound,
    });

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

      // Recalculate rankings for affected users in a single batched operation
      const userIds = [...new Set(predictions.map((p) => p.user_id))];

      if (userIds.length > 0) {
        // Fetch all predictions points for affected users
        const { data: userPredsData, error: userPredsError } = await supabase
          .from("predictions")
          .select("user_id, points")
          .in("user_id", userIds);

        if (userPredsError) {
          console.error("Error fetching user predictions for rankings:", userPredsError);
        }

        // Sum points per user
        const pointsByUser = new Map<string, number>();
        (userPredsData || []).forEach((row: any) => {
          const uid = String(row.user_id);
          const pts = Number(row.points || 0);
          pointsByUser.set(uid, (pointsByUser.get(uid) || 0) + pts);
        });

        // Fetch pre-copa points for affected users in one query
        const { data: preCopaData } = await supabase
          .from("pre_copa_predictions")
          .select("user_id, points")
          .in("user_id", userIds);

        const preCopaByUser = new Map<string, number>();
        (preCopaData || []).forEach((row: any) => {
          preCopaByUser.set(String(row.user_id), Number(row.points || 0));
        });

        // Build rankings upsert payload
        const rankingsUpserts = userIds.map((uid) => {
          const matchPoints = pointsByUser.get(uid) || 0;
          const preCopaPoints = preCopaByUser.get(uid) || 0;
          return {
            user_id: uid,
            total_points: matchPoints + preCopaPoints,
            pre_copa_points: preCopaPoints,
            updated_at: new Date().toISOString(),
          };
        });

        // Upsert all rankings in one call to avoid duplicate recalculations
        const { error: rankingError } = await supabase
          .from("rankings")
          .upsert(rankingsUpserts, { onConflict: "user_id" });

        if (rankingError) {
          console.error("Error upserting rankings:", rankingError);
        }
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
