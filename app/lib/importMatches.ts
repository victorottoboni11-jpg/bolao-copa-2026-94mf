import { supabase } from "./supabase";
import type { Match } from "../types";

const defaultMatches: Omit<Match, "id">[] = [
  {
    home_team: "Brasil",
    away_team: "Argentina",
    kickoff_at: "2026-06-15T18:00:00Z",
    stadium: "Estádio Azteca",
    city: "Mexico City",
    group_name: "Demo",
    phase: "group",
    status: "pending",
    result_updated: false,
  },
  {
    home_team: "Portugal",
    away_team: "França",
    kickoff_at: "2026-06-16T20:00:00Z",
    stadium: "Estádio MetLife",
    city: "New York",
    group_name: "Demo",
    phase: "group",
    status: "pending",
    result_updated: false,
  },
];

export async function importarJogos() {
  const { data } = await supabase
    .from("matches")
    .select("home_team,away_team,kickoff_at");

  const existingMatches = (data as Array<Pick<Match, "home_team" | "away_team" | "kickoff_at">>) || [];

  const existingKeys = new Set(
    existingMatches.map(
      (match) => `${match.home_team}:${match.away_team}:${match.kickoff_at}`
    )
  );

  const newMatches = defaultMatches.filter(
    (match) =>
      !existingKeys.has(`${match.home_team}:${match.away_team}:${match.kickoff_at}`)
  );

  if (newMatches.length === 0) {
    return;
  }

  const { error } = await supabase.from("matches").insert(newMatches);

  if (error) {
    console.error("Erro ao importar jogos:", error);
    throw error;
  }
}
