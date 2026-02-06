import { useEffect, useRef, useCallback } from 'react';
import type { Tournament, TournamentSession } from '../services/tournamentService';
import { gameService } from '../services/gameService';
import { supabase } from '../lib/supabase';

/**
 * Returns true if the current Cairo time falls within the allowed scheduling window.
 * Checks active hours (e.g. 10:00-17:00) and excluded days (e.g. [5,6] = Fri/Sat).
 */
function isWithinSchedulingWindow(tournament: Tournament): boolean {
  // Convert current UTC to Cairo time (UTC+2)
  const now = new Date();
  const cairoOffset = 2 * 60; // Cairo is UTC+2
  const cairoTime = new Date(now.getTime() + cairoOffset * 60 * 1000);
  const cairoDay = cairoTime.getUTCDay(); // 0=Sun..6=Sat
  const cairoHour = cairoTime.getUTCHours();
  const cairoMinute = cairoTime.getUTCMinutes();

  // Check excluded days
  const excludedDays = tournament.excludedDays || (tournament.config?.excludedDays as number[]) || [];
  if (excludedDays.length > 0 && excludedDays.includes(cairoDay)) {
    return false;
  }

  // Check active hours
  const activeStart = tournament.activeHoursStart || (tournament.config?.activeHoursStart as string);
  const activeEnd = tournament.activeHoursEnd || (tournament.config?.activeHoursEnd as string);
  if (activeStart && activeEnd) {
    const [startH, startM] = activeStart.split(':').map(Number);
    const [endH, endM] = activeEnd.split(':').map(Number);
    const currentMinutes = cairoHour * 60 + cairoMinute;
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    if (currentMinutes < startMinutes || currentMinutes >= endMinutes) {
      return false;
    }
  }

  return true;
}

interface SchedulerOptions {
  tournament: Tournament | null;
  sessions: TournamentSession[];
  onSessionActivated?: (session: TournamentSession) => void;
  onSessionCompleted?: (session: TournamentSession) => void;
  onSessionsChanged?: () => void;
  enabled?: boolean;
}

/**
 * Client-side tournament session scheduler.
 * Polls every 5 seconds and auto-activates/completes sessions based on scheduled times.
 * Uses conditional DB updates to prevent race conditions from multiple clients.
 */
