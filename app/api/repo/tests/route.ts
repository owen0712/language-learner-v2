import { NextRequest, NextResponse } from 'next/server';
import { getSession, saveTests } from '@/lib/repo-session-store';
import { TestCase } from '@/lib/repo-assistant-types';

export async function POST(request: NextRequest) {
  const { sessionId, input } = await request.json() as { sessionId?: string; input?: string };

  if (!sessionId || !input) {
    return NextResponse.json({ code: 'INVALID_INPUT', message: 'sessionId and input are required.' }, { status: 400 });
  }

  if (input.length > 2000) {
    return NextResponse.json({ code: 'INPUT_TOO_LONG', message: 'Input exceeds 2000 character MVP limit.' }, { status: 400 });
  }

  const session = getSession(sessionId);
  if (!session) {
    return NextResponse.json({ code: 'SESSION_EXPIRED', message: 'Session is missing or expired.' }, { status: 404 });
  }

  const cases: TestCase[] = [
    { id: 'P-1', type: 'positive', title: 'Upload valid repo', preconditions: 'ZIP <=50MB', steps: 'Upload repository', expectedResult: 'sessionId and parse summary are returned' },
    { id: 'P-2', type: 'positive', title: 'Generate docs', preconditions: 'Session exists', steps: 'Call /repo/docs', expectedResult: 'Markdown doc is returned with metadata' },
    { id: 'P-3', type: 'positive', title: 'Ask grounded question', preconditions: 'Session indexed', steps: 'Send chat prompt', expectedResult: 'Answer with citations is returned' },
    { id: 'N-1', type: 'negative', title: 'Reject oversized input', preconditions: 'Input > 2000 chars', steps: 'Call /repo/tests', expectedResult: 'INPUT_TOO_LONG returned' },
    { id: 'N-2', type: 'negative', title: 'Expired session', preconditions: 'Session removed', steps: 'Call any endpoint', expectedResult: 'SESSION_EXPIRED returned' },
    { id: 'N-3', type: 'negative', title: 'Missing sessionId', preconditions: 'No sessionId in payload', steps: 'Call /repo/understand', expectedResult: 'INVALID_INPUT returned' },
    { id: 'E-1', type: 'edge', title: 'Exactly 50MB upload', preconditions: 'Archive size == 50MB', steps: 'Upload repository', expectedResult: 'Accepted and parsed' },
    { id: 'E-2', type: 'edge', title: 'Exactly 500 files', preconditions: 'fileCount == 500', steps: 'Upload repository', expectedResult: 'Accepted with possible skipped list' },
  ];

  saveTests(sessionId, cases);
  return NextResponse.json({ cases, generatedAt: new Date().toISOString() });
}
