CREATE TABLE IF NOT EXISTS sites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  url text NOT NULL,
  status text NOT NULL DEFAULT 'em_andamento',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  strategy text NOT NULL,
  ran_at timestamptz NOT NULL DEFAULT now(),

  performance_score real,
  accessibility_score real,
  best_practices_score real,
  seo_score real,

  fcp_ms real,
  lcp_ms real,
  tbt_ms real,
  cls real,
  speed_index_ms real,

  failed_seo_audits jsonb,
  error text
);

CREATE INDEX IF NOT EXISTS reports_site_strategy_ran_at_idx
  ON reports (site_id, strategy, ran_at DESC);
