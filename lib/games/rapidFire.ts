import config from '@/data/config.json';

export type Question = {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number; // Index 0-3
};

export const RAPID_FIRE_QUESTIONS: Question[] = config.rapidFireQuestions;

export const SCORING = {
  BASE_CORRECT: 100,
  TIME_BONUS_MULTIPLIER: 10, // Points per second remaining
  STREAK_BONUS: 50,
};
