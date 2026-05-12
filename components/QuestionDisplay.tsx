'use client';

import { useEffect, useRef, useState } from 'react';

interface Props {
  category: string;
  points: number;
  question: string;
  answer: string;
  teamNames: Record<string, string>;
  teamScores: Record<string, number>;
  onAward: (teamId: string) => void;
  onDeduct: (teamId: string) => void;
  onSkip: () => void;
  onBack: () => void;
}

const TEAM_IDS = ['t1', 't2', 't3', 't4'];
const LONG_PRESS_MS = 500;
const AUTO_RETURN_MS = 1500;

interface PendingScore {
  teamId: string;
  delta: number; // positive = award, negative = deduct
  teamName: string;
}

export default function QuestionDisplay({
  category,
  points,
  question,
  answer,
  teamNames,
  teamScores,
  onAward,
  onDeduct,
  onSkip,
  onBack,
}: Props) {
  const [showAnswer, setShowAnswer] = useState(false);
  const [pending, setPending] = useState<PendingScore | null>(null);
  const [pressingTeam, setPressingTeam] = useState<string | null>(null);
  const [pressPct, setPressPct] = useState(0);

  // Long-press machinery
  const pressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pressStartRef = useRef<number>(0);
  const longPressFiredRef = useRef<boolean>(false);

  function clearPress() {
    if (pressTimerRef.current) {
      clearInterval(pressTimerRef.current);
      pressTimerRef.current = null;
    }
    setPressingTeam(null);
    setPressPct(0);
  }

  function startPress(teamId: string) {
    if (pending) return; // already awarded — ignore further input
    longPressFiredRef.current = false;
    pressStartRef.current = Date.now();
    setPressingTeam(teamId);
    pressTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - pressStartRef.current;
      const pct = Math.min(100, (elapsed / LONG_PRESS_MS) * 100);
      setPressPct(pct);
      if (elapsed >= LONG_PRESS_MS && !longPressFiredRef.current) {
        longPressFiredRef.current = true;
        clearPress();
        fireScore(teamId, true);
      }
    }, 16);
  }

  function endPress(teamId: string) {
    if (pending) return;
    if (!longPressFiredRef.current) {
      // released before threshold = tap = award
      clearPress();
      fireScore(teamId, false);
    } else {
      clearPress();
    }
  }

  function cancelPress() {
    if (longPressFiredRef.current) return;
    clearPress();
  }

  function fireScore(teamId: string, deduct: boolean) {
    setPending({
      teamId,
      delta: deduct ? -points : points,
      teamName: teamNames[teamId] || teamId,
    });
    // Hand off to parent after the toast plays
    setTimeout(() => {
      if (deduct) onDeduct(teamId);
      else onAward(teamId);
    }, AUTO_RETURN_MS);
  }

  // Cleanup if unmount
  useEffect(() => {
    return () => {
      if (pressTimerRef.current) clearInterval(pressTimerRef.current);
    };
  }, []);

  const toast = pending ? (
    <div
      className={`toast ${pending.delta < 0 ? 'deduct' : ''}`}
      role="status"
      aria-live="polite"
    >
      {pending.delta >= 0 ? '+' : '−'}${Math.abs(pending.delta)} → {pending.teamName}
    </div>
  ) : null;

  return (
    <div className="tile-flip-in game-surface fixed inset-0 flex flex-col px-4 py-3 sm:px-8 sm:py-4 overflow-hidden">
      {/* Top bar: back link / category / points */}
      <div className="flex items-center justify-between text-xs sm:text-sm shrink-0">
        <button
          onClick={onBack}
          className="text-[#FFF8F0]/55 hover:text-[#FFF8F0] text-xs"
          title="Back to board (small button — don't tap by accident)"
        >
          ← Back
        </button>
        <div className="uppercase tracking-widest opacity-75 font-semibold truncate px-2">
          {category}
        </div>
        <div className="text-[#E8D5B7] font-extrabold text-lg sm:text-2xl tabular-nums">
          ${points}
        </div>
      </div>

      {/* Question / answer area */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-2">
        <p className="font-extrabold leading-tight max-w-5xl text-[clamp(1.25rem,3.2vw,3rem)]">
          {question}
        </p>
        {showAnswer && (
          <div className="mt-4 sm:mt-6 max-w-3xl">
            <p className="uppercase tracking-[0.3em] text-[10px] sm:text-xs opacity-75">
              The answer
            </p>
            <p className="font-extrabold mt-1 leading-tight text-[#E8D5B7] text-[clamp(1rem,2.4vw,2rem)]">
              {answer}
            </p>
          </div>
        )}
      </div>

      {/* Bottom controls */}
      <div className="shrink-0">
        {!showAnswer ? (
          <div className="flex justify-center gap-3 pb-2">
            <button
              onClick={() => setShowAnswer(true)}
              className="bg-[#B76E79] hover:bg-[#9A5660] text-white font-bold px-6 py-2.5 rounded-full text-base sm:text-lg transition-colors"
            >
              Reveal answer
            </button>
            <button
              onClick={onSkip}
              className="bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-full text-sm transition-colors"
            >
              Skip
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-center text-[10px] sm:text-xs uppercase tracking-widest opacity-65">
              Tap a team to award · long-press to deduct
            </p>
            <div className="grid grid-cols-4 gap-2">
              {TEAM_IDS.map((t) => {
                const isPressing = pressingTeam === t;
                return (
                  <button
                    key={t}
                    className={`team-btn ${isPressing ? 'pressing' : ''} bg-white text-[#5C1A2F] font-bold py-3 rounded-xl hover:bg-[#E8D5B7] transition-colors`}
                    onPointerDown={(e) => {
                      e.preventDefault();
                      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
                      startPress(t);
                    }}
                    onPointerUp={() => endPress(t)}
                    onPointerLeave={() => cancelPress()}
                    onPointerCancel={() => cancelPress()}
                    onContextMenu={(e) => e.preventDefault()}
                    style={
                      isPressing
                        ? ({ '--pressPct': `${pressPct}%` } as React.CSSProperties)
                        : undefined
                    }
                  >
                    <span className="press-ring" aria-hidden />
                    <div className="relative">
                      <div className="text-[10px] uppercase tracking-wider opacity-65 leading-none">
                        ${(teamScores[t] ?? 0).toLocaleString()}
                      </div>
                      <div className="text-sm sm:text-base leading-tight mt-1 truncate px-1">
                        {teamNames[t] || t}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="text-center">
              <button
                onClick={onSkip}
                className="text-white/60 hover:text-white text-xs underline"
              >
                Nobody got it — skip
              </button>
            </div>
          </div>
        )}
      </div>

      {toast}
    </div>
  );
}
