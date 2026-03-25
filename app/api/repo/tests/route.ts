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
    {
      id: 'P-1',
      type: 'positive',
      title: 'Business user uploads a standard repository successfully',
      preconditions: 'Given a ZIP repository package is available and its size is 50MB or less.',
      steps: 'When the user uploads the repository through /repo/upload and continues to /repo/understand.',
      expectedResult: 'Then the user receives a sessionId and a readable parse summary to confirm onboarding is complete.',
    },
    {
      id: 'P-2',
      type: 'positive',
      title: 'Business user generates project documentation for stakeholders',
      preconditions: 'Given an active analysis session already exists.',
      steps: 'When the user requests documentation from /repo/docs with a selected scope.',
      expectedResult: 'Then a markdown document is generated with business and technical sections plus generation metadata.',
    },
    {
      id: 'P-3',
      type: 'positive',
      title: 'Business user asks a product question and gets traceable answers',
      preconditions: 'Given repository indexing is completed for the session.',
      steps: 'When the user sends a question to /repo/chat about features, behavior, or risk.',
      expectedResult: 'Then the assistant returns a grounded response with file citations for validation.',
    },
    {
      id: 'N-1',
      type: 'negative',
      title: 'System protects quality by rejecting very long test prompts',
      preconditions: 'Given the test input body is longer than 2000 characters.',
      steps: 'When the user submits the request to /repo/tests.',
      expectedResult: 'Then the request is rejected with INPUT_TOO_LONG and a clear corrective message.',
    },
    {
      id: 'N-2',
      type: 'negative',
      title: 'Session timeout is communicated clearly to business users',
      preconditions: 'Given the original session has expired or is no longer stored.',
      steps: 'When the user calls any protected repository endpoint.',
      expectedResult: 'Then the API returns SESSION_EXPIRED so the user can restart analysis safely.',
    },
    {
      id: 'N-3',
      type: 'negative',
      title: 'API enforces required identifiers for reliable workflows',
      preconditions: 'Given sessionId is missing in the request payload.',
      steps: 'When the user calls /repo/understand (or equivalent protected endpoint).',
      expectedResult: 'Then INVALID_INPUT is returned to guide the user toward a valid request.',
    },
    {
      id: 'E-1',
      type: 'edge',
      title: 'Boundary case: repository package is exactly 50MB',
      preconditions: 'Given the uploaded archive size is exactly at the 50MB product limit.',
      steps: 'When the user uploads the boundary-size repository.',
      expectedResult: 'Then upload is accepted and parsing proceeds without unexpected blocking.',
    },
    {
      id: 'E-2',
      type: 'edge',
      title: 'Boundary case: repository contains exactly 500 files',
      preconditions: 'Given the repository contains exactly 500 processable files.',
      steps: 'When the user uploads and analyzes the repository.',
      expectedResult: 'Then processing succeeds and any skipped files are reported transparently if applicable.',
    },
  ];

  saveTests(sessionId, cases);
  return NextResponse.json({ cases, generatedAt: new Date().toISOString() });
}
