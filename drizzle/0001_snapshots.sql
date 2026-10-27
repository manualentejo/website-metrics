CREATE TABLE IF NOT EXISTS snapshots (
  site_id uuid NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  strategy text NOT NULL,
  final_screenshot text,
  thumbnails jsonb,
  captured_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS snapshots_site_strategy_idx ON snapshots (site_id, strategy);
