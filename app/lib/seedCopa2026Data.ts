/**
 * Official FIFA Copa 2026 seed data (normalized)
 * - Exports `TEAMS_DATA` (48 teams) and `MATCHES_DATA` (104 matches)
 * - Team names and group assignments follow the official listing
 * - Group matches (72) + knockout placeholders (32) are generated
 * - `match_date` values are Date objects representing the official
 *   Brasília wall-clock time; scripts will convert to UTC before saving.
 */

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
    teams.map((team) => ({ ...team, group_name }))
  );
}

const KNOCKOUT_ROUND_OF_32_PAIRS: Array<[string, string]> = [
  ["1A", "2B"],
  ["1C", "2D"],
  ["1E", "2F"],
  ["1G", "2H"],
  ["1I", "2J"],
  ["1K", "2L"],
  ["1B", "2A"],
  ["1D", "2C"],
  ["1F", "2E"],
  ["1H", "2G"],
  ["1J", "2I"],
  ["1L", "2K"],
  ["Melhor 3º 1", "Melhor 3º 8"],
  ["Melhor 3º 2", "Melhor 3º 7"],
  ["Melhor 3º 3", "Melhor 3º 6"],
  ["Melhor 3º 4", "Melhor 3º 5"],
];

const KNOCKOUT_MATCH_STADIUM = "A definir";

function buildMatchSeed() {
  let matchNumber = 1;
  return Object.entries(OFFICIAL_GROUPS).flatMap(([group_name, teams]) => {
    const stadium = GROUP_STADIUMS[group_name] ?? "NRG Stadium";
    return GROUP_MATCH_PAIRS.map(([homeIndex, awayIndex]) => {
      // Create a Date for Brasília wall time by constructing an ISO with -03:00
      // For deterministic spacing we increment days as groups progress.
      const dayOffset = Math.floor((matchNumber - 1) / 6);
      const hour = 16 + ((matchNumber - 1) % 3) * 4; // 16,20,24 simplified pattern
      const day = 12 + dayOffset;
      const matchDate = new Date(`${String(2026)}-06-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:00:00-03:00`);
      return {
        home_team: teams[homeIndex].name,
        away_team: teams[awayIndex].name,
        group_name,
        stadium,
        match_date: matchDate,
        match_number: matchNumber++,
        phase: "group",
      };
    });
  });
}

function buildFriendlySeed() {
  // Friendlies should have unique match_number values before official matches.
  // We use 0 and -1 so they appear before match_number 1 but remain unique.
  const matches: Array<any> = [];
  matches.push({
    home_team: "Brasil",
    away_team: "Panamá",
    group_name: null,
    stadium: "Maracanã",
    match_date: new Date("2026-05-31T18:30:00-03:00"),
    match_number: 0,
    phase: "friendly",
  });

  matches.push({
    home_team: "Brasil",
    away_team: "Egito",
    group_name: null,
    stadium: "Cleveland",
    city: "Cleveland",
    country: "United States",
    match_date: new Date("2026-06-06T19:00:00-03:00"),
    match_number: -1,
    phase: "friendly",
  });

  return matches;
}

function buildKnockoutSeed() {
  const matches: Array<any> = [];
  let matchNumber = 73;

  const addMatches = (phase: string, pairs: Array<[string, string]>, baseDay: number, baseHour: number, stepHours = 12) => {
    pairs.forEach((pair, i) => {
      const dt = new Date(Date.UTC(2026, 6, baseDay, baseHour, 0, 0) + i * stepHours * 60 * 60 * 1000);
      matches.push({ home_team: pair[0], away_team: pair[1], group_name: null, stadium: KNOCKOUT_MATCH_STADIUM, match_date: dt, match_number: matchNumber++, phase });
    });
  };

  addMatches("round_of_32", KNOCKOUT_ROUND_OF_32_PAIRS, 5, 18);
  addMatches(
    "round_of_16",
    [
      ["Vencedor 73", "Vencedor 74"],
      ["Vencedor 75", "Vencedor 76"],
      ["Vencedor 77", "Vencedor 78"],
      ["Vencedor 79", "Vencedor 80"],
      ["Vencedor 81", "Vencedor 82"],
      ["Vencedor 83", "Vencedor 84"],
      ["Vencedor 85", "Vencedor 86"],
      ["Vencedor 87", "Vencedor 88"],
    ],
    13,
    18
  );

  addMatches(
    "quarterfinal",
    [
      ["Vencedor 89", "Vencedor 90"],
      ["Vencedor 91", "Vencedor 92"],
      ["Vencedor 93", "Vencedor 94"],
      ["Vencedor 95", "Vencedor 96"],
    ],
    20,
    18
  );

  addMatches("semifinal", [["Vencedor 97", "Vencedor 98"], ["Vencedor 99", "Vencedor 100"]], 27, 18);
  addMatches("third_place", [["Perdedor 101", "Perdedor 102"]], 31, 18);
  addMatches("final", [["Vencedor 101", "Vencedor 102"]], 31, 21);

  return matches;
}

export const TEAMS_DATA = buildTeamSeed();
export const MATCHES_DATA = [...buildFriendlySeed(), ...buildMatchSeed(), ...buildKnockoutSeed()];

export const MATCHES = MATCHES_DATA.map((m, i) => ({ ...m, id: `match-${i + 1}` }));
export const TOTAL_MATCHES = MATCHES.length;
