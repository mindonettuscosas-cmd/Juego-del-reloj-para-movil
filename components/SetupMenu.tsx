
import React, { useState } from 'react';
import { GameMode, Difficulty, GameSettings, ScoreEntry } from '../types';

interface SetupMenuProps {
  onStart: (settings: GameSettings) => void;
  highScores: ScoreEntry[];
}

const SetupMenu: React.FC<SetupMenuProps> = ({ onStart, highScores }) => {
  const [playerCount, setPlayerCount] = useState(1);
  const [mode, setMode] = useState(GameMode.ELIMINATION);
  const [lives, setLives] = useState(3);
  const [difficulty, setDifficulty] = useState(Difficulty.NORMAL);
  const [showScores, setShowScores] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-white bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black overflow-y-auto">
      <div className="text-center mb-10">
        <h1 className="text-5xl md:text-7xl font-black mb-2 tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-indigo-300 via-indigo-500 to-purple-600 drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]">
          RELOJ MORTAL
        </h1>
        <p className="text-indigo-400 text-sm font-bold tracking-[0.3em] uppercase">Desafío de Salto</p>
      </div>

      <div className="w-full max-w-md bg-white/5 backdrop-blur-xl p-8 rounded-[2rem] shadow-2xl border border-white/10 ring-1 ring-white/5">
        {!showScores ? (
          <div className="space-y-8">
            <div>
              <div className="flex justify-between items-end mb-4">
                <label className="text-xs font-bold uppercase tracking-widest text-indigo-300">Jugadores</label>
                <span className="text-2xl font-black text-white">{playerCount}</span>
              </div>
              <input 
                type="range" min="1" max="8" value={playerCount} 
                onChange={(e) => setPlayerCount(parseInt(e.target.value))}
                className="w-full h-3 bg-indigo-950 rounded-full appearance-none cursor-pointer accent-indigo-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-2 px-1 font-mono">
                {[1,2,3,4,5,6,7,8].map(n => <span key={n}>{n}</span>)}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-indigo-300/60">Modo de Juego</label>
                <select 
                  value={mode} 
                  onChange={(e) => setMode(e.target.value as GameMode)}
                  className="w-full bg-slate-900/50 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-semibold"
                >
                  <option value={GameMode.ELIMINATION}>Eliminación</option>
                  <option value={GameMode.LIVES}>Vidas</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-indigo-300/60">Dificultad</label>
                <select 
                  value={difficulty} 
                  onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                  className="w-full bg-slate-900/50 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-semibold"
                >
                  <option value={Difficulty.EASY}>Fácil</option>
                  <option value={Difficulty.NORMAL}>Normal</option>
                  <option value={Difficulty.HARD}>Difícil</option>
                </select>
              </div>
            </div>

            {mode === GameMode.LIVES && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex justify-between items-end mb-4">
                  <label className="text-xs font-bold uppercase tracking-widest text-rose-300">Vidas iniciales</label>
                  <span className="text-2xl font-black text-white">{lives}</span>
                </div>
                <input 
                  type="range" min="1" max="10" value={lives} 
                  onChange={(e) => setLives(parseInt(e.target.value))}
                  className="w-full h-3 bg-rose-950 rounded-full appearance-none cursor-pointer accent-rose-500"
                />
              </div>
            )}

            <div className="pt-4 space-y-4">
              <button 
                onClick={() => onStart({ playerCount, mode, lives, difficulty })}
                className="w-full group relative overflow-hidden bg-indigo-600 hover:bg-indigo-500 text-white font-black py-5 px-6 rounded-2xl transition-all shadow-[0_0_20px_rgba(79,70,229,0.4)] active:scale-95"
              >
                <span className="relative z-10 text-xl">¡A JUGAR!</span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              </button>

              <button 
                onClick={() => setShowScores(true)}
                className="w-full py-3 text-indigo-300/60 hover:text-indigo-300 text-xs font-bold tracking-widest transition-all hover:bg-white/5 rounded-xl uppercase"
              >
                Ver Mejores Puntuaciones
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
            <h2 className="text-2xl font-black text-center text-indigo-300 tracking-tight">SALÓN DE LA FAMA</h2>
            <div className="max-h-64 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-indigo-500/20">
              {highScores.length > 0 ? highScores.map((s, i) => (
                <div key={i} className="flex justify-between items-center p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-black text-indigo-500/50">#{i+1}</span>
                    <span className="text-sm font-bold text-white">{s.playerName}</span>
                  </div>
                  <span className="text-sm font-black text-indigo-400">{s.score} <span className="text-[10px] font-normal opacity-50">PTS</span></span>
                </div>
              )) : (
                <div className="text-center py-10 opacity-30 italic text-sm">Aún no hay registros...</div>
              )}
            </div>
            <button 
              onClick={() => setShowScores(false)}
              className="w-full mt-6 bg-slate-800 hover:bg-slate-700 p-4 rounded-2xl text-xs font-bold tracking-widest uppercase transition-all"
            >
              Volver al Menú
            </button>
          </div>
        )}
      </div>

      <div className="mt-12 text-center space-y-2 max-w-xs">
        <p className="text-indigo-400/50 text-[10px] uppercase font-bold tracking-[0.2em]">Instrucciones</p>
        <p className="text-indigo-100/40 text-xs italic leading-relaxed">
          "Cada jugador tiene un botón de color. Pulsa el tuyo para saltar la manecilla en el momento justo."
        </p>
      </div>
    </div>
  );
};

export default SetupMenu;
