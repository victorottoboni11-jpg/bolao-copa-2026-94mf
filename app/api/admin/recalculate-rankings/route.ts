import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "../../../lib/serverSupabase";
import { recalculateRankings } from "../../../lib/rankings";

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

    const ranking = await recalculateRankings(serverSupabase);

    return NextResponse.json({ success: true, count: ranking.length });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
