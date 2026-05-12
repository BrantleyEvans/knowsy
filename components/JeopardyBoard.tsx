'use client';

import { useEffect, useMemo, useState } from 'react';
import type { GameData, GameState } from '@/lib/types';
import { TEAM_IDS, useGameState, DEFAULT_TEAM_NAMES } from '@/lib/useGameState';
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
  | 'final-question'
  | 'final-answer'
  | 'winner';

function useIsPortrait(): boolean {
  const [portrait, setPortrait] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(orientation: portrait)');
    const sync = () => setPortrait(mq.matches);
    sync();
    if (mq.addEventListener) mq.addEventListener('change', sync);
    else mq.addListener(sync);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', sync);
      else mq.removeListener(sync);
    };
  }, []);
  return portrait;
}

function RotatePrompt() {
  return (
    <div className="rotate-prompt">
      <div className="icon" aria-hidden>📱</div>
      <h1 className="script text-5xl sm:text-6xl mt-6 text-[#E8D5B7]">Rotate to play</h1>
      <p className="mt-3 max-w-sm opacity-85 text-sm sm:text-base leading-relaxed">
        Knowsy is designed for landscape. Turn your phone sideways (or open this
        link on a laptop) to play.
      </p>
    </div>
  );
}

export default function JeopardyBoard({
  gameToken,
  gameData,
  initialState,
  eventName,
  brideName,
}: Props) {
  const totalTiles = useMemo(
    () => gameData.categories.reduce((n, c) => n + c.questions.length, 0),
    [gameData]
  );
  const isPortrait = useIsPortrait();

  const {
    state,
    setState,
    awardOrDeduct,
    adjustScore,
    setTeamName,
    playedKeys,
    allPlayed,
  } = useGameState(gameToken, initialState, totalTiles);

  const [phase, setPhase] = useState<Phase>('board');
  const [activeTile, setActiveTile] = useState<{ ci: number; qi: number } | null>(null);

  // Final-round local state
  const [wagers, setWagers] = useState<Record<string, string>>({});
  const [finalResults, setFinalResults] = useState<Record<string, boolean>>({});

  const handleTileClick = (ci: number, qi: number) => {
    if (playedKeys.has(`${ci}-${qi}`)) return;
    setActiveTile({ ci, qi });
    setPhase('question');
  };

  const handleAward = (teamId: string) => {
    if (!activeTile) return;
    const pts = gameData.categories[activeTile.ci].questions[activeTile.qi].points;
    awardOrDeduct(teamId, false, activeTile, pts);
    setActiveTile(null);
    setPhase('board');
  };
  const handleDeduct = (teamId: string) => {
    if (!activeTile) return;
    const pts = gameData.categories[activeTile.ci].questions[activeTile.qi].points;
    awardOrDeduct(teamId, true, activeTile, pts);
    setActiveTile(null);
    setPhase('board');
  };
  const handleSkip = () => {
    if (!activeTile) return;
    const pts = gameData.categories[activeTile.ci].questions[activeTile.qi].points;
    awardOrDeduct(null, false, activeTile, pts);
    setActiveTile(null);
    setPhase('board');
  };
  const handleBack = () => {
    setActiveTile(null);
    setPhase('board');
  };

  // ----- Portrait override (renders FIRST, blocks all gameplay) -----
  if (isPortrait) return <RotatePrompt />;

  // ----- Question phase -----
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
        teamScores={state.team_scores}
        onAward={handleAward}
        onDeduct={handleDeduct}
        onSkip={handleSkip}
        onBack={handleBack}
      />
    );
  }

  // ----- Final round screens (kept mostly as-is, minor compaction) -----
  if (phase === 'final-setup') {
    const confirmWagers = () => {
      const parsed: Record<string, number> = {};
      for (const t of TEAM_IDS) {
        const v = parseInt(wagers[t] || '0', 10);
        parsed[t] = isNaN(v) ? 0 : Math.max(0, v);
      }
      setState((s) => ({ ...s, final_wagers: parsed }));
      setPhase('final-question');
    };
    return (
      <div className="game-surface fixed inset-0 p-4 sm:p-8 flex flex-col overflow-auto">
        <h2 className="script text-center text-4xl sm:text-6xl text-[#E8D5B7]">Final Knowsy</h2>
        <p className="text-center mt-3 text-xs uppercase tracking-widest opacity-75">Category</p>
        <p className="text-center mt-1 text-2xl sm:text-4xl font-bold">
          {gameData.final_jeopardy.category}
        </p>
        <p className="text-center mt-4 opacity-80 text-sm">Each team enters a wager (0 to their current score):</p>
        <div className="mt-3 max-w-2xl mx-auto w-full grid grid-cols-2 sm:grid-cols-4 gap-2">
          {TEAM_IDS.map((t) => (
            <div key={t} className="bg-white text-[#5C1A2F] rounded-xl p-2 sm:p-3">
              <div className="text-[10px] uppercase tracking-wider text-[#5C1A2F]/60 truncate">
                {(state.team_names || DEFAULT_TEAM_NAMES)[t]}
              </div>
              <div className="text-lg sm:text-xl font-extrabold mt-0.5">
                ${state.team_scores[t] ?? 0}
              </div>
              <input
                type="number"
                min="0"
                value={wagers[t] || ''}
                onChange={(e) => setWagers((w) => ({ ...w, [t]: e.target.value }))}
                placeholder="Wager…"
                className="mt-1 w-full px-2 py-1 border border-[#B76E79]/25 rounded text-sm"
              />
            </div>
          ))}
        </div>
        <div className="mt-4 text-center">
          <button onClick={confirmWagers} className="bg-[#B76E79] hover:bg-[#9A5660] text-white font-bold px-6 py-2 rounded-full text-sm transition-colors">
            Reveal the question →
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'final-question') {
    return (
      <div className="game-surface fixed inset-0 p-4 sm:p-8 flex flex-col items-center justify-center">
        <p className="uppercase tracking-[0.3em] text-[10px] sm:text-xs text-[#E8D5B7]">Final Knowsy</p>
        <h2 className="text-xl sm:text-3xl font-bold mt-2 text-center">
          {gameData.final_jeopardy.category}
        </h2>
        <p className="mt-6 text-center font-extrabold leading-tight max-w-4xl text-[clamp(1.25rem,3vw,2.75rem)]">
          {gameData.final_jeopardy.question_text}
        </p>
        <button onClick={() => setPhase('final-answer')} className="mt-6 bg-[#B76E79] hover:bg-[#9A5660] text-white font-bold px-6 py-2 rounded-full">
          Show answer
        </button>
      </div>
    );
  }

  if (phase === 'final-answer') {
    const applyFinalResults = () => {
      setState((s) => {
        const scores = { ...s.team_scores };
        for (const t of TEAM_IDS) {
          const wager = (s.final_wagers || {})[t] || 0;
          if (finalResults[t]) scores[t] = (scores[t] || 0) + wager;
          else scores[t] = (scores[t] || 0) - wager;
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
    return (
      <div className="game-surface fixed inset-0 p-4 sm:p-8 flex flex-col items-center justify-center overflow-auto">
        <p className="uppercase tracking-[0.3em] text-[10px] sm:text-xs text-[#E8D5B7]">The answer</p>
        <p className="mt-3 text-center font-extrabold leading-tight max-w-4xl text-[#E8D5B7] text-[clamp(1rem,2.5vw,2.25rem)]">
          {gameData.final_jeopardy.answer_text}
        </p>
        <p className="mt-5 opacity-80 text-sm">Did each team get it right?</p>
        <div className="mt-3 max-w-2xl w-full grid grid-cols-2 sm:grid-cols-4 gap-2">
          {TEAM_IDS.map((t) => (
            <div key={t} className="bg-white text-[#5C1A2F] rounded-xl p-2 flex flex-col items-center gap-1">
              <div className="text-[10px] uppercase tracking-wider text-[#5C1A2F]/60 truncate w-full text-center">
                {(state.team_names || DEFAULT_TEAM_NAMES)[t]}
              </div>
              <div className="text-[10px] text-[#5C1A2F]/60">Wagered ${(state.final_wagers || {})[t] || 0}</div>
              <div className="flex gap-1">
                <button
                  onClick={() => setFinalResults((r) => ({ ...r, [t]: true }))}
                  className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${finalResults[t] === true ? 'bg-green-600 text-white' : 'bg-zinc-100 text-zinc-700'}`}
                >
                  ✓
                </button>
                <button
                  onClick={() => setFinalResults((r) => ({ ...r, [t]: false }))}
                  className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${finalResults[t] === false ? 'bg-red-600 text-white' : 'bg-zinc-100 text-zinc-700'}`}
                >
                  ✗
                </button>
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={applyFinalResults}
          disabled={TEAM_IDS.some((t) => !(t in finalResults))}
          className="mt-4 bg-[#B76E79] hover:bg-[#9A5660] disabled:opacity-40 text-white font-bold px-6 py-2 rounded-full text-sm"
        >
          See final scores →
        </button>
      </div>
    );
  }

  if (phase === 'winner') {
    const sorted = TEAM_IDS.map((t) => ({
      t, score: state.team_scores[t] || 0, name: (state.team_names || DEFAULT_TEAM_NAMES)[t],
    })).sort((a, b) => b.score - a.score);
    return (
      <div className="game-surface fixed inset-0 p-4 sm:p-8 flex flex-col items-center justify-center overflow-auto">
        <p className="uppercase tracking-[0.3em] text-[10px] sm:text-xs text-[#E8D5B7]">Champion</p>
        <h2 className="script text-6xl sm:text-8xl mt-2 text-center text-[#E8D5B7]">{sorted[0].name}</h2>
        <p className="text-xl sm:text-3xl mt-1 text-[#E8D5B7]/85 font-bold">
          ${sorted[0].score.toLocaleString()}
        </p>
        <div className="mt-4 max-w-md w-full space-y-1.5">
          {sorted.map((t, i) => (
            <div key={t.t} className={`flex items-center justify-between px-4 py-2 rounded-xl text-sm ${i === 0 ? 'bg-[#E8D5B7] text-[#5C1A2F]' : 'bg-white/10 text-[#FFF8F0]'}`}>
              <span className="font-semibold">{i + 1}. {t.name}</span>
              <span className="font-extrabold">${t.score.toLocaleString()}</span>
            </div>
          ))}
        </div>
        <button onClick={() => setPhase('board')} className="mt-4 text-xs underline opacity-70 hover:opacity-100">
          Back to board
        </button>
      </div>
    );
  }

  // ----- BOARD (landscape-first, target 844×390) -----
  const startFinal = () => {
    setWagers(Object.fromEntries(TEAM_IDS.map((t) => [t, ''])));
    setFinalResults({});
    setPhase('final-setup');
  };

  return (
    <div className="game-surface fixed inset-0 flex flex-col overflow-hidden">
      {/* Header bar — compact, single row */}
      <header className="flex items-center justify-between px-3 sm:px-6 py-1.5 sm:py-2 shrink-0">
        <p className="text-[10px] sm:text-xs uppercase tracking-[0.25em] text-[#E8D5B7]/80 font-semibold">Knowsy</p>
        <h1 className="script text-2xl sm:text-4xl text-[#E8D5B7] leading-none truncate px-2">
          {brideName ? `${brideName}'s Trivia` : eventName}
        </h1>
        <p className="text-[10px] sm:text-xs opacity-65 tabular-nums">
          {playedKeys.size} / {totalTiles}
        </p>
      </header>

      {/* 5x5 board — sized to fill remaining height */}
      <div className="flex-1 px-2 sm:px-4 min-h-0">
        <div className="h-full max-w-[1200px] mx-auto grid grid-cols-5 grid-rows-[auto_repeat(5,1fr)] gap-1 sm:gap-1.5">
          {/* Category headers across the top */}
          {gameData.categories.map((cat, ci) => (
            <div
              key={`h${ci}`}
              className="category-header flex items-center justify-center text-center px-1 py-1 uppercase text-[9px] sm:text-[11px] leading-tight"
              style={{ gridColumn: ci + 1, gridRow: 1 }}
            >
              {cat.name}
            </div>
          ))}
          {/* Tiles */}
          {gameData.categories.map((cat, ci) =>
            cat.questions.map((q, qi) => {
              const played = playedKeys.has(`${ci}-${qi}`);
              return (
                <button
                  key={`${ci}-${qi}`}
                  onClick={() => handleTileClick(ci, qi)}
                  disabled={played}
                  className={`game-tile ${played ? 'played' : ''} flex items-center justify-center font-extrabold text-lg sm:text-3xl`}
                  style={{ gridColumn: ci + 1, gridRow: qi + 2 }}
                  aria-label={`${cat.name} for $${q.points}`}
                >
                  {played ? '' : <span className="tile-amount">${q.points}</span>}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Final-round affordances when board is exhausted */}
      {allPlayed && !state.final_played && (
        <div className="text-center py-1.5 shrink-0">
          <button
            onClick={startFinal}
            className="bg-[#B76E79] hover:bg-[#9A5660] text-white font-bold px-5 py-1.5 rounded-full text-sm transition-colors"
          >
            🥂 Start Final Knowsy
          </button>
        </div>
      )}
      {allPlayed && state.final_played && (
        <div className="text-center py-1.5 shrink-0">
          <button
            onClick={() => setPhase('winner')}
            className="bg-white/10 hover:bg-white/20 text-white font-medium px-4 py-1 rounded-full text-xs"
          >
            Show final standings →
          </button>
        </div>
      )}

      {/* Compact scoreboard footer */}
      <Scoreboard
        teamIds={[...TEAM_IDS]}
        teamNames={state.team_names || DEFAULT_TEAM_NAMES}
        scores={state.team_scores}
        onRename={setTeamName}
        onAdjust={adjustScore}
      />
    </div>
  );
}
