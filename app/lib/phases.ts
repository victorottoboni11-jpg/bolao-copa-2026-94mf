export const MATCH_PHASES = [
  "group",
  "round_of_32",
  "round_of_16",
  "quarterfinal",
  "semifinal",
  "third_place",
  "final",
] as const;

export type MatchPhase = (typeof MATCH_PHASES)[number];

export const MATCH_PHASE_LABELS: Record<MatchPhase, string> = {
  group: "Fase de Grupos",
  round_of_32: "32 avos",
  round_of_16: "Oitavas",
  quarterfinal: "Quartas de Final",
  semifinal: "Semifinal",
  third_place: "Disputa 3º Lugar",
  final: "Final",
};

export const GROUP_PHASES: ReadonlySet<MatchPhase> = new Set(["group"]);

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

export function isGroupPhase(phase: string | undefined): phase is MatchPhase {
  return phase !== undefined && GROUP_PHASES.has(phase as MatchPhase);
}

export function isKnockoutPhase(phase: string | undefined): phase is MatchPhase {
  return phase !== undefined && KNOCKOUT_PHASES.has(phase as MatchPhase);
}

export function formatPhaseLabel(phase: string | undefined): string {
  if (!phase) {
    return "Fase desconhecida";
  }

  if (phase in MATCH_PHASE_LABELS) {
    return MATCH_PHASE_LABELS[phase as MatchPhase];
  }

  return String(phase).replace(/_/g, " ");
}

export function getPhaseOrder(phase?: string): number | null {
  if (!phase) {
    return null;
  }

  const index = MATCH_PHASES.indexOf(phase as MatchPhase);
  return index === -1 ? null : index;
}
