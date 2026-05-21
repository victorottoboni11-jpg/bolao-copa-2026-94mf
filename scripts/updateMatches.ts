import { createClient } from "@supabase/supabase-js";
import { MATCHES_DATA, TEAMS_DATA } from "../app/lib/seedCopa2026Data";
import { getPhaseOrder } from "../app/lib/phases";

const SUPABASE_URL =
  process.env.SUPABASE_URL ??
  "https://qahwqsqzmbqgmiorvnek.supabase.co";
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.SUPABASE_KEY ??
  "sb_publishable_2COLVI6axBQfJnRGLMSKPg_BWmvb6kA";

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error(
    "Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or SUPABASE_KEY."
  );
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const STADIUM_LOCATION: Record<string, { city: string; country: string }> = {
  "NRG Stadium": { city: "Houston", country: "United States" },
  "AT&T Stadium": { city: "Arlington", country: "United States" },
  "MetLife Stadium": { city: "East Rutherford", country: "United States" },
  "SoFi Stadium": { city: "Inglewood", country: "United States" },
  "Allegiant Stadium": { city: "Las Vegas", country: "United States" },
  "Arrowhead Stadium": { city: "Kansas City", country: "United States" },
  "Levi's Stadium": { city: "Santa Clara", country: "United States" },
  "Lincoln Financial Field": { city: "Philadelphia", country: "United States" },
  "Soldier Field": { city: "Chicago", country: "United States" },
  "Gillette Stadium": { city: "Foxborough", country: "United States" },
  "Empower Field": { city: "Denver", country: "United States" },
  "Vancouver Stadium": { city: "Vancouver", country: "Canada" },
  "Mercedes-Benz Stadium": { city: "Atlanta", country: "United States" },
  "Hard Rock Stadium": { city: "Miami Gardens", country: "United States" },
  "BC Place": { city: "Vancouver", country: "Canada" },
  "Estadio Azteca": { city: "Mexico City", country: "Mexico" },
  "Estadio BBVA": { city: "Guadalupe", country: "Mexico" },
  "Estadio Akron": { city: "Zapopan", country: "Mexico" },
};

/**
 * Treat a given Date (or parsable date string) as a wall-clock time in
 * America/Sao_Paulo (Brasília) and return an ISO UTC string for that
 * instant. This ignores the local runtime timezone and forces Brasília
 * as the source of truth.
 */
function brasiliaToUTC(dateLike: Date | string | undefined | null) {
  if (!dateLike) return null;
  const d = typeof dateLike === "string" ? new Date(dateLike) : dateLike;
  const Y = d.getFullYear();
  const M = String(d.getMonth() + 1).padStart(2, "0");
  const D = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  const s = String(d.getSeconds()).padStart(2, "0");
  // Brasília is UTC-03:00 (use fixed -03:00 according to project rule)
  const isoWithOffset = `${Y}-${M}-${D}T${h}:${m}:${s}-03:00`;
  return new Date(isoWithOffset).toISOString();
}

const dryRun = process.argv.includes("--dry-run") || process.argv.includes("-d");

function normalizeMatch(
  match: typeof MATCHES_DATA[number],
  teamMap: Map<string, string>
) {
  const location = STADIUM_LOCATION[match.stadium] ?? null;
  const homeTeamId = teamMap.get(match.home_team) ?? null;
  const awayTeamId = teamMap.get(match.away_team) ?? null;

  if (!homeTeamId) {
    console.warn(`⚠️ Não foi possível encontrar o ID do time mandante: ${match.home_team}`);
  }
  if (!awayTeamId) {
    console.warn(`⚠️ Não foi possível encontrar o ID do time visitante: ${match.away_team}`);
  }

  const kickoffUtc = brasiliaToUTC(match.match_date) ?? null;

  return {
    home_team_id: homeTeamId,
    away_team_id: awayTeamId,
    match_number: match.match_number,
    phase: match.phase,
    phase_order: getPhaseOrder(match.phase),
    stadium: match.stadium,
    city: location?.city ?? null,
    country: location?.country ?? null,
    kickoff_at: kickoffUtc,
    match_date: kickoffUtc,
    status: "scheduled",
  };
}

async function upsertTeams() {
  console.log("🔁 Atualizando times da Copa 2026...");
  const teamsToUpsert = TEAMS_DATA.map((team) => ({
    name: team.name,
    fifa_code: team.fifa_code,
    group_name: team.group_name,
    flag_url: team.flag_url,
  }));

  if (dryRun) {
    console.log(`Dry run: would upsert ${teamsToUpsert.length} teams`);
    return;
  }

  const { error } = await supabase.from("teams").upsert(teamsToUpsert, {
    onConflict: "name",
  });

  if (error) {
    console.error("Falha ao upsertar times:", error.message);
    throw error;
  }

  console.log(`✅ Times atualizados: ${teamsToUpsert.length}`);
}

async function upsertMatches() {
  console.log("🔁 Atualizando partidas da Copa 2026...");

  const { data: teamsData, error: teamsError } = await supabase
    .from("teams")
    .select("id,name");

  if (teamsError) {
    console.error("Falha ao buscar IDs de times:", teamsError.message);
    throw teamsError;
  }

  const teamMap = new Map<string, string>();
  teamsData?.forEach((team) => {
    if (team.id && team.name) {
      teamMap.set(team.name, team.id);
    }
  });

  const matchesToUpsert = MATCHES_DATA.map((match) =>
    normalizeMatch(match, teamMap)
  );

  if (dryRun) {
    console.log(`Dry run: would upsert ${matchesToUpsert.length} matches`);
    console.log(matchesToUpsert.slice(0, 3));
    return;
  }

  const { error } = await supabase.from("matches").upsert(matchesToUpsert, {
    onConflict: "match_number",
  });

  if (error) {
    console.error("Falha ao upsertar partidas:", error.message);
    throw error;
  }

  console.log(`✅ Partidas atualizadas: ${matchesToUpsert.length}`);
}

async function run() {
  console.log("🚀 Iniciando updateMatches script");

  await upsertTeams();
  await upsertMatches();

  console.log("🎉 updateMatches concluído");
}

run().catch((error) => {
  console.error("❌ Erro no script updateMatches:", error);
  process.exit(1);
});
