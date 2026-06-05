/**
 * Lógica de chaveamento automático da Copa 2026
 * Baseado no documento oficial FIFA Copa 2026
 * 
 * Após a fase de grupos, os times são classificados como:
 * - 1º colocado de cada grupo (A-L)
 * - 2º colocado de cada grupo (A-L)  
 * - 8 melhores 3º colocados (de 12 grupos)
 * 
 * Chaveamento dos 32-avos (jogos 73-88):
 * J73: 2ºA x 2ºB
 * J74: 1ºE x melhor3º(A/B/C/D/F)
 * J75: 1ºF x 2ºC
 * J76: 1ºC x 2ºF
 * J77: 1ºI x melhor3º(C/D/F/G/H)
 * J78: 2ºE x 2ºI
 * J79: 1ºA x melhor3º(C/E/F/H/I)
 * J80: 1ºL x melhor3º(E/H/I/J/K)
 * J81: 1ºD x melhor3º(B/E/F/I/J)
 * J82: 1ºG x melhor3º(A/E/H/I/J)
 * J83: 2ºK x 2ºL
 * J84: 1ºH x 2ºJ
 * J85: 1ºB x melhor3º(E/F/G/I/J)
 * J86: 1ºJ x 2ºH
 * J87: 1ºK x melhor3º(D/E/I/J/L)
 * J88: 2ºD x 2ºG
 */

import type { SupabaseClient } from "@supabase/supabase-js";

interface TeamStanding {
  team_id: string;
  team_name: string;
  group_name: string;
  position: number; // 1, 2 ou 3
  points: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  wins: number;
}

export async function calculateGroupStandings(
  supabase: SupabaseClient
): Promise<TeamStanding[]> {
  // Buscar todas as partidas finalizadas da fase de grupos
  const { data: matches, error } = await supabase
    .from("matches")
    .select("id, group_name, home_team_id, away_team_id, home_score, away_score, is_finished")
    .eq("phase", "group_stage")
    .eq("is_finished", true);

  if (error || !matches) return [];

  // Calcular pontuação por time
  const standings = new Map<string, TeamStanding>();

  const initTeam = (teamId: string, groupName: string, teamName: string) => {
    if (!standings.has(teamId)) {
      standings.set(teamId, {
        team_id: teamId,
        team_name: teamName,
        group_name: groupName,
        position: 0,
        points: 0,
        goals_for: 0,
        goals_against: 0,
        goal_difference: 0,
        wins: 0,
      });
    }
  };

  for (const match of matches) {
    if (match.home_score === null || match.away_score === null) continue;

    initTeam(match.home_team_id, match.group_name, "");
    initTeam(match.away_team_id, match.group_name, "");

    const home = standings.get(match.home_team_id)!;
    const away = standings.get(match.away_team_id)!;

    home.goals_for += match.home_score;
    home.goals_against += match.away_score;
    away.goals_for += match.away_score;
    away.goals_against += match.home_score;

    if (match.home_score > match.away_score) {
      home.points += 3;
      home.wins += 1;
    } else if (match.home_score < match.away_score) {
      away.points += 3;
      away.wins += 1;
    } else {
      home.points += 1;
      away.points += 1;
    }
  }

  // Calcular saldo
  standings.forEach((s) => {
    s.goal_difference = s.goals_for - s.goals_against;
  });

  return Array.from(standings.values());
}

export function rankGroup(teams: TeamStanding[]): TeamStanding[] {
  return [...teams].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goal_difference !== a.goal_difference) return b.goal_difference - a.goal_difference;
    if (b.goals_for !== a.goals_for) return b.goals_for - a.goals_for;
    return 0;
  });
}

export function getBestThirdPlaceTeams(
  allStandings: TeamStanding[],
  fromGroups: string[]
): TeamStanding[] {
  // Pegar os 3os colocados dos grupos especificados
  const thirds: TeamStanding[] = [];

  for (const group of fromGroups) {
    const groupTeams = allStandings.filter((t) => t.group_name === group);
    const ranked = rankGroup(groupTeams);
    if (ranked[2]) thirds.push({ ...ranked[2], position: 3 });
  }

  // Ordenar pelo critério de desempate entre 3os colocados
  return thirds.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goal_difference !== a.goal_difference) return b.goal_difference - a.goal_difference;
    if (b.goals_for !== a.goals_for) return b.goals_for - a.goals_for;
    return 0;
  });
}

/**
 * Retorna o chaveamento completo dos 32-avos baseado na classificação
 * Cada jogo retorna { home_team_id, away_team_id } ou null se ainda não definido
 */
