'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '@/lib/firebase';

type AppLanguage = 'en' | 'zh';

type NewsItem = {
  title: string;
  link: string;
  source: string;
  published?: string;
};

const lessons = [
  {
    key: 'mensHealth',
    en: 'Men reproductive health, hormones, and sexual knowledge',
    zh: '男性生殖健康、荷尔蒙与性知识',
  },
  {
    key: 'trading',
    en: 'Trading, investment, and finance knowledge',
    zh: '交易、投资与金融知识',
  },
  {
    key: 'planning',
    en: 'Financial planner knowledge',
    zh: '财务规划师知识',
  },
  {
    key: 'lifeRpg',
    en: 'Life RPG operating system (quests, XP, talent tree, achievements)',
    zh: '人生 RPG 操作系统（任务、经验值、天赋树、成就）',
  },
];

const lifeRpgModules = [
  {
    icon: '🧭',
    en: 'Traveler Profile: character card, attributes, and current state.',
    zh: '旅行者档案：角色卡、属性面板、当前状态。',
  },
  {
    icon: '🧪',
    en: 'Element Resonance: 5 growth lines and breakthrough requirements.',
    zh: '元素共鸣：5条成长线与突破条件。',
  },
  {
    icon: '📜',
    en: 'Quest Board: Archon quests, daily commissions, side quests, and spiral challenges.',
    zh: '冒险之证：主线、每日委托、支线与高难挑战。',
  },
  {
    icon: '🌳',
    en: 'Talent Tree: visible skill levels and unlock conditions.',
    zh: '天赋树：技能等级可视化与解锁条件。',
  },
  {
    icon: '🛡️',
    en: 'Artifacts: tools and resource loadout with set bonuses.',
    zh: '圣遗物：工具与资源装备，支持套装加成。',
  },
  {
    icon: '⭐',
    en: 'Adventure Log + Achievement System: EXP settlement, milestones, and hidden achievements.',
    zh: '冒险日志+成就系统：经验结算、里程碑与隐藏成就。',
  },
];

const copy = {
  en: {
    title: 'Dual-Language Learning Hub',
    subtitle: 'Learn in English / 中文 with guided modules and live Yahoo Finance headlines',
    language: 'Language',
    login: 'Login',
    register: 'Register',
    logout: 'Logout',
    email: 'Email',
    password: 'Password',
    authTitle: 'Account access',
    authHint: 'Sign in with your email or create a new account to start learning.',
    modulesTitle: 'Learning Tracks',
    lifeRpgTitle: 'New App Track: Life RPG OS',
    lifeRpgSubtitle: 'Turn work into quests, skills into talent trees, and yearly review into achievement unlocks.',
    marketNewsTitle: 'Latest top 20 Yahoo Finance headlines',
    refreshNews: 'Refresh News',
    loadingNews: 'Loading latest finance news...',
    admin: 'Admin page',
    signedIn: 'Signed in',
    firebaseMissing:
      'Firebase is not configured yet. Add NEXT_PUBLIC_FIREBASE_* variables in .env.local or Vercel project settings.',
  },
  zh: {
    title: '双语学习中心',
    subtitle: '支持 English / 中文 学习，并提供 Yahoo Finance 实时财经新闻',
    language: '语言',
    login: '登录',
    register: '注册',
    logout: '退出登录',
    email: '邮箱',
    password: '密码',
    authTitle: '账号登录',
    authHint: '使用邮箱登录，或先注册新账号后开始学习。',
    modulesTitle: '学习主题',
    lifeRpgTitle: '新增模块：人生 RPG 系统',
    lifeRpgSubtitle: '把工作变任务、把学习变天赋树、把复盘变成就解锁。',
    marketNewsTitle: 'Yahoo Finance 最新 20 条新闻',
    refreshNews: '刷新新闻',
    loadingNews: '正在加载最新财经新闻...',
    admin: '管理员页面',
    signedIn: '当前登录',
    firebaseMissing:
      'Firebase 尚未配置，请在 .env.local 或 Vercel 项目变量中添加 NEXT_PUBLIC_FIREBASE_* 参数。',
  },
} as const;

