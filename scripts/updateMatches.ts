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

const dryRun = process.argv.includes("--dry-run") || process.argv.includes("-d");

function normalizeMatch(match: typeof MATCHES_DATA[number]) {
  const location = STADIUM_LOCATION[match.stadium] ?? null;

  return {
    home_team: match.home_team,
    away_team: match.away_team,
    home_score: null,
    away_score: null,
    match_number: match.match_number,
    phase: match.phase,
    phase_order: getPhaseOrder(match.phase),
    group_name: match.group_name ?? null,
    stadium: match.stadium,
    city: location?.city ?? null,
    country: location?.country ?? null,
    kickoff_at: match.match_date?.toISOString() ?? null,
    status: "scheduled",
    is_finished: false,
    result_updated: false,
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

  const matchesToUpsert = MATCHES_DATA.map(normalizeMatch);

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
