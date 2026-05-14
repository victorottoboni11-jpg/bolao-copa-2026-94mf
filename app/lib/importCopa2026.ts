import { supabase } from "./supabase";

const OFFICIAL_GROUPS = {
  A: [
    { name: "México", fifa_code: "MEX", flag_url: "https://flagcdn.com/w320/mx.png" },
    { name: "África do Sul", fifa_code: "RSA", flag_url: "https://flagcdn.com/w320/za.png" },
    { name: "Coreia do Sul", fifa_code: "KOR", flag_url: "https://flagcdn.com/w320/kr.png" },
    { name: "República Tcheca", fifa_code: "CZE", flag_url: "https://flagcdn.com/w320/cz.png" },
  ],
  B: [
    { name: "Canadá", fifa_code: "CAN", flag_url: "https://flagcdn.com/w320/ca.png" },
    { name: "Suíça", fifa_code: "SUI", flag_url: "https://flagcdn.com/w320/ch.png" },
    { name: "Qatar", fifa_code: "QAT", flag_url: "https://flagcdn.com/w320/qa.png" },
    { name: "Bósnia e Herzegovina", fifa_code: "BIH", flag_url: "https://flagcdn.com/w320/ba.png" },
  ],
  C: [
    { name: "Brasil", fifa_code: "BRA", flag_url: "https://flagcdn.com/w320/br.png" },
    { name: "Marrocos", fifa_code: "MAR", flag_url: "https://flagcdn.com/w320/ma.png" },
    { name: "Escócia", fifa_code: "SCO", flag_url: "https://flagcdn.com/w320/gb-sct.png" },
    { name: "Haiti", fifa_code: "HTI", flag_url: "https://flagcdn.com/w320/ht.png" },
  ],
  D: [
    { name: "Estados Unidos", fifa_code: "USA", flag_url: "https://flagcdn.com/w320/us.png" },
    { name: "Turquia", fifa_code: "TUR", flag_url: "https://flagcdn.com/w320/tr.png" },
    { name: "Paraguai", fifa_code: "PAR", flag_url: "https://flagcdn.com/w320/py.png" },
    { name: "Austrália", fifa_code: "AUS", flag_url: "https://flagcdn.com/w320/au.png" },
  ],
  E: [
    { name: "Alemanha", fifa_code: "GER", flag_url: "https://flagcdn.com/w320/de.png" },
    { name: "Equador", fifa_code: "ECU", flag_url: "https://flagcdn.com/w320/ec.png" },
    { name: "Curaçao", fifa_code: "CUW", flag_url: "https://flagcdn.com/w320/cw.png" },
    { name: "Costa do Marfim", fifa_code: "CIV", flag_url: "https://flagcdn.com/w320/ci.png" },
  ],
  F: [
    { name: "Holanda", fifa_code: "NED", flag_url: "https://flagcdn.com/w320/nl.png" },
    { name: "Japão", fifa_code: "JPN", flag_url: "https://flagcdn.com/w320/jp.png" },
    { name: "Suécia", fifa_code: "SWE", flag_url: "https://flagcdn.com/w320/se.png" },
    { name: "Tunísia", fifa_code: "TUN", flag_url: "https://flagcdn.com/w320/tn.png" },
  ],
  G: [
    { name: "Bélgica", fifa_code: "BEL", flag_url: "https://flagcdn.com/w320/be.png" },
    { name: "Egito", fifa_code: "EGY", flag_url: "https://flagcdn.com/w320/eg.png" },
    { name: "Nova Zelândia", fifa_code: "NZL", flag_url: "https://flagcdn.com/w320/nz.png" },
    { name: "Irã", fifa_code: "IRN", flag_url: "https://flagcdn.com/w320/ir.png" },
  ],
  H: [
    { name: "Espanha", fifa_code: "ESP", flag_url: "https://flagcdn.com/w320/es.png" },
    { name: "Uruguai", fifa_code: "URU", flag_url: "https://flagcdn.com/w320/uy.png" },
    { name: "Cabo Verde", fifa_code: "CPV", flag_url: "https://flagcdn.com/w320/cv.png" },
    { name: "Arábia Saudita", fifa_code: "KSA", flag_url: "https://flagcdn.com/w320/sa.png" },
  ],
  I: [
    { name: "França", fifa_code: "FRA", flag_url: "https://flagcdn.com/w320/fr.png" },
    { name: "Senegal", fifa_code: "SEN", flag_url: "https://flagcdn.com/w320/sn.png" },
    { name: "Noruega", fifa_code: "NOR", flag_url: "https://flagcdn.com/w320/no.png" },
    { name: "Iraque", fifa_code: "IRQ", flag_url: "https://flagcdn.com/w320/iq.png" },
  ],
  J: [
    { name: "Argentina", fifa_code: "ARG", flag_url: "https://flagcdn.com/w320/ar.png" },
    { name: "Jordânia", fifa_code: "JOR", flag_url: "https://flagcdn.com/w320/jo.png" },
    { name: "Áustria", fifa_code: "AUT", flag_url: "https://flagcdn.com/w320/at.png" },
    { name: "Argélia", fifa_code: "ALG", flag_url: "https://flagcdn.com/w320/dz.png" },
  ],
  K: [
    { name: "Portugal", fifa_code: "POR", flag_url: "https://flagcdn.com/w320/pt.png" },
    { name: "Colômbia", fifa_code: "COL", flag_url: "https://flagcdn.com/w320/co.png" },
    { name: "República Democrática do Congo", fifa_code: "COD", flag_url: "https://flagcdn.com/w320/cd.png" },
    { name: "Uzbequistão", fifa_code: "UZB", flag_url: "https://flagcdn.com/w320/uz.png" },
  ],
  L: [
    { name: "Inglaterra", fifa_code: "ENG", flag_url: "https://flagcdn.com/w320/gb-eng.png" },
    { name: "Croácia", fifa_code: "CRO", flag_url: "https://flagcdn.com/w320/hr.png" },
    { name: "Panamá", fifa_code: "PAN", flag_url: "https://flagcdn.com/w320/pa.png" },
    { name: "Gana", fifa_code: "GHA", flag_url: "https://flagcdn.com/w320/gh.png" },
  ],
};

