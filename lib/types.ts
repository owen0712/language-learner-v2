export type LanguageCode = 'japanese' | 'korean' | 'thai';
export type LevelCode = 'beginner' | 'intermediate' | 'pro';

export type LessonSection = {
  title: string;
  focus: string;
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
  goals: string[];
  sections: LessonSection[];
  flashcards: Flashcard[];
  practicePlan: string[];
};

export type ProgressRecord = {
  language: LanguageCode;
  level: LevelCode;
  completedSections: string[];
  flashcardScores: Record<string, number>;
  updatedAt: string;
};
