export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  lastModified: number;
  tags: string[]; // e.g., 'Grammar', 'Vocabulary', 'Compliance'
  isFavorite?: boolean;
}

export interface TranslationResult {
  term: string;
  translation: string;
  definition: string;
  examples: string[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export enum AppView {
  NOTES = 'NOTES',
  TRANSLATOR = 'TRANSLATOR',
  QUIZ = 'QUIZ',
  NEWS = 'NEWS',
}

export interface QuizState {
  isActive: boolean;
  score: number;
  currentQuestionIndex: number;
  questions: QuizQuestion[];
  showResults: boolean;
  answers: number[]; // Index of selected answer per question
}

export interface User {
  id: string;
  email: string;
  name: string;
}
