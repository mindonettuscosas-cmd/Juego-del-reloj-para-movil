
import { Difficulty } from './types';

export const PLAYER_COLORS = [
  '#ef4444', // Red
  '#3b82f6', // Blue
  '#22c55e', // Green
  '#eab308', // Yellow
  '#a855f7', // Purple
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#f97316', // Orange
];

export const GAME_OVER_POOL = {
  loser: [
    "¿Saltabas o echabas raíces?",
    "Mi gato tiene más reflejos muerto.",
    "¿Te pesan las botas de plomo?",
    "Vaya desastre de coordinación.",
    "El suelo y tú sois mejores amigos.",
    "¿Has probado a usar los ojos?",
    "Nivel: Planta ornamental."
  ],
  average: [
    "Ni fú ni fá, un humano corriente.",
    "Aceptable... para alguien con sueño.",
    "Has durado más de lo que esperaba (que era nada).",
    "Meh. Un poco de ritmo no te vendría mal.",
    "Casi pareces un deportista. Casi.",
    "Sigue practicando, todavía das pena."
  ],
  winner: [
    "Suerte de principiante, seguro.",
    "¿No tienes nada mejor que hacer con tu vida?",
    "Vaya pro... se nota que no sales mucho a la calle.",
    "Has ganado, pero sigues siendo un patoso.",
    "Hacker. Nadie salta tanto de forma natural.",
    "¡Deja de lucirte, es solo una cuerda!"
  ]
};

export const DIFFICULTY_CONFIG = {
  [Difficulty.EASY]: {
    baseSpeed: 0.015,
    acceleration: 0.000005,
    reverseProbability: 0.002,
    telegraphWindow: 60,
  },
  [Difficulty.NORMAL]: {
    baseSpeed: 0.025,
    acceleration: 0.000015,
    reverseProbability: 0.005,
    telegraphWindow: 45,
  },
  [Difficulty.HARD]: {
    baseSpeed: 0.04,
    acceleration: 0.000025,
    reverseProbability: 0.01,
    telegraphWindow: 30,
  },
};

export const JUMP_DURATION = 550; // ms
export const JUMP_COOLDOWN = 100; // ms
export const COLLISION_THRESHOLD = 0.25; 
export const ROPE_HEIGHT = 15;
