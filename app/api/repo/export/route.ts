import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/repo-session-store';

function csvEscape(value: string) {
  const escaped = value.replaceAll('"', '""');
  return `"${escaped}"`;
}

export async function POST(request: NextRequest) {
  const { sessionId } = await request.json() as { sessionId?: string };

  if (!sessionId) {
    return NextResponse.json({ code: 'INVALID_INPUT', message: 'sessionId is required.' }, { status: 400 });
  }

  const session = getSession(sessionId);
  if (!session) {
    return NextResponse.json({ code: 'SESSION_EXPIRED', message: 'Session is missing or expired.' }, { status: 404 });
  }

  if (session.generatedTests.length === 0) {
    return NextResponse.json({ code: 'INVALID_INPUT', message: 'Generate test cases before exporting CSV.' }, { status: 400 });
  }

  const header = ['ID', 'Type', 'Title', 'Preconditions', 'Steps', 'ExpectedResult'];
  const rows = session.generatedTests.map((test) => [test.id, test.type, test.title, test.preconditions, test.steps, test.expectedResult]);

  const csv = ['\uFEFF' + header.join(','), ...rows.map((row) => row.map(csvEscape).join(','))].join('\n');
  const stamp = new Date().toISOString().replaceAll(':', '').replaceAll('-', '').slice(0, 15);

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="testcases_${session.repoName}_${stamp}.csv"`,
    },
  });
}
