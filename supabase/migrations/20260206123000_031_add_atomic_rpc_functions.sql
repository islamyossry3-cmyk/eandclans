-- ============================================================================
-- ATOMIC INCREMENT RPC FUNCTIONS
-- Prevents race conditions on scores and player stats updates
-- ============================================================================

-- Atomic team score increment
CREATE OR REPLACE FUNCTION increment_game_score(
  game_id uuid,
  score_column text,
  increment_by integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF score_column NOT IN ('team1_score', 'team2_score') THEN
    RAISE EXCEPTION 'Invalid score column: %', score_column;
  END IF;

  EXECUTE format(
    'UPDATE live_games SET %I = %I + $1, updated_at = now() WHERE id = $2',
    score_column,
    score_column
  )
  USING increment_by, game_id;
END;
$$;

-- Atomic player stats increment (game_players)
CREATE OR REPLACE FUNCTION increment_player_stats(
  player_id uuid,
  add_questions integer DEFAULT 0,
  add_correct integer DEFAULT 0,
  add_territories integer DEFAULT 0
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE game_players
  SET questions_answered = questions_answered + add_questions,
      correct_answers = correct_answers + add_correct,
      territories_claimed = territories_claimed + add_territories,
      last_active = now()
  WHERE id = player_id;
$$;

-- Atomic tournament player stats increment (tournament_players)
-- Includes credit logic (1 credit per 3 correct answers)
CREATE OR REPLACE FUNCTION increment_tournament_player_stats(
  player_id uuid,
  add_correct integer DEFAULT 0,
  add_credits integer DEFAULT 0,
  add_territories integer DEFAULT 0,
  add_sessions integer DEFAULT 0
)
RETURNS TABLE(total_credits integer, credit_earned boolean)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE tournament_players
  SET total_correct_answers = total_correct_answers + add_correct,
      total_territories_claimed = total_territories_claimed + add_territories,
      sessions_played = sessions_played + add_sessions,
      total_credits = total_credits
        + add_credits
        + ((total_correct_answers + add_correct) / 3)
        - (total_correct_answers / 3),
      updated_at = now()
  WHERE id = player_id
  RETURNING
    total_credits,
    ((total_correct_answers / 3) > ((total_correct_answers - add_correct) / 3)) AS credit_earned;
$$;
