-- ============================================================================
-- PERFORMANCE INDEXES FOR 3000+ CONCURRENT USERS
-- Based on SCALABILITY_CONFIGURATION.md
-- ============================================================================

-- Fast session PIN lookups (most common query)
CREATE INDEX IF NOT EXISTS idx_sessions_pin_status
ON sessions(session_pin, status)
WHERE status IN ('ready', 'live');

-- Admin dashboard queries
CREATE INDEX IF NOT EXISTS idx_sessions_admin_status
ON sessions(admin_id, status, created_at DESC);

-- Live game lookups
CREATE INDEX IF NOT EXISTS idx_live_games_session_status
ON live_games(session_id, status)
WHERE status IN ('lobby', 'playing');

-- Player queries (most frequent)
CREATE INDEX IF NOT EXISTS idx_game_players_game_team
ON game_players(live_game_id, team, connected);

CREATE INDEX IF NOT EXISTS idx_game_players_active
ON game_players(live_game_id, connected, last_active)
WHERE connected = true;

-- Territory claims (real-time)
CREATE INDEX IF NOT EXISTS idx_hex_territories_game_hex
ON hex_territories(live_game_id, hex_id);

CREATE INDEX IF NOT EXISTS idx_hex_territories_team
ON hex_territories(live_game_id, team);

-- Leaderboard rankings
CREATE INDEX IF NOT EXISTS idx_leaderboards_session_score
ON leaderboards(session_id, score DESC, completed_at DESC);

CREATE INDEX IF NOT EXISTS idx_individual_entries_session_score
ON individual_game_entries(individual_game_id, score DESC, completed_at DESC);

-- ============================================================================
-- VACUUM CONFIGURATION (Prevents bloat under high load)
-- ============================================================================

ALTER TABLE game_players SET (
  autovacuum_vacuum_scale_factor = 0.05,
  autovacuum_analyze_scale_factor = 0.02
);

ALTER TABLE hex_territories SET (
  autovacuum_vacuum_scale_factor = 0.05,
  autovacuum_analyze_scale_factor = 0.02
);

ALTER TABLE live_games SET (
  autovacuum_vacuum_scale_factor = 0.1,
  autovacuum_analyze_scale_factor = 0.05
);

-- ============================================================================
-- UPDATE TABLE STATISTICS
-- ============================================================================

ANALYZE sessions;
ANALYZE live_games;
ANALYZE game_players;
ANALYZE hex_territories;
ANALYZE leaderboards;
