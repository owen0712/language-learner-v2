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
    `# ${session.repoName} - Business Documentation`,
    '',
    '## Executive Summary',
    `${session.repoName} supports a business-friendly workflow to upload a repository, understand its structure, generate documentation, create test scenarios, and ask grounded product questions.`,
    '',
    '## Business Objectives',
    '- Reduce onboarding time for product, QA, and operations stakeholders.',
    '- Improve decision quality with evidence-backed answers from the codebase.',
    '- Standardize delivery artifacts such as summaries, test cases, and downloadable outputs.',
    '',
    '## Primary User Journey',
    '1. Upload a repository ZIP package.',
    '2. Review automated repository understanding outputs.',
    '3. Generate documentation tailored to business and delivery discussions.',
    '4. Generate user-friendly test scenarios for validation planning.',
    '5. Ask follow-up questions with citations to support alignment.',
    '',
    '## Key Business Capabilities',
    '- **Repository Intake:** Accepts repository uploads within configured limits.',
    '- **Automated Understanding:** Produces parse summaries and system context quickly.',
    '- **Documentation Generation:** Creates reusable markdown documentation.',
    '- **Test Scenario Support:** Provides positive, negative, and edge-case scenarios.',
    '- **Evidence-Based Q&A:** Returns grounded answers with references.',
    '',
    '## Success Criteria (Business-Facing)',
    '- Teams can understand repository purpose and workflow within one session.',
    '- Stakeholders can review generated docs without deep engineering context.',
    '- QA and product teams can derive acceptance coverage from generated test cases.',
    '- Users receive clear error messaging for invalid requests or expired sessions.',
    '',
    '## Operating Constraints',
    '- Session lifecycle is time-bound; expired sessions must be re-created.',
    '- Input limits are enforced to keep responses predictable in MVP scope.',
    '',
    '## Scope of This Document',
    `Requested scope: ${scope ?? 'full repository'}.`,
    '',
    '## Technical Appendix',
    '- Runtime stack: Next.js route handlers.',
    '- Session state: in-memory Map with TTL.',
    '- Main flows: upload, understand, docs, tests, chat, and CSV export.',
  ].join('\n');

  return NextResponse.json({ markdown, generatedAt: new Date().toISOString() });
}
