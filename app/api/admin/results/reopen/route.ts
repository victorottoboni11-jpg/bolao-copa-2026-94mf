/**
 * API Route: /api/admin/results/[matchId]/reopen
 * Reopens a finished match for editing
 */

import { supabase } from "../../../../lib/supabase";
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
        updated_at: new Date().toISOString(),
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
