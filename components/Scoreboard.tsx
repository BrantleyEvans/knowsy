'use client';

import { useState } from 'react';

interface Props {
  teamIds: string[];
  teamNames: Record<string, string>;
  scores: Record<string, number>;
  onRename: (teamId: string, name: string) => void;
  onAdjust: (teamId: string, delta: number) => void;
}

// Compact landscape-friendly scoreboard. Single horizontal row of 4 cells.
// Each cell shows team name + score + tiny +/- buttons for manual host
// corrections (escape hatch — primary scoring happens on the question screen).
export default function Scoreboard({
  teamIds,
  teamNames,
  scores,
  onRename,
  onAdjust,
}: Props) {
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  function startEdit(teamId: string) {
    setEditing(teamId);
    setEditValue(teamNames[teamId] || '');
  }
  function commitEdit() {
    if (editing) onRename(editing, editValue.trim());
    setEditing(null);
  }

  return (
    <div className="bg-black/35 border-t border-[#E8D5B7]/15 px-2 py-1.5 shrink-0">
      <div className="max-w-6xl mx-auto grid grid-cols-4 gap-1.5 sm:gap-3">
        {teamIds.map((t) => (
          <div
            key={t}
            className="bg-white/8 rounded-lg px-2 py-1 flex items-center justify-between gap-1.5"
          >
            <div className="min-w-0 flex-1">
              {editing === t ? (
                <input
                  autoFocus
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={commitEdit}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitEdit();
                    if (e.key === 'Escape') setEditing(null);
                  }}
                  className="bg-white text-[#5C1A2F] px-1.5 py-0.5 rounded text-[11px] sm:text-xs w-full"
                  placeholder="Team name"
                />
              ) : (
                <button
                  onClick={() => startEdit(t)}
                  className="text-[10px] sm:text-xs font-bold uppercase tracking-wider opacity-85 hover:opacity-100 truncate w-full text-left leading-tight"
                  title="Click to rename"
                >
                  {teamNames[t] || t}
                </button>
              )}
              <div className="text-base sm:text-xl font-extrabold text-[#E8D5B7] tabular-nums leading-tight">
                ${(scores[t] ?? 0).toLocaleString()}
              </div>
            </div>
            <div className="flex flex-col gap-0.5 shrink-0">
              <button
                onClick={() => onAdjust(t, 100)}
                className="bg-white/10 hover:bg-white/20 text-[10px] leading-none px-1.5 py-0.5 rounded transition-colors"
                title="Add 100 (manual)"
              >
                +100
              </button>
              <button
                onClick={() => onAdjust(t, -100)}
                className="bg-white/10 hover:bg-white/20 text-[10px] leading-none px-1.5 py-0.5 rounded transition-colors"
                title="Subtract 100 (manual)"
              >
                −100
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
