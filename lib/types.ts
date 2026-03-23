export type LanguageCode = 'japanese' | 'korean' | 'thai';
export type LevelCode = 'beginner' | 'intermediate' | 'pro';

export type LessonItem = {
  title: string;
  activity: string;
  outcome: string;
};

export type LessonSection = {
  title: string;
  focus: string;
  objectives: string[];
  lessons: LessonItem[];
  assessment: string;
  content: string[];
};

export type Flashcard = {
  front: string;
  back: string;
  proficiencyHint: string;
};

export type GeneratedCourse = {
  language: LanguageCode;
  level: LevelCode;
  headline: string;
  description: string;
  goals: string[];
  outcomes: string[];
  sections: LessonSection[];
  flashcards: Flashcard[];
  practicePlan: string[];
  milestones: string[];
  finalProject: string;
};

export type ProgressRecord = {
  language: LanguageCode;
  level: LevelCode;
  completedSections: string[];
  flashcardScores: Record<string, number>;
  updatedAt: string;
};
