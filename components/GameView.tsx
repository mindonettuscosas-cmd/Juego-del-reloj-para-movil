
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { GameSettings, Player, GameMode, Difficulty, GameState } from '../types';
import { PLAYER_COLORS, DIFFICULTY_CONFIG, JUMP_DURATION, JUMP_COOLDOWN } from '../constants';

interface GameViewProps {
  settings: GameSettings;
  onGameOver: (finalScores: { id: number, score: number }[]) => void;
  onBackToMenu: () => void;
}

enum RopeBehavior {
  NORMAL = 'NORMAL',
  SWAY = 'VAIVÉN',
  SPRINT = 'ACELERÓN',
  STUTTER = 'HIPO',
  BRAKE = 'FRENADA',
  REVERSE = 'GIRO',
  ZIGZAG = 'ZIG-ZAG',
  GHOST = 'FANTASMA',
  GRAVITY = 'GRAVEDAD',
  TURBO = 'TURBO'
}

interface VisualEffect {
  x: number;
  y: number;
  startTime: number;
  color: string;
  type: 'land' | 'start' | 'score' | 'alert';
}

class SoundManager {
  private ctx: AudioContext | null = null;

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  play(type: 'jump' | 'hit' | 'countdown' | 'behavior' | 'start' | 'point' | 'warning') {
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    const now = this.ctx.currentTime;
    switch (type) {
      case 'jump':
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
        break;
      case 'point':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.05);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
        break;
      case 'hit':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.linearRampToValueAtTime(40, now + 0.3);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
        break;
      case 'warning':
        osc.type = 'square';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.3);
        gain.gain.setValueAtTime(0.03, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
        break;
      case 'countdown':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
        break;
      case 'start':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
        break;
      case 'behavior':
        osc.type = 'square';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.linearRampToValueAtTime(400, now + 0.15);
        gain.gain.setValueAtTime(0.02, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
        break;
    }
  }
}

const sounds = new SoundManager();

