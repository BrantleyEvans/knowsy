// Game state + persistence, extracted from JeopardyBoard so the component
// can focus on rendering + phase transitions.
//
// Responsibilities:
//   - useState<GameState>
//   - hydrate from localStorage if the cache has more played questions than
//     the server snapshot (host refreshed mid-game)
//   - on every mutation: write localStorage + debounced POST /api/save-game-state
//   - expose awardOrDeduct + adjustScore + setTeamName as stable callbacks

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { GameState } from './types';

export const DEFAULT_TEAM_NAMES: Record<string, string> = {
  t1: 'Team 1',
  t2: 'Team 2',
  t3: 'Team 3',
  t4: 'Team 4',
};

export const TEAM_IDS = ['t1', 't2', 't3', 't4'] as const;

export interface UseGameStateResult {
  state: GameState;
  setState: React.Dispatch<React.SetStateAction<GameState>>;
  awardOrDeduct: (
    teamId: string | null,
    deduct: boolean,
    activeTile: { ci: number; qi: number } | null,
    pointsForActiveTile: number
  ) => void;
  adjustScore: (teamId: string, delta: number) => void;
  setTeamName: (teamId: string, name: string) => void;
  playedKeys: Set<string>;
  allPlayed: boolean;
  totalTiles: number;
}

export function useGameState(
  gameToken: string,
  initialState: GameState | null | undefined,
  totalTiles: number
): UseGameStateResult {
  const seedState = useMemo<GameState>(
    () => ({
      played_questions: initialState?.played_questions || [],
      team_scores: {
        t1: 0,
        t2: 0,
        t3: 0,
        t4: 0,
        ...(initialState?.team_scores || {}),
      },
      team_names: { ...DEFAULT_TEAM_NAMES, ...(initialState?.team_names || {}) },
      final_played: initialState?.final_played || false,
      final_wagers: initialState?.final_wagers || {},
      final_results: initialState?.final_results || {},
    }),
    [initialState]
  );

  const [state, setState] = useState<GameState>(seedState);

  // Hydrate from localStorage if cache is newer than server
  useEffect(() => {
    const key = `knowsy-game-${gameToken}`;
    try {
      const cached = localStorage.getItem(key);
      if (cached) {
        const parsed = JSON.parse(cached) as { state: GameState; updatedAt: number };
        const serverPlayedCount = initialState?.played_questions?.length || 0;
        const cachedPlayedCount = parsed.state.played_questions?.length || 0;
        if (cachedPlayedCount > serverPlayedCount) {
          setState({
            ...seedState,
            ...parsed.state,
            team_scores: { ...seedState.team_scores, ...parsed.state.team_scores },
            team_names: { ...seedState.team_names, ...parsed.state.team_names },
          });
        }
      }
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameToken]);

  // Persist on every state change: localStorage immediately, server debounced 400ms
  useEffect(() => {
    const key = `knowsy-game-${gameToken}`;
    try {
      localStorage.setItem(key, JSON.stringify({ state, updatedAt: Date.now() }));
    } catch {
      /* ignore */
    }
    const timer = setTimeout(() => {
      fetch('/api/save-game-state', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ game_token: gameToken, game_state: state }),
      }).catch(() => {});
    }, 400);
    return () => clearTimeout(timer);
  }, [state, gameToken]);

  const playedKeys = useMemo(
    () => new Set(state.played_questions.map((p) => `${p.category_index}-${p.question_index}`)),
    [state.played_questions]
  );
  const allPlayed = playedKeys.size >= totalTiles;

  const setTeamName = useCallback((teamId: string, name: string) => {
    setState((s) => ({
      ...s,
      team_names: {
        ...s.team_names,
        [teamId]: name || DEFAULT_TEAM_NAMES[teamId],
      },
    }));
  }, []);

  const adjustScore = useCallback((teamId: string, delta: number) => {
    setState((s) => ({
      ...s,
      team_scores: { ...s.team_scores, [teamId]: (s.team_scores[teamId] || 0) + delta },
    }));
  }, []);

  const awardOrDeduct = useCallback(
    (
      teamId: string | null,
      deduct: boolean,
      activeTile: { ci: number; qi: number } | null,
      points: number
    ) => {
      if (!activeTile) return;
      setState((s) => {
        const newPlayed = [
          ...s.played_questions,
          {
            category_index: activeTile.ci,
            question_index: activeTile.qi,
            awarded_team: teamId || undefined,
            points_awarded: teamId ? (deduct ? -points : points) : 0,
          },
        ];
        const newScores = { ...s.team_scores };
        if (teamId) {
          newScores[teamId] = (newScores[teamId] || 0) + (deduct ? -points : points);
        }
        return { ...s, played_questions: newPlayed, team_scores: newScores };
      });
    },
    []
  );

  return {
    state,
    setState,
    awardOrDeduct,
    adjustScore,
    setTeamName,
    playedKeys,
    allPlayed,
    totalTiles,
  };
}
