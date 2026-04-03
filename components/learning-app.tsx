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
];

const copy = {
  en: {
    title: 'Dual-Language Learning Hub',
    subtitle: 'English / 中文 learning app with Firebase authentication',
    language: 'Language',
    login: 'Login',
    register: 'Register',
    logout: 'Logout',
    email: 'Email',
    password: 'Password',
    authTitle: 'Sign in with email & password',
    authHint: 'If account does not exist, choose Register.',
    modulesTitle: 'Learning Tracks',
    marketNewsTitle: 'Latest top 20 Bloomberg + Yahoo Finance headlines',
    refreshNews: 'Refresh News',
    loadingNews: 'Loading latest finance news...',
    admin: 'Admin page',
    firebaseMissing:
      'Firebase is not configured yet. Add NEXT_PUBLIC_FIREBASE_* variables in .env.local.',
  },
  zh: {
    title: '双语学习中心',
    subtitle: '支持 English / 中文 与 Firebase 登录',
    language: '语言',
    login: '登录',
    register: '注册',
    logout: '退出登录',
    email: '邮箱',
    password: '密码',
    authTitle: '使用邮箱和密码登录',
    authHint: '如果没有账号，请选择注册。',
    modulesTitle: '学习主题',
    marketNewsTitle: 'Bloomberg + Yahoo Finance 最新 20 条新闻',
    refreshNews: '刷新新闻',
    loadingNews: '正在加载最新财经新闻...',
    admin: '管理员页面',
    firebaseMissing: 'Firebase 尚未配置，请在 .env.local 添加 NEXT_PUBLIC_FIREBASE_* 变量。',
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

  const signedInLabel = useMemo(() => (user ? user.email : '-'), [user]);

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
      <section className="card row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>{t.title}</h1>
          <p className="sub">{t.subtitle}</p>
        </div>
        <label>
          {t.language}
          <select value={language} onChange={(event) => setLanguage(event.target.value as AppLanguage)}>
            <option value="en">English</option>
            <option value="zh">中文</option>
          </select>
        </label>
      </section>

      <section className="card">
        <h2>{t.authTitle}</h2>
        <p className="sub">{t.authHint}</p>
        <form
          className="row"
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
          <div className="row" style={{ alignItems: 'flex-end' }}>
            <button type="submit">{t.login}</button>
            <button type="button" onClick={() => void onAuth('register')}>
              {t.register}
            </button>
            <button type="button" onClick={() => auth && signOut(auth)}>
              {t.logout}
            </button>
            <Link href="/admin">{t.admin}</Link>
          </div>
        </form>
        <p className="session">Signed in: {signedInLabel}</p>
        {!isFirebaseConfigured && <p className="status">{t.firebaseMissing}</p>}
        {authError && <p className="status">{authError}</p>}
      </section>

      <section className="card">
        <h2>{t.modulesTitle}</h2>
        <ul>
          {lessons.map((lesson) => (
            <li key={lesson.key}>{language === 'en' ? lesson.en : lesson.zh}</li>
          ))}
        </ul>
      </section>

      <section className="card">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h2>{t.marketNewsTitle}</h2>
          <button type="button" onClick={() => void loadNews()} disabled={newsLoading}>
            {t.refreshNews}
          </button>
        </div>
        {newsLoading ? (
          <p>{t.loadingNews}</p>
        ) : (
          <ol>
            {news.map((item) => (
              <li key={`${item.source}-${item.link}`}>
                <a href={item.link} target="_blank" rel="noreferrer">
                  {item.title}
                </a>{' '}
                ({item.source}) {item.published ?? ''}
              </li>
            ))}
          </ol>
        )}
      </section>
    </main>
  );
}
