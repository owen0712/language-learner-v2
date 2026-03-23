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

  const progress = useMemo(() => getStoredProgress()[`${language}-${level}`], [language, level]);
  const completedSectionCount = progress?.completedSections.length ?? 0;
  const totalSections = course.sections.length;
  const completionPercent = totalSections === 0 ? 0 : Math.round((completedSectionCount / totalSections) * 100);
  const flashcardCount = Object.keys(progress?.flashcardScores ?? {}).length;
  const totalXp = completedSectionCount * 25 + flashcardCount * 5;
  const streakDays = Math.max(1, completedSectionCount * 2 + (flashcardCount > 0 ? 1 : 0));
  const heartsLeft = Math.max(1, 5 - Math.min(4, totalSections - completedSectionCount));
  const nextLesson = course.sections.find((section) => !(progress?.completedSections.includes(section.title) ?? false)) ?? course.sections[0];
  const dailyQuestTarget = Math.min(3, totalSections || 1);
  const dailyQuestProgress = Math.min(dailyQuestTarget, completedSectionCount);

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
            A playful lesson lane with streak energy, daily quests, XP, and bite-sized skill bubbles
            for Japanese, Korean, or Thai.
          </p>
        </div>
        <div className="topbar-stats">
          <div className="streak-pill">
            <span className="streak-number">{streakDays}</span>
            <span className="streak-label">day streak</span>
          </div>
          <div className="streak-pill xp-pill">
            <span className="streak-number">{totalXp}</span>
            <span className="streak-label">total XP</span>
          </div>
        </div>
      </section>

      <section className="duo-layout">
        <aside className="sidebar card">
          <div className="sidebar-block mascot-panel">
            <div>
              <p className="sidebar-label">Today&apos;s mission</p>
              <h2>{capitalize(language)} sprint</h2>
              <p className="helper">Finish one lesson, review flashcards, and keep your momentum alive.</p>
            </div>
            <div className="mascot-bubble" aria-hidden="true">🦉</div>
          </div>

          <div className="sidebar-block stats-grid trio">
            <article className="mini-stat success">
              <span>{streakDays}</span>
              <strong>Streak</strong>
            </article>
            <article className="mini-stat info">
              <span>{totalXp}</span>
              <strong>XP</strong>
            </article>
            <article className="mini-stat accent">
              <span>{heartsLeft} / 5</span>
              <strong>Hearts</strong>
            </article>
          </div>

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

          <div className="sidebar-block quest-card">
            <div className="panel-header compact-header">
              <div>
                <p className="sidebar-label">Daily quest</p>
                <h2>{course.headline}</h2>
              </div>
              <span className="panel-chip">{dailyQuestProgress}/{dailyQuestTarget}</span>
            </div>
            <p className="helper">{course.description}</p>
            <div className="quest-progress">
              <div className="quest-progress-bar" style={{ width: `${(dailyQuestProgress / dailyQuestTarget) * 100}%` }} />
            </div>
            <ul className="goal-list compact">
              {course.goals.map((goal) => <li key={goal}>{goal}</li>)}
            </ul>
            <p className="helper">Last sync: {progress?.updatedAt ?? 'Not saved yet'}</p>
          </div>

          <div className="sidebar-block league-card">
            <p className="sidebar-label">League status</p>
            <h2>{levelLabels[level]} League</h2>
            <ul className="goal-list compact">
              <li>{completedSectionCount}/{totalSections} skills completed</li>
              <li>{flashcardCount} flashcards tracked</li>
              <li>Next focus: {nextLesson?.focus ?? 'Generate a path'}</li>
            </ul>
          </div>
        </aside>

        <div className="content-column">
          <section className="hero-banner card">
            <div className="hero-copy">
              <p className="eyebrow">Continue learning</p>
              <h2>{capitalize(language)} {capitalize(level)} journey</h2>
              <p>
                Follow the winding path, clear each skill bubble, and stack confidence through
                guided practice, review, and mastery checks.
              </p>
            </div>
            <div className="hero-metrics">
              <article>
                <strong>{completionPercent}%</strong>
                <span>course progress</span>
              </article>
              <article>
                <strong>{course.practicePlan.length}</strong>
                <span>today&apos;s drills</span>
              </article>
              <article>
                <strong>{course.outcomes.length}</strong>
                <span>target outcomes</span>
              </article>
            </div>
          </section>

          <section className="path-experience card">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Skill path</p>
                <h2>Learn like a game board</h2>
              </div>
              <span className="panel-chip">Next up: {nextLesson?.title ?? 'Lesson 1'}</span>
            </div>
            <div className="path-map">
              {course.sections.map((section, index) => {
                const isComplete = progress?.completedSections.includes(section.title) ?? false;
                const isCurrent = nextLesson?.title === section.title && !isComplete;
                return (
                  <article
                    key={section.title}
                    className={`path-orb ${isComplete ? 'complete' : ''} ${isCurrent ? 'current' : ''} ${index % 2 === 1 ? 'right' : 'left'}`}
                  >
                    <div className="path-orb-button">
                      <span>{index + 1}</span>
                    </div>
                    <div className="path-orb-copy">
                      <p className="path-node-kicker">Unit {index + 1}</p>
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
                  <p className="eyebrow">Warm up</p>
                  <h2>Practice routine</h2>
                </div>
                <span className="panel-chip">{course.practicePlan.length} drills</span>
              </div>
              <ol className="practice-list">
                {course.practicePlan.map((item) => <li key={item}>{item}</li>)}
              </ol>
            </article>

            <article className="card panel-card">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Quest board</p>
                  <h2>Progress snapshot</h2>
                </div>
                <span className="panel-chip">{completionPercent}% done</span>
              </div>
              <ul className="goal-list">
                <li>Completed lessons: {completedSectionCount}</li>
                <li>Tracked flashcards: {flashcardCount}</li>
                <li>Course outcomes mapped: {course.outcomes.length}</li>
                <li>Firebase sync activates when env vars are configured.</li>
              </ul>
            </article>
          </section>

          <section className="grid-panels">
            <article className="card panel-card">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Rewards</p>
                  <h2>Learning outcomes</h2>
                </div>
                <span className="panel-chip">{course.outcomes.length} goals</span>
              </div>
              <ul className="goal-list">
                {course.outcomes.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </article>

            <article className="card panel-card">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Boss level</p>
                  <h2>Milestones & capstone</h2>
                </div>
                <span className="panel-chip">{course.milestones.length} checkpoints</span>
              </div>
              <ul className="goal-list">
                {course.milestones.map((item) => <li key={item}>{item}</li>)}
              </ul>
              <p className="helper"><strong>Final project:</strong> {course.finalProject}</p>
            </article>
          </section>

          <section className="card">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Lesson lane</p>
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
                    <div className="lesson-details">
                      <p className="eyebrow">Module objectives</p>
                      <ul className="goal-list compact">
                        {section.objectives.map((item) => <li key={item}>{item}</li>)}
                      </ul>
                      <p className="eyebrow">Lesson sequence</p>
                      <ul className="goal-list compact">
                        {section.lessons.map((lesson) => (
                          <li key={lesson.title}>
                            <strong>{lesson.title}</strong>: {lesson.activity} <em>Outcome:</em> {lesson.outcome}
                          </li>
                        ))}
                      </ul>
                      <p className="helper">{section.assessment}</p>
                    </div>
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
                    <div className="flashcard-badge">+5 XP</div>
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
