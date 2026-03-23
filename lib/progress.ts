'use client';

import { doc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { ProgressRecord } from './types';

const STORAGE_KEY = 'polyglot-path-progress';

export async function persistProgress(record: ProgressRecord) {
  const all = getStoredProgress();
  const next = {
    ...all,
    [`${record.language}-${record.level}`]: record,
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));

  if (db) {
    await setDoc(doc(db, 'progress', `${record.language}-${record.level}`), record, { merge: true });
  }
}

export function getStoredProgress(): Record<string, ProgressRecord> {
  if (typeof window === 'undefined') return {};
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : {};
}
