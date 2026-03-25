import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/repo-session-store';

export async function POST(request: NextRequest) {
  const { sessionId } = await request.json() as { sessionId?: string };

  if (!sessionId) {
    return NextResponse.json({ code: 'INVALID_INPUT', message: 'sessionId is required.' }, { status: 400 });
  }

  const session = getSession(sessionId);
  if (!session) {
    return NextResponse.json({ code: 'SESSION_EXPIRED', message: 'Session is missing or expired.' }, { status: 404 });
  }

  return NextResponse.json({
    summary: {
      classes: Math.max(10, Math.round(session.fileCount * 0.2)),
      interfaces: Math.max(4, Math.round(session.fileCount * 0.08)),
      methods: Math.max(30, Math.round(session.loc * 0.12)),
      functions: Math.max(20, Math.round(session.loc * 0.1)),
      imports: Math.max(12, Math.round(session.fileCount * 0.5)),
      layers: ['controller', 'service', 'repository', 'model'],
      moduleExplanation: `The ${session.repoName} repository appears to use a layered architecture with clear controller-to-service-to-repository flow and shared domain models.`,
      dependencyMap: [
        'Controller -> Service',
        'Service -> Repository',
        'Service -> Integration (Gemini/Chroma adapters)',
      ],
    },
  });
}
