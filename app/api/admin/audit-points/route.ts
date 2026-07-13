import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "../../../lib/serverSupabase";
import { calculateMatchPoints } from "../../../lib/scoring";

export async function POST(request: NextRequest) {
  try {
    const authorization = request.headers.get("Authorization") || "";
    const token = authorization.replace("Bearer", "").trim();
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const serverSupabase = getServerSupabase();
    const { data: userData } = await serverSupabase.auth.getUser(token);
    if (!userData?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: userRow } = await serverSupabase
      .from("users").select("is_admin").eq("id", userData.user.id).single();
    if (!userRow?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // Buscar todos os jogos finalizados de mata-mata
    const { data: matches } = await serverSupabase
      .from("matches")
      .select("*")
      .eq("is_finished", true)
      .neq("phase", "group_stage")
      .neq("phase", "friendly");

    if (!matches?.length) return NextResponse.json({ success: true, corrections: 0 });

    // Buscar todas as predictions desses jogos
    const matchIds = matches.map((m: any) => m.id);
    const { data: predictions } = await serverSupabase
      .from("predictions")
      .select("*")
      .in("match_id", matchIds);

    if (!predictions?.length) return NextResponse.json({ success: true, corrections: 0 });

    const matchMap = new Map(matches.map((m: any) => [m.id, m]));
    let corrections = 0;
    const errors: string[] = [];

    for (const pred of predictions as any[]) {
      const match = matchMap.get(pred.match_id);
      if (!match) continue;

      const result = calculateMatchPoints(pred, match);
      const correctPoints = result.points;

      if (pred.points !== correctPoints) {
        const { error } = await serverSupabase
          .from("predictions")
          .update({ points: correctPoints })
          .eq("id", pred.id);

        if (error) {
          errors.push(`Pred ${pred.id}: ${error.message}`);
        } else {
          corrections++;
        }
      }
    }

    // Atualizar ranking
    const { data: allUsers } = await serverSupabase.from("users").select("id");
    for (const user of allUsers || []) {
      const { data: sumData } = await serverSupabase
        .from("predictions")
        .select("points, match_id")
        .eq("user_id", user.id);

      const { data: matchesData } = await serverSupabase
        .from("matches")
        .select("id")
        .eq("is_finished", true);

      const finishedIds = new Set((matchesData || []).map((m: any) => m.id));
      const total = (sumData || [])
        .filter((p: any) => finishedIds.has(p.match_id))
        .reduce((acc: number, p: any) => acc + (Number(p.points) || 0), 0);

      const { data: precopa } = await serverSupabase
        .from("pre_copa_predictions")
        .select("pre_copa_points")
        .eq("user_id", user.id)
        .single();

      const totalWithPrecopa = total + (Number(precopa?.pre_copa_points) || 0);

      await serverSupabase
        .from("rankings")
        .update({ total_points: totalWithPrecopa })
        .eq("user_id", user.id);
    }

    return NextResponse.json({ success: true, corrections, errors });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro interno" },
      { status: 500 }
    );
  }
}
