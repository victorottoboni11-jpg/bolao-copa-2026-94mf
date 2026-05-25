/**
 * API Route: /api/admin/pre-copa
 * Manages official pre-Copa outcomes and scoring
 */

import { supabase } from "../../../lib/supabase";
import { NextRequest, NextResponse } from "next/server";

const OFFICIAL_PRE_COPA_ID = "00000000-0000-0000-0000-000000000002";

/**
 * POST /api/admin/pre-copa
 * Update official pre-Copa outcomes and recalculate all user points
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

    const {
      champion,
      runner_up,
      top_scorer,
      top_scorer_goals,
      best_player,
      best_goalkeeper,
      most_assists,
      fair_play,
      revelation,
    } = await request.json();

    if (
      !champion ||
      !runner_up ||
      !top_scorer ||
      top_scorer_goals === undefined ||
      !best_player ||
      !best_goalkeeper ||
      !most_assists ||
      !fair_play ||
      !revelation
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const { data: predictions, error: predError } = await supabase
      .from("pre_copa_predictions")
      .select("*");

    if (predError) {
      return NextResponse.json(
        { error: `Failed to fetch predictions: ${predError.message}` },
        { status: 400 }
      );
    }

    const { error: officialError } = await supabase
      .from("official_pre_copa_outcomes")
      .upsert(
        {
          id: OFFICIAL_PRE_COPA_ID,
          champion_team: champion,
          runner_up_team: runner_up,
          top_scorer_player: top_scorer,
          top_scorer_goals: Number(top_scorer_goals),
          golden_ball_player: best_player,
          best_goalkeeper_player: best_goalkeeper,
          most_assists_player: most_assists,
          most_assists_count: 0,
          fair_play_team: fair_play,
          revelation_player: revelation,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );

    if (officialError) {
      return NextResponse.json(
        { error: `Failed to save official outcomes: ${officialError.message}` },
        { status: 400 }
      );
    }

    if (!predictions || predictions.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Official outcomes updated (no predictions to score)",
        updatedUsers: 0,
      });
    }

    const { calculatePreCopaPoints } = await import("../../../lib/scoring");

    const updates = predictions.map((pred) => {
      const points = calculatePreCopaPoints(
        pred.champion_team.toLowerCase() === champion.toLowerCase(),
        pred.runner_up_team.toLowerCase() === runner_up.toLowerCase(),
        pred.top_scorer_player.toLowerCase() === top_scorer.toLowerCase(),
        Number(pred.top_scorer_goals) === Number(top_scorer_goals),
        pred.golden_ball_player.toLowerCase() === best_player.toLowerCase(),
        pred.best_goalkeeper_player?.toLowerCase() === best_goalkeeper.toLowerCase(),
        pred.most_assists_player.toLowerCase() === most_assists.toLowerCase(),
        pred.fair_play_team.toLowerCase() === fair_play.toLowerCase(),
        pred.revelation_player.toLowerCase() === revelation.toLowerCase()
      );

      return {
        id: pred.id,
        points,
        updated_at: new Date().toISOString(),
      };
    });

    // Update all pre-Copa predictions
    const { error: updateError } = await supabase
      .from("pre_copa_predictions")
      .upsert(updates, { onConflict: "id" });

    if (updateError) {
      return NextResponse.json(
        { error: `Failed to update predictions: ${updateError.message}` },
        { status: 400 }
      );
    }

    // Recalculate rankings for all affected users
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

    return NextResponse.json({
      success: true,
      message: "Official pre-Copa outcomes updated and rankings recalculated",
      updatedUsers: predictions.length,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
