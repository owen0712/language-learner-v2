export type RepoSession = {
  sessionId: string;
  repoName: string;
  uploadedAt: string;
  fileCount: number;
  loc: number;
  skippedFiles: Array<{ path: string; reason: string }>;
  indexed: boolean;
  chatHistory: Array<{ role: 'user' | 'assistant'; message: string }>;
  generatedTests: TestCase[];
};

export type ParseSummary = {
  sessionId: string;
  repoName: string;
  fileCount: number;
  loc: number;
  skippedFiles: Array<{ path: string; reason: string }>;
  limits: {
    maxSizeMb: number;
    maxFiles: number;
    maxLoc: number;
  };
};

export type TestCase = {
  id: string;
  type: 'positive' | 'negative' | 'edge';
  title: string;
  preconditions: string;
  steps: string;
  expectedResult: string;
};
