'use client';

import { useMemo, useState } from 'react';
import { fallbackCourse } from '@/lib/course-data';
import { getStoredProgress, persistProgress } from '@/lib/progress';
import { GeneratedCourse, LanguageCode, LevelCode } from '@/lib/types';

const languages: LanguageCode[] = ['japanese', 'korean', 'thai'];
const levels: LevelCode[] = ['beginner', 'intermediate', 'pro'];

export function CourseDashboard() {
  const [language, setLanguage] = useState<LanguageCode>('japanese');
  const [level, setLevel] = useState<LevelCode>('beginner');
  const [course, setCourse] = useState<GeneratedCourse>(fallbackCourse('japanese', 'beginner'));
  const [status, setStatus] = useState('Ready to generate a course.');
  const [scores, setScores] = useState<Record<string, number>>({});

  const progress = useMemo(() => getStoredProgress()[`${language}-${level}`], [language, level, course]);

  async function generateCourse() {
    setStatus('Generating course with Gemini...');
    const response = await fetch('/api/course', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language, level }),
    });
    const data = await response.json();
    setCourse(data.course);
    setStatus(data.source === 'gemini' ? 'Gemini course loaded.' : 'Fallback course loaded. Add GEMINI_API_KEY for AI generation.');
    setScores(progress?.flashcardScores ?? {});
  }

  async function saveProgress(sectionTitle?: string) {
    const completedSections = sectionTitle
      ? Array.from(new Set([...(progress?.completedSections ?? []), sectionTitle]))
      : (progress?.completedSections ?? []);

    await persistProgress({
      language,
      level,
      completedSections,
      flashcardScores: scores,
      updatedAt: new Date().toISOString(),
    });
    setStatus('Progress saved locally and to Firebase when configured.');
  }

  return (
    <main className="page">
      <section className="hero card">
        <div>
          <p className="eyebrow">Vercel-ready Next.js app</p>
          <h1>Polyglot Path</h1>
          <p>
            Learn Japanese, Korean, or Thai with AI-generated courses, beginner-to-pro tracks,
            flashcards, and Firebase-backed progress.
          </p>
        </div>
        <div className="grid two">
          <label>
            Language
            <select value={language} onChange={(e) => setLanguage(e.target.value as LanguageCode)}>
              {languages.map((item) => <option key={item} value={item}>{capitalize(item)}</option>)}
            </select>
          </label>
          <label>
            Level
            <select value={level} onChange={(e) => setLevel(e.target.value as LevelCode)}>
              {levels.map((item) => <option key={item} value={item}>{capitalize(item)}</option>)}
            </select>
          </label>
        </div>
        <div className="actions">
          <button onClick={generateCourse}>Generate course</button>
          <button className="secondary" onClick={() => saveProgress()}>Save progress</button>
        </div>
        <p className="status">{status}</p>
      </section>

      <section className="grid two">
        <article className="card">
          <h2>{course.headline}</h2>
          <ul>
            {course.goals.map((goal) => <li key={goal}>{goal}</li>)}
          </ul>
          <h3>Daily practice plan</h3>
          <ol>
            {course.practicePlan.map((item) => <li key={item}>{item}</li>)}
          </ol>
        </article>

        <article className="card">
          <h2>Progress snapshot</h2>
          <p>Completed modules: {progress?.completedSections.length ?? 0}</p>
          <p>Tracked flashcards: {Object.keys(progress?.flashcardScores ?? {}).length}</p>
          <p>Last sync: {progress?.updatedAt ?? 'Not saved yet'}</p>
          <p className="helper">Firebase writes activate automatically once env vars are configured.</p>
        </article>
      </section>

      <section className="card">
        <h2>Lesson modules</h2>
        <div className="module-list">
          {course.sections.map((section) => (
            <article key={section.title} className="module">
              <div className="module-header">
                <div>
                  <h3>{section.title}</h3>
                  <p>{section.focus}</p>
                </div>
                <button className="secondary" onClick={() => saveProgress(section.title)}>
                  Mark complete
                </button>
              </div>
              <ul>
                {section.content.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="card">
        <h2>Flashcard mode</h2>
        <div className="flashcards">
          {course.flashcards.map((card, index) => {
            const key = `${course.language}-${course.level}-${index}`;
            return (
              <article key={key} className="flashcard">
                <p className="flash-front">{card.front}</p>
                <p>{card.back}</p>
                <p className="helper">{card.proficiencyHint}</p>
                <label>
                  Proficiency score (1-5)
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={scores[key] ?? 3}
                    onChange={(e) => setScores((prev) => ({ ...prev, [key]: Number(e.target.value) }))}
                  />
                </label>
                <strong>Current score: {scores[key] ?? 3}</strong>
              </article>
            );
          })}
        </div>
      </section>

      <section className="card">
        <h2>Deployment and setup</h2>
        <ul>
          <li>Deploy directly to Vercel with the included <code>vercel.json</code>.</li>
          <li>Add Firebase and Gemini keys from <code>.env.example</code> in Vercel project settings.</li>
          <li>Beginner mode explicitly emphasizes character, pronunciation, and grammar foundations.</li>
        </ul>
      </section>
    </main>
  );
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