const GameView: React.FC<GameViewProps> = ({ settings, onGameOver, onBackToMenu }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number>();
  
  const playersRef = useRef<Player[]>([]);
  const effectsRef = useRef<VisualEffect[]>([]);
  const ropeAngleRef = useRef<number>(0);
  const ropeSpeedRef = useRef<number>(0);
  const directionRef = useRef<number>(1); 
  const lastTimeRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  const isPausedRef = useRef<boolean>(false);
  const isCountingDownRef = useRef<boolean>(true);
  const countdownValueRef = useRef<number>(3);
  const startTimeRef = useRef<number>(0);
  
  const currentBehaviorRef = useRef<RopeBehavior>(RopeBehavior.NORMAL);
  const nextBehaviorRef = useRef<RopeBehavior | null>(null);
  const behaviorTimerRef = useRef<number>(0);
  const telegraphTimerRef = useRef<number>(0);
  const behaviorCooldownRef = useRef<number>(30000); 
  const behaviorWarningRef = useRef<string | null>(null);
  const swayCenterAngleRef = useRef<number>(0);

  const [displayPlayers, setDisplayPlayers] = useState<Player[]>([]);

  const findSafestAngle = useCallback(() => {
    const alivePlayers = playersRef.current.filter(p => p.isAlive);
    if (alivePlayers.length === 0) return Math.PI;
    
    if (alivePlayers.length === 1) {
      return (alivePlayers[0].angle + Math.PI) % (Math.PI * 2);
    }

    const angles = alivePlayers.map(p => p.angle).sort((a, b) => a - b);
    let maxDiff = 0;
    let safeAngle = 0;
    
    for (let i = 0; i < angles.length; i++) {
      const nextIdx = (i + 1) % angles.length;
      let diff = angles[nextIdx] - angles[i];
      if (diff < 0) diff += Math.PI * 2;
      
      if (diff > maxDiff) {
        maxDiff = diff;
        safeAngle = angles[i] + diff / 2;
      }
    }
    
    return ((safeAngle % (Math.PI * 2)) + (Math.PI * 2)) % (Math.PI * 2);
  }, []);

  const initGame = useCallback(() => {
    const initialPlayers: Player[] = [];
    for (let i = 0; i < settings.playerCount; i++) {
      initialPlayers.push({
        id: i,
        name: `J${i + 1}`,
        angle: (i / settings.playerCount) * Math.PI * 2,
        isJumping: false,
        jumpTime: 0,
        isAlive: true,
        lives: settings.mode === GameMode.LIVES ? settings.lives : 1,
        score: 0,
        color: PLAYER_COLORS[i],
        jumpCooldown: 0
      });
    }
    playersRef.current = initialPlayers;
    effectsRef.current = [];
    setDisplayPlayers([...initialPlayers]);
    
    ropeSpeedRef.current = DIFFICULTY_CONFIG[settings.difficulty].baseSpeed;
    directionRef.current = 1;
    ropeAngleRef.current = findSafestAngle();
    
    frameCountRef.current = 0;
    lastTimeRef.current = performance.now();
    startTimeRef.current = performance.now();
    isCountingDownRef.current = true;
    countdownValueRef.current = 3;
    currentBehaviorRef.current = RopeBehavior.NORMAL;
    nextBehaviorRef.current = null;
    behaviorCooldownRef.current = 30000; 
    telegraphTimerRef.current = 0;
    behaviorWarningRef.current = null;
  }, [settings, findSafestAngle]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const handleJump = useCallback((playerId: number) => {
    if (isPausedRef.current || isCountingDownRef.current) return;
    const p = playersRef.current[playerId];
    if (p && p.isAlive && !p.isJumping && p.jumpCooldown <= 0) {
      p.isJumping = true;
      p.jumpTime = performance.now();
      if (canvasRef.current) {
        const radius = Math.min(canvasRef.current.width, canvasRef.current.height) * 0.35;
        const cx = canvasRef.current.width / 2;
        const cy = canvasRef.current.height / 2;
        effectsRef.current.push({
          x: cx + Math.cos(p.angle) * radius,
          y: cy + Math.sin(p.angle) * radius,
          startTime: performance.now(),
          color: p.color,
          type: 'start'
        });
      }
      sounds.play('jump');
      if ('vibrate' in navigator) navigator.vibrate(10);
      setDisplayPlayers([...playersRef.current]);
    }
  }, []);

  const update = (time: number) => {
    if (isPausedRef.current) {
      lastTimeRef.current = time;
      requestRef.current = requestAnimationFrame(update);
      return;
    }

    const deltaTime = Math.min(time - lastTimeRef.current, 100); 
    lastTimeRef.current = time;
    effectsRef.current = effectsRef.current.filter(e => time - e.startTime < 1000);

    if (isCountingDownRef.current) {
      const elapsed = time - startTimeRef.current;
      const currentVal = Math.ceil(3 - (elapsed / 1000));
      if (currentVal !== countdownValueRef.current) {
        if (currentVal > 0) sounds.play('countdown');
        else sounds.play('start');
        countdownValueRef.current = currentVal;
      }
      if (elapsed >= 3000) {
        isCountingDownRef.current = false;
        lastTimeRef.current = time; 
      }
      draw();
      requestRef.current = requestAnimationFrame(update);
      return;
    }

    frameCountRef.current++;
    const config = DIFFICULTY_CONFIG[settings.difficulty];

    if (behaviorCooldownRef.current > 0) {
      behaviorCooldownRef.current -= deltaTime;
    } else if (currentBehaviorRef.current === RopeBehavior.NORMAL && !nextBehaviorRef.current) {
      const possibleBehaviors = [
        RopeBehavior.SPRINT, 
        RopeBehavior.SWAY, 
        RopeBehavior.STUTTER, 
        RopeBehavior.BRAKE,
        RopeBehavior.REVERSE,
        RopeBehavior.ZIGZAG,
        RopeBehavior.GHOST,
        RopeBehavior.GRAVITY,
        RopeBehavior.TURBO
      ];
      let available = possibleBehaviors.slice(0, 4);
      if (frameCountRef.current > 2500) available = possibleBehaviors.slice(0, 7);
      if (frameCountRef.current > 5000) available = possibleBehaviors;
      
      nextBehaviorRef.current = available[Math.floor(Math.random() * available.length)];
      telegraphTimerRef.current = 1500;
      behaviorWarningRef.current = `¡AVISO: ${nextBehaviorRef.current}!`;
      sounds.play('warning');
    }

    if (telegraphTimerRef.current > 0) {
      telegraphTimerRef.current -= deltaTime;
      if (telegraphTimerRef.current <= 0) {
        currentBehaviorRef.current = nextBehaviorRef.current!;
        nextBehaviorRef.current = null;
        if (currentBehaviorRef.current === RopeBehavior.SWAY) {
            swayCenterAngleRef.current = findSafestAngle();
            ropeAngleRef.current = swayCenterAngleRef.current;
        }
        behaviorTimerRef.current = currentBehaviorRef.current === RopeBehavior.REVERSE ? 100 : 3500 + Math.random() * 2000;
        behaviorWarningRef.current = `¡${currentBehaviorRef.current}!`;
        sounds.play('behavior');
      }
    }

    if (currentBehaviorRef.current !== RopeBehavior.NORMAL) {
      behaviorTimerRef.current -= deltaTime;
      if (behaviorTimerRef.current <= 0) {
        if (currentBehaviorRef.current === RopeBehavior.REVERSE) directionRef.current *= -1;
        currentBehaviorRef.current = RopeBehavior.NORMAL;
        behaviorCooldownRef.current = 4500 + Math.random() * 4000;
        behaviorWarningRef.current = null;
      }
    }

    ropeSpeedRef.current += config.acceleration;
    let effectiveSpeed = ropeSpeedRef.current;

    switch (currentBehaviorRef.current) {
      case RopeBehavior.SPRINT: effectiveSpeed *= 1.4; break;
      case RopeBehavior.TURBO: effectiveSpeed *= 2.1; break;
      case RopeBehavior.STUTTER: effectiveSpeed *= (Math.floor(frameCountRef.current / 25) % 2 === 0) ? 2.1 : 0.05; break;
      case RopeBehavior.BRAKE: effectiveSpeed *= 0.15; break;
      case RopeBehavior.ZIGZAG: effectiveSpeed = directionRef.current * (ropeSpeedRef.current + Math.sin(frameCountRef.current * 0.45) * 0.12); break;
      case RopeBehavior.GRAVITY: 
        const gravityFactor = Math.sin(ropeAngleRef.current) > 0 ? 1.7 : 0.45;
        effectiveSpeed *= gravityFactor; 
        break;
    }

    const prevRopeAngle = ropeAngleRef.current;
    if (currentBehaviorRef.current === RopeBehavior.SWAY) {
        const swayRange = Math.PI * 0.7;
        const swayOsc = Math.sin(frameCountRef.current * 0.07) * swayRange;
        ropeAngleRef.current = swayCenterAngleRef.current + swayOsc;
    } else if (currentBehaviorRef.current === RopeBehavior.ZIGZAG) {
        ropeAngleRef.current += effectiveSpeed;
    } else {
        ropeAngleRef.current += effectiveSpeed * directionRef.current;
    }
    ropeAngleRef.current = ((ropeAngleRef.current % (Math.PI * 2)) + (Math.PI * 2)) % (Math.PI * 2);
    const currRopeAngle = ropeAngleRef.current;

    let anyAlive = false;
    playersRef.current.forEach(p => {
      if (!p.isAlive) return;
      anyAlive = true;
      if (p.isJumping) {
        if (performance.now() - p.jumpTime > JUMP_DURATION) {
          p.isJumping = false;
          p.jumpCooldown = JUMP_COOLDOWN;
          if (canvasRef.current) {
            const radius = Math.min(canvasRef.current.width, canvasRef.current.height) * 0.35;
            const cx = canvasRef.current.width / 2;
            const cy = canvasRef.current.height / 2;
            effectsRef.current.push({
              x: cx + Math.cos(p.angle) * radius,
              y: cy + Math.sin(p.angle) * radius,
              startTime: performance.now(),
              color: p.color,
              type: 'land'
            });
          }
        }
      } else if (p.jumpCooldown > 0) {
        p.jumpCooldown = Math.max(0, p.jumpCooldown - deltaTime);
      }

      const checkCrossing = (start: number, end: number, target: number) => {
          if (currentBehaviorRef.current === RopeBehavior.SWAY) {
              const dist = Math.abs(currRopeAngle - target);
              const wrapDist = Math.PI * 2 - dist;
              return Math.min(dist, wrapDist) < 0.15;
          }
          let s = start, e = end;
          const dir = (currentBehaviorRef.current === RopeBehavior.ZIGZAG) ? 1 : directionRef.current;
          if (dir === -1) [s, e] = [e, s];
          if (s < e) return target >= s && target <= e;
          return target >= s || target <= e;
      };

      if (checkCrossing(prevRopeAngle, currRopeAngle, p.angle)) {
          if (currentBehaviorRef.current === RopeBehavior.GHOST) {
              if (p.isJumping) { p.score++; sounds.play('point'); }
              return; 
          }
          if (p.isJumping) {
              p.score++;
              sounds.play('point');
              if (canvasRef.current) {
                const radius = Math.min(canvasRef.current.width, canvasRef.current.height) * 0.35;
                const cx = canvasRef.current.width / 2, cy = canvasRef.current.height / 2;
                effectsRef.current.push({
                  x: cx + Math.cos(p.angle) * (radius - 40),
                  y: cy + Math.sin(p.angle) * (radius - 40),
                  startTime: performance.now(),
                  color: p.color,
                  type: 'score'
                });
              }
          } else {
              sounds.play('hit');
              if ('vibrate' in navigator) navigator.vibrate([60, 40, 60]);
              if (settings.mode === GameMode.LIVES) {
                p.lives--;
                if (p.lives <= 0) p.isAlive = false;
                p.jumpCooldown = 1500; 
              } else p.isAlive = false;
          }
          setDisplayPlayers([...playersRef.current]);
      }
    });

    draw();
    if (!anyAlive) onGameOver(playersRef.current.map(p => ({ id: p.id, score: p.score })));
    else requestRef.current = requestAnimationFrame(update);
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width, h = canvas.height;
    const cx = w / 2, cy = h / 2;
    const radius = Math.min(w, h) * 0.33;
    const time = performance.now();

    ctx.clearRect(0, 0, w, h);
    const bgGradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h));
    bgGradient.addColorStop(0, '#0f172a'); bgGradient.addColorStop(1, '#020617');
    ctx.fillStyle = bgGradient; ctx.fillRect(0, 0, w, h);

    effectsRef.current.forEach(e => {
      const elapsed = time - e.startTime, progress = elapsed / 1000, opacity = 1 - progress;
      if (e.type === 'land') {
        ctx.beginPath(); ctx.arc(e.x, e.y, progress * 100, 0, Math.PI * 2);
        ctx.strokeStyle = `${e.color}${Math.floor(opacity * 255).toString(16).padStart(2, '0')}`;
        ctx.lineWidth = 4; ctx.stroke();
      } else if (e.type === 'score') {
        ctx.font = `900 ${30 + progress * 20}px Inter, sans-serif`;
        ctx.fillStyle = `rgba(255,255,255,${opacity})`; ctx.textAlign = 'center';
        ctx.fillText("+1", e.x, e.y - progress * 50);
      } else {
        ctx.beginPath(); ctx.arc(e.x, e.y, Math.max(0, (1-progress)*60), 0, Math.PI * 2);
        ctx.fillStyle = `white${Math.floor(opacity * 120).toString(16).padStart(2, '0')}`; ctx.fill();
      }
    });

    let ropeColor = '#6366f1'; 
    if (telegraphTimerRef.current > 0) {
        ropeColor = (Math.floor(time / 100) % 2 === 0) ? '#f43f5e' : '#ffffff'; 
    } else {
        switch (currentBehaviorRef.current) {
            case RopeBehavior.SPRINT: ropeColor = '#fbbf24'; break;
            case RopeBehavior.TURBO: ropeColor = '#f59e0b'; break;
            case RopeBehavior.SWAY: ropeColor = '#c084fc'; break;
            case RopeBehavior.STUTTER: ropeColor = '#22d3ee'; break;
            case RopeBehavior.BRAKE: ropeColor = '#64748b'; break;
            case RopeBehavior.ZIGZAG: ropeColor = '#ec4899'; break;
            case RopeBehavior.GHOST: ropeColor = 'rgba(255,255,255,0.4)'; break;
            case RopeBehavior.GRAVITY: ropeColor = '#10b981'; break;
        }
    }

    ctx.save();
    if (currentBehaviorRef.current !== RopeBehavior.GHOST) {
        ctx.shadowBlur = 35; ctx.shadowColor = ropeColor;
    }
    ctx.beginPath(); ctx.moveTo(cx, cy);
    const rx = cx + Math.cos(ropeAngleRef.current) * (radius + 45);
    const ry = cy + Math.sin(ropeAngleRef.current) * (radius + 45);
    ctx.lineTo(rx, ry); ctx.strokeStyle = ropeColor; ctx.lineWidth = 14; ctx.lineCap = 'round'; ctx.stroke();
    ctx.shadowBlur = 0; ctx.strokeStyle = currentBehaviorRef.current === RopeBehavior.GHOST ? 'rgba(255,255,255,0.8)' : '#ffffff';
    ctx.lineWidth = 4; ctx.stroke(); ctx.restore();

    playersRef.current.forEach(p => {
      const x = cx + Math.cos(p.angle) * radius, y = cy + Math.sin(p.angle) * radius;
      const jumpProgress = p.isJumping ? (time - p.jumpTime) / JUMP_DURATION : 0;
      const jumpOffset = p.isJumping ? Math.sin(jumpProgress * Math.PI) * 80 : 0;
      let scaleX = 1, scaleY = 1;
      if (p.isJumping) {
        const stretch = Math.sin(jumpProgress * Math.PI) * 0.3; scaleX = 1 - stretch; scaleY = 1 + stretch;
      } else if (p.jumpCooldown > 0 && p.isAlive) {
        const squashProgress = Math.min(1, (JUMP_COOLDOWN - p.jumpCooldown) / JUMP_COOLDOWN);
        const squash = Math.sin(squashProgress * Math.PI) * 0.25; scaleX = 1 + squash; scaleY = 1 - squash;
      }
      if (p.isAlive) {
        ctx.beginPath(); const shadowSize = 20 - (jumpOffset / 4);
        ctx.ellipse(x, y + 18, Math.max(0, shadowSize), Math.max(0, shadowSize / 3), 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fill();
      }
      ctx.save(); ctx.translate(x, y - jumpOffset); ctx.scale(scaleX, scaleY);
      if (p.isAlive) { ctx.shadowBlur = 25; ctx.shadowColor = p.color; }
      ctx.beginPath(); ctx.arc(0, 0, p.isAlive ? 24 : 15, 0, Math.PI * 2);
      ctx.fillStyle = p.isAlive ? p.color : '#334155'; ctx.fill(); ctx.shadowBlur = 0;
      if (p.isAlive) { ctx.strokeStyle = 'rgba(255,255,255,0.95)'; ctx.lineWidth = 5; ctx.stroke(); }
      
      // Caritas de los jugadores
      ctx.font = '20px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      let face = '🙂';
      if (!p.isAlive) face = '💀';
      else if (p.isJumping) face = '😲';
      else if (p.jumpCooldown > 0) face = '😖';
      ctx.fillText(face, 0, 1);
      
      ctx.restore();
    });

    // Círculo central con carita
    ctx.save();
    ctx.translate(cx, cy);
    ctx.beginPath(); ctx.arc(0, 0, 28, 0, Math.PI * 2);
    const centerColor = telegraphTimerRef.current > 0 ? (Math.floor(time / 100) % 2 === 0 ? '#ff0000' : '#ffffff') : ropeColor;
    ctx.fillStyle = centerColor;
    ctx.fill(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 4; ctx.stroke();
    
    // Carita del círculo central
    ctx.font = '28px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    let centerFace = '😈';
    if (telegraphTimerRef.current > 0) centerFace = '🚨';
    else {
      switch (currentBehaviorRef.current) {
        case RopeBehavior.NORMAL: centerFace = '😈'; break;
        case RopeBehavior.SPRINT: centerFace = '🏃'; break;
        case RopeBehavior.TURBO: centerFace = '🔥'; break;
        case RopeBehavior.SWAY: centerFace = '🌀'; break;
        case RopeBehavior.REVERSE: centerFace = '🔄'; break;
        case RopeBehavior.GHOST: centerFace = '👻'; break;
        case RopeBehavior.STUTTER: centerFace = '🥴'; break;
        case RopeBehavior.GRAVITY: centerFace = '🌍'; break;
        case RopeBehavior.BRAKE: centerFace = '🛑'; break;
        case RopeBehavior.ZIGZAG: centerFace = '⚡'; break;
      }
    }
    // Rotamos la carita central con la cuerda para que se vea dinámica
    ctx.rotate(ropeAngleRef.current);
    ctx.fillText(centerFace, 0, 0);
    ctx.restore();

    if (isCountingDownRef.current) {
      ctx.fillStyle = 'rgba(2, 6, 23, 0.8)'; ctx.fillRect(0, 0, w, h);
      ctx.font = '900 120px Inter, sans-serif'; ctx.fillStyle = 'white'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(countdownValueRef.current > 0 ? countdownValueRef.current.toString() : "¡GO!", cx, cy);
    } else if (behaviorWarningRef.current) {
      ctx.font = '900 42px Inter, sans-serif';
      ctx.fillStyle = telegraphTimerRef.current > 0 ? '#fca5a5' : ropeColor;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(behaviorWarningRef.current, cx, cy - radius - 110);
    }
  };

  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (canvasRef.current) { canvasRef.current.width = width; canvasRef.current.height = height; draw(); }
      }
    });
    resizeObserver.observe(containerRef.current);
    requestRef.current = requestAnimationFrame(update);
    return () => { resizeObserver.disconnect(); if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, []);

  const getButtonPosition = (index: number) => {
    if (settings.playerCount === 2) return index === 0 ? 'bottom-8 left-1/2 -translate-x-1/2' : 'top-28 left-1/2 -translate-x-1/2';
    const positions = ['bottom-8 left-8', 'bottom-8 right-8', 'top-28 left-8', 'top-28 right-8', 'bottom-8 left-1/2 -translate-x-1/2', 'top-28 left-1/2 -translate-x-1/2', 'top-1/2 left-8 -translate-y-1/2', 'top-1/2 right-8 -translate-y-1/2'];
    return positions[index] || '';
  };

  return (
    <div ref={containerRef} className="w-full h-full relative bg-black overflow-hidden select-none touch-none">
      <canvas ref={canvasRef} className="block w-full h-full" />
      
      {/* Marcador Superior Minimalista */}
      <div className="absolute top-0 left-0 w-full pt-12 pb-4 px-6 flex justify-center gap-3 overflow-x-auto no-scrollbar pointer-events-none z-40">
        {displayPlayers.map((p, i) => (
          <div key={p.id} className={`
            px-4 py-2 rounded-2xl border flex items-center gap-3 backdrop-blur-xl transition-all duration-500
            ${p.isAlive ? 'bg-black/60 border-white/20 shadow-lg' : 'bg-slate-900/60 border-white/5 opacity-30'}
          `}>
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }}></div>
            <span className="text-white font-black text-xs tracking-tight">{p.name}: {p.score}</span>
            {settings.mode === GameMode.LIVES && <span className="text-[10px] text-rose-400">{'❤'.repeat(p.lives)}</span>}
          </div>
        ))}
      </div>

      <button onClick={() => isPausedRef.current = !isPausedRef.current} className="absolute top-28 right-6 z-50 bg-white/10 hover:bg-white/20 p-4 rounded-2xl text-white backdrop-blur-2xl transition-all border border-white/20 shadow-xl active:scale-90">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          {isPausedRef.current ? <polygon points="5 3 19 12 5 21 5 3" fill="currentColor"/> : <><line x1="6" y1="4" x2="6" y2="20"/><line x1="18" y1="4" x2="18" y2="20"/></>}
        </svg>
      </button>

      <div className="absolute inset-0 pointer-events-none">
        {displayPlayers.map((p, i) => (
          <div key={p.id} className={`absolute ${getButtonPosition(i)} pointer-events-auto`}>
            <button
              onPointerDown={(e) => { e.preventDefault(); handleJump(p.id); }}
              style={{ backgroundColor: p.isAlive ? p.color : '#1e293b', boxShadow: p.isAlive ? `0 12px 0 0 ${p.color}aa, 0 30px 60px -12px ${p.color}99` : 'none' }}
              className={`w-24 h-24 md:w-44 md:h-44 rounded-[2.5rem] flex items-center justify-center text-white font-black text-4xl active:translate-y-4 active:shadow-none transition-all duration-75 touch-none border-4 border-white/30 ${!p.isAlive ? 'opacity-10 grayscale scale-90 pointer-events-none' : 'opacity-100'}`}
            >
              <span className={settings.playerCount === 2 && i === 1 ? "rotate-180" : ""}>{p.name}</span>
            </button>
          </div>
        ))}
      </div>

      {isPausedRef.current && (
        <div className="absolute inset-0 bg-black/95 backdrop-blur-3xl flex items-center justify-center z-[100] animate-in fade-in duration-300">
           <div className="bg-slate-900/80 border border-white/20 p-12 rounded-[4.5rem] shadow-2xl text-center max-w-sm mx-4 ring-1 ring-white/10">
              <h2 className="text-white text-6xl font-black mb-12 tracking-tight">PAUSA</h2>
              <div className="space-y-6">
                <button onClick={() => isPausedRef.current = false} className="w-full py-8 bg-indigo-600 text-white font-black rounded-3xl shadow-2xl shadow-indigo-600/50 active:scale-95 transition-transform text-2xl uppercase tracking-widest">Seguir</button>
                <button onClick={onBackToMenu} className="w-full py-6 bg-slate-800 text-slate-400 font-bold rounded-3xl active:scale-95 transition-transform uppercase tracking-widest text-lg">Menú</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default GameView;
