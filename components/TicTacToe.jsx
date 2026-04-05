'use client';
import React from 'react';

export default function TicTacToe({ board, onMove }) {
  // board is a 9-char string e.g. "00X0O0X00"
  const cells = board ? board.padEnd(9, '0').split('') : Array(9).fill('0');

  return (
    <div className="w-full h-full bg-gradient-to-br from-gray-900 via-gray-800 to-black p-6 flex flex-col items-center justify-center font-sans text-white select-none">
      <h2 className="text-4xl font-extrabold mb-8 tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 drop-shadow-lg">
        Tic-Tac-Toe
      </h2>
      <div className="grid grid-cols-3 gap-3 p-4 bg-white/5 backdrop-blur-xl rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.5)] border border-white/10">
        {cells.map((val, idx) => (
          <button
            key={idx}
            onClick={() => {
              if (val === '0' && onMove) onMove((idx + 1).toString());
            }}
            disabled={val !== '0'}
            className={`w-24 h-24 flex items-center justify-center text-6xl font-bold rounded-xl outline-none transition-all duration-300 transform shadow-inner
              ${val === '0' 
                ? 'bg-white/5 hover:bg-white/10 hover:scale-105 hover:shadow-[0_0_15px_rgba(255,255,255,0.2)] cursor-pointer' 
                : val === 'X' 
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50 cursor-default'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 cursor-default'
              }`}
          >
            {val === '0' ? '' : val}
          </button>
        ))}
      </div>
      <div className="mt-10 text-sm text-gray-400 bg-black/30 px-6 py-2 rounded-full border border-white/5 backdrop-blur-md">
        Player vs Computer Engine Linked
      </div>
    </div>
  );
}
