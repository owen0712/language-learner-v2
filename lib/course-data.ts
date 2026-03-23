import { GeneratedCourse, LanguageCode, LevelCode } from './types';

const beginnerFocusMap: Record<LanguageCode, string[]> = {
  japanese: ['Hiragana and Katakana', 'Pronunciation rhythm', 'Core grammar particles'],
  korean: ['Hangul blocks', 'Pronunciation and batchim', 'Sentence order and particles'],
  thai: ['Thai consonants and vowels', 'Tones and pronunciation', 'Basic sentence patterns'],
};

export const fallbackCourse = (language: LanguageCode, level: LevelCode): GeneratedCourse => {
  const focus = level === 'beginner'
    ? beginnerFocusMap[language]
    : level === 'intermediate'
      ? ['Conversation building', 'Listening patterns', 'Grammar expansion']
      : ['Nuanced fluency', 'Advanced reading', 'Professional communication'];

  return {
    language,
    level,
    headline: `${capitalize(language)} ${capitalize(level)} Path`,
    goals: [
      `Build confidence in ${language} ${level} study.`,
      'Track progress across lessons and flashcards.',
      'Blend AI course generation with structured practice.',
    ],
    sections: focus.map((item, index) => ({
      title: `Module ${index + 1}`,
      focus: item,
      content: [
        `Study the essential ideas for ${item.toLowerCase()}.`,
        `Practice short drills tailored to ${language}.`,
        'Review mistakes and mark confidence after each session.',
      ],
    })),
    flashcards: [
      {
        front: sampleFront(language, level),
        back: sampleBack(language),
        proficiencyHint: 'Mark 1 if difficult, 3 if familiar, 5 if mastered.',
      },
      {
        front: `Key ${level} grammar pattern`,
        back: 'Explain the structure and write one example sentence.',
        proficiencyHint: 'Repeat until you can use it naturally.',
      },
    ],
    practicePlan: [
      '10 minutes review',
      '15 minutes guided lesson',
      '10 minutes flashcards',
      '5 minutes self-reflection and progress sync',
    ],
  };
};

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