export function LearningApp() {
  const [language, setLanguage] = useState<AppLanguage>('en');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const t = copy[language];

  useEffect(() => {
    if (!auth) {
      return;
    }
    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
    });
  }, []);

  const loadNews = async () => {
    setNewsLoading(true);
    try {
      const response = await fetch('/api/news', { cache: 'no-store' });
      const data = await response.json();
      if (response.ok) {
        setNews(data.items ?? []);
      }
    } finally {
      setNewsLoading(false);
    }
  };

  useEffect(() => {
    void loadNews();
  }, []);

  const signedInLabel = useMemo(() => user?.email ?? '-', [user]);

  const onAuth = async (mode: 'login' | 'register') => {
    setAuthError(null);

    if (!auth) {
      setAuthError(t.firebaseMissing);
      return;
    }

    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      setPassword('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Authentication failed.';
      setAuthError(message);
    }
  };

  return (
    <main className="shell">
      <section className="hero card">
        <div>
          <p className="chip">Learning Hub</p>
          <h1>{t.title}</h1>
          <p className="sub hero-subtitle">{t.subtitle}</p>
        </div>
        <label className="language-control">
          {t.language}
          <select value={language} onChange={(event) => setLanguage(event.target.value as AppLanguage)}>
            <option value="en">English</option>
            <option value="zh">中文</option>
          </select>
        </label>
      </section>

      <div className="layout-grid">
        <section className="card auth-card">
          <h2>{t.authTitle}</h2>
          <p className="sub">{t.authHint}</p>
          <form
            className="auth-form"
            onSubmit={(event) => {
              event.preventDefault();
              void onAuth('login');
            }}
          >
            <label>
              {t.email}
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </label>
            <label>
              {t.password}
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={6}
                required
              />
            </label>
            <div className="action-row">
              <button type="submit">{t.login}</button>
              <button type="button" className="secondary" onClick={() => void onAuth('register')}>
                {t.register}
              </button>
              <button type="button" className="ghost" onClick={() => auth && signOut(auth)}>
                {t.logout}
              </button>
              <Link href="/admin" className="text-link">
                {t.admin}
              </Link>
            </div>
          </form>
          <p className="session">
            {t.signedIn}: <strong>{signedInLabel}</strong>
          </p>
          {!isFirebaseConfigured && <p className="status">{t.firebaseMissing}</p>}
          {authError && <p className="status">{authError}</p>}
        </section>

        <section className="card modules-card">
          <h2>{t.modulesTitle}</h2>
          <ul className="lesson-list">
            {lessons.map((lesson, index) => (
              <li key={lesson.key}>
                <span className="lesson-index">{index + 1}</span>
                <span>{language === 'en' ? lesson.en : lesson.zh}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="card modules-card">
        <h2>{t.lifeRpgTitle}</h2>
        <p className="sub">{t.lifeRpgSubtitle}</p>
        <ul className="lesson-list">
          {lifeRpgModules.map((module) => (
            <li key={module.icon + module.en}>
              <span className="lesson-index">{module.icon}</span>
              <span>{language === 'en' ? module.en : module.zh}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="card news-card">
        <div className="row news-header">
          <h2>{t.marketNewsTitle}</h2>
          <button type="button" onClick={() => void loadNews()} disabled={newsLoading}>
            {t.refreshNews}
          </button>
        </div>
        {newsLoading ? (
          <p>{t.loadingNews}</p>
        ) : (
          <ol className="news-list">
            {news.map((item) => (
              <li key={`${item.source}-${item.link}`}>
                <a href={item.link} target="_blank" rel="noreferrer">
                  {item.title}
                </a>
                <p className="sub news-meta">
                  {item.source} · {item.published ?? ''}
                </p>
              </li>
            ))}
          </ol>
        )}
      </section>
    </main>
  );
}
