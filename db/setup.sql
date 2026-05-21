-- SQL de criação de tabelas e políticas para o Bolão Oficial Copa 2026

-- Adiciona flag de administrador à tabela de usuários customizada
ALTER TABLE IF EXISTS users
  ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

ALTER TABLE IF EXISTS users
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- Tabela de palpites dos jogos
CREATE TABLE IF NOT EXISTS predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  match_id uuid NOT NULL REFERENCES matches(id),
  predicted_home integer NOT NULL,
  predicted_away integer NOT NULL,
  points integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id, match_id)
);

-- Tabela de ranking global
CREATE TABLE IF NOT EXISTS rankings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  total_points integer DEFAULT 0,
  exact_hits integer DEFAULT 0,
  winner_hits integer DEFAULT 0,
  group_stage_points integer DEFAULT 0,
  knockout_points integer DEFAULT 0,
  pre_copa_points integer DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id)
);

-- Tabela de palpites pré-copa
CREATE TABLE IF NOT EXISTS pre_copa_predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  champion_team text NOT NULL,
  runner_up_team text NOT NULL,
  top_scorer_player text NOT NULL,
  top_scorer_goals integer NOT NULL,
  best_goalkeeper_player text NOT NULL,
  best_player text NOT NULL,
  tournament_revelation text NOT NULL,
  points integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id)
);

-- Configuração administrativa de palpites abertos/fechados
CREATE TABLE IF NOT EXISTS admin_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  predictions_open boolean DEFAULT true,
  updated_at timestamptz DEFAULT now()
);

INSERT INTO admin_settings (id, predictions_open)
VALUES ('00000000-0000-0000-0000-000000000001', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de segurança (RLS)
ALTER TABLE IF EXISTS predictions ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "users can manage own predictions" ON predictions
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

ALTER TABLE IF EXISTS pre_copa_predictions ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "users can manage own pre copa" ON pre_copa_predictions
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

ALTER TABLE IF EXISTS rankings ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "public can read rankings" ON rankings
  FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "admins can manage rankings" ON rankings
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

ALTER TABLE IF EXISTS admin_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "admins can manage settings" ON admin_settings
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Nota: As políticas acima assumem que o Supabase está configurado para usar auth.uid() e auth.role().
-- Ajuste se necessário para sua instância Supabase.
