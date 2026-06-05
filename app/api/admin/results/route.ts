/**
 * API Route: /api/admin/results
 * Handles listing matches and finalizing match results
 */

import { getServerSupabase } from "../../../lib/serverSupabase";
import { normalizeMatchPhase } from "../../../lib/phases";
import { recalculateRankings } from "../../../lib/rankings";
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
    const supabase = getServerSupabase();
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
      group: ["group_stage"],
      knockout: ["round_of_32", "round_of_16", "quarterfinal", "semifinal", "third_place", "final"],
    };

    const statusAliases: Record<string, string[]> = {
      all: [],
      pending: ["pending", "scheduled"],
      scheduled: ["scheduled", "pending"],
      live: ["live"],
      finished: ["finished", "complete", "completed"],
    };

    const normalizedPhaseValues = (phaseAliases[phase] || [phase])
      .filter((value, index, array) => array.indexOf(value) === index);
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

    const supabase = getServerSupabase();
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
    const { matchId, homeScore, awayScore, winner, penalties } = await request.json();

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
    // Determinar winner_type baseado no placar e penaltis
    const winnerType = penalties ? "penalties" : "normal";

    const { error: updateError } = await supabase
      .from("matches")
      .update({
        home_score: homeScore,
        away_score: awayScore,
        status: "finished",
        is_finished: true,
        ...(winner ? { winner, winner_type: winnerType } : {}),
      })
      .eq("id", matchId);

    if (updateError) {
      return NextResponse.json(
        { error: `Failed to update match: ${updateError.message}` },
        { status: 400 }
      );
    }

    console.log("[admin/results] match updated", { matchId, homeScore, awayScore });

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
      const { calculateMatchPoints } = await import("../../../lib/scoring");

      // Calculate points for each prediction and update one by one
      for (const pred of predictions) {
        const scoring = calculateMatchPoints(pred, { ...match, home_score: homeScore, away_score: awayScore });

        const { error: updatePredError } = await supabase
          .from("predictions")
          .update({
            points: scoring.points,
            updated_at: new Date().toISOString(),
          })
          .eq("id", pred.id);

        if (updatePredError) {
          console.error("Error updating prediction:", pred.id, updatePredError);
        }
      }
    }

    console.log("[admin/results] recalculating full rankings after finalizing match", { matchId });
    await recalculateRankings(getServerSupabase());
    console.log("[admin/results] rankings recalculated");

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

