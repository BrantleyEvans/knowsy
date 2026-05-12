'use client';

import { useState } from 'react';

interface Props {
  teamIds: string[];
  teamNames: Record<string, string>;
  scores: Record<string, number>;
  onRename: (teamId: string, name: string) => void;
  onAdjust: (teamId: string, delta: number) => void;
}

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
    <div className="bg-black/25 border-t border-white/10 px-2 py-3 sm:py-4">
      <div className="max-w-6xl mx-auto grid grid-cols-4 gap-2 sm:gap-4">
        {teamIds.map((t) => (
          <div
            key={t}
            className="bg-white/8 rounded-lg p-2 sm:p-3 flex flex-col items-center"
          >
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
                className="bg-white text-[#1E1B3A] px-2 py-1 rounded text-xs sm:text-sm w-full text-center"
                placeholder="Team name"
              />
            ) : (
              <button
                onClick={() => startEdit(t)}
                className="text-[10px] sm:text-sm font-bold uppercase tracking-wider opacity-85 hover:opacity-100 truncate w-full text-center"
                title="Click to rename"
              >
                {teamNames[t] || t}
              </button>
            )}
            <div className="text-xl sm:text-3xl font-extrabold mt-1 text-[#FFC857]">
              ${(scores[t] ?? 0).toLocaleString()}
            </div>
            <div className="flex gap-1 mt-1">
              <button
                onClick={() => onAdjust(t, -100)}
                className="bg-white/10 hover:bg-white/20 text-xs px-2 py-0.5 rounded transition-colors"
                title="Subtract 100"
              >
                −100
              </button>
              <button
                onClick={() => onAdjust(t, 100)}
                className="bg-white/10 hover:bg-white/20 text-xs px-2 py-0.5 rounded transition-colors"
                title="Add 100"
              >
                +100
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
