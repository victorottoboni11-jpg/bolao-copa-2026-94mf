export type PredictionForm = {
  casa: number;
  fora: number;
};

export type Team = {
  id: string;
  name: string;
  short_name?: string | null;
  fifa_code: string;
  group_name?: string | null;
  flag_url: string;
  continent?: string | null;
  created_at?: string;
};

export type Phase = "groups" | "round-of-16" | "quarterfinals" | "semifinals" | "final" | "pre-copa";

export type MatchPhase = "group_stage" | "round_of_16" | "quarterfinals" | "semifinals" | "final";

export type Match = {
  id: string;
  home_team_id?: string | null;
  away_team_id?: string | null;
  home_team?: Team | string | null;
  away_team?: Team | string | null;
  home_score?: number | null;
  away_score?: number | null;
  match_number?: number;
  phase: MatchPhase;
  group_name?: string | null;
  stadium?: string | null;
  city?: string | null;
  match_date?: string;
  match_datetime?: string;
  status?: "pending" | "live" | "finished" | "scheduled" | string;
  is_finished?: boolean;
  winner?: "home" | "away" | "draw" | null;
  winner_type?: "normal" | "penalties" | null;
  round?: number | null;
  result_updated?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type Prediction = {
  id: string;
  user_id: string;
  match_id: string;
  predicted_home: number;
  predicted_away: number;
  points: number;
  created_at?: string;
  updated_at?: string;
};

export type AppUser = {
  id: string;
  email?: string | null;
  name?: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
  is_admin?: boolean;
  created_at?: string;
};

export type LeaderboardEntry = {
  userId: string;
  userName: string;
  email?: string | null;
  userAvatar?: string | null;
  points: number;
  exacts: number;
  correctResults: number;
  predictions: number;
  preCopaPoints?: number;
  groupStagePoints?: number;
  knockoutPoints?: number;
  rank?: number;
};

export type PreCopaPrediction = {
  id: string;
  user_id: string;
  champion_team: string;
  runner_up_team: string;
  golden_ball_player: string;
  top_scorer_player: string;
  top_scorer_goals: number;
  most_assists_player: string;
  most_assists_count: number;
  fair_play_team: string;
  revelation_player: string;
  points: number;
  created_at?: string;
  updated_at?: string;
};

export type PreCopaResult = {
  id: string;
  champion_team: string;
  golden_ball_player: string;
  top_scorer_player: string;
  top_scorer_goals: number;
  best_goalkeeper_player: string;
  most_assists_player: string;
  most_assists_count: number;
  fair_play_team: string;
  revelation_player: string;
  created_at?: string;
};

export type RankingEntry = {
  rank: number;
  user_id: string;
  user_name: string;
  user_email?: string | null;
  user_avatar?: string | null;
  total_points: number;
  pre_copa_points: number;
  group_stage_points: number;
  knockout_points: number;
  exact_scores: number;
  created_at?: string;
};

export type GroupStandings = {
  group_name: string;
  teams: Array<{
    team_id: string;
    team_name: string;
    flag_url: string;
    played: number;
    won: number;
    drawn: number;
    lost: number;
    goals_for: number;
    goals_against: number;
    goal_difference: number;
    points: number;
  }>;
};
