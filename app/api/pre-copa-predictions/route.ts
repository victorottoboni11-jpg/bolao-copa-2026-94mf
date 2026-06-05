import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "../../lib/serverSupabase";
import { canEditPreCopaPrediction, fetchPreCopaLockDate } from "../../lib/preCopa";

export async function POST(request: NextRequest) {
  try {
    const authorization = request.headers.get("Authorization") || "";
    const token = authorization.replace("Bearer", "").trim();

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const serverSupabase = getServerSupabase();

    // Verificar lock da pré-copa
    const lockDate = await fetchPreCopaLockDate();
    if (!canEditPreCopaPrediction(lockDate)) {
      return NextResponse.json(
        { error: "Os palpites Pré-Copa foram encerrados." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      champion_team,
      runner_up_team,
      top_scorer_player,
      top_scorer_goals,
      best_goalkeeper_player,
      best_player,
      tournament_revelation,
    } = body || {};

    if (
      !champion_team ||
      !runner_up_team ||
      !top_scorer_player ||
      top_scorer_goals === undefined ||
      !best_goalkeeper_player ||
      !best_player ||
      !tournament_revelation
    ) {
      return NextResponse.json(
        { error: "Campos obrigatórios ausentes para salvar o palpite Pré-Copa." },
        { status: 400 }
      );
    }

    const { data: userData, error: userError } = await serverSupabase.auth.getUser(token);
    if (userError || !userData?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await serverSupabase
      .from("pre_copa_predictions")
      .upsert(
        [
          {
            user_id: userData.user.id,
            champion_team,
            runner_up_team,
            top_scorer_player,
            top_scorer_goals,
            best_goalkeeper_player,
            best_player,
            tournament_revelation,
            updated_at: new Date().toISOString(),
          },
        ],
        { onConflict: "user_id" }
      )
      .select("*")
      .single();

    if (error) {
      console.error("Erro ao salvar palpite Pré-Copa no servidor:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, prediction: data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
