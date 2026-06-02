/**
 * API Route: /api/admin/results/[matchId]/reopen
 * Reopens a finished match for editing
 */

import { getServerSupabase } from "../../../../lib/serverSupabase";
import { recalculateRankings } from "../../../../lib/rankings";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/admin/results/reopen
 * Reopen a finished match and clear prediction points
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

    // Get matchId from request body
    const body = await request.json();
    const { matchId } = body;

    if (!matchId) {
      return NextResponse.json(
        { error: "Match ID is required" },
        { status: 400 }
      );
    }

    // Update match to pending status
    const { error: updateError } = await supabase
      .from("matches")
      .update({
        status: "pending",
        is_finished: false,
        finished_at: null,
      })
      .eq("id", matchId);

    if (updateError) {
      return NextResponse.json(
        { error: `Failed to reopen match: ${updateError.message}` },
        { status: 400 }
      );
    }

    // Clear prediction points for this match
    const { data: predictions, error: predError } = await supabase
      .from("predictions")
      .select("user_id")
      .eq("match_id", matchId);

    if (predError) {
      console.error("Error fetching predictions:", predError);
      return NextResponse.json(
        { error: `Failed to clear predictions: ${predError.message}` },
        { status: 400 }
      );
    }

    if (predictions && predictions.length > 0) {
      // Reset points to 0 for all predictions of this match
      const { error: updatePredError } = await supabase
        .from("predictions")
        .update({ points: 0, updated_at: new Date().toISOString() })
        .eq("match_id", matchId);

      if (updatePredError) {
        console.error("Error clearing prediction points:", updatePredError);
      }

      console.log("[admin/results/reopen] predictions reset for match", { matchId, affected: predictions.length });
      console.log("[admin/results/reopen] recalculating full rankings after reopening match", { matchId });
      await recalculateRankings(getServerSupabase());
      console.log("[admin/results/reopen] rankings recalculated");
    }

    return NextResponse.json({
      success: true,
      message: "Match reopened and predictions reset",
      affectedPredictions: predictions?.length || 0,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
