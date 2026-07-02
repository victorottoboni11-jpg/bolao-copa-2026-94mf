import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "../../../lib/serverSupabase";

export async function POST(request: NextRequest) {
  try {
    const authorization = request.headers.get("Authorization") || "";
    const token = authorization.replace("Bearer", "").trim();

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const serverSupabase = getServerSupabase();

    const { data: userData, error: userError } = await serverSupabase.auth.getUser(token);
    if (userError || !userData?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: userRow } = await serverSupabase
      .from("users")
      .select("is_admin")
      .eq("id", userData.user.id)
      .single();

    if (!userRow?.is_admin) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    // Calcular ranking direto via SQL usando os points salvos nas predictions
    const { data: rankData, error: rankError } = await serverSupabase.rpc("recalculate_rankings_from_points");

    if (rankError) {
      // Fallback: calcular manualmente via queries
      const { data: predictions } = await serverSupabase
        .from("predictions")
        .select("user_id, points, match_id");

      const { data: matches } = await serverSupabase
        .from("matches")
        .select("id, phase, is_finished");

      const { data: users } = await serverSupabase
        .from("users")
        .select("id, full_name, email");

      const { data: preCopa } = await serverSupabase
        .from("pre_copa_predictions")
        .select("user_id, pre_copa_points");

      if (!predictions || !matches || !users) {
        return NextResponse.json({ error: "Erro ao buscar dados" }, { status: 500 });
      }

      const matchMap = new Map((matches || []).map((m: any) => [m.id, m]));
      const userMap = new Map((users || []).map((u: any) => [u.id, u]));
      const preCopaMap = new Map((preCopa || []).map((p: any) => [p.user_id, p.pre_copa_points || 0]));

      const scoreMap = new Map<string, any>();

      predictions.forEach((pred: any) => {
        const match = matchMap.get(pred.match_id);
        if (!match || !match.is_finished) return;

        const pts = Number(pred.points) || 0;
        const userId = pred.user_id;
        const isKnockout = match.phase !== "group_stage" && match.phase !== "friendly";

        if (scoreMap.has(userId)) {
          const e = scoreMap.get(userId);
          e.total_points += pts;
          if (isKnockout) e.knockout_points += pts;
          else e.group_stage_points += pts;
        } else {
          const user = userMap.get(userId);
          scoreMap.set(userId, {
            user_id: userId,
            user_name: user?.full_name || user?.email || "—",
            total_points: pts,
            group_stage_points: isKnockout ? 0 : pts,
            knockout_points: isKnockout ? pts : 0,
            pre_copa_points: 0,
            exact_scores: 0,
            correct_results: 0,
          });
        }
      });

      // Adicionar pré-copa
      preCopaMap.forEach((pts, userId) => {
        if (scoreMap.has(userId)) {
          const e = scoreMap.get(userId);
          e.total_points += pts;
          e.pre_copa_points = pts;
        } else {
          const user = userMap.get(userId);
          scoreMap.set(userId, {
            user_id: userId,
            user_name: user?.full_name || user?.email || "—",
            total_points: pts,
            group_stage_points: 0,
            knockout_points: 0,
            pre_copa_points: pts,
            exact_scores: 0,
            correct_results: 0,
          });
        }
      });

      const entries = Array.from(scoreMap.values())
        .sort((a, b) => b.total_points - a.total_points)
        .map((e, i) => ({ ...e, position: i + 1 }));

      // Upsert no banco
      for (const entry of entries) {
        await serverSupabase
          .from("rankings")
          .upsert({
            user_id: entry.user_id,
            total_points: entry.total_points,
            position: entry.position,
            exact_scores: entry.exact_scores,
            correct_results: entry.correct_results,
          }, { onConflict: "user_id" });
      }

      return NextResponse.json({ success: true, count: entries.length });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
