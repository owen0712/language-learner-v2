import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/repo-session-store';

export async function POST(request: NextRequest) {
  const { sessionId, scope } = await request.json() as { sessionId?: string; scope?: string };

  if (!sessionId) {
    return NextResponse.json({ code: 'INVALID_INPUT', message: 'sessionId is required.' }, { status: 400 });
  }

  const session = getSession(sessionId);
  if (!session) {
    return NextResponse.json({ code: 'SESSION_EXPIRED', message: 'Session is missing or expired.' }, { status: 404 });
  }

  const markdown = [
    `# ${session.repoName} README`,
    '',
    '## Overview',
    `${session.repoName} is analyzed as an AI Repo Assistant compatible codebase focused on upload, parsing, documentation, testing, and chat flows.`,
    '',
    '## Prerequisites',
    '- Node.js 20+',
    '- npm 10+',
    '',
    '## Setup',
    '1. Install dependencies with `npm install`.',
    '2. Run locally with `npm run dev`.',
    '',
    '## Architecture',
    '- API layer: Next.js route handlers',
    '- Session state: in-memory Map with TTL',
    '- Core features: ingestion, understanding, docs, tests, chat, CSV export',
    '',
    `## Scope`,
    `Requested scope: ${scope ?? 'full repository'}.`,
  ].join('\n');

  return NextResponse.json({ markdown, generatedAt: new Date().toISOString() });
}
