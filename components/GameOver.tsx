
import React, { useMemo } from 'react';
import { GameSettings } from '../types';
import { GAME_OVER_POOL, PLAYER_COLORS } from '../constants';

interface GameOverProps {
  settings: GameSettings;
  onRestart: () => void;
  onMenu: () => void;
  finalScores?: { id: number, score: number }[];
}

const GameOver: React.FC<GameOverProps> = ({ settings, onRestart, onMenu, finalScores }) => {
  const sortedScores = useMemo(() => {
    if (!finalScores || finalScores.length === 0) return [];
    return [...finalScores].sort((a, b) => b.score - a.score);
  }, [finalScores]);

  const winners = useMemo(() => {
    if (sortedScores.length === 0) return [];
    const max = sortedScores[0].score;
    return sortedScores.filter(s => s.score === max);
  }, [sortedScores]);

  const getCommentForScore = (score: number, isWinner: boolean) => {
    let pool;
    if (isWinner) {
      pool = GAME_OVER_POOL.winner;
    } else if (score < 5) {
      pool = GAME_OVER_POOL.loser;
    } else {
      pool = GAME_OVER_POOL.average;
    }
    
    // Corrección del acceso al array de comentarios
    const randomIndex = Math.floor(Math.random() * pool.length);
    return pool[randomIndex] || pool[0];
  };

  return (
    <div className="absolute inset-0 z-[200] bg-slate-950 flex flex-col items-center justify-start text-white p-8 animate-in fade-in duration-500 overflow-y-auto pt-16">
      <div className="relative mb-8 text-center">
        <div className="text-6xl font-black text-rose-600 tracking-tighter drop-shadow-[0_0_25px_rgba(225,29,72,0.5)]">
          ¡FIN!
        </div>
        <div className="mt-2 text-[10px] font-bold uppercase tracking-[0.5em] text-rose-400/60">
          MURO DE LA VERGÜENZA
        </div>
      </div>

      <div className="w-full max-w-lg space-y-4 mb-10">
        {sortedScores.length > 0 ? sortedScores.map((s, idx) => {
          const isWinner = winners.some(w => w.id === s.id);
          const comment = getCommentForScore(s.score, isWinner);
          
          return (
            <div key={s.id} className={`
              relative p-6 rounded-[2.5rem] border transition-all duration-500 transform
              ${isWinner ? 'bg-indigo-600/20 border-indigo-500 scale-105 shadow-[0_0_40px_rgba(99,102,241,0.2)]' : 'bg-white/5 border-white/10'}
            `}>
              {isWinner && (
                <div className="absolute -top-3 -right-3 bg-yellow-400 text-black text-[10px] font-black px-3 py-1 rounded-full rotate-12 shadow-lg z-10">
                  GANADOR
                </div>
              )}
              
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full" style={{ backgroundColor: PLAYER_COLORS[s.id] }}></div>
                  <span className="text-xl font-black tracking-tight">JUGADOR {s.id + 1}</span>
                </div>
                <div className="text-2xl font-black text-indigo-400">
                  {s.score} <span className="text-[10px] opacity-40 uppercase tracking-tighter">Saltos</span>
                </div>
              </div>
              
              <p className="text-sm italic font-medium text-white/60 leading-relaxed pl-8 border-l-2 border-indigo-500/30">
                "{comment}"
              </p>
            </div>
          );
        }) : (
          <div className="text-center py-20 opacity-20 italic">No hay puntuaciones registradas...</div>
        )}
      </div>

      <div className="w-full max-w-sm space-y-4 pb-12 mt-auto">
        <button 
          onClick={onRestart}
          className="w-full relative group overflow-hidden bg-indigo-600 hover:bg-indigo-500 text-white font-black py-7 rounded-[2.5rem] shadow-2xl transition-all active:scale-95"
        >
          <span className="relative z-10 text-2xl tracking-tight">REINTENTAR</span>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
        </button>
        
        <button 
          onClick={onMenu}
          className="w-full bg-slate-900/50 hover:bg-slate-800 text-slate-400 font-bold py-5 rounded-[2rem] border border-white/5 transition-all active:scale-95 uppercase tracking-widest text-sm"
        >
          MENÚ PRINCIPAL
        </button>
      </div>
    </div>
  );
};

export default GameOver;
