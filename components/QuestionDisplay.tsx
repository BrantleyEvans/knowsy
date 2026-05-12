'use client';

import { useState } from 'react';

interface Props {
  category: string;
  points: number;
  question: string;
  answer: string;
  teamNames: Record<string, string>;
  onAward: (teamId: string) => void;
  onDeduct: (teamId: string) => void;
  onSkip: () => void;
}

const TEAM_IDS = ['t1', 't2', 't3', 't4'];

export default function QuestionDisplay({
  category,
  points,
  question,
  answer,
  teamNames,
  onAward,
  onDeduct,
  onSkip,
}: Props) {
  const [showAnswer, setShowAnswer] = useState(false);
  const [mode, setMode] = useState<'award' | 'deduct'>('award');

  return (
    <div className="game-surface min-h-screen flex flex-col p-4 sm:p-10">
      <div className="flex items-center justify-between text-xs sm:text-sm">
        <div className="uppercase tracking-widest opacity-75 font-semibold">{category}</div>
        <div className="text-[#FFC857] font-extrabold text-xl sm:text-2xl">${points}</div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <p className="text-3xl sm:text-5xl md:text-6xl font-extrabold leading-tight max-w-5xl">
          {question}
        </p>

        {showAnswer && (
          <div className="mt-12 sm:mt-16 max-w-3xl">
            <p className="uppercase tracking-[0.3em] text-xs sm:text-sm opacity-75">
              The answer
            </p>
            <p className="text-2xl sm:text-4xl font-extrabold mt-3 leading-tight text-[#FFC857]">
              {answer}
            </p>
          </div>
        )}
      </div>

      <div className="pb-6">
        {!showAnswer ? (
          <div className="flex justify-center gap-3">
            <button
              onClick={() => setShowAnswer(true)}
              className="bg-[#E85D5D] hover:bg-[#C94646] text-white font-bold px-8 py-3 rounded-full text-base sm:text-lg transition-colors"
            >
              Show answer
            </button>
            <button
              onClick={onSkip}
              className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-full text-sm transition-colors"
            >
              Skip question
            </button>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto">
            <div className="flex justify-center gap-2 mb-3">
              <button
                onClick={() => setMode('award')}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                  mode === 'award'
                    ? 'bg-[#FFC857] text-[#1E1B3A]'
                    : 'bg-white/10 text-white'
                }`}
              >
                Award (+)
              </button>
              <button
                onClick={() => setMode('deduct')}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                  mode === 'deduct'
                    ? 'bg-[#FFC857] text-[#1E1B3A]'
                    : 'bg-white/10 text-white'
                }`}
              >
                Deduct (–)
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {TEAM_IDS.map((t) => (
                <button
                  key={t}
                  onClick={() => (mode === 'award' ? onAward(t) : onDeduct(t))}
                  className="bg-white text-[#1E1B3A] font-bold py-4 rounded-xl hover:bg-[#E85D5D] hover:text-white transition-colors"
                >
                  <div className="text-[10px] uppercase tracking-wider opacity-60">
                    {mode === 'award' ? `+$${points}` : `-$${points}`}
                  </div>
                  <div className="text-base sm:text-lg leading-tight mt-1">
                    {teamNames[t] || t}
                  </div>
                </button>
              ))}
            </div>
            <div className="text-center mt-3">
              <button
                onClick={onSkip}
                className="text-white/60 hover:text-white text-sm underline transition-colors"
              >
                Nobody got it — skip
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
