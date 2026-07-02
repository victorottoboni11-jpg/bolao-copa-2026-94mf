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

    // Buscar soma real dos pontos de cada usuário direto do banco
    const { data: users } = await serverSupabase
      .from("users")
      .select("id, full_name, email");

    const { data: predictions } = await serverSupabase
      .from("predictions")
      .select("user_id, points, match_id");

    const { data: matches } = await serverSupabase
      .from("matches")
      .select("id, phase, is_finished, home_score, away_score")
      .eq("is_finished", true);

    const { data: preCopa } = await serverSupabase
      .from("pre_copa_predictions")
      .select("user_id, pre_copa_points");

    if (!users || !predictions || !matches) {
      return NextResponse.json({ error: "Erro ao buscar dados" }, { status: 500 });
    }

    const matchMap = new Map((matches || []).map((m: any) => [m.id, m]));
    const preCopaMap = new Map((preCopa || []).map((p: any) => [p.user_id, Number(p.pre_copa_points) || 0]));

    const scoreMap = new Map<string, { total: number; exact: number; groups: number; knockout: number; preCopa: number }>();

    // Somar pontos salvos de cada prediction
    for (const pred of predictions as any[]) {
      const match = matchMap.get(pred.match_id);
      if (!match) continue;

      const pts = Number(pred.points) || 0;
      const isKnockout = match.phase !== "group_stage" && match.phase !== "friendly";
      const isExact = match.home_score !== null && pred.points >= 8;

      if (!scoreMap.has(pred.user_id)) {
        scoreMap.set(pred.user_id, { total: 0, exact: 0, groups: 0, knockout: 0, preCopa: 0 });
      }
      const e = scoreMap.get(pred.user_id)!;
      e.total += pts;
      if (isKnockout) e.knockout += pts;
      else e.groups += pts;
    }

    // Adicionar pontos de pré-copa
    preCopaMap.forEach((pts, userId) => {
      if (!scoreMap.has(userId)) {
        scoreMap.set(userId, { total: 0, exact: 0, groups: 0, knockout: 0, preCopa: 0 });
      }
      const e = scoreMap.get(userId)!;
      e.total += pts;
      e.preCopa = pts;
    });

    // Ordenar e fazer upsert
    const sorted = Array.from(scoreMap.entries())
      .sort((a, b) => b[1].total - a[1].total)
      .map(([userId, s], i) => ({
        user_id: userId,
        total_points: s.total,
        position: i + 1,
        exact_scores: s.exact,
        correct_results: 0,
      }));

    // Upsert em lotes
    for (let i = 0; i < sorted.length; i += 50) {
      const batch = sorted.slice(i, i + 50);
      await serverSupabase
        .from("rankings")
        .upsert(batch, { onConflict: "user_id" });
    }

    return NextResponse.json({ success: true, count: sorted.length });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
