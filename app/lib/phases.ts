export const MATCH_PHASES = [
  "friendly",
  "group",
  "group_stage",
  "round_of_32",
  "round_of_16",
  "quarterfinal",
  "semifinal",
  "third_place",
  "final",
] as const;

export type MatchPhase = (typeof MATCH_PHASES)[number];

const LEGACY_PHASE_ALIASES: Record<string, MatchPhase> = {
  groups: "group",
  group_stage: "group",
  round_of_16: "round_of_16",
  quarterfinals: "quarterfinal",
  semifinals: "semifinal",
  round_of_32: "round_of_32",
  third_place: "third_place",
  final: "final",
};

export const MATCH_PHASE_LABELS: Record<MatchPhase, string> = {
  friendly: "Amistoso",
  group: "Fase de Grupos",
  group_stage: "Fase de Grupos",
  round_of_32: "32 avos",
  round_of_16: "Oitavas",
  quarterfinal: "Quartas de Final",
  semifinal: "Semifinal",
  third_place: "Disputa 3º Lugar",
  final: "Final",
};

export const GROUP_PHASES: ReadonlySet<MatchPhase> = new Set(["group", "group_stage"]);

export const KNOCKOUT_PHASES: ReadonlySet<MatchPhase> = new Set([
  "round_of_32",
  "round_of_16",
  "quarterfinal",
  "semifinal",
  "third_place",
  "final",
]);

export const KNOCKOUT_PHASE_ORDER: MatchPhase[] = [
  "round_of_32",
  "round_of_16",
  "quarterfinal",
  "semifinal",
  "third_place",
  "final",
];

export function normalizeMatchPhase(phase: string | undefined): MatchPhase | null {
  if (!phase) return null;

  const normalized = String(phase).trim().toLowerCase().replace(/[-\s]+/g, "_");
  return LEGACY_PHASE_ALIASES[normalized] ?? (MATCH_PHASES.includes(normalized as MatchPhase) ? (normalized as MatchPhase) : null);
}

export function isGroupPhase(phase: string | undefined): boolean {
  const n = normalizeMatchPhase(phase);
  return n === "group" || n === "group_stage" || phase === "group_stage";
}

export function isKnockoutPhase(phase: string | undefined): boolean {
  const normalized = normalizeMatchPhase(phase);
  return normalized !== null && KNOCKOUT_PHASES.has(normalized);
}

export function formatPhaseLabel(phase: string | undefined): string {
  const normalized = normalizeMatchPhase(phase);

  if (!normalized) {
    return "Fase desconhecida";
  }

  return MATCH_PHASE_LABELS[normalized];
}

export function getPhaseOrder(phase?: string): number | null {
  const normalized = normalizeMatchPhase(phase);
  if (!normalized) {
    return null;
  }

  const index = MATCH_PHASES.indexOf(normalized);
  return index === -1 ? null : index;
}
