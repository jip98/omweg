CREATE TABLE IF NOT EXISTS feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vote INTEGER NOT NULL,            -- 1 = like, -1 = dislike
  type TEXT,                        -- direction | timer | spotting | stop | choice | random
  title TEXT,
  instruction TEXT,                 -- generiek, zonder plaatsnaam
  mode TEXT,                        -- casual | date | ...
  location_type TEXT,               -- snelweg | dorp | ...
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_feedback_vote ON feedback (vote);
CREATE INDEX IF NOT EXISTS idx_feedback_type ON feedback (type);
