import { GeneratedCourse, LanguageCode, LevelCode, LessonSection } from './types';

const beginnerFocusMap: Record<LanguageCode, string[]> = {
  japanese: ['Hiragana and Katakana foundations', 'Pronunciation and survival phrases', 'Core particles and sentence patterns', 'Reading and writing simple routines'],
  korean: ['Hangul decoding and writing', 'Pronunciation and batchim accuracy', 'Particles and sentence building', 'Daily-life reading and speaking tasks'],
  thai: ['Thai consonants and vowels', 'Tones and pronunciation control', 'Basic sentence structure and particles', 'Reading signs and everyday exchanges'],
};

const intermediateFocusMap: Record<LanguageCode, string[]> = {
  japanese: ['Conversation expansion', 'Listening for key details', 'Grammar combinations', 'Short-form reading and response'],
  korean: ['Conversation flow', 'Listening comprehension', 'Connector patterns', 'Short reading and summary'],
  thai: ['Conversation confidence', 'Listening and tone recognition', 'Grammar expansion', 'Short reading and response'],
};

const proFocusMap: Record<LanguageCode, string[]> = {
  japanese: ['Nuanced speaking', 'Advanced listening', 'Formal reading strategies', 'Professional communication'],
  korean: ['Nuanced speaking', 'Advanced listening', 'Formal reading strategies', 'Professional communication'],
  thai: ['Nuanced speaking', 'Advanced listening', 'Formal reading strategies', 'Professional communication'],
};

export const fallbackCourse = (language: LanguageCode, level: LevelCode): GeneratedCourse => {
  const focus = level === 'beginner'
    ? beginnerFocusMap[language]
    : level === 'intermediate'
      ? intermediateFocusMap[language]
      : proFocusMap[language];

  const sections = focus.map((item, index) => buildSection(language, level, item, index + 1));

  return {
    language,
    level,
    headline: `${capitalize(language)} ${capitalize(level)} Path`,
    description: `A structured ${level} course for ${language} built around module outcomes, bite-sized lessons, practice checks, and a final performance task.`,
    goals: [
      `Build confidence in ${language} ${level} study through a predictable weekly structure.`,
      'Progress from guided input to independent output in every module.',
      'Track lesson completion, review cards, and skill milestones in one place.',
    ],
    outcomes: [
      `Understand the core ${language} patterns expected at the ${level} stage.`,
      'Use each module skill in a short speaking or writing task.',
      'Finish the course with a portfolio-ready final project.',
    ],
    sections,
    flashcards: [
      {
        front: sampleFront(language, level),
        back: sampleBack(language),
        proficiencyHint: 'Mark 1 if difficult, 3 if familiar, 5 if mastered.',
      },
      {
        front: `Key ${level} grammar pattern`,
        back: 'Explain the structure, write one example, and say it aloud once.',
        proficiencyHint: 'Repeat until you can use it naturally without notes.',
      },
      {
        front: `${capitalize(language)} high-frequency phrase`,
        back: 'Use it in a realistic mini-dialogue or daily-life sentence.',
        proficiencyHint: 'Raise your score when you can recall it quickly and accurately.',
      },
    ],
    practicePlan: [
      'Warm-up review: 10 minutes of old flashcards and pronunciation recall.',
      'Core lesson block: 20 minutes on one module lesson item.',
      'Active production: 15 minutes speaking or writing from memory.',
      'Assessment check: 10 minutes quiz, dictation, or self-recording.',
      'Reflection: 5 minutes logging mistakes and next-step goals.',
    ],
    milestones: [
      'Checkpoint 1: Complete the first two modules with at least one saved review note per module.',
      'Checkpoint 2: Finish a short recorded introduction or dialogue using target grammar.',
      'Checkpoint 3: Pass the end-of-module assessments and update weak flashcards.',
      'Final milestone: Submit the final project and complete a self-evaluation.',
    ],
    finalProject: buildFinalProject(language, level),
  };
};

function buildSection(language: LanguageCode, level: LevelCode, focus: string, moduleNumber: number): LessonSection {
  return {
    title: `Module ${moduleNumber}`,
    focus,
    objectives: [
      `Identify the main patterns used in ${focus.toLowerCase()}.`,
      `Apply ${focus.toLowerCase()} in a short ${level === 'beginner' ? 'guided' : 'independent'} task.`,
      `Review common mistakes and build a reusable study note for ${focus.toLowerCase()}.`,
    ],
    lessons: [
      {
        title: 'Lesson 1 · Input',
        activity: `Study a concise explanation and model examples for ${focus.toLowerCase()}.`,
        outcome: `Recognize the core ideas behind ${focus.toLowerCase()}.`,
      },
      {
        title: 'Lesson 2 · Guided practice',
        activity: `Complete pronunciation, matching, or sentence-building drills tailored to ${language}.`,
        outcome: 'Use the target skill with support and immediate correction.',
      },
      {
        title: 'Lesson 3 · Real-world output',
        activity: 'Write or say a short response that mirrors a realistic conversation, sign, or message.',
        outcome: 'Demonstrate retention without copying the model directly.',
      },
    ],
    assessment: level === 'pro'
      ? 'Assessment: complete a scenario response with accuracy, range, and natural phrasing.'
      : 'Assessment: finish a short quiz plus one speaking or writing check using the module target.',
    content: [
      `Start with the essential concepts for ${focus.toLowerCase()}.`,
      `Practice with short drills tailored to ${language} and the ${level} level.`,
      'End with a check-for-understanding task and a quick reflection note.',
    ],
  };
}

function buildFinalProject(language: LanguageCode, level: LevelCode) {
  if (level === 'beginner') {
    return `Create a beginner ${language} survival portfolio: self-introduction, daily routine, and one practical dialogue with audio or written script.`;
  }
  if (level === 'intermediate') {
    return `Create a themed ${language} project that combines a summary, opinion, and role-play response using the course grammar targets.`;
  }
  return `Deliver a polished ${language} capstone presentation or writing sample that demonstrates advanced comprehension, organization, and audience awareness.`;
}

function sampleFront(language: LanguageCode, level: LevelCode) {
  if (language === 'japanese') return level === 'beginner' ? 'あ / ア' : 'Explain a polite self-introduction.';
  if (language === 'korean') return level === 'beginner' ? '가' : 'Build a sentence about your daily routine.';
  return level === 'beginner' ? 'ก' : 'Describe a simple travel plan in Thai.';
}

function sampleBack(language: LanguageCode) {
  if (language === 'japanese') return 'Read it aloud and explain the sound or meaning.';
  if (language === 'korean') return 'Pronounce it, then write a matching example word.';
  return 'Say the tone carefully and connect it to a usable phrase.';
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
