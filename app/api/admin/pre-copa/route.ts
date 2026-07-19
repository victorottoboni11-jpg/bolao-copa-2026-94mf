import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "../../../lib/serverSupabase";

const OFFICIAL_PRE_COPA_ID = "00000000-0000-0000-0000-000000000002";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const serverSupabase = getServerSupabase();

    const { data: userData } = await serverSupabase.auth.getUser(token);
    if (!userData?.user?.id) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { data: userRow } = await serverSupabase
      .from("users")
      .select("is_admin")
      .eq("id", userData.user.id)
      .single();

    if (!userRow?.is_admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const {
      champion,
      runner_up,
      top_scorer,
      top_scorer_goals,
      best_player,
      best_goalkeeper,
      revelation,
    } = await request.json();

    // Salvar resultados oficiais
    const { error: officialError } = await serverSupabase
      .from("official_pre_copa_outcomes")
      .upsert({
        id: OFFICIAL_PRE_COPA_ID,
        champion_team: champion,
        runner_up_team: runner_up,
        top_scorer_player: top_scorer,
        top_scorer_goals: Number(top_scorer_goals),
        best_player_name: best_player,
        best_goalkeeper_name: best_goalkeeper,
        revelation_player: revelation,
        updated_at: new Date().toISOString(),
      }, { onConflict: "id" });

    if (officialError) {
      return NextResponse.json(
        { error: `Failed to save official outcomes: ${officialError.message}` },
        { status: 400 }
      );
    }

    // Buscar todos os palpites de pré-copa
    const { data: predictions, error: predError } = await serverSupabase
      .from("pre_copa_predictions")
      .select("*");

    if (predError || !predictions?.length) {
      return NextResponse.json({
        success: true,
        message: "Official outcomes saved (no predictions to score)",
        updatedUsers: 0,
      });
    }

    let updatedUsers = 0;

    for (const pred of predictions) {
      let points = 0;

      // Campeão (15 pts)
      if (pred.champion_team && champion &&
          pred.champion_team.toLowerCase() === champion.toLowerCase()) points += 15;

      // Vice (10 pts)
      if (pred.runner_up_team && runner_up &&
          pred.runner_up_team.toLowerCase() === runner_up.toLowerCase()) points += 10;

      // Artilheiro nome (usando campo top_scorer do banco)
      const predTopScorer = pred.top_scorer_player || pred.top_scorer;
      if (predTopScorer && top_scorer &&
          predTopScorer.toLowerCase() === top_scorer.toLowerCase()) points += 10;

      // Gols do artilheiro
      const predGoals = pred.top_scorer_goals ?? pred.predicted_total_goals;
      if (predGoals !== null && predGoals !== undefined) {
        const diff = Math.abs(Number(predGoals) - Number(top_scorer_goals));
        if (diff === 0) points += 10;
        else if (diff === 1) points += 7;
        else if (diff === 2) points += 5;
      }

      // Melhor jogador (usando best_player do banco)
      if (pred.best_player && best_player &&
          pred.best_player.toLowerCase() === best_player.toLowerCase()) points += 10;

      // Melhor goleiro (usando best_goalkeeper do banco)
      const predGoalkeeper = pred.best_goalkeeper_player || pred.best_goalkeeper;
      if (predGoalkeeper && best_goalkeeper &&
          predGoalkeeper.toLowerCase() === best_goalkeeper.toLowerCase()) points += 8;

      // Revelação (usando tournament_revelation ou best_young do banco)
      const predRevelation = pred.tournament_revelation || pred.best_young;
      if (predRevelation && revelation &&
          predRevelation.toLowerCase() === revelation.toLowerCase()) points += 7;

      // Atualizar pontos de pré-copa
      await serverSupabase
        .from("pre_copa_predictions")
        .update({ pre_copa_points: points })
        .eq("id", pred.id);

      updatedUsers++;
    }

    // Atualizar ranking de todos
    await serverSupabase.rpc;
    const { data: allUsers } = await serverSupabase
      .from("pre_copa_predictions")
      .select("user_id, pre_copa_points");

    for (const u of allUsers || []) {
      const { data: matchPreds } = await serverSupabase
        .from("predictions")
        .select("points, match_id");

      const { data: matches } = await serverSupabase
        .from("matches")
        .select("id")
        .eq("is_finished", true);

      const finishedIds = new Set((matches || []).map((m: any) => m.id));
      const matchTotal = (matchPreds || [])
        .filter((p: any) => finishedIds.has(p.match_id))
        .reduce((sum: number, p: any) => sum + (Number(p.points) || 0), 0);

      const total = matchTotal + (Number(u.pre_copa_points) || 0);

      await serverSupabase
        .from("rankings")
        .update({ total_points: total })
        .eq("user_id", u.user_id);
    }

    return NextResponse.json({
      success: true,
      message: "Pre-Copa outcomes saved and users scored",
      updatedUsers,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
