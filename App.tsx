
import React, { useState, useEffect, useCallback } from 'react';
import { GameState, GameSettings, GameMode, Difficulty, ScoreEntry } from './types';
import SetupMenu from './components/SetupMenu';
import GameView from './components/GameView';
import GameOver from './components/GameOver';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [settings, setSettings] = useState<GameSettings>({
    playerCount: 1,
    mode: GameMode.ELIMINATION,
    lives: 3,
    difficulty: Difficulty.NORMAL,
  });
  const [highScores, setHighScores] = useState<ScoreEntry[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('jump_rope_highscores');
    if (saved) {
      setHighScores(JSON.parse(saved));
    }
  }, []);

  const saveScore = useCallback((playerName: string, score: number) => {
    const newEntry: ScoreEntry = {
      playerName,
      score,
      date: new Date().toLocaleDateString(),
    };
    const updated = [...highScores, newEntry]
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
    setHighScores(updated);
    localStorage.setItem('jump_rope_highscores', JSON.stringify(updated));
  }, [highScores]);

  const startGame = (newSettings: GameSettings) => {
    setSettings(newSettings);
    setGameState(GameState.PLAYING);
  };

  const handleGameOver = (finalScores: { id: number, score: number }[]) => {
    if (settings.playerCount === 1) {
      saveScore('Player 1', finalScores[0].score);
    }
    setGameState(GameState.GAME_OVER);
  };

  return (
    <div className="w-full h-screen bg-slate-900 overflow-hidden relative">
      {gameState === GameState.MENU && (
        <SetupMenu onStart={startGame} highScores={highScores} />
      )}
      
      {gameState === GameState.PLAYING && (
        <GameView 
          settings={settings} 
          onGameOver={handleGameOver}
          onBackToMenu={() => setGameState(GameState.MENU)}
        />
      )}

      {gameState === GameState.GAME_OVER && (
        <GameOver 
          settings={settings} 
          onRestart={() => setGameState(GameState.PLAYING)} 
          onMenu={() => setGameState(GameState.MENU)}
        />
      )}
    </div>
  );
};

export default App;
