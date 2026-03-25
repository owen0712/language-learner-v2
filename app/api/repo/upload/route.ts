import { NextRequest, NextResponse } from 'next/server';
import { createSession } from '@/lib/repo-session-store';

const LIMITS = {
  maxSizeMb: 50,
  maxFiles: 500,
  maxLoc: 50000,
};

export async function POST(request: NextRequest) {
  const payload = await request.json() as {
    repoName?: string;
    sizeMb?: number;
    fileCount?: number;
    loc?: number;
  };

  const repoName = payload.repoName?.trim();
  const sizeMb = payload.sizeMb ?? 0;
  const fileCount = payload.fileCount ?? 0;
  const loc = payload.loc ?? 0;

  if (!repoName) {
    return NextResponse.json({ code: 'INVALID_INPUT', message: 'Repository name is required.' }, { status: 400 });
  }
  if (sizeMb > LIMITS.maxSizeMb) {
    return NextResponse.json({ code: 'REPO_TOO_LARGE', message: 'Repository exceeds 50MB limit.' }, { status: 400 });
  }
  if (fileCount > LIMITS.maxFiles) {
    return NextResponse.json({ code: 'TOO_MANY_FILES', message: 'Repository exceeds 500 file limit for MVP.' }, { status: 400 });
  }

  const skippedFiles = [
    { path: 'README.md', reason: 'Unsupported extension for AST extraction.' },
    { path: 'assets/logo.svg', reason: 'Binary or non-target file type.' },
  ];

  const session = createSession({ repoName, fileCount, loc, skippedFiles });

  return NextResponse.json({
    sessionId: session.sessionId,
    parseSummary: {
      sessionId: session.sessionId,
      repoName,
      fileCount,
      loc,
      skippedFiles,
      limits: LIMITS,
    },
  });
}
