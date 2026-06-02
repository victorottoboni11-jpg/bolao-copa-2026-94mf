import { supabase } from "./supabase";
import type { Match } from "../types";

const defaultMatches: Omit<Match, "id">[] = [
  {
    home_team: "Brasil",
    away_team: "Argentina",
    match_datetime: "2026-06-15T18:00:00Z",
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
    match_datetime: "2026-06-16T20:00:00Z",
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
    .select("home_team,away_team,match_datetime");

  const existingMatches = (data as Array<Pick<Match, "home_team" | "away_team" | "match_datetime">>) || [];

  const existingKeys = new Set(
    existingMatches.map(
      (match) => `${match.home_team}:${match.away_team}:${match.match_datetime}`
    )
  );

  const newMatches = defaultMatches.filter(
    (match) =>
      !existingKeys.has(`${match.home_team}:${match.away_team}:${match.match_datetime}`)
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