export function useTournamentScheduler({
  tournament,
  sessions,
  onSessionActivated,
  onSessionCompleted,
  onSessionsChanged,
  enabled = true,
}: SchedulerOptions) {
  const processingRef = useRef(false);
  const lastCheckRef = useRef(0);

  const checkAndTransition = useCallback(async () => {
    if (!tournament || tournament.status !== 'active' || processingRef.current) return;
    
    const now = Date.now();
    // Debounce: don't check more than once per 4 seconds
    if (now - lastCheckRef.current < 4000) return;
    lastCheckRef.current = now;
    processingRef.current = true;

    try {
      // 1. Check if any active session should be completed
      const activeSession = sessions.find(s => s.status === 'active');
      if (activeSession) {
        const endTime = new Date(activeSession.scheduledEnd).getTime();
        if (now >= endTime) {
          // Complete this session - use conditional update (only if still active)
          const { error: completeError } = await supabase
            .from('tournament_sessions')
            .update({
              status: 'completed',
              actual_end: new Date().toISOString(),
            })
            .eq('id', activeSession.id)
            .eq('status', 'active'); // Conditional: only if still active

          if (!completeError) {
            // End the live game if exists
            if (activeSession.liveGameId) {
              const game = await gameService.getLiveGame(activeSession.liveGameId);
              if (game && game.status === 'playing') {
                // Record final scores on the session
                await supabase
                  .from('tournament_sessions')
                  .update({
                    team1_final_score: game.team1Score,
                    team2_final_score: game.team2Score,
                    winner: game.team1Score > game.team2Score ? 'team1'
                      : game.team2Score > game.team1Score ? 'team2'
                      : 'tie',
                  })
                  .eq('id', activeSession.id);

                await gameService.endGame(activeSession.liveGameId);
              }
            }
            onSessionCompleted?.(activeSession);
            onSessionsChanged?.();
          }
          processingRef.current = false;
          return; // Let next tick handle activation
        }
      }

      // 2. Check if a pending session should be activated
      if (!activeSession) {
        // Skip activation if outside scheduling window (active hours / excluded days)
        if (!isWithinSchedulingWindow(tournament)) {
          processingRef.current = false;
          return;
        }

        const pendingSession = sessions.find(s => s.status === 'pending');
        if (pendingSession) {
          const startTime = new Date(pendingSession.scheduledStart).getTime();
          if (now >= startTime) {
            // Create a live game for this session
            const liveGame = await createLiveGameForSession(pendingSession, tournament);
            
            if (liveGame) {
              // Activate session with conditional update
              const { error: activateError } = await supabase
                .from('tournament_sessions')
                .update({
                  status: 'active',
                  actual_start: new Date().toISOString(),
                  live_game_id: liveGame.id,
                })
                .eq('id', pendingSession.id)
                .eq('status', 'pending'); // Conditional: only if still pending

              if (!activateError) {
                // Start the live game
                const durationSeconds = tournament.sessionDurationSeconds;
                await gameService.startGame(liveGame.id, durationSeconds);
                onSessionActivated?.(pendingSession);
                onSessionsChanged?.();
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('[TournamentScheduler] Error during check:', error);
    } finally {
      processingRef.current = false;
    }
  }, [tournament, sessions, onSessionActivated, onSessionCompleted, onSessionsChanged]);

  useEffect(() => {
    if (!enabled || !tournament || tournament.status !== 'active') return;

    // Run immediately
    checkAndTransition();

    // Then poll every 5 seconds
    const interval = setInterval(checkAndTransition, 5000);
    return () => clearInterval(interval);
  }, [enabled, tournament?.id, tournament?.status, sessions, checkAndTransition]);
}

/**
 * Creates a live_game row for a tournament session.
 * The live_games table references sessions.id, but tournament sessions
 * don't have a matching sessions row. We need to create a temporary
 * sessions-compatible game entry.
 */
async function createLiveGameForSession(
  session: TournamentSession,
  tournament: Tournament
) {
  try {
    // live_games requires a session_id. For tournaments, we create a
    // temporary session row or use an existing approach.
    // Since live_games.session_id references sessions(id), we need to
    // first ensure a session row exists for this tournament session.

    // Check if there's already a sessions row for this tournament session
    const { data: existingSession } = await supabase
      .from('sessions')
      .select('id')
      .eq('name', `tournament-${tournament.id}-session-${session.sessionNumber}`)
      .maybeSingle();

    let sessionId: string;

    if (existingSession) {
      sessionId = existingSession.id;
    } else {
      // Create a lightweight session row for the live game
      const pin = `T${tournament.id.slice(0, 4).toUpperCase()}${session.sessionNumber}`;
      const { data: newSession, error: sessionError } = await supabase
        .from('sessions')
        .insert({
          admin_id: tournament.adminId,
          name: `tournament-${tournament.id}-session-${session.sessionNumber}`,
          description: `Auto-generated for tournament: ${tournament.name}`,
          type: 'team_battle',
          status: 'live',
          session_pin: `${pin}-${Date.now().toString(36)}`,
          config_duration: tournament.sessionDurationSeconds,
          config_max_players_per_team: tournament.maxPlayersPerTeam,
          config_hex_grid_size: tournament.design?.hexGridSize || 18,
          config_time_per_question: tournament.design?.timePerQuestion || 15,
          config_points_per_correct_answer: tournament.design?.pointsPerCorrectAnswer || 10,
          design_team1_name: tournament.design?.team1?.name || 'Team 1',
          design_team1_color: tournament.design?.team1?.color || '#E00800',
          design_team1_icon: tournament.design?.team1?.icon || '🔴',
          design_team2_name: tournament.design?.team2?.name || 'Team 2',
          design_team2_color: tournament.design?.team2?.color || '#003DA5',
          design_team2_icon: tournament.design?.team2?.icon || '🔵',
          design_background_theme: tournament.design?.backgroundTheme || 'innovation',
          design_branding_text: tournament.design?.brandingText || '',
          questions: tournament.questions || [],
        })
        .select()
        .single();

      if (sessionError || !newSession) {
        console.error('[TournamentScheduler] Failed to create session row:', sessionError);
        return null;
      }
      sessionId = newSession.id;
    }

    // Now create the live game
    const { data: liveGame, error: gameError } = await supabase
      .from('live_games')
      .insert({
        session_id: sessionId,
        status: 'lobby',
        team1_score: 0,
        team2_score: 0,
      })
      .select()
      .single();

    if (gameError || !liveGame) {
      console.error('[TournamentScheduler] Failed to create live game:', gameError);
      return null;
    }

    return gameService.mapDbToLiveGame(liveGame);
  } catch (error) {
    console.error('[TournamentScheduler] Error creating live game:', error);
    return null;
  }
}
