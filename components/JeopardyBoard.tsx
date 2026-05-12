'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { GameData, GameState } from '@/lib/types';
import QuestionDisplay from './QuestionDisplay';
import Scoreboard from './Scoreboard';

interface Props {
  gameToken: string;
  gameData: GameData;
  initialState: GameState;
  eventName: string;
  brideName: string;
}

type Phase =
  | 'board'
  | 'question'
  | 'final-setup'
  | 'final-wager'
  | 'final-question'
  | 'final-answer'
  | 'final-result'
  | 'winner';

const DEFAULT_TEAM_NAMES: Record<string, string> = {
  t1: 'Team 1',
  t2: 'Team 2',
  t3: 'Team 3',
  t4: 'Team 4',
};

const TEAM_IDS = ['t1', 't2', 't3', 't4'];

export default function JeopardyBoard({
  gameToken,
  gameData,
  initialState,
  eventName,
  brideName,
}: Props) {
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
  const [phase, setPhase] = useState<Phase>('board');
  const [activeTile, setActiveTile] = useState<{ ci: number; qi: number } | null>(null);

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

  // Save to localStorage + server on every change
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

  const totalTiles = gameData.categories.reduce((n, c) => n + c.questions.length, 0);
  const playedKeys = new Set(
    state.played_questions.map((p) => `${p.category_index}-${p.question_index}`)
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
      team_scores: {
        ...s.team_scores,
        [teamId]: (s.team_scores[teamId] || 0) + delta,
      },
    }));
  }, []);

  const handleTileClick = (ci: number, qi: number) => {
    if (playedKeys.has(`${ci}-${qi}`)) return;
    setActiveTile({ ci, qi });
    setPhase('question');
  };

  const awardOrDeduct = (teamId: string | null, deduct = false) => {
    if (!activeTile) return;
    const q = gameData.categories[activeTile.ci].questions[activeTile.qi];
    setState((s) => {
      const newPlayed = [
        ...s.played_questions,
        {
          category_index: activeTile.ci,
          question_index: activeTile.qi,
          awarded_team: teamId || undefined,
          points_awarded: teamId ? (deduct ? -q.points : q.points) : 0,
        },
      ];
      const newScores = { ...s.team_scores };
      if (teamId) {
        newScores[teamId] =
          (newScores[teamId] || 0) + (deduct ? -q.points : q.points);
      }
      return { ...s, played_questions: newPlayed, team_scores: newScores };
    });
    setActiveTile(null);
    setPhase('board');
  };

  const [wagers, setWagers] = useState<Record<string, string>>({});
  const [finalResults, setFinalResults] = useState<Record<string, boolean>>({});

  const startFinal = () => {
    setWagers(Object.fromEntries(TEAM_IDS.map((t) => [t, ''])));
    setFinalResults({});
    setPhase('final-setup');
  };

  const confirmWagers = () => {
    const parsed: Record<string, number> = {};
    for (const t of TEAM_IDS) {
      const v = parseInt(wagers[t] || '0', 10);
      parsed[t] = isNaN(v) ? 0 : Math.max(0, v);
    }
    setState((s) => ({ ...s, final_wagers: parsed }));
    setPhase('final-question');
  };

  const applyFinalResults = () => {
    setState((s) => {
      const scores = { ...s.team_scores };
      for (const t of TEAM_IDS) {
        const wager = (s.final_wagers || {})[t] || 0;
        if (finalResults[t]) {
          scores[t] = (scores[t] || 0) + wager;
        } else {
          scores[t] = (scores[t] || 0) - wager;
        }
      }
      return {
        ...s,
        team_scores: scores,
        final_played: true,
        final_results: finalResults,
      };
    });
    setPhase('winner');
  };

  // QUESTION VIEW
  if (phase === 'question' && activeTile) {
    const q = gameData.categories[activeTile.ci].questions[activeTile.qi];
    const cat = gameData.categories[activeTile.ci].name;
    return (
      <QuestionDisplay
        category={cat}
        points={q.points}
        question={q.question_text}
        answer={q.answer_text}
        teamNames={state.team_names || DEFAULT_TEAM_NAMES}
        onAward={(teamId) => awardOrDeduct(teamId, false)}
        onDeduct={(teamId) => awardOrDeduct(teamId, true)}
        onSkip={() => awardOrDeduct(null)}
      />
    );
  }

  // FINAL SETUP — wagers
  if (phase === 'final-setup') {
    return (
      <div className="game-surface min-h-screen p-6 sm:p-12 flex flex-col">
        <h2 className="text-center text-2xl sm:text-4xl font-extrabold uppercase tracking-[0.2em] text-[#FFC857]">
          Final Knowsy
        </h2>
        <p className="text-center mt-6 text-base opacity-75">Category</p>
        <p className="text-center mt-2 text-3xl sm:text-5xl font-bold">
          {gameData.final_jeopardy.category}
        </p>
        <p className="text-center mt-10 opacity-80">
          Each team enters a wager (0 to their current score):
        </p>
        <div className="mt-6 max-w-2xl mx-auto w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
          {TEAM_IDS.map((t) => (
            <div key={t} className="bg-white text-[#1E1B3A] rounded-xl p-4">
              <div className="text-xs uppercase tracking-wider text-[#1E1B3A]/60">
                {(state.team_names || DEFAULT_TEAM_NAMES)[t]}
              </div>
              <div className="text-2xl font-extrabold mt-1">
                ${state.team_scores[t] ?? 0}
              </div>
              <input
                type="number"
                min="0"
                value={wagers[t] || ''}
                onChange={(e) =>
                  setWagers((w) => ({ ...w, [t]: e.target.value }))
                }
                placeholder="Wager…"
                className="mt-2 w-full px-3 py-2 border border-[#1E1B3A]/20 rounded-lg"
              />
            </div>
          ))}
        </div>
        <button
          onClick={confirmWagers}
          className="mt-10 mx-auto bg-[#E85D5D] hover:bg-[#C94646] text-white font-bold px-8 py-3 rounded-full transition-colors"
        >
          Reveal the question →
        </button>
      </div>
    );
  }

  // FINAL QUESTION
  if (phase === 'final-question') {
    return (
      <div className="game-surface min-h-screen p-6 sm:p-12 flex flex-col items-center justify-center">
        <p className="uppercase tracking-[0.3em] text-xs sm:text-sm text-[#FFC857]">
          Final Knowsy
        </p>
        <h2 className="text-2xl sm:text-4xl font-bold mt-3 text-center">
          {gameData.final_jeopardy.category}
        </h2>
        <p className="mt-12 text-center text-3xl sm:text-5xl font-extrabold leading-tight max-w-4xl">
          {gameData.final_jeopardy.question_text}
        </p>
        <button
          onClick={() => setPhase('final-answer')}
          className="mt-12 bg-[#E85D5D] hover:bg-[#C94646] text-white font-bold px-8 py-3 rounded-full"
        >
          Show answer
        </button>
      </div>
    );
  }

  // FINAL ANSWER
  if (phase === 'final-answer') {
    return (
      <div className="game-surface min-h-screen p-6 sm:p-12 flex flex-col items-center justify-center">
        <p className="uppercase tracking-[0.3em] text-xs sm:text-sm text-[#FFC857]">
          The answer
        </p>
        <p className="mt-6 text-center text-3xl sm:text-5xl font-extrabold leading-tight max-w-4xl text-[#FFC857]">
          {gameData.final_jeopardy.answer_text}
        </p>
        <p className="mt-12 opacity-80">Did each team get it right?</p>
        <div className="mt-4 max-w-2xl w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
          {TEAM_IDS.map((t) => (
            <div
              key={t}
              className="bg-white text-[#1E1B3A] rounded-xl p-3 flex items-center justify-between"
            >
              <div>
                <div className="text-xs uppercase tracking-wider text-[#1E1B3A]/60">
                  {(state.team_names || DEFAULT_TEAM_NAMES)[t]}
                </div>
                <div className="text-xs text-[#1E1B3A]/60">
                  Wagered ${(state.final_wagers || {})[t] || 0}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setFinalResults((r) => ({ ...r, [t]: true }))}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    finalResults[t] === true
                      ? 'bg-green-600 text-white'
                      : 'bg-zinc-100 text-zinc-700'
                  }`}
                >
                  ✓ Right
                </button>
                <button
                  onClick={() => setFinalResults((r) => ({ ...r, [t]: false }))}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    finalResults[t] === false
                      ? 'bg-red-600 text-white'
                      : 'bg-zinc-100 text-zinc-700'
                  }`}
                >
                  ✗ Wrong
                </button>
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={applyFinalResults}
          disabled={TEAM_IDS.some((t) => !(t in finalResults))}
          className="mt-8 bg-[#E85D5D] hover:bg-[#C94646] disabled:opacity-40 text-white font-bold px-8 py-3 rounded-full"
        >
          See final scores →
        </button>
      </div>
    );
  }

  // WINNER
  if (phase === 'winner') {
    const sorted = TEAM_IDS.map((t) => ({
      t,
      score: state.team_scores[t] || 0,
      name: (state.team_names || DEFAULT_TEAM_NAMES)[t],
    })).sort((a, b) => b.score - a.score);
    return (
      <div className="game-surface min-h-screen p-6 sm:p-12 flex flex-col items-center justify-center">
        <p className="uppercase tracking-[0.3em] text-xs text-[#FFC857]">Champion</p>
        <h2 className="text-5xl sm:text-7xl font-extrabold mt-4 text-center">
          {sorted[0].name}
        </h2>
        <p className="text-2xl sm:text-3xl mt-3 text-[#FFC857] font-bold">
          ${sorted[0].score.toLocaleString()}
        </p>
        <div className="mt-10 max-w-md w-full space-y-2">
          {sorted.map((t, i) => (
            <div
              key={t.t}
              className={`flex items-center justify-between px-5 py-3 rounded-xl ${
                i === 0
                  ? 'bg-[#FFC857] text-[#1E1B3A]'
                  : 'bg-white/10 text-[#FFF8F0]'
              }`}
            >
              <span className="font-semibold">
                {i + 1}. {t.name}
              </span>
              <span className="font-extrabold">${t.score.toLocaleString()}</span>
            </div>
          ))}
        </div>
        <button
          onClick={() => setPhase('board')}
          className="mt-10 text-sm underline opacity-70 hover:opacity-100"
        >
          Back to board
        </button>
      </div>
    );
  }

  // DEFAULT: BOARD
  return (
    <div className="game-surface min-h-screen flex flex-col">
      <header className="px-4 sm:px-8 pt-6 pb-3 text-center">
        <p className="text-xs sm:text-sm uppercase tracking-[0.25em] text-[#FFC857] font-semibold">
          Knowsy
        </p>
        <h1 className="text-2xl sm:text-4xl font-extrabold mt-1">
          {brideName ? `${brideName}'s Trivia Night` : eventName}
        </h1>
        <p className="text-xs sm:text-sm opacity-70 mt-1">
          {playedKeys.size} / {totalTiles} questions played
        </p>
      </header>

      <div className="flex-1 px-2 sm:px-6 pb-4">
        <div className="max-w-6xl mx-auto h-full grid grid-cols-5 gap-1.5 sm:gap-2">
          {gameData.categories.map((cat, ci) => (
            <div key={ci} className="flex flex-col gap-1.5 sm:gap-2">
              <div className="category-header flex items-center justify-center text-center px-1 py-3 sm:py-4 min-h-[60px] sm:min-h-[80px] uppercase text-[10px] sm:text-sm leading-tight">
                <span>{cat.name}</span>
              </div>
              {cat.questions.map((q, qi) => {
                const played = playedKeys.has(`${ci}-${qi}`);
                return (
                  <button
                    key={qi}
                    onClick={() => handleTileClick(ci, qi)}
                    disabled={played}
                    className={`game-tile ${played ? 'played' : ''} flex items-center justify-center min-h-[60px] sm:min-h-[90px] font-extrabold text-2xl sm:text-4xl`}
                  >
                    {played ? '' : <span className="tile-amount">${q.points}</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {allPlayed && !state.final_played && (
        <div className="text-center pb-3">
          <button
            onClick={startFinal}
            className="bg-[#E85D5D] hover:bg-[#C94646] text-white font-bold px-8 py-3 rounded-full transition-colors"
          >
            🎲 Start Final Knowsy
          </button>
        </div>
      )}

      {allPlayed && state.final_played && (
        <div className="text-center pb-3">
          <button
            onClick={() => setPhase('winner')}
            className="bg-white/10 hover:bg-white/20 text-white font-medium px-6 py-2 rounded-full text-sm"
          >
            Show final standings →
          </button>
        </div>
      )}

      <Scoreboard
        teamIds={TEAM_IDS}
        teamNames={state.team_names || DEFAULT_TEAM_NAMES}
        scores={state.team_scores}
        onRename={setTeamName}
        onAdjust={adjustScore}
      />
    </div>
  );
}
