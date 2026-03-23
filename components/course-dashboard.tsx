'use client';

import { useEffect, useMemo, useState } from 'react';
import { fallbackCourse } from '@/lib/course-data';
import { getStoredProgress, persistProgress } from '@/lib/progress';
import { GeneratedCourse, LanguageCode, LevelCode } from '@/lib/types';

const languages: LanguageCode[] = ['japanese', 'korean', 'thai'];
const levels: LevelCode[] = ['beginner', 'intermediate', 'pro'];
const levelLabels: Record<LevelCode, string> = {
  beginner: 'Rookie',
  intermediate: 'Explorer',
  pro: 'Champion',
};

export function CourseDashboard() {
  const [language, setLanguage] = useState<LanguageCode>('japanese');
  const [level, setLevel] = useState<LevelCode>('beginner');
  const [course, setCourse] = useState<GeneratedCourse>(fallbackCourse('japanese', 'beginner'));
  const [status, setStatus] = useState('Choose a track and jump into today\'s lesson path.');
  const [scores, setScores] = useState<Record<string, number>>({});

  const progress = useMemo(() => getStoredProgress()[`${language}-${level}`], [language, level, course]);
  const completedSectionCount = progress?.completedSections.length ?? 0;
  const totalSections = course.sections.length;
  const completionPercent = totalSections === 0 ? 0 : Math.round((completedSectionCount / totalSections) * 100);
  const flashcardCount = Object.keys(progress?.flashcardScores ?? {}).length;

  useEffect(() => {
    setScores(progress?.flashcardScores ?? {});
  }, [progress]);

  async function generateCourse() {
    setStatus('Building your next lesson path with Gemini...');
    const response = await fetch('/api/course', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language, level }),
    });
    const data = await response.json();
    setCourse(data.course);
    setStatus(data.source === 'gemini'
      ? 'Fresh AI path loaded. Keep your streak going.'
      : 'Fallback path loaded. Add GEMINI_API_KEY to unlock AI-generated lessons.');
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
    setStatus(sectionTitle ? `${sectionTitle} marked complete and saved.` : 'Progress saved locally and to Firebase when configured.');
  }

  return (
    <main className="duo-shell">
      <section className="topbar card">
        <div>
          <p className="eyebrow">Duolingo-inspired learning flow</p>
          <h1>Polyglot Path</h1>
          <p className="intro-copy">
            Organize study into a playful path with focused lessons, daily practice, quick review,
            and visible momentum for Japanese, Korean, or Thai.
          </p>
        </div>
        <div className="streak-pill">
          <span className="streak-number">{completionPercent}%</span>
          <span className="streak-label">Path complete</span>
        </div>
      </section>

      <section className="duo-layout">
        <aside className="sidebar card">
          <div className="sidebar-block">
            <p className="sidebar-label">Course setup</p>
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
            <div className="actions stack">
              <button onClick={generateCourse}>Generate course</button>
              <button className="secondary" onClick={() => saveProgress()}>Save progress</button>
            </div>
            <p className="status">{status}</p>
          </div>

          <div className="sidebar-block stats-grid">
            <article className="mini-stat success">
              <span>{completedSectionCount}/{totalSections}</span>
              <strong>Lessons cleared</strong>
            </article>
            <article className="mini-stat info">
              <span>{flashcardCount}</span>
              <strong>Cards tracked</strong>
            </article>
            <article className="mini-stat accent">
              <span>{levelLabels[level]}</span>
              <strong>League</strong>
            </article>
          </div>

          <div className="sidebar-block quest-card">
            <p className="sidebar-label">Daily quest</p>
            <h2>{course.headline}</h2>
            <ul className="goal-list compact">
              {course.goals.map((goal) => <li key={goal}>{goal}</li>)}
            </ul>
            <p className="helper">Last sync: {progress?.updatedAt ?? 'Not saved yet'}</p>
          </div>
        </aside>

        <div className="content-column">
          <section className="hero-path card">
            <div className="hero-path-copy">
              <p className="eyebrow">Unit map</p>
              <h2>{capitalize(language)} {capitalize(level)} journey</h2>
              <p>
                Move through bite-sized lessons in order: unlock the next skill, review weak spots,
                then finish with flashcards to reinforce recall.
              </p>
            </div>
            <div className="path-rail">
              {course.sections.map((section, index) => {
                const isComplete = progress?.completedSections.includes(section.title) ?? false;
                return (
                  <article key={section.title} className={`path-node ${isComplete ? 'complete' : ''}`}>
                    <div className="path-badge">{index + 1}</div>
                    <div className="path-node-copy">
                      <p className="path-node-kicker">Skill {index + 1}</p>
                      <h3>{section.focus}</h3>
                      <p>{section.content[0]}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="grid-panels">
            <article className="card panel-card">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Today</p>
                  <h2>Practice routine</h2>
                </div>
                <span className="panel-chip">{course.practicePlan.length} steps</span>
              </div>
              <ol className="practice-list">
                {course.practicePlan.map((item) => <li key={item}>{item}</li>)}
              </ol>
            </article>

            <article className="card panel-card">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Coach notes</p>
                  <h2>Progress snapshot</h2>
                </div>
                <span className="panel-chip">{completionPercent}% done</span>
              </div>
              <ul className="goal-list">
                <li>Completed modules: {completedSectionCount}</li>
                <li>Tracked flashcards: {flashcardCount}</li>
                <li>Firebase sync activates when env vars are configured.</li>
              </ul>
            </article>
          </section>

          <section className="card">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Lesson path</p>
                <h2>Core skills</h2>
              </div>
              <span className="panel-chip">Tap through in order</span>
            </div>
            <div className="lesson-stack">
              {course.sections.map((section, index) => {
                const isComplete = progress?.completedSections.includes(section.title) ?? false;
                return (
                  <article key={section.title} className={`lesson-card ${isComplete ? 'complete' : ''}`}>
                    <div className="lesson-card-head">
                      <div>
                        <p className="lesson-step">Lesson {index + 1}</p>
                        <h3>{section.title}: {section.focus}</h3>
                      </div>
                      <button className="secondary" onClick={() => saveProgress(section.title)}>
                        {isComplete ? 'Completed' : 'Mark complete'}
                      </button>
                    </div>
                    <ul className="goal-list">
                      {section.content.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="card">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Review zone</p>
                <h2>Flashcards</h2>
              </div>
              <span className="panel-chip">Strengthen recall</span>
            </div>
            <div className="flashcards duo-cards">
              {course.flashcards.map((card, index) => {
                const key = `${course.language}-${course.level}-${index}`;
                return (
                  <article key={key} className="flashcard duo-flashcard">
                    <p className="flash-front">{card.front}</p>
                    <p className="flash-back">{card.back}</p>
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
        </div>
      </section>
    </main>
  );
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