export async function generateBracket(supabase: SupabaseClient): Promise<
  Record<number, { home_team_id: string | null; away_team_id: string | null; home_label: string; away_label: string }>
> {
  const allStandings = await calculateGroupStandings(supabase);

  // Classificados por grupo
  const getPos = (group: string, pos: number): TeamStanding | null => {
    const groupTeams = allStandings.filter((t) => t.group_name === group);
    if (groupTeams.length === 0) return null;
    return rankGroup(groupTeams)[pos - 1] ?? null;
  };

  // Melhores 3os colocados por combinação de grupos
  const getBest3rd = (fromGroups: string[]): TeamStanding | null => {
    const thirds = getBestThirdPlaceTeams(allStandings, fromGroups);
    return thirds[0] ?? null;
  };

  const bracket: Record<number, { home_team_id: string | null; away_team_id: string | null; home_label: string; away_label: string }> = {};

  const entry = (
    matchNum: number,
    homeTeam: TeamStanding | null,
    awayTeam: TeamStanding | null,
    homeLabel: string,
    awayLabel: string
  ) => {
    bracket[matchNum] = {
      home_team_id: homeTeam?.team_id ?? null,
      away_team_id: awayTeam?.team_id ?? null,
      home_label: homeTeam ? homeTeam.team_name : homeLabel,
      away_label: awayTeam ? awayTeam.team_name : awayLabel,
    };
  };

  // 32-avos
  entry(73, getPos("A", 2), getPos("B", 2), "2º Grupo A", "2º Grupo B");
  entry(74, getPos("E", 1), getBest3rd(["A","B","C","D","F"]), "1º Grupo E", "Melhor 3º A/B/C/D/F");
  entry(75, getPos("F", 1), getPos("C", 2), "1º Grupo F", "2º Grupo C");
  entry(76, getPos("C", 1), getPos("F", 2), "1º Grupo C", "2º Grupo F");
  entry(77, getPos("I", 1), getBest3rd(["C","D","F","G","H"]), "1º Grupo I", "Melhor 3º C/D/F/G/H");
  entry(78, getPos("E", 2), getPos("I", 2), "2º Grupo E", "2º Grupo I");
  entry(79, getPos("A", 1), getBest3rd(["C","E","F","H","I"]), "1º Grupo A", "Melhor 3º C/E/F/H/I");
  entry(80, getPos("L", 1), getBest3rd(["E","H","I","J","K"]), "1º Grupo L", "Melhor 3º E/H/I/J/K");
  entry(81, getPos("D", 1), getBest3rd(["B","E","F","I","J"]), "1º Grupo D", "Melhor 3º B/E/F/I/J");
  entry(82, getPos("G", 1), getBest3rd(["A","E","H","I","J"]), "1º Grupo G", "Melhor 3º A/E/H/I/J");
  entry(83, getPos("K", 2), getPos("L", 2), "2º Grupo K", "2º Grupo L");
  entry(84, getPos("H", 1), getPos("J", 2), "1º Grupo H", "2º Grupo J");
  entry(85, getPos("B", 1), getBest3rd(["E","F","G","I","J"]), "1º Grupo B", "Melhor 3º E/F/G/I/J");
  entry(86, getPos("J", 1), getPos("H", 2), "1º Grupo J", "2º Grupo H");
  entry(87, getPos("K", 1), getBest3rd(["D","E","I","J","L"]), "1º Grupo K", "Melhor 3º D/E/I/J/L");
  entry(88, getPos("D", 2), getPos("G", 2), "2º Grupo D", "2º Grupo G");

  return bracket;
}

/**
 * Atualiza os times dos jogos do mata-mata no banco
 * Chamado pelo admin após finalizar a fase de grupos
 */
export async function updateKnockoutBracket(supabase: SupabaseClient): Promise<{
  updated: number;
  errors: string[];
}> {
  const bracket = await generateBracket(supabase);
  let updated = 0;
  const errors: string[] = [];

  for (const [matchNumber, { home_team_id, away_team_id }] of Object.entries(bracket)) {
    if (!home_team_id && !away_team_id) continue;

    const updateData: Record<string, string> = {};
    if (home_team_id) updateData.home_team_id = home_team_id;
    if (away_team_id) updateData.away_team_id = away_team_id;

    const { error } = await supabase
      .from("matches")
      .update(updateData)
      .eq("match_number", Number(matchNumber));

    if (error) {
      errors.push(`Jogo ${matchNumber}: ${error.message}`);
    } else {
      updated++;
    }
  }

  return { updated, errors };
}