const GROUP_STADIUMS: Record<string, string> = {
  A: "NRG Stadium",
  B: "AT&T Stadium",
  C: "MetLife Stadium",
  D: "SoFi Stadium",
  E: "Gillette Stadium",
  F: "Mercedes-Benz Stadium",
  G: "Hard Rock Stadium",
  H: "Levi's Stadium",
  I: "Lincoln Financial Field",
  J: "Soldier Field",
  K: "Empower Field",
  L: "Allegiant Stadium",
};

const GROUP_MATCH_PAIRS: Array<[number, number]> = [
  [0, 1],
  [0, 2],
  [0, 3],
  [1, 2],
  [1, 3],
  [2, 3],
];

function buildTeamSeed() {
  return Object.entries(OFFICIAL_GROUPS).flatMap(([group_name, teams]) =>
    teams.map((team) => ({
      ...team,
      group_name,
    }))
  );
}

function buildMatchSeed() {
  let matchNumber = 1;
  return Object.entries(OFFICIAL_GROUPS).flatMap(([group_name, teams]) => {
    const stadium = GROUP_STADIUMS[group_name] ?? "NRG Stadium";
    return GROUP_MATCH_PAIRS.map(([homeIndex, awayIndex]) => {
      const matchDate = new Date(Date.UTC(2026, 5, 12, 16, 0, 0) + (matchNumber - 1) * 3 * 60 * 60 * 1000);
      return {
        home_team: teams[homeIndex].name,
        away_team: teams[awayIndex].name,
        group_name,
        stadium,
        match_date: matchDate,
        match_number: matchNumber++,
        phase: "group_stage",
      };
    });
  });
}

const TEAMS_DATA = buildTeamSeed();
const MATCHES_DATA = buildMatchSeed();

/**
 * Importa TODOS os dados da Copa 2026 para o Supabase
 * 1. Limpa dados existentes
 * 2. Insere 48 times
 * 3. Obtém IDs dos times
 * 4. Insere 72 partidas de grupos
 */
