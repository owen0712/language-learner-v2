import { RepoSession, TestCase } from '@/lib/repo-assistant-types';

const SESSION_TTL_MS = 30 * 60 * 1000;
const sessions = new Map<string, RepoSession>();

function nowIso() {
  return new Date().toISOString();
}

function generateSessionId() {
  return crypto.randomUUID();
}

function cleanExpired() {
  const now = Date.now();
  for (const [id, session] of sessions.entries()) {
    if (now - new Date(session.uploadedAt).getTime() > SESSION_TTL_MS) {
      sessions.delete(id);
    }
  }
}

export function createSession(input: {
  repoName: string;
  fileCount: number;
  loc: number;
  skippedFiles: Array<{ path: string; reason: string }>;
}) {
  cleanExpired();
  const session: RepoSession = {
    sessionId: generateSessionId(),
    repoName: input.repoName,
    uploadedAt: nowIso(),
    fileCount: input.fileCount,
    loc: input.loc,
    skippedFiles: input.skippedFiles,
    indexed: true,
    chatHistory: [],
    generatedTests: [],
  };
  sessions.set(session.sessionId, session);
  return session;
}

export function getSession(sessionId: string) {
  cleanExpired();
  return sessions.get(sessionId) ?? null;
}

export function appendChat(sessionId: string, role: 'user' | 'assistant', message: string) {
  const session = getSession(sessionId);
  if (!session) return null;
  session.chatHistory.push({ role, message });
  if (session.chatHistory.length > 20) {
    session.chatHistory.splice(0, session.chatHistory.length - 20);
  }
  sessions.set(sessionId, session);
  return session;
}

export function saveTests(sessionId: string, tests: TestCase[]) {
  const session = getSession(sessionId);
  if (!session) return null;
  session.generatedTests = tests;
  sessions.set(sessionId, session);
  return session;
}
