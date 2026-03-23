import { NextRequest, NextResponse } from 'next/server';
import { fallbackCourse } from '@/lib/course-data';
import { GeneratedCourse, LanguageCode, LevelCode } from '@/lib/types';

export async function POST(request: NextRequest) {
  const { language, level } = (await request.json()) as {
    language: LanguageCode;
    level: LevelCode;
  };

  if (!language || !level) {
    return NextResponse.json({ error: 'Language and level are required.' }, { status: 400 });
  }

  const fallback = fallbackCourse(language, level);
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash';

  if (!apiKey) {
    return NextResponse.json({ course: fallback, source: 'fallback' });
  }

  const prompt = [
    'Return valid JSON only.',
    'Create a language learning course object with keys: headline, description, goals, outcomes, sections, flashcards, practicePlan, milestones, finalProject.',
    `Language: ${language}. Level: ${level}.`,
    'Use a fuller online course structure with an overview, measurable outcomes, modules, bite-sized lessons, practice, assessment, milestones, and a final project.',
    'Support Japanese, Korean, and Thai study.',
    'If level is beginner, include script or sound system, pronunciation, and foundational grammar explicitly.',
    'sections must be an array of {title, focus, objectives:string[], lessons:{title, activity, outcome}[], assessment, content:string[]}.',
    'Each module should feel substantial, practical, and sequenced from input to guided practice to output.',
    'flashcards must be an array of {front, back, proficiencyHint}.',
    'goals, outcomes, practicePlan, and milestones must be string arrays.',
    'finalProject must be one string describing the capstone task for the end of the course.',
  ].join(' ');

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' },
        }),
      });

    if (!response.ok) {
      return NextResponse.json({ course: fallback, source: 'fallback' });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      return NextResponse.json({ course: fallback, source: 'fallback' });
    }

    const parsed = JSON.parse(text) as Omit<GeneratedCourse, 'language' | 'level'>;
    return NextResponse.json({
      course: {
        language,
        level,
        ...parsed,
      } satisfies GeneratedCourse,
      source: 'gemini',
    });
  } catch {
    return NextResponse.json({ course: fallback, source: 'fallback' });
  }
}
