
import React from 'react';
import { GameSettings } from '../types';

interface GameOverProps {
  settings: GameSettings;
  onRestart: () => void;
  onMenu: () => void;
  finalScores?: { id: number, score: number }[]; // Añadido opcional por si se quiere usar
}

const GameOver: React.FC<GameOverProps> = ({ settings, onRestart, onMenu }) => {
  return (
    <div className="absolute inset-0 z-[200] bg-slate-950 flex flex-col items-center justify-center text-white p-8 animate-in fade-in duration-500 overflow-y-auto">
      <div className="relative mb-12 text-center">
        <div className="text-7xl font-black text-rose-600 tracking-tighter drop-shadow-[0_0_25px_rgba(225,29,72,0.5)] animate-pulse">
          ¡FIN!
        </div>
        <div className="mt-2 text-[12px] font-bold uppercase tracking-[0.5em] text-rose-400/60">
          PARTIDA FINALIZADA
        </div>
      </div>

      <div className="w-full max-w-sm space-y-4 mb-10">
        <button 
          onClick={onRestart}
          className="w-full relative group overflow-hidden bg-indigo-600 hover:bg-indigo-500 text-white font-black py-7 rounded-[2rem] shadow-2xl transition-all active:scale-95"
        >
          <span className="relative z-10 text-2xl tracking-tight">VOLVER A INTENTAR</span>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
        </button>
        
        <button 
          onClick={onMenu}
          className="w-full bg-slate-900/50 hover:bg-slate-800 text-slate-400 font-bold py-5 rounded-[1.5rem] border border-white/5 transition-all active:scale-95"
        >
          MENÚ PRINCIPAL
        </button>
      </div>

      <div className="text-center opacity-40">
        <p className="text-xs italic leading-relaxed">
          "Puntúas por cada salto completado.<br/>¡Afinad vuestros reflejos!"
        </p>
      </div>
    </div>
  );
};

export default GameOver;
