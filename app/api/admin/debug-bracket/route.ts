import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "../../../lib/serverSupabase";
import { generateBracket } from "../../../lib/bracket";

export async function GET(request: NextRequest) {
  try {
    const serverSupabase = getServerSupabase();
    const bracket = await generateBracket(serverSupabase);

    return NextResponse.json({ bracket });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro" },
      { status: 500 }
    );
  }
}
