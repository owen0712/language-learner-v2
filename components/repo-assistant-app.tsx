'use client';

import { useState } from 'react';
import { ParseSummary, TestCase } from '@/lib/repo-assistant-types';

type UnderstandSummary = {
  classes: number;
  interfaces: number;
  methods: number;
  functions: number;
  imports: number;
  layers: string[];
  moduleExplanation: string;
  dependencyMap: string[];
};

export function RepoAssistantApp() {
  const [repoName, setRepoName] = useState('sample-fintech-repo');
  const [sizeMb, setSizeMb] = useState(12);
  const [fileCount, setFileCount] = useState(120);
  const [loc, setLoc] = useState(16000);
  const [sessionId, setSessionId] = useState('');
  const [status, setStatus] = useState('Ready to ingest a repository.');
  const [parseSummary, setParseSummary] = useState<ParseSummary | null>(null);
  const [understand, setUnderstand] = useState<UnderstandSummary | null>(null);
  const [markdown, setMarkdown] = useState('');
  const [testInput, setTestInput] = useState('Generate tests for ingestion, docs, and chat flow.');
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [question, setQuestion] = useState('Explain the architecture and API flow.');
  const [chatAnswer, setChatAnswer] = useState('');

  async function ingest() {
    setStatus('Uploading and parsing repository...');
    const response = await fetch('/api/repo/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repoName, sizeMb, fileCount, loc }),
    });
    const data = await response.json();
    if (!response.ok) {
      setStatus(`${data.code}: ${data.message}`);
      return;
    }

    setSessionId(data.sessionId);
    setParseSummary(data.parseSummary);
    setStatus(`Session ${data.sessionId} created.`);
  }

  async function runUnderstand() {
    if (!sessionId) return;
    setStatus('Extracting code understanding summary...');
    const response = await fetch('/api/repo/understand', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    });
    const data = await response.json();
    if (!response.ok) {
      setStatus(`${data.code}: ${data.message}`);
      return;
    }
    setUnderstand(data.summary);
    setStatus('Code understanding summary generated.');
  }

  async function generateDocs() {
    if (!sessionId) return;
    setStatus('Generating markdown documentation...');
    const response = await fetch('/api/repo/docs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, scope: 'full repository' }),
    });
    const data = await response.json();
    if (!response.ok) {
      setStatus(`${data.code}: ${data.message}`);
      return;
    }
    setMarkdown(data.markdown);
    setStatus('Documentation generated.');
  }

  async function generateTests() {
    if (!sessionId) return;
    setStatus('Generating test cases...');
    const response = await fetch('/api/repo/tests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, input: testInput }),
    });
    const data = await response.json();
    if (!response.ok) {
      setStatus(`${data.code}: ${data.message}`);
      return;
    }
    setTestCases(data.cases);
    setStatus('Test cases generated.');
  }

  async function askChat() {
    if (!sessionId) return;
    setStatus('Querying repository chat...');
    const response = await fetch('/api/repo/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, question }),
    });
    const data = await response.json();
    if (!response.ok) {
      setStatus(`${data.code}: ${data.message}`);
      return;
    }
    const citations = (data.citations ?? []).map((c: { file: string; lineStart: number; lineEnd: number }) => `${c.file}:${c.lineStart}-${c.lineEnd}`).join(', ');
    setChatAnswer(`${data.answer}${citations ? `\n\nCitations: ${citations}` : ''}`);
    setStatus('Chat response received.');
  }

  async function exportCsv() {
    if (!sessionId) return;
    setStatus('Exporting CSV...');
    const response = await fetch('/api/repo/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    });
    if (!response.ok) {
      const data = await response.json();
      setStatus(`${data.code}: ${data.message}`);
      return;
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `testcases_${repoName}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    setStatus('CSV exported.');
  }

  return (
    <main className="shell">
      <h1>AI Repo Assistant MVP</h1>
      <p className="sub">Rebuilt from PRD/SRS constraints: ingestion, understanding, docs, tests, chat, and CSV export.</p>

      <section className="card grid4">
        <label>Repo Name<input value={repoName} onChange={(e) => setRepoName(e.target.value)} /></label>
        <label>Size (MB)<input type="number" value={sizeMb} onChange={(e) => setSizeMb(Number(e.target.value))} /></label>
        <label>File Count<input type="number" value={fileCount} onChange={(e) => setFileCount(Number(e.target.value))} /></label>
        <label>LOC<input type="number" value={loc} onChange={(e) => setLoc(Number(e.target.value))} /></label>
      </section>

      <section className="row">
        <button onClick={ingest}>1) Ingest</button>
        <button onClick={runUnderstand} disabled={!sessionId}>2) Understand</button>
        <button onClick={generateDocs} disabled={!sessionId}>3) Generate Docs</button>
        <button onClick={generateTests} disabled={!sessionId}>4) Generate Tests</button>
        <button onClick={askChat} disabled={!sessionId}>5) Ask Chat</button>
        <button onClick={exportCsv} disabled={!sessionId}>6) Export CSV</button>
      </section>

      <p className="status">{status}</p>
      <p className="session">Session: <code>{sessionId || 'not created'}</code></p>

      <section className="card">
        <h2>Parse Summary</h2>
        <pre>{parseSummary ? JSON.stringify(parseSummary, null, 2) : 'Run ingestion to view summary.'}</pre>
      </section>

      <section className="card">
        <h2>Code Understanding</h2>
        <pre>{understand ? JSON.stringify(understand, null, 2) : 'Run understanding after ingestion.'}</pre>
      </section>

      <section className="card">
        <h2>Documentation Markdown</h2>
        <pre>{markdown || 'Generate documentation to preview markdown output.'}</pre>
      </section>

      <section className="card">
        <h2>Test Generation</h2>
        <textarea value={testInput} onChange={(e) => setTestInput(e.target.value)} rows={3} />
        <pre>{testCases.length > 0 ? JSON.stringify(testCases, null, 2) : 'No test cases yet.'}</pre>
      </section>

      <section className="card">
        <h2>Chat with Repository</h2>
        <textarea value={question} onChange={(e) => setQuestion(e.target.value)} rows={2} />
        <pre>{chatAnswer || 'No chat response yet.'}</pre>
      </section>
    </main>
  );
}