export async function importCopa2026Data() {
  try {
    console.log("🏆 Iniciando importação COMPLETA dos dados da Copa 2026...");

    // PASSO 1: Limpar matches existentes
    console.log("🗑️  Removendo matches existentes...");
    const { error: deleteMatchesError } = await supabase
      .from("matches")
      .delete()
      .neq("match_number", -1); // Deleta todos

    if (deleteMatchesError) {
      console.warn("⚠️ Aviso ao limpar matches:", deleteMatchesError.message);
    } else {
      console.log("✅ Matches removidos");
    }

    // PASSO 2: Limpar teams existentes
    console.log("🗑️  Removendo times existentes...");
    const { error: deleteTeamsError } = await supabase
      .from("teams")
      .delete()
      .neq("group_name", ""); // Deleta todos

    if (deleteTeamsError) {
      console.warn("⚠️ Aviso ao limpar times:", deleteTeamsError.message);
    } else {
      console.log("✅ Times removidos");
    }

    // PASSO 3: Inserir os 48 times
    console.log("📋 Importando 48 times...");
    const { data: insertedTeams, error: teamsError } = await supabase
      .from("teams")
      .insert(TEAMS_DATA)
      .select("id, name");

    if (teamsError) {
      console.error("❌ ERRO ao importar times:", teamsError);
      throw new Error(`Falha ao inserir times: ${teamsError.message}`);
    }

    if (!insertedTeams || insertedTeams.length === 0) {
      throw new Error("Nenhum time foi inserido!");
    }

    console.log(`✅ ${insertedTeams.length} times importados com sucesso!`);

    // PASSO 4: Criar mapa de times para IDs
    console.log("🔍 Mapeando IDs dos times...");
    const teamMap = new Map<string, string>();
    insertedTeams.forEach((team) => {
      teamMap.set(team.name, team.id);
    });

    console.log(`📊 Mapa contém ${teamMap.size} times`);

    // PASSO 5: Preparar dados das partidas
    console.log("⚙️  Preparando dados das 72 partidas...");
    const matchesToInsert = MATCHES_DATA.map((match) => {
      const homeTeamId = teamMap.get(match.home_team);
      const awayTeamId = teamMap.get(match.away_team);

      if (!homeTeamId) {
        console.warn(`⚠️ Time não encontrado: ${match.home_team}`);
      }
      if (!awayTeamId) {
        console.warn(`⚠️ Time não encontrado: ${match.away_team}`);
      }

      return {
        home_team_id: homeTeamId || "",
        away_team_id: awayTeamId || "",
        home_score: null,
        away_score: null,
        match_number: match.match_number,
        phase: match.phase,
        group_name: match.group_name,
        stadium: match.stadium,
        match_date: match.match_date.toISOString(),
        status: "scheduled",
        is_finished: false,
      };
    });

    console.log(`📊 Preparadas ${matchesToInsert.length} partidas para inserção`);

    // PASSO 6: Inserir as 72 partidas
    console.log("📋 Importando 72 partidas da fase de grupos...");
    const { data: insertedMatches, error: matchesError } = await supabase
      .from("matches")
      .insert(matchesToInsert)
      .select("id");

    if (matchesError) {
      console.error("❌ ERRO ao importar partidas:", matchesError);
      throw new Error(`Falha ao inserir partidas: ${matchesError.message}`);
    }

    if (!insertedMatches || insertedMatches.length === 0) {
      throw new Error("Nenhuma partida foi inserida!");
    }

    console.log(`✅ ${insertedMatches.length} partidas importadas com sucesso!`);

    // PASSO 7: Sucesso final
    console.log("🎉🎉🎉 Copa 2026 COMPLETAMENTE importada com sucesso! 🎉🎉🎉");
    console.log(`   📊 Total: 48 times + 72 partidas`);
    console.log(`   📍 Grupos: A, B, C, D, E, F, G, H, I, J, K, L`);
    console.log(`   🏟️  Estádios oficiais atribuídos`);

    return {
      success: true,
      message: "Copa 2026 importada com sucesso!",
      stats: {
        teams: insertedTeams.length,
        matches: insertedMatches.length,
      },
    };
  } catch (error) {
    console.error("💥 ERRO GERAL durante importação:", error);
    throw error;
  }
}

/**
 * Verifica se os dados já foram importados (48 times + 72 partidas)
 */
export async function checkCopa2026Imported(): Promise<boolean> {
  try {
    const { count: teamCount } = await supabase
      .from("teams")
      .select("*", { count: "exact" });

    const { count: matchCount } = await supabase
      .from("matches")
      .select("*", { count: "exact" });

    const isImported = (teamCount ?? 0) >= 48 && (matchCount ?? 0) >= 72;

    console.log(
      `📊 Status: ${teamCount ?? 0} times, ${matchCount ?? 0} partidas`
    );

    return isImported;
  } catch (error) {
    console.error("Erro ao verificar importação:", error);
    return false;
  }
}

/**
 * Obtém todas as equipes
 */
export async function getAllTeams() {
  try {
    const { data, error } = await supabase.from("teams").select("*");

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Erro ao obter times:", error);
    return [];
  }
}

/**
 * Obtém todos os matches
 */
export async function getAllMatches() {
  try {
    const { data, error } = await supabase
      .from("matches")
      .select(`
        *,
        home_team:home_team_id (
          id,
          name,
          flag_url,
          fifa_code
        ),
        away_team:away_team_id (
          id,
          name,
          flag_url,
          fifa_code
        )
      `)
      .order("match_date", { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Erro ao obter matches:", error);
    return [];
  }
}

/**
 * Obtém matches de um grupo específico
 */
export async function getGroupMatches(groupName: string) {
  try {
    const { data, error } = await supabase
      .from("matches")
      .select(`
        *,
        home_team:home_team_id (
          id,
          name,
          flag_url,
          fifa_code
        ),
        away_team:away_team_id (
          id,
          name,
          flag_url,
          fifa_code
        )
      `)
      .eq("group_name", groupName)
      .order("match_date", { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error(`Erro ao obter matches do grupo ${groupName}:`, error);
    return [];
  }
}

/**
 * Obtém times de um grupo específico
 */
export async function getGroupTeams(groupName: string) {
  try {
    const { data, error } = await supabase
      .from("teams")
      .select("*")
      .eq("group_name", groupName)
      .order("name", { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error(`Erro ao obter times do grupo ${groupName}:`, error);
    return [];
  }
}
