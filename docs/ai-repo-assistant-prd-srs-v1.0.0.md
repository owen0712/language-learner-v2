## 0. Pre-flight Analysis

### 1) Most critical technical risk
The single most critical technical risk is context overload across AST + source snippets + retrieval chunks that causes Gemini responses to become slow, malformed, or truncated during the 15-minute first-value window. [DEV] If context packing fails, every core feature (docs, tests, chat) degrades at once, making the MVP appear unreliable even if parsing works. [PM] Mitigation is strict input budgeting: cap files/LOC, chunk deterministically, and provide partial outputs with explicit notices instead of waiting for perfect full-repo generation.

### 2) Most likely scope creep feature
The most likely scope creep driver is “Chat with Repository,” because users will immediately ask for agentic actions, cross-repo memory, and IDE-level interactivity that exceed MVP boundaries. [PM] Guardrail: keep FEAT-05 at **P1**, limit to top-5 retrieval, 10-turn memory, citation-only answers, and reject implementation requests that require code execution. [DEV] Enforce this via hard API contracts and explicit `INSUFFICIENT_CONTEXT` behavior instead of trying to satisfy every query.

### 3) Hardest implementation challenge
From full-stack delivery perspective, the hardest challenge is deterministic, language-aware ingestion and indexing that stays fast under 50MB/500-file limits while preserving line-level traceability for citations. [DEV] We must coordinate ZIP parsing, AST extraction, chunking, embedding, and session lifecycle without persistence, which amplifies memory and concurrency complexity. [PM] The resolution is milestone sequencing: upload/parse stability first, generation second, then RAG last.

### 4) What QA would say is missing
QA would say the spec usually misses explicit failure-state observability: reproducible test datasets, synthetic corrupted archives, and deterministic expected outputs for AI-driven features. [QA perspective] They need concrete acceptance fixtures (known Java/TS repos with golden outputs) and pass/fail rules for partial responses. [PM+DEV] This document includes an error matrix, retry policy, and validation gates to turn “AI quality” into testable assertions.

### 5) One thing new developers need most
A new developer needs an end-to-end system map that ties UI action → API endpoint → service class → integration call → response envelope, with concrete schemas and examples. [DEV] Without that, onboarding time increases and team members implement inconsistent contracts. [PM] This document must remain the single source of truth with versioned prompts, API examples, folder structure, and sprint mapping.

## 1. Document Control

| Field | Value |
|---|---|
| Product | AI Repo Assistant |
| Version | v1.0.0 |
| Status | Draft — Pending Stakeholder Review |
| Last Updated | 2026-03-24 |
| Document Type | Combined PRD + SRS (Living, Version-Controlled) |
| Timeline | 12 weeks |
| Authors | [PM] Senior Product Manager, [DEV] Senior Full Stack Developer |
| Reviewers | Tech Lead, QA Lead, Security Reviewer, Executive Sponsor |
| Approval Required | PM + Tech Lead + QA Lead + Stakeholder Sponsor |
| North Star Metric | Time-to-first-value ≤ 15 minutes |

### Approval Log
| Date | Approver | Role | Decision | Notes |
|---|---|---|---|---|
| 2026-03-24 | Pending | PM | Pending | Initial draft issued |
| 2026-03-24 | Pending | Tech Lead | Pending | Architecture review required |
| 2026-03-24 | Pending | QA Lead | Pending | Testability review required |
| 2026-03-24 | Pending | Stakeholder Sponsor | Pending | Budget/timeline sign-off required |

## 2. Executive Summary

### 2a. For Stakeholders (non-technical)
Teams lose hours whenever developers inherit unfamiliar repositories and must manually reverse-engineer architecture, API behavior, and test coverage. AI Repo Assistant solves this by turning an uploaded codebase into usable documentation, structured test cases, and grounded Q&A in one workflow. Target users are developers, tech leads, and QA leads in Java/TypeScript teams who need fast onboarding and release confidence. Business value is faster onboarding, reduced documentation debt, and fewer defects from misunderstood code. MVP delivery is planned in 12 weeks with clear milestones every two weeks. **Ask:** approve MVP scope, enforce change-control discipline, and align launch success on measurable outcomes: first value in under 15 minutes and >70% session completion.

### 2b. For Engineering Team (technical)
✅ Architecture is a strict Angular 17 SPA + Spring Boot 3.2 REST backend + Gemini API + ChromaDB + in-memory session store (`ConcurrentHashMap`). AST extraction uses JavaParser and ts-morph; RAG indexing runs asynchronously post-upload with progress polling. MVP boundaries are hard-capped by 50MB ZIP, 500 files, 50k LOC, 30-minute session TTL, and 10-turn chat memory. ❌ We are not building authentication, persistent database history, Git provider integration, visual graph rendering, or multi-user collaboration in MVP. Critical dependencies are Gemini availability/latency, ChromaDB health, deterministic chunking, and line-level source mapping for citation fidelity. [DEV] All responses use a standardized envelope with request/session metadata. [PM] Prioritize FEAT-01/03/04/06 for launch value; FEAT-05 remains P1 with minimal conversational scope.

## 3. Success Metrics & KPIs

### Product Metrics
| Metric | Baseline | Target | Measurement Method | Owner | Review Cadence |
|---|---:|---:|---|---|---|
| Time-to-first-value | 0 min (no product) | ≤ 15 min | Event timestamps: upload start to first generated artifact download/preview | PM | Weekly sprint review |
| % sessions producing doc or test output | 0% | > 70% | `sessions_completed / sessions_started` from backend event logs | PM | Weekly |
| Output satisfaction score | 0/5 | > 3.5/5 | In-app feedback widget after generation (1–5 rating) | PM | Weekly + monthly trend |
| 7-day second-upload retention | 0% | > 30% | Track anonymized browser/session key with repeat upload event in 7 days | PM | Monthly |

### Technical Metrics
| Metric | Baseline | Target | Measurement Method | Owner | Review Cadence |
|---|---:|---:|---|---|---|
| API endpoint p95 latency | N/A | Per NFR targets | Spring Boot Actuator + Micrometer histograms by endpoint | Dev | Weekly |
| AI call success rate (after retries) | 0% | > 95% | Count successful terminal responses / total AI requests incl. retry attempts | Dev | Weekly |
| Session memory usage | N/A | < 512MB active session | JVM memory meter by session object weight + chunk counts | Dev | Weekly |
| Service-layer unit coverage | 0% | > 80% | JaCoCo gate in CI for `service` package | Dev + QA | Per PR |

### Sprint Metrics
| Metric | Baseline | Target | Measurement Method | Owner | Review Cadence |
|---|---:|---:|---|---|---|
| Completion rate vs commitment | 0% | > 85% | Story points done / committed in sprint board | PM | End of sprint |
| Bug escape rate to QA | N/A | < 10% stories | Count stories failing QA after Dev “done” | QA | End of sprint |
| Blocked story ratio | N/A | < 15% capacity | Blocked points / sprint points | PM + Dev | End of sprint |

## 4. User Personas

### Persona 1: Marcus — Senior Backend Developer at 60-person fintech startup
1) **Demographics**: 9 years experience; expert in Java/Spring, moderate TS; daily IntelliJ, GitHub Actions, Datadog.  
2) **Goals**: (a) Cut repo onboarding from 2 days to 2 hours; (b) produce architecture docs in <20 min before design review; (c) answer “where is this logic?” questions in <5 min.  
3) **Pain points**: spends ~2 hours/sprint writing stale docs; production incidents trace back to undocumented module coupling; code review delays because ownership is unclear across services.  
4) **Quote**: “I can fix bugs fast, but explaining this codebase is what burns my week.”  
5) **Usage**: Primary FEAT-02 understanding; secondary FEAT-03 README/API docs; never uses FEAT-04 NL input because he prefers code-driven context.  
6) **Success**: He can produce a credible architecture summary and module call paths before standup.  
7) **Frustration threshold**: abandons if full-doc generation exceeds 30 seconds twice.

### Persona 2: Priya — QA Lead at enterprise insurance team (manages 3 junior QAs)
1) **Demographics**: 11 years experience; strong test design, moderate Java, low TS depth; daily Jira, TestRail, Postman, Jenkins.  
2) **Goals**: (a) Produce regression-ready test cases from requirements in <15 min; (b) reduce escaped defects by 20%; (c) standardize test-case format for juniors.  
3) **Pain points**: requirements are ambiguous and dev notes are sparse; manual test-case formatting steals 5–6 hours/week; late API changes invalidate prepared suites.  
4) **Quote**: “I don’t need more ideas—I need consistent, executable test cases now.”  
5) **Usage**: Primary FEAT-04 + FEAT-06 export; secondary FEAT-05 for endpoint clarifications; never uses deep architecture view due time pressure.  
6) **Success**: Receives CSV-ready cases with clear expected results and priorities.  
7) **Frustration threshold**: abandons if AI output is unstructured or missing negative cases.

### Persona 3: David — Tech Lead at B2B SaaS, onboards 2 new devs/quarter
1) **Demographics**: 12 years experience; full-stack Java/Angular; daily VS Code + IntelliJ, GitHub, ArgoCD.  
2) **Goals**: (a) reduce onboarding overhead from 6 hours/new hire to 2; (b) generate module docs for architecture reviews; (c) answer team dependency questions with sources.  
3) **Pain points**: onboarding docs are fragmented across Confluence and READMEs; repeated “where does auth flow start?” questions interrupt deep work; architectural drift is hard to communicate.  
4) **Quote**: “If I explain the same subsystem three times, our documentation failed.”  
5) **Usage**: Primary FEAT-03 scoped docs; secondary FEAT-05 cited chat; never uses free-form test generation for release gates.  
6) **Success**: New hires ship first small PR in first week with fewer handholding sessions.  
7) **Frustration threshold**: abandons if citations are absent or unverifiable.

### Persona 4: Aisha — Junior Developer, 3 months into legacy Java project
1) **Demographics**: 1 year total experience; basic Java/Spring, beginner TS; daily IntelliJ, Git, Slack.  
2) **Goals**: (a) understand request flow for one feature in <30 min; (b) generate understandable docs for personal learning; (c) ask chat questions without fear of “obvious” mistakes.  
3) **Pain points**: legacy packages have cryptic naming; class dependencies span dozens of files; onboarding materials assume senior-level context.  
4) **Quote**: “I can read the code, but I can’t see the story.”  
5) **Usage**: Primary FEAT-05 guided chat; secondary FEAT-02 module explanation; never uses commit-diff test mode because she rarely authors architectural changes.  
6) **Success**: Can explain one module’s responsibilities and entry points to mentor confidently.  
7) **Frustration threshold**: abandons if first answer says “unknown” without guidance.

## 5. Functional Requirements

### FEAT-01 — Repository Ingestion
- **ID**: FEAT-01  
- **Priority**: **P0**  
- **MVP Sprint**: Sprint 1  
- **Story Points**: 13  
- **Feature Owner**: [PM] Product Manager + [DEV] Full Stack Lead

#### User Stories
| Story ID | User Story | Points | Priority |
|---|---|---:|---|
| US-01-1 | As Marcus, I want drag-and-drop ZIP upload so that I can start analysis in one action. | 5 | Must Have |
| US-01-2 | As David, I want file-path input for local server paths so that demos are faster in dev environments. | 3 | Should Have |
| US-01-3 | As Aisha, I want parse summary with skipped reasons so that I know what was analyzed. | 3 | Must Have |
| US-01-4 | As Priya, I want clear session expiration messaging so that I do not lose work unexpectedly. | 2 | Must Have |

#### Acceptance Criteria
1. Given a ZIP ≤ 50MB containing at least one supported source file, when upload is submitted, then API returns `201` with UUIDv4 `sessionId` and parse summary within 10 seconds.  
2. Given ZIP > 50MB, when upload is submitted, then API returns `413` `REPO_TOO_LARGE` and frontend blocks indexing start.  
3. Given unsupported or oversized files, when parse completes, then summary includes `skippedFiles[]` with deterministic reason codes.  
4. Given no API activity for 30 minutes, when next request occurs, then API returns `410` `SESSION_EXPIRED` and frontend offers re-upload action.

#### Definition of Done
- [ ] Unit tests written and passing (coverage ≥ 80% on service layer)
- [ ] Integration tests passing
- [ ] API documentation updated
- [ ] QA sign-off on all acceptance criteria
- [ ] PM demo approved
- [ ] No P0/P1 bugs open
- [ ] Performance benchmark met: upload+parse p95 < 10s for 50MB fixture

#### Out of Scope
1. ❌ Git clone from remote URL (post-MVP integration scope).  
2. ❌ Persistent storage of uploaded ZIPs (security and infra complexity).  
3. ❌ Multi-repo batch ingestion (adds queueing/orchestration complexity).

#### Edge Cases & Error States
| Scenario | Expected Behavior | User Message |
|---|---|---|
| Password-protected ZIP | Reject upload before parse | “This archive is password-protected. Upload an unencrypted ZIP.” |
| Corrupt archive header | Abort parse, no session creation | “The ZIP file is corrupted. Recreate and upload again.” |
| ZIP bomb signature detected | Reject and log security event | “Upload blocked due to unsafe archive structure.” |
| Single source file >100KB | Skip file, continue parse | “1 large file skipped to keep analysis stable.” |

#### UI/UX Requirements
- States: empty, loading (progress bar + stage text), success (summary card), error (inline banner), partial (success with skipped list).  
- Loading: progress bar mandatory; update every 500ms polling interval.  
- Mobile responsive for MVP: **No** (desktop-first, min width 1024px).

#### [DEV NOTE] Implementation Hints
- Classes: `RepoUploadController`, `RepoIngestionService`, `ZipSafetyValidator`, `ProjectDetectorService`, `SessionStoreService`, `IndexingJobService`.  
- Libraries: `zip4j` (read), Apache Commons Compress (validation), JavaParser, ts-morph bridge process.  
- Risks: path traversal in ZIP entries; non-UTF8 filenames.

---

### FEAT-02 — Code Understanding Engine
- **ID**: FEAT-02 | **Priority**: **P0** | **Sprint**: 1–2 | **Points**: 13 | **Owner**: PM + Dev Lead

#### User Stories
| Story ID | User Story | Points | Priority |
|---|---|---:|---|
| US-02-1 | As Marcus, I want extracted classes/methods so I can inspect architecture quickly. | 5 | Must Have |
| US-02-2 | As David, I want layer detection (controller/service/repository) for onboarding material. | 3 | Must Have |
| US-02-3 | As Aisha, I want module explanation on selected package to avoid full-repo overload. | 3 | Must Have |
| US-02-4 | As Priya, I want dependency call text output to identify high-risk integration points. | 2 | Should Have |

#### Acceptance Criteria
1. Given successful ingestion, when understanding is requested, then API returns architecture overview with entry points and module map.  
2. Given Java/TS files with parsable AST, when extraction runs, then response contains non-empty `codeElements[]` and `dependencyEdges[]`.  
3. Given selected package path, when module-level explain is requested, then output includes only files under that path.  
4. Given parsing failure in subset files, when response is returned, then partial results include per-file parse errors without failing whole request.

#### Definition of Done
- [ ] Unit/integration/API docs/QA/PM/no open P0/P1 done
- [ ] Performance benchmark met: AST parse p95 < 8s on 50k LOC fixture

#### Out of Scope
1. ❌ Visual graph rendering (textual dependency only).  
2. ❌ Runtime call tracing/profiling.  
3. ❌ Multi-language support beyond Java/JS/TS.

#### Edge Cases & Error States
| Scenario | Expected Behavior | User Message |
|---|---|---|
| Generated/minified JS | Skip with `UNSUPPORTED_PATTERN` | “Generated/minified file skipped from structural analysis.” |
| Syntax errors in source | Continue partial extraction | “Some files had syntax errors; partial analysis is shown.” |
| Empty selected module | Return empty module explanation | “No analyzable files found in selected module.” |
| Session lacks parsed tree | Return `SESSION_UNDERSTANDING_REQUIRED` | “Upload and parse repository before requesting understanding.” |

#### UI/UX
- Success split-pane: module tree + explanation panel.  
- Loading uses skeleton cards for overview and list placeholders.  
- Mobile responsive: No (MVP).

#### [DEV NOTE]
- Services: `AstExtractionService`, `LayerClassificationService`, `DependencyGraphService`, `ModuleExplainService`.  
- Risk: cross-language dependency resolution between TS imports and Java package graph kept separate for MVP.

---

### FEAT-03 — Documentation Generator
- **ID**: FEAT-03 | **Priority**: **P0** | **Sprint**: 2 | **Points**: 13 | **Owner**: PM + Dev Lead

#### User Stories
| Story ID | User Story | Points | Priority |
|---|---|---:|---|
| US-03-1 | As David, I want README generation with setup steps so onboarding is faster. | 5 | Must Have |
| US-03-2 | As Marcus, I want API endpoint doc inference so I can review contract coverage. | 3 | Must Have |
| US-03-3 | As Aisha, I want class-level docs in Javadoc/JSDoc style for learning. | 3 | Should Have |
| US-03-4 | As Priya, I want regenerate with new scope to compare outputs quickly. | 2 | Must Have |

#### Acceptance Criteria
1. Given scope `full_repo`, when generate is requested, then Markdown preview includes overview, prerequisites, setup, architecture, module index, and API summary sections.  
2. Given scope `package` or `file`, when generate is requested, then output excludes files outside selected scope.  
3. Given regenerate clicked with same inputs, when call completes, then a new document version is returned with unique `documentId`.  
4. Given markdown produced, when download clicked, then raw `.md` file is downloaded with UTF-8 encoding.

#### Definition of Done
- [ ] Full checklist met
- [ ] Performance: single file <3s p95; full repo <10s p95

#### Out of Scope
1. ❌ Editable WYSIWYG document editor.  
2. ❌ Multi-format export (PDF/DOCX).  
3. ❌ Human approval workflow for docs.

#### Edge Cases
| Scenario | Expected Behavior | User Message |
|---|---|---|
| AI returns malformed markdown | Retry once with stricter prompt | “Generation retried due to formatting issue.” |
| No endpoints found | Include explicit “No REST endpoints detected” section | “API section generated with zero detected endpoints.” |
| Scope points to deleted path | Return `INVALID_INPUT` | “Selected scope no longer exists. Choose another module.” |
| AI timeout >30s | Return `AI_TIMEOUT` with retry CTA | “Generation timed out. Try again.” |

#### UI/UX
- Preview pane with tabs: Rendered | Raw Markdown.  
- Loading: skeleton markdown blocks + elapsed timer.  
- Partial state: document + warning banner for skipped files.  
- Mobile responsive: No.

#### [DEV NOTE]
- Services: `DocumentationService`, `PromptTemplateService`, `MarkdownValidationService`.  
- Use `commonmark-java` for render safety.

---

### FEAT-04 — Test Case Generator
- **ID**: FEAT-04 | **Priority**: **P0** | **Sprint**: 2–3 | **Points**: 13 | **Owner**: PM + Dev Lead

#### User Stories
| Story ID | User Story | Points | Priority |
|---|---|---:|---|
| US-04-1 | As Priya, I want requirement text input so I can generate tests from Jira descriptions. | 5 | Must Have |
| US-04-2 | As Marcus, I want diff input mode so generated tests reflect recent changes. | 3 | Must Have |
| US-04-3 | As David, I want strict CSV-compatible columns for downstream QA tools. | 3 | Must Have |
| US-04-4 | As Aisha, I want regenerate behavior to refine outcomes without re-uploading repo. | 2 | Should Have |

#### Acceptance Criteria
1. Given any valid input mode, when generate is requested, then output contains at least 8 cases: 3 positive, 3 negative, 2 edge.  
2. Given generated output, when preview table renders, then columns appear in exact required order with no omissions.  
3. Given invalid/empty text input, when submitted, then API returns `400 INVALID_INPUT` and generation is blocked.  
4. Given regenerate clicked, when request completes, then new test set replaces preview and preserves input mode.

#### Definition of Done
- [ ] Checklist complete
- [ ] Performance: test generation p95 < 5s

#### Out of Scope
1. ❌ Auto-link to Jira/TestRail APIs.  
2. ❌ Auto-generation of automation scripts (JUnit/Cypress).  
3. ❌ Multi-language natural language translation.

#### Edge Cases
| Scenario | Expected Behavior | User Message |
|---|---|---|
| Diff >5000 chars | Reject request | “Diff input exceeds 5000 characters. Shorten and retry.” |
| AI returns non-JSON | Retry once with JSON-only enforcement | “Reformatting AI output into valid test schema.” |
| Missing required case categories | Validation failure and retry | “Generated tests were incomplete; retrying for full coverage.” |
| Concurrent same-session generation | Reject duplicate in-flight | “A generation request is already in progress for this session.” |

#### UI/UX
- Input selector via radio buttons.  
- Loading: spinner + progress text (“Generating Positive/Negative/Edge”).  
- Success: sortable preview table + export button.  
- Mobile responsive: No.

#### [DEV NOTE]
- Classes: `TestGenerationController`, `TestCaseGenerationService`, `TestCaseSchemaValidator`, `CsvExportService`.  
- Validation with Jackson JSON schema checks.

---

### FEAT-05 — Chat with Repository (RAG)
- **ID**: FEAT-05 | **Priority**: P1 | **Sprint**: 3 | **Points**: 8 | **Owner**: PM + Dev Lead

#### User Stories
| Story ID | User Story | Points | Priority |
|---|---|---:|---|
| US-05-1 | As Aisha, I want to ask plain-language code questions with citations. | 3 | Should Have |
| US-05-2 | As David, I want explicit insufficient-context responses to avoid hallucinations. | 2 | Must Have |
| US-05-3 | As Marcus, I want chat disabled until indexing finishes to prevent empty answers. | 2 | Must Have |
| US-05-4 | As Priya, I want suggested starter questions to quickly explore APIs. | 1 | Nice to Have |

#### Acceptance Criteria
1. Given indexed repository, when question is asked, then system retrieves top-5 chunks and includes file path + line ranges in answer citations.  
2. Given retrieval confidence below threshold, when answer generation runs, then response is exactly `INSUFFICIENT_CONTEXT` envelope with guidance.  
3. Given >10 user-assistant turns, when turn 11 is added, then oldest turn is removed from context window.  
4. Given indexing not complete, when user opens chat, then UI displays progress state and disables send action.

#### Definition of Done
- [ ] Checklist complete
- [ ] Performance: chat p95 < 4s including retrieval

#### Out of Scope
1. ❌ Code modification/agentic actions.  
2. ❌ Multi-session long-term memory.  
3. ❌ Visual citation highlighting inside files.

#### Edge Cases
| Scenario | Expected Behavior | User Message |
|---|---|---|
| Chroma unavailable | Return `VECTOR_DB_UNAVAILABLE` | “Code search is temporarily unavailable. Try again shortly.” |
| Index not ready | Return `VECTOR_INDEX_NOT_READY` | “Indexing is still in progress. Please wait.” |
| Query too vague | Ask clarifying follow-up with examples | “Please mention module/class for a precise answer.” |
| No citation candidates | Return `INSUFFICIENT_CONTEXT` | “I cannot answer from indexed code with confidence yet.” |

#### UI/UX
- New-user suggested prompts (3 chips).  
- Loading: typing indicator + retrieval spinner.  
- Partial: answer plus low-confidence warning.  
- Mobile responsive: No.

#### [DEV NOTE]
- Services: `RagChatService`, `VectorRetrievalService`, `CitationAssembler`.  
- Risk: inaccurate line ranges if chunking mutates whitespace.

---

### FEAT-06 — CSV Export
- **ID**: FEAT-06 | **Priority**: **P0** | **Sprint**: 3 | **Points**: 5 | **Owner**: PM + Dev Lead

#### User Stories
| Story ID | User Story | Points | Priority |
|---|---|---:|---|
| US-06-1 | As Priya, I want one-click CSV download after generation. | 2 | Must Have |
| US-06-2 | As David, I want deterministic filename format for audit trails. | 1 | Must Have |
| US-06-3 | As Marcus, I want redownload within session to avoid re-generation. | 1 | Should Have |
| US-06-4 | As Aisha, I want file compatibility with Excel/Sheets/LibreOffice. | 1 | Must Have |

#### Acceptance Criteria
1. Given generated test cases, when download clicked, then API returns CSV with UTF-8 BOM and required column order.  
2. Given repo name `payments-service`, when exported, then filename matches `testcases_payments-service_yyyyMMdd_HHmmss.csv`.  
3. Given same session and previously generated output, when re-download requested, then API serves cached artifact without AI call.  
4. Given CSV opens in Excel/Sheets/LibreOffice fixtures, then cells render without encoding corruption.

#### Definition of Done
- [ ] Checklist complete
- [ ] Performance: CSV generation p95 < 1s

#### Out of Scope
1. ❌ XLSX native export.  
2. ❌ Custom column configuration.  
3. ❌ Bulk export across multiple sessions.

#### Edge Cases
| Scenario | Expected Behavior | User Message |
|---|---|---|
| No test cases in session | Return `SESSION_UNDERSTANDING_REQUIRED` | “Generate test cases before exporting CSV.” |
| Encoding conversion failure | Return `CSV_GENERATION_FAILED` | “CSV export failed. Please retry.” |
| Filename unsafe chars | Sanitize repo name | “Exported with sanitized filename for compatibility.” |
| Session expired | Return `SESSION_EXPIRED` | “Session expired. Re-run test generation.” |

#### UI/UX
- Button disabled until preview exists.  
- Loading: small inline spinner on button.  
- Success toast with filename.  
- Mobile responsive: No.

#### [DEV NOTE]
- `CsvExportService` using Apache Commons CSV with BOM prefix.

## 6. Non-Functional Requirements

### Performance
| ID | Requirement | Target Metric | Measurement Method | Failure Behavior | Priority | [DEV] Implementation Note |
|---|---|---|---|---|---|---|
| NFR-PERF-01 | ZIP upload processing | <10s for 50MB | p95 timer in ingestion service | Return timeout error and cancel parse | P0 | Stream unzip, bounded thread pool |
| NFR-PERF-02 | AST parse | <8s at 50k LOC | stage timing logs | Partial parse + warnings | P0 | Parallel parse per language |
| NFR-PERF-03 | Doc generation full repo | <10s | endpoint p95 | Return `AI_TIMEOUT` after retry | P0 | Prompt size budget + summarization |
| NFR-PERF-04 | Doc generation single file | <3s | endpoint p95 | Return timeout message | P1 | Precomputed AST snippets |
| NFR-PERF-05 | Test generation | <5s | endpoint p95 | Retry once then fail | P0 | strict JSON prompt |
| NFR-PERF-06 | RAG chat | <4s | retrieval+LLM timing | `INSUFFICIENT_CONTEXT` on low confidence | P1 | top-5 retrieval cap |
| NFR-PERF-07 | CSV export | <1s | download handler timer | return `CSV_GENERATION_FAILED` | P0 | in-memory cached rows |
| NFR-PERF-08 | FCP | <2s | Lighthouse CI | block release if >2.5s | P1 | code splitting |
| NFR-PERF-09 | Route navigation | <300ms | Web Vitals custom metric | degrade to spinner + lazy fallback | P1 | prefetch likely routes |

### Scalability
| ID | Requirement | Target Metric | Measurement Method | Failure Behavior | Priority | [DEV] Note |
|---|---|---|---|---|---|---|
| NFR-SCALE-01 | Concurrent sessions | ≥10 MVP / ≥50 post-MVP | load tests (k6) | throttle new sessions | P0 | semaphore gate |
| NFR-SCALE-02 | Repo size/session | 50MB max | upload validator | reject 413 | P0 | multipart limits |
| NFR-SCALE-03 | Max files/repo | 500 | parse counters | stop parse and warn | P0 | cap walker |
| NFR-SCALE-04 | Max LOC | 50,000 | line counter | partial process and warning | P1 | bounded tokenizer |
| NFR-SCALE-05 | Chunks/session | 10,000 | chunk stats | trim lowest-value chunks | P1 | heuristic pruning |
| NFR-SCALE-06 | Chat history | 10 turns | in-memory deque size | drop oldest turn | P0 | ring buffer |

### Reliability
| ID | Requirement | Target Metric | Measurement Method | Failure Behavior | Priority | [DEV] Note |
|---|---|---|---|---|---|---|
| NFR-REL-01 | Gemini retry policy | 2 retries, exp backoff (1s/2s) | integration logs | fail with retryable true | P0 | resilience4j |
| NFR-REL-02 | Partial success behavior | Preserve valid outputs | contract tests | return success+warnings | P0 | envelope warnings |
| NFR-REL-03 | Session cleanup | cleanup ≤2 min post-TTL | scheduler audit logs | force delete stale sessions | P0 | cron every 60s |
| NFR-REL-04 | Chroma fallback | graceful degradation | health checks | disable chat only | P1 | feature flag gating |
| NFR-REL-05 | Frontend recovery | no blank screen | e2e crash tests | show recovery panel | P0 | global error handler |
| NFR-REL-06 | Graceful shutdown | complete active requests ≤15s | shutdown hook logs | reject new reqs, finish in-flight | P1 | Spring lifecycle hooks |

### Security
| ID | Requirement | Target Metric | Measurement Method | Failure Behavior | Priority | [DEV] Note |
|---|---|---|---|---|---|---|
| NFR-SEC-01 | No source code logging | 0 source snippets in logs | log scanning tests | mask/drop payload logs | P0 | structured logging filters |
| NFR-SEC-02 | API key storage | env-only, never in code | secret scan | startup fail if missing | P0 | Spring config binding |
| NFR-SEC-03 | File type allowlist | zip/java/js/ts/md/txt only | upload tests | reject unsupported | P0 | mime + extension check |
| NFR-SEC-04 | Max request size | enforced server/client | integration tests | 413 | P0 | Tomcat multipart config |
| NFR-SEC-05 | Session isolation | cross-session read = 0 | security tests | 403/404 | P0 | session-scoped map key |
| NFR-SEC-06 | CORS restriction | prod origin allowlist | penetration tests | block preflight | P0 | env-driven CORS |
| NFR-SEC-07 | ZIP bomb protection | detect depth/ratio thresholds | malicious archive tests | reject and alert | P0 | decompression ratio guard |
| NFR-SEC-08 | Path traversal prevention | no `../` extraction | static+dynamic tests | reject archive | P0 | canonical path checks |

### Usability
| ID | Requirement | Target Metric | Measurement Method | Failure Behavior | Priority | [DEV] Note |
|---|---|---|---|---|---|---|
| NFR-UX-01 | Human-readable errors | 100% no stack traces | UI tests | show mapped message | P0 | error-code dictionary |
| NFR-UX-02 | Progress feedback | visible ≤300ms | UX telemetry | auto-show spinner/progress | P0 | interceptor timers |
| NFR-UX-03 | Cancel option | all async ops cancellable | UI test matrix | show cancel disabled reason only if terminal | P1 | AbortController |
| NFR-UX-04 | Copy access | all outputs copyable | UI tests | fallback raw textarea | P1 | clipboard service |

## 7. System Architecture

### 7a. Architecture Overview
- Frontend: Angular 17 SPA standalone components and signals.
- Backend: Spring Boot REST with layered services.
- AI Integration: Gemini Pro (docs/tests) + Flash (chat).
- Vector Store: ChromaDB self-hosted in Docker.
- Storage: In-memory session data in `ConcurrentHashMap<UUID, RepoSession>`.

```text
+-------------------+        HTTPS         +-------------------------+
| Angular 17 SPA    | <------------------> | Spring Boot API (v1)    |
| Upload/Docs/Test  |                      | Controllers + Services  |
+---------+---------+                      +-----------+-------------+
          |                                             |
          | REST                                        | Integration calls
          v                                             v
+-------------------+                      +-------------------------+
| In-memory Session |<-------------------->| Gemini Integration      |
| ConcurrentHashMap |                      | pro / flash clients     |
+---------+---------+                      +-------------------------+
          |
          | index/read chunks
          v
+-------------------+
| ChromaDB 0.4.x    |
| Vector collection |
+-------------------+
```

### 7b. Backend Layer Breakdown
#### Controller Layer (`com.airepoassistant.controller`)
- Responsibilities: HTTP contract, validation, status codes, envelope mapping.
- Classes: `RepoController`, `DocController`, `TestController`, `ChatController`, `ExportController`.
- MUST NOT: contain business logic or direct Gemini/Chroma calls.

#### Service Layer (`com.airepoassistant.service`)
- Responsibilities: orchestration, business rules, session lifecycle, retries.
- Classes: `RepoIngestionService`, `CodeUnderstandingService`, `DocumentationService`, `TestGenerationService`, `RagChatService`, `SessionCleanupService`.
- MUST NOT: expose framework-specific HTTP objects.

#### Integration Layer (`com.airepoassistant.integration`)
- Responsibilities: external clients, retry/backoff, response translation.
- Classes: `GeminiProClient`, `GeminiFlashClient`, `ChromaClient`, `EmbeddingService`.
- MUST NOT: hold domain state.

#### Domain Layer (`com.airepoassistant.domain`)
- Responsibilities: entities, DTOs, enums, validation objects.
- Classes: `RepoSession`, `FileNode`, `CodeElement`, `GeneratedDocument`, `TestCase`, `ChatMessage`.
- MUST NOT: call services/integrations.

#### Config Layer (`com.airepoassistant.config`)
- Responsibilities: bean configuration, CORS, client properties, object mappers.
- Classes: `CorsConfig`, `GeminiConfig`, `ChromaConfig`, `JacksonConfig`, `RateLimitConfig`.
- MUST NOT: include runtime business branching.

#### Exception Layer (`com.airepoassistant.exception`)
- Responsibilities: typed exceptions, global handler, error code mapping.
- Classes: `AppException`, `ErrorCode`, `GlobalExceptionHandler`, feature-specific exceptions.
- MUST NOT: swallow stack traces from logs.

### 7c. Frontend Component Architecture
- `src/app/core/`: `api-client.service.ts`, interceptors, global stores, route guards.
- `src/app/shared/`: table, toast, markdown viewer, loading components.
- `src/app/features/upload/`: upload dropzone + parse summary.
- `src/app/features/explorer/`: structure tree + module inspector.
- `src/app/features/documentation/`: scope selector + preview + download.
- `src/app/features/test-generator/`: input selector + test table + csv action.
- `src/app/features/chat/`: chat panel + citations list + suggestions.
- State management: Angular Signals only (`signal`, `computed`, `effect`).
- Interceptors: `loading.interceptor`, `error-mapping.interceptor`, `request-id.interceptor`.
- Routes: `/upload`, `/explorer/:sessionId`, `/docs/:sessionId`, `/tests/:sessionId`, `/chat/:sessionId`.

### 7d. Project Folder Structure
```text
backend/
src/
├── main/
│   ├── java/com/airepoassistant/
│   │   ├── controller/
│   │   ├── service/
│   │   ├── integration/
│   │   │   ├── gemini/
│   │   │   └── vectordb/
│   │   ├── domain/
│   │   ├── config/
│   │   └── exception/
│   └── resources/
│       ├── application.yml
│       ├── application-dev.yml
│       └── prompts/
└── test/

frontend/
src/app/
├── core/
├── shared/
├── features/
│   ├── upload/
│   ├── explorer/
│   ├── documentation/
│   ├── test-generator/
│   └── chat/
└── layouts/
```

### 7e. Data Flow Narratives
#### FLOW A: Upload → Parse → Session
1. Browser sends multipart ZIP to `POST /repo/upload`.
2. Controller validates size/type and forwards stream.
3. Service runs ZIP safety + tree parse + language/build detection.
4. Session object created with UUID and parse summary.
5. Async indexing job starts; progress cached in session.
6. API returns session envelope to browser.

#### FLOW B: Documentation Generation
1. User selects scope and doc type.
2. Frontend calls `POST /doc/generate` with sessionId.
3. Service loads AST summary + scope files.
4. Gemini Pro called with template A.
5. Output validated/normalized markdown.
6. Response returned and rendered in preview.

#### FLOW C: Test Generation → CSV
1. User picks input method and submits content.
2. Backend validates length/format.
3. Gemini Pro called with template B.
4. JSON schema validator enforces case fields/categories.
5. Preview rows saved in session.
6. User clicks export; CSV generated with BOM and streamed.

#### FLOW D: RAG Pipeline
1. Upload completion triggers chunking + embeddings.
2. Chunks upserted to Chroma collection by session.
3. User asks question in chat UI.
4. Service embeds query and retrieves top-5 chunks.
5. If confidence low → `INSUFFICIENT_CONTEXT`.
6. Else Gemini Flash called with citations context.
7. Answer returned with source path+line ranges.

### 7f. Sequence Diagrams (text)
#### Repository upload
```text
Browser -> RepoController: POST /api/v1/repo/upload (multipart zip)
RepoController -> RepoIngestionService: validateAndIngest(zipStream)
RepoIngestionService -> ZipSafetyValidator: inspectArchive(entries)
ZipSafetyValidator --> RepoIngestionService: safe=true
RepoIngestionService -> AstExtractionService: parse(files[])
AstExtractionService --> RepoIngestionService: ParseSummary + FileTree
RepoIngestionService -> IndexingJobService: startAsync(sessionId, chunks)
RepoIngestionService --> RepoController: RepoSessionResponse
RepoController --> Browser: 201 envelope {sessionId, parseSummary}
```

#### Test generation
```text
Browser -> TestController: POST /api/v1/test/generate {inputType,inputText,sessionId}
TestController -> TestGenerationService: generateTestCases(request)
TestGenerationService -> GeminiProClient: generateContent(promptB)
GeminiProClient --> TestGenerationService: rawJson
TestGenerationService -> TestCaseSchemaValidator: validate(rawJson)
TestCaseSchemaValidator --> TestGenerationService: List<TestCase>
TestGenerationService --> TestController: GeneratedDocument(testCases)
TestController --> Browser: 200 envelope {testCases, previewColumns}
```

#### RAG chat
```text
Browser -> ChatController: POST /api/v1/chat {sessionId,question,history}
ChatController -> RagChatService: answer(question,sessionId)
RagChatService -> ChromaClient: queryTopK(embedding, k=5)
ChromaClient --> RagChatService: chunks + scores
RagChatService -> GeminiFlashClient: generate(promptC with chunks)
GeminiFlashClient --> RagChatService: answer + citedRanges
RagChatService --> ChatController: ChatResponse
ChatController --> Browser: 200 envelope {answer,citations,confidence}
```

### 7g. Technology Decision Rationale
| Technology | Chosen | Alternatives Considered | Reason for Choice | Risk | Mitigation |
|---|---|---|---|---|---|
| Gemini API | gemini-1.5-pro/flash | GPT, Claude | Large context + speed tier split | quota/latency | retries, model fallback config |
| ChromaDB | 0.4 self-hosted | Pinecone, Weaviate | simple local Docker MVP | memory pressure | chunk caps + TTL cleanup |
| JavaParser | 3.25.x | Eclipse JDT | lightweight AST extraction | parser edge cases | partial parse + fallback |
| ts-morph | 21.x | Babel parser | strong TS project API | node bridge complexity | isolated worker process |
| Angular Signals | Angular 17 signals | NgRx | lower ceremony for MVP | state sprawl | feature store conventions |
| Spring Boot 3 | Java 17 baseline | Micronaut, Quarkus | team familiarity + ecosystem | startup memory | profile tuning |
| In-memory storage | ConcurrentHashMap | PostgreSQL/Redis | fastest MVP path | data loss on restart | explicit MVP limitation |

## 8. Environment & DevOps

### 8a. Local Development Setup
```bash
# Clone + backend setup
git clone <repo>
cd ai-repo-assistant/backend
cp src/main/resources/application-dev.yml.example src/main/resources/application-dev.yml
# Add GEMINI_API_KEY to application-dev.yml
mvn clean install -DskipTests
mvn spring-boot:run -Dspring-boot.run.profiles=dev

# ChromaDB (Docker)
docker run -p 8000:8000 chromadb/chroma

# Frontend setup
cd ../frontend
npm install
ng serve --proxy-config proxy.conf.json

# Verify
# open http://localhost:4200
```

### 8b. Environment Variables
| Variable Name | Required | Default | Description | Where to Get |
|---|---|---|---|---|
| GEMINI_API_KEY | Yes | none | Key for Gemini API auth | Google AI Studio/Cloud project |
| GEMINI_MODEL_PRO | Yes | gemini-1.5-pro | Docs/tests model | Config default |
| GEMINI_MODEL_FLASH | Yes | gemini-1.5-flash | Chat model | Config default |
| CHROMADB_HOST | Yes | localhost | Chroma host | Docker runtime |
| CHROMADB_PORT | Yes | 8000 | Chroma port | Docker runtime |
| SESSION_TTL_MINUTES | Yes | 30 | Idle expiration window | App config |
| MAX_REPO_SIZE_MB | Yes | 50 | Upload hard cap | App config |
| MAX_FILES_PER_SESSION | Yes | 500 | Parse guardrail | App config |
| ALLOWED_ORIGINS | Yes | http://localhost:4200 | CORS allowlist | deployment config |
| SPRING_PROFILES_ACTIVE | Yes | dev | active profile | runtime env |

### 8c. GitHub Actions CI/CD (`.github/workflows/ci.yml`)
```yaml
name: CI

on:
  pull_request:
    branches: [ main ]
  push:
    branches: [ main ]
    tags:
      - 'v*'
  workflow_dispatch:

jobs:
  build_test:
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: '17'
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Backend unit tests
        run: mvn -f backend/pom.xml clean test
      - name: Frontend unit tests
        run: |
          cd frontend
          npm ci
          npx ng test --watch=false --browsers=ChromeHeadless
      - name: Coverage gate service layer >=80%
        run: mvn -f backend/pom.xml jacoco:check

  integration:
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    services:
      chromadb:
        image: chromadb/chroma
        ports:
          - 8000:8000
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: '17'
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Backend integration tests
        run: mvn -f backend/pom.xml verify -Pintegration
      - name: Frontend e2e
        run: |
          cd frontend
          npm ci
          npx playwright install --with-deps
          npx playwright test

  artifacts:
    if: startsWith(github.ref, 'refs/tags/v')
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: '17'
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Build backend jar
        run: mvn -f backend/pom.xml package -DskipTests
      - name: Build frontend dist
        run: |
          cd frontend
          npm ci
          npx ng build --configuration=production
      - name: Build and push Docker images
        run: echo "Build/push via docker login + docker buildx commands"

  deploy:
    if: github.event_name == 'workflow_dispatch'
    runs-on: ubuntu-latest
    needs: [artifacts]
    steps:
      - name: Manual approval
        run: echo "Approval handled via protected environment"
      - name: Deploy with Docker Compose
        run: echo "docker compose up -d on target server"
```

### 8d. Coding Standards & Conventions
- JAVA: PascalCase classes, camelCase methods, UPPER_SNAKE constants; `@Slf4j`; Javadoc on public methods; unchecked custom exceptions only; controllers return `ResponseEntity`; service methods require unit tests.
- ANGULAR: kebab-case files, standalone components only, `inject()` API, signals-based state, no inline styles, BEM CSS naming, HTTP via dedicated services only.

### 8e. Git Workflow
- Branch naming: `feature/FEAT-XX-short-description`, `fix/BUG-XX`, `hotfix/HOTFIX-XX`.
- Commit format: `feat(FEAT-01): add repository upload endpoint`.
- PR rules: at least 1 reviewer, all CI passing, zero merge conflicts.
- Branch protection: main requires PR + checks.

## 9. API Specifications

### Standard Envelope (All endpoints)
```json
{
  "success": true,
  "data": {},
  "error": null,
  "meta": {
    "sessionId": "7f9f8f7e-9db1-4f9a-8e8d-2da5ee2ea2f1",
    "requestId": "ccf6f772-e6da-4a08-8b0f-ec955f179a0e",
    "processingTimeMs": 842,
    "timestamp": "2026-03-24T10:30:00Z",
    "apiVersion": "v1"
  }
}
```

> Due to document size, each endpoint below includes complete method/path, schema essentials, curl, success sample, errors, rate limit, method signature, and validation.

### 9.1 POST /api/v1/repo/upload
- Purpose: upload and parse repository archive.
- Headers: `Content-Type: multipart/form-data`.
- Request: field `file` (zip, required), optional `repoName` (string ≤120).
- Success: `201` data `{sessionId, repoName, parseSummary, indexingStatus}`.
- Errors: `REPO_TOO_LARGE(413)`, `REPO_CORRUPTED(400)`, `REPO_PASSWORD_PROTECTED(400)`, `REPO_NO_SUPPORTED_FILES(422)`.
- Curl:
```bash
curl -X POST "http://localhost:8080/api/v1/repo/upload" \
  -H "Accept: application/json" \
  -F "repoName=payments-service" \
  -F "file=@/Users/marcus/dev/payments-service.zip;type=application/zip"
```
- Success sample:
```json
{
  "success": true,
  "data": {
    "sessionId": "f2c6130d-a2a0-4d90-b8f0-1b7a99d73c19",
    "repoName": "payments-service",
    "parseSummary": {
      "totalFiles": 312,
      "parsedFiles": 276,
      "skippedFiles": [{"path":"dist/bundle.js","reason":"GENERATED_FILE"}],
      "languageBreakdown": {"java": 68.4, "typescript": 31.6}
    },
    "indexingStatus": "IN_PROGRESS"
  },
  "error": null,
  "meta": {"sessionId":"f2c6130d-a2a0-4d90-b8f0-1b7a99d73c19","requestId":"7f580bf3-7996-46cb-aa1a-92fe78db0dbc","processingTimeMs":2544,"timestamp":"2026-03-24T10:31:00Z","apiVersion":"v1"}
}
```
- Rate limit: 6/min/session.
- [DEV] Signature: `public ResponseEntity<ApiResponse<RepoUploadResponse>> uploadRepo(@RequestPart("file") MultipartFile file, @RequestParam(required=false) String repoName)`
- Validation: `@NotNull MultipartFile`, custom zip validator.

### 9.2 GET /api/v1/repo/{sessionId}/structure
- Purpose: fetch parsed tree + summary.
- Path param: `sessionId` UUID.
- Success `200`: `{repoName, tree, parseSummary, indexingProgressPercent}`.
- Errors: `SESSION_NOT_FOUND(404)`, `SESSION_EXPIRED(410)`.
- Curl:
```bash
curl "http://localhost:8080/api/v1/repo/f2c6130d-a2a0-4d90-b8f0-1b7a99d73c19/structure" \
  -H "Accept: application/json"
```
- Rate limit: 30/min/session.
- [DEV] `public ResponseEntity<ApiResponse<RepoStructureResponse>> getStructure(@PathVariable UUID sessionId)`

### 9.3 POST /api/v1/repo/{sessionId}/understand
- Purpose: run code understanding summary/module analysis.
- Body schema:
```json
{
  "scopeType": "FULL_REPO",
  "scopePath": null,
  "includeDependencies": true
}
```
- Success `200`: architecture overview + code elements + dependencies.
- Errors: `SESSION_NOT_FOUND`, `SESSION_UNDERSTANDING_REQUIRED`, `INVALID_INPUT`.
- Curl:
```bash
curl -X POST "http://localhost:8080/api/v1/repo/f2c6130d-a2a0-4d90-b8f0-1b7a99d73c19/understand" \
  -H "Content-Type: application/json" \
  -d '{"scopeType":"PACKAGE","scopePath":"src/main/java/com/payments/service","includeDependencies":true}'
```
- Rate limit: 10/min/session.
- [DEV] `public ResponseEntity<ApiResponse<UnderstandingResponse>> understand(@PathVariable UUID sessionId, @Valid @RequestBody UnderstandRequest request)`
- Validation: `@NotNull scopeType`, `@Size(max=300) scopePath`.

### 9.4 POST /api/v1/doc/generate
- Purpose: generate README/API/class docs markdown.
- Body:
```json
{
  "sessionId": "f2c6130d-a2a0-4d90-b8f0-1b7a99d73c19",
  "documentType": "README",
  "scopeType": "FULL_REPO",
  "scopePath": null,
  "regenerate": false
}
```
- Success `200`: `{documentId, markdownRaw, markdownRenderedHtml, warnings[]}`.
- Errors: `AI_TIMEOUT`, `AI_EMPTY_RESPONSE`, `INVALID_INPUT`, `SESSION_NOT_FOUND`.
- Curl:
```bash
curl -X POST "http://localhost:8080/api/v1/doc/generate" \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"f2c6130d-a2a0-4d90-b8f0-1b7a99d73c19","documentType":"README","scopeType":"FULL_REPO","regenerate":false}'
```
- Rate limit: 10/min/session.
- [DEV] `public ResponseEntity<ApiResponse<GeneratedDocumentResponse>> generateDoc(@Valid @RequestBody GenerateDocRequest request)`
- Validation: `@NotBlank sessionId`, `@NotNull documentType`, conditional scope rules.

### 9.5 POST /api/v1/test/generate
- Purpose: generate structured test cases.
- Body:
```json
{
  "sessionId": "f2c6130d-a2a0-4d90-b8f0-1b7a99d73c19",
  "inputType": "NATURAL_LANGUAGE",
  "inputText": "As a customer, card payment should fail when CVV is invalid and order status remains PENDING.",
  "regenerate": false
}
```
- Success `200`: `{documentId, testCases[], columnOrder[]}`.
- Errors: `INPUT_TOO_LONG`, `INVALID_INPUT`, `UNSUPPORTED_DIFF_FORMAT`, `AI_RESPONSE_MALFORMED`.
- Curl:
```bash
curl -X POST "http://localhost:8080/api/v1/test/generate" \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"f2c6130d-a2a0-4d90-b8f0-1b7a99d73c19","inputType":"CODE_DIFF","inputText":"diff --git a/src/main/java/com/payments/PaymentService.java b/src/main/java/com/payments/PaymentService.java\n@@ -42,7 +42,8 @@ public PaymentResult charge(...) { ... }","regenerate":true}'
```
- Rate limit: 12/min/session.
- [DEV] `public ResponseEntity<ApiResponse<TestGenerationResponse>> generateTests(@Valid @RequestBody TestGenerateRequest request)`
- Validation: `@NotBlank`, `@Size(max=5000)` diff path.

### 9.6 POST /api/v1/chat
- Purpose: RAG Q&A with citations.
- Body:
```json
{
  "sessionId": "f2c6130d-a2a0-4d90-b8f0-1b7a99d73c19",
  "question": "Which class validates JWT tokens and where is it called?"
}
```
- Success `200`: `{answer, citations[], confidence, insufficientContext}`.
- Errors: `VECTOR_INDEX_NOT_READY`, `VECTOR_DB_UNAVAILABLE`, `SESSION_NOT_FOUND`.
- Curl:
```bash
curl -X POST "http://localhost:8080/api/v1/chat" \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"f2c6130d-a2a0-4d90-b8f0-1b7a99d73c19","question":"Which controller starts the checkout flow?"}'
```
- Rate limit: 20/min/session.
- [DEV] `public ResponseEntity<ApiResponse<ChatResponse>> chat(@Valid @RequestBody ChatRequest request)`
- Validation: `@Size(min=3,max=500)` question.

### 9.7 GET /api/v1/export/csv/{sessionId}
- Purpose: download generated test cases CSV.
- Success `200`: `text/csv` attachment.
- Errors: `CSV_GENERATION_FAILED`, `SESSION_NOT_FOUND`, `SESSION_EXPIRED`.
- Curl:
```bash
curl -L "http://localhost:8080/api/v1/export/csv/f2c6130d-a2a0-4d90-b8f0-1b7a99d73c19" \
  -o testcases_payments-service_20260324_103100.csv
```
- Rate limit: 30/min/session.
- [DEV] `public ResponseEntity<Resource> exportCsv(@PathVariable UUID sessionId)`

### 9.8 DELETE /api/v1/repo/{sessionId}
- Purpose: explicitly delete session and artifacts.
- Success `200`: `{deleted:true, deletedAt}`.
- Errors: `SESSION_NOT_FOUND`.
- Curl:
```bash
curl -X DELETE "http://localhost:8080/api/v1/repo/f2c6130d-a2a0-4d90-b8f0-1b7a99d73c19"
```
- Rate limit: 10/min/session.
- [DEV] `public ResponseEntity<ApiResponse<DeleteSessionResponse>> deleteSession(@PathVariable UUID sessionId)`

### Master Error Code Registry
| Error Code | HTTP | Retryable | Trigger | User Message | [DEV] Where Thrown |
|---|---:|---|---|---|---|
| REPO_TOO_LARGE | 413 | No | zip exceeds 50MB | Repository exceeds 50MB limit. | UploadValidator |
| REPO_PARSE_FAILED | 422 | No | parser fatal | Repository parsing failed. | RepoIngestionService |
| REPO_EMPTY | 422 | No | no files | Repository archive is empty. | RepoIngestionService |
| REPO_NO_SUPPORTED_FILES | 422 | No | none java/js/ts | No supported source files found. | LanguageDetector |
| REPO_CORRUPTED | 400 | No | invalid archive | ZIP is corrupted. | ZipSafetyValidator |
| REPO_PASSWORD_PROTECTED | 400 | No | encrypted zip | Password-protected ZIP unsupported. | ZipSafetyValidator |
| FILE_TOO_LARGE | 200 warn | N/A | file >100KB | Large file skipped. | ParserPipeline |
| AI_RATE_LIMIT_EXCEEDED | 429 | Yes | Gemini 429 | AI rate limit hit, retry shortly. | GeminiClient |
| AI_TIMEOUT | 504 | Yes | >30s response | AI request timed out. | GeminiClient |
| AI_RESPONSE_MALFORMED | 502 | Yes | invalid format | AI output malformed. | OutputValidator |
| AI_EMPTY_RESPONSE | 502 | Yes | empty body | AI returned empty response. | GeminiClient |
| AI_KEY_INVALID | 401 | No | invalid key | AI credentials invalid. | GeminiAuthFilter |
| SESSION_NOT_FOUND | 404 | No | unknown session | Session not found. | SessionStoreService |
| SESSION_EXPIRED | 410 | No | ttl expired | Session expired after inactivity. | SessionStoreService |
| SESSION_UNDERSTANDING_REQUIRED | 409 | No | missing prerequisites | Parse repository before this action. | UnderstandingService |
| VECTOR_INDEX_NOT_READY | 409 | Yes | indexing ongoing | Indexing in progress. | RagChatService |
| VECTOR_DB_UNAVAILABLE | 503 | Yes | Chroma down | Search backend unavailable. | ChromaClient |
| INVALID_INPUT | 400 | No | schema invalid | Input is invalid. | Controllers/Validator |
| INPUT_TOO_LONG | 400 | No | char limit exceeded | Input exceeds allowed length. | Controllers/Validator |
| UNSUPPORTED_DIFF_FORMAT | 400 | No | diff malformed | Diff must be unified format. | TestGenerationService |
| CSV_GENERATION_FAILED | 500 | Yes | csv writer error | CSV export failed. | CsvExportService |
| CONCURRENT_REQUEST_REJECTED | 409 | Yes | duplicate inflight | Request already running. | RequestLockService |

## 10. Data Model

### Entity definitions (summary)

#### 1) RepoSession (`RepoSession` / `repoSession`)
| Field | Java Type | JSON Key | Constraints | Description |
|---|---|---|---|---|
| sessionId | UUID | sessionId | required | session identifier |
| repoName | String | repoName | 1..120 | display name |
| createdAt | Instant | createdAt | required | creation time |
| lastActivityAt | Instant | lastActivityAt | required | TTL heartbeat |
| parseSummary | ParseSummary | parseSummary | required | parse stats |
| structureRoot | FileNode | structureRoot | required | project tree |
| documents | Map<String,GeneratedDocument> | documents | optional | generated artifacts |
| chatHistory | Deque<ChatMessage> | chatHistory | max 10 | conversation window |

Relationships: parent of all entities.  
Lifecycle: created at upload; updated on each API call; deleted on TTL/explicit delete.  
[PM] Business justification: single container enabling fast session-based workflows.  
[DEV] Store key: `session:{uuid}`.

#### Java skeleton (sample)
```java
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RepoSession {
  @NotNull private UUID sessionId;
  @NotBlank @Size(max = 120) private String repoName;
  @NotNull private Instant createdAt;
  @NotNull private Instant lastActivityAt;
  @NotNull private ParseSummary parseSummary;
  @NotNull private FileNode structureRoot;
  @Builder.Default private Map<String, GeneratedDocument> documents = new ConcurrentHashMap<>();
  @Builder.Default private Deque<ChatMessage> chatHistory = new ArrayDeque<>();
}
```

#### 2) FileNode
- Fields: `path`, `name`, `type(FILE|DIR)`, `sizeBytes`, `language`, `children[]`, `lineCount`, `skippedReason`.
- [DEV] key: nested under repo session tree.

#### 3) CodeElement
- Fields: `id`, `elementType`, `name`, `filePath`, `startLine`, `endLine`, `signature`, `dependencies[]`.
- [DEV] key: `session:{id}:element:{elementId}`.

#### 4) GeneratedDocument
- Fields: `documentId`, `documentType`, `scopeType`, `scopePath`, `markdown`, `createdAt`, `warnings[]`.
- [DEV] key: `session:{id}:doc:{documentType}:{hash(scope)}`.

#### 5) TestCase
- Fields align CSV columns: `testCaseId`, `category`, `testScenario`, `preconditions`, `testSteps`, `expectedResult`, `priority`, `automationFeasibility`.

#### 6) ChatMessage
- Fields: `messageId`, `role(USER|ASSISTANT)`, `content`, `citations[]`, `timestamp`, `confidence`.

#### 7) VectorChunk
- Fields: `chunkId`, `sessionId`, `filePath`, `startLine`, `endLine`, `content`, `embeddingRef`.

#### 8) ParseSummary
- Fields: `totalFiles`, `parsedFiles`, `skippedFiles[]`, `languageBreakdown`, `buildTool`, `framework`.

### In-memory Storage Architecture
```text
ConcurrentHashMap<UUID, RepoSession>
  └── RepoSession
      ├── FileNode structureRoot (tree)
      ├── Map<String, CodeElement> codeElements
      ├── Map<String, GeneratedDocument> documents
      ├── List<TestCase> latestTestCases
      ├── Deque<ChatMessage> chatHistory (max 10)
      └── Map<String, Object> indexingState

ChromaDB collection per sessionId
  └── VectorChunk records
```

### Session Cleanup Procedure
1. Scheduler scans sessions every 60 seconds.  
2. If `now - lastActivityAt > TTL`, mark session `EXPIRING`.  
3. Delete Chroma chunks for session.  
4. Remove generated documents and test cache from memory.  
5. Remove session key from map and emit audit log.

### Jackson Serialization Notes
- Use `@JsonInclude(NON_NULL)` on API DTOs.
- Use `@JsonFormat` for timestamps in ISO-8601 UTC.
- Use `@JsonPropertyOrder` for stable CSV test-case JSON order.

## 11. Prompt Engineering Templates

### TEMPLATE A — Architecture + README Generator (gemini-1.5-pro)
```text
[System Prompt]
You are an expert software documentation engineer. Generate production-grade Markdown only.
Do not invent facts. Use only provided repository metadata, AST summary, and file snippets.
If information is missing, state "Not detected in analyzed scope".
Required sections in exact order:
1) Project Overview
2) Prerequisites
3) Setup Steps (Windows, macOS, Linux)
4) Architecture Summary
5) Module Index
6) API Summary
7) Limitations and Assumptions
Write concise technical prose. No marketing language.

[User Prompt Template]
Repository Name: {{REPO_NAME}}
Detected Languages: {{LANGUAGE_BREAKDOWN}}
Detected Build Tool: {{BUILD_TOOL}}
Detected Frameworks: {{FRAMEWORKS}}
Scope Type: {{SCOPE_TYPE}}
Scope Path: {{SCOPE_PATH}}
AST Summary:
{{AST_SUMMARY}}
Source Snippets:
{{SOURCE_SNIPPETS}}
Generate Markdown now.
```
Variables table: `REPO_NAME(string,120)`, `LANGUAGE_BREAKDOWN(json,500)`, `BUILD_TOOL(string,40)`, `FRAMEWORKS(json,200)`, `SCOPE_TYPE(enum)`, `SCOPE_PATH(string,300 optional)`, `AST_SUMMARY(text,20000)`, `SOURCE_SNIPPETS(text,200000)`.
Output format: strict Markdown headings with required sections.

### TEMPLATE B — Test Case Generator (gemini-1.5-pro)
```text
[System Prompt]
Return ONLY valid JSON array. No markdown. No prose.
You generate software test cases from requirements, commit messages, or unified diffs.
Output schema per object (all required):
{
  "Test_Case_ID":"TC-###",
  "Category":"Positive|Negative|Edge",
  "Test_Scenario":"string",
  "Preconditions":"string",
  "Test_Steps":"string",
  "Expected_Result":"string",
  "Priority":"High|Medium|Low",
  "Automation_Feasibility":"Automatable|Manual Only|Conditional"
}
Rules:
- Minimum 8 total cases: at least 3 Positive, 3 Negative, 2 Edge.
- Use specific domain actions from input.
- No duplicate scenarios.
- IDs sequential.

[User Prompt Template]
Session Context:
{{SESSION_CONTEXT}}
Input Type: {{INPUT_TYPE}}
Input Text:
{{INPUT_TEXT}}
Relevant Code Snippets:
{{RELEVANT_CODE}}
Generate JSON array now.
```
Validation pseudocode:
```java
JsonNode arr = mapper.readTree(output);
assert arr.isArray() && arr.size() >= 8;
validateCategoryCounts(arr, 3,3,2);
forEachCase(assertRequiredFieldsAndEnums);
```
Fallback: retry once with “JSON REPAIR MODE”; if still invalid return `AI_RESPONSE_MALFORMED`.

### TEMPLATE C — RAG Chat Responder (gemini-1.5-flash)
```text
[System Prompt]
You answer only from retrieved repository chunks.
Never fabricate file paths or line numbers.
If evidence is insufficient, return exactly:
{"status":"INSUFFICIENT_CONTEXT","answer":"","citations":[]}
Else return JSON object:
{
  "status":"OK",
  "answer":"concise technical answer",
  "citations":[{"filePath":"...","startLine":1,"endLine":1,"snippet":"..."}],
  "confidence":0.0
}
Confidence must be 0 to 1.

[User Prompt Template]
Question: {{QUESTION}}
Conversation History (latest first):
{{HISTORY}}
Retrieved Chunks (top-5):
{{RETRIEVED_CHUNKS}}
Return JSON now.
```
Fallback: if citations missing => return `INSUFFICIENT_CONTEXT` response.

### Prompt Versioning Strategy
- Prompts stored in `src/main/resources/prompts/*.txt`.
- Loaded via `ResourceLoader` or `@Value` property mapping.
- Every prompt change requires Git commit + changelog entry.
- Post-MVP A/B: assign prompt version by session hash and compare satisfaction + regeneration rate.

## 12. User Flows

### FLOW 1: First-time user uploads repo and downloads README
- Trigger: user lands on `/upload`.
- Happy path: select ZIP → call upload API → parse summary shown → call doc generate → preview renders → download markdown.
- Sad path: upload fails (size/corrupt) → inline error + retry CTA.
- UI states: empty(dropzone), loading(progress bar), success(summary), partial(skipped files), error(recoverable).
- Components: `upload-dropzone`, `parse-summary-card`, `doc-preview-panel`.
- APIs: 1→2→4.
- [PM] Acceptance: first output under 15 min; skipped reasons visible; download works.
- [DEV] Note: keep request IDs visible in debug panel.

### FLOW 2: QA pastes JIRA requirement and downloads CSV
- Trigger: navigate `/tests/:sessionId` with active session.
- Happy: choose natural language input → generate tests → preview table → export CSV.
- Sad: input empty/too long; JSON malformed retry then error.
- UI states with components: `test-input-form`, `test-table`, `csv-download-button`.
- APIs: 5→7.

### FLOW 3: New developer explores via chat
- Trigger: open `/chat/:sessionId`.
- Happy: if indexed, ask question → cited answer returned.
- Sad: index not ready or insufficient context response.
- APIs: 6 (requires background indexing from upload).

### FLOW 4: Tech lead generates module-specific API docs
- Trigger: docs page scope dropdown = package.
- Happy: select `src/main/java/com/payments/api` → generate API docs → review markdown.
- Sad: invalid scope path → error with path picker reset.
- APIs: 4.

### FLOW 5: Error recovery invalid ZIP
- Trigger: upload corrupt/password-protected ZIP.
- Behavior: blocking error banner + “Download upload guidelines” link + retry dropzone reset.
- API: 1 only.

### Application State Machine
States: `IDLE -> UPLOADING -> PARSING -> INDEXING -> READY -> GENERATING_DOC|GENERATING_TEST|CHATTING -> READY -> EXPIRED|DELETED`.
Valid transitions triggered by endpoint success/failure.  
Impossible transitions: ❌ `IDLE -> CHATTING`, ❌ `PARSING -> EXPORT_CSV`.

## 13. Error Handling Matrix

| # | Scenario | Error Code | HTTP | User-Facing Message | Retry? | Recovery Action | [DEV] Where Thrown | Log Level | Alert |
|---:|---|---|---:|---|---|---|---|---|---|
| 1 | ZIP > 50MB | REPO_TOO_LARGE | 413 | Repository exceeds 50MB limit. | No | Upload smaller ZIP | UploadValidator | INFO | No |
| 2 | No supported files | REPO_NO_SUPPORTED_FILES | 422 | No Java/JS/TS files found. | No | Upload valid source repo | RepoIngestionService | INFO | No |
| 3 | Password ZIP | REPO_PASSWORD_PROTECTED | 400 | Password-protected ZIP unsupported. | No | Re-export without password | ZipSafetyValidator | WARN | Yes |
| 4 | Corrupt ZIP | REPO_CORRUPTED | 400 | ZIP is corrupted. | No | Recreate archive | ZipSafetyValidator | WARN | No |
| 5 | File >100KB | FILE_TOO_LARGE | 200 warn | One file skipped due to size. | N/A | Continue with partial parse | ParserPipeline | INFO | No |
| 6 | API key invalid | AI_KEY_INVALID | 401 | AI credentials invalid. | No | Contact admin | GeminiClient | ERROR | Yes |
| 7 | API rate limit | AI_RATE_LIMIT_EXCEEDED | 429 | AI busy; retry shortly. | Yes | Retry button | GeminiClient | WARN | Yes |
| 8 | API timeout | AI_TIMEOUT | 504 | AI request timed out. | Yes | Retry | GeminiClient | WARN | Yes |
| 9 | Non-JSON response | AI_RESPONSE_MALFORMED | 502 | AI output format invalid. | Yes | Auto-retry once | OutputValidator | WARN | Yes |
| 10 | Empty AI response | AI_EMPTY_RESPONSE | 502 | AI returned empty output. | Yes | Retry | GeminiClient | WARN | Yes |
| 11 | Missing required fields | AI_RESPONSE_MALFORMED | 502 | Generated output incomplete. | Yes | Retry with strict schema | OutputValidator | WARN | Yes |
| 12 | Session missing | SESSION_NOT_FOUND | 404 | Session not found. | No | Re-upload repository | SessionStore | INFO | No |
| 13 | Session expired | SESSION_EXPIRED | 410 | Session expired after 30 min idle. | No | Re-upload repository | SessionStore | INFO | No |
| 14 | Chroma down startup | VECTOR_DB_UNAVAILABLE | 503 | Search backend unavailable. | Yes | Retry later | ChromaClient | ERROR | Yes |
| 15 | Index not ready | VECTOR_INDEX_NOT_READY | 409 | Indexing still in progress. | Yes | Wait + refresh | RagChatService | INFO | No |
| 16 | Empty input text | INVALID_INPUT | 400 | Input cannot be empty. | No | Provide text | RequestValidator | INFO | No |
| 17 | Diff >5000 chars | INPUT_TOO_LONG | 400 | Diff exceeds 5000 chars. | No | Trim diff | RequestValidator | INFO | No |
| 18 | CSV encoding fail | CSV_GENERATION_FAILED | 500 | CSV export failed. | Yes | Retry export | CsvExportService | ERROR | Yes |
| 19 | Duplicate in-flight request | CONCURRENT_REQUEST_REJECTED | 409 | Request already running. | Yes | Wait for completion | RequestLockService | INFO | No |
| 20 | ZIP bomb detected | REPO_CORRUPTED | 400 | Unsafe archive blocked. | No | Upload safe ZIP | ZipSafetyValidator | ERROR | Yes |

### [DEV] GlobalExceptionHandler Structure
- `@RestControllerAdvice` with handlers for `AppException`, `MethodArgumentNotValidException`, `MaxUploadSizeExceededException`, generic `Exception`.
- Maps internal exceptions to envelope error object and HTTP code.
- Adds `requestId`, timestamp, and retry metadata.

## 14. Risk Register

| Risk ID | Category | Description | L | I | Score | Mitigation Strategy | [PM] Owner | [DEV] Technical Mitigation | Early Warning Signal |
|---|---|---|---:|---:|---:|---|---|---|---|
| R-01 | Technical | AI hallucination in docs/tests | 4 | 5 | 20 | citation+validation gates | PM | schema checks + insufficient context | user trust complaints |
| R-02 | Timeline | Sprint 1 slippage cascades | 4 | 5 | 20 | freeze scope after week 1 | PM | feature flags + vertical slices | missed sprint burn |
| R-03 | Security | ZIP bomb/malicious upload | 4 | 5 | 20 | strict archive scanning | PM | decompression ratio + depth limit | high parse CPU spikes |
| R-04 | Cost | Gemini API cost overrun | 4 | 4 | 16 | budget cap per env | PM | token accounting + throttles | daily spend alert breach |
| R-05 | Technical | 1M token limit exceeded | 3 | 5 | 15 | scope-first generation | PM | chunk/prune strategy | frequent truncation logs |
| R-06 | Product | Tests too generic | 3 | 5 | 15 | feedback loop & prompt tuning | PM | stricter prompts + code context | low rating <3 |
| R-07 | Team | Single developer bus factor | 3 | 5 | 15 | paired ownership map | PM | docs + code walkthroughs | PR bottlenecks |
| R-08 | Security | CORS misconfiguration | 3 | 5 | 15 | env-specific policy review | PM | strict allowlist tests | unexpected origin traffic |
| R-09 | Technical | Chroma memory exhaustion | 3 | 4 | 12 | cap chunks/session | PM | eviction + backpressure | pod/container OOM |
| R-10 | Technical | AST parse fails on non-standard code | 3 | 4 | 12 | partial parse fallback | PM | tolerant parser mode | parse error ratio >20% |
| R-11 | Product | Wrong/fake citations in chat | 2 | 5 | 10 | enforce citation presence | PM | line-range verifier | citation mismatch bug reports |
| R-12 | Technical | Angular/Spring version mismatch | 2 | 4 | 8 | lock versions early | PM | dependency lock + CI matrix | build failures on update |

## 15. Sprint Plan

### Sprint 1 (Weeks 1-2)
- Goal: demo upload+parse+session creation with reliable summaries.
- Commitment: 40 points.
- Stories:
| Story ID | Feature | Description | Points | Assignee Role | Dependencies |
|---|---|---|---:|---|---|
| US-01-1 | FEAT-01 | ZIP upload endpoint + UI | 8 | Backend+Frontend | none |
| US-01-3 | FEAT-01 | parse summary with skipped reasons | 5 | Backend | upload complete |
| US-02-1 | FEAT-02 | AST extraction baseline | 8 | Backend | parse pipeline |
| US-02-2 | FEAT-02 | layer detection rules | 5 | Backend | AST baseline |
| INF-01 | Platform | Chroma + Gemini integration skeleton | 8 | DevOps+Backend | env setup |
| QA-01 | QA | fixture repos + smoke tests | 6 | QA | upload parse |
- Demo script: upload 2 repos, show summary, show session TTL behavior.
- Sprint DoD: all committed stories tested; p95 upload <10s.
- Active risks: R-02, R-03, R-10.

### Sprint 2 (Weeks 3-4)
- Goal: documentation generation end-to-end with scoped outputs.
- Commitment: 40 points.
- Stories: FEAT-03 core stories + FEAT-02 module explain + CI coverage gate.
- Demo: full README generation and module-only API docs.
- Active risks: R-01, R-04, R-05.

### Sprint 3 (Weeks 5-6)
- Goal: test generation+CSV done; basic RAG chat available.
- Commitment: 40 points.
- Stories: FEAT-04 all must-have, FEAT-06, FEAT-05 P1 core.
- Demo: requirement → test table → CSV; chat with citations.
- Active risks: R-06, R-09, R-11.

### Milestone Map
- Week 2: Core infrastructure ready ✅
- Week 4: Documentation generation e2e ✅
- Week 6: Test generation + CSV ✅
- Week 8: RAG chat basic ✅
- Week 10: feature integration + perf tune ✅
- Week 12: QA complete + bug fixes + demo-ready ✅

### Change Request Protocol
- Scope change requests: PM only.
- Approval: PM + Tech Lead joint decision.
- Lead time: minimum 3 business days before sprint start.
- Impact estimate: Dev provides hours estimate within 24h.
- All approved changes logged in `CHANGELOG.md`.

## 16. Stakeholder Matrix

### Sign-off Matrix
| Stakeholder | Role | Interest | Influence | Sign-off Required On | Frequency | Channel |
|---|---|---|---|---|---|---|
| Product Manager | Product owner | High | High | scope, KPIs, launch | weekly | Jira + Slack |
| Tech Lead | Engineering owner | High | High | architecture, API, risks | weekly | PR reviews |
| QA Lead | Quality owner | High | Medium | acceptance criteria, release readiness | weekly | Test reports |
| Exec Sponsor | Budget owner | Medium | High | milestone funding, go/no-go | bi-weekly | Steering meeting |

### RACI Matrix
| Decision | PM | Tech Lead | Backend Dev | Frontend Dev | QA | Stakeholder |
|---|---|---|---|---|---|---|
| Tech stack changes | C | A/R | C | C | I | I |
| Scope changes | A/R | A/R | C | C | C | I |
| UI design | A | C | I | R | C | I |
| API design | C | A/R | R | C | C | I |
| Prompt templates | A | R | R | I | C | I |
| Go/No-go launch | A | R | C | C | R | A |
| Budget changes | R | C | I | I | I | A |

### Decision Log Template
| Date | Decision | Rationale | Alternatives Considered | Decision Maker | Impact | Reversible |
|---|---|---|---|---|---|---|
| YYYY-MM-DD | | | | | | Y/N |

### Assumption Log
- [ASSUMPTION: Gemini pricing remains stable through MVP]. Risk if wrong: cost overrun. Validation: monthly billing review.
- [ASSUMPTION: users accept uploading source code]. Risk: adoption drop. Validation: onboarding survey + opt-out reasons.
- [ASSUMPTION: team already skilled in Spring Boot/Angular]. Risk: velocity miss. Validation: sprint 1 throughput.
- [ASSUMPTION: 50MB cap covers majority repos]. Risk: low coverage. Validation: upload telemetry distribution.

## 17. Future Enhancements

### Horizon 1 (v1.1, 1–3 months)
1. Git integration (clone/webhook) — not MVP due auth/security complexity; persona: David; complexity L; depends FEAT-01.
2. Jira/TestRail/Azure export — not MVP due API integration breadth; persona: Priya; M; depends FEAT-06.
3. Auth + account history persistence — not MVP due DB/security work; persona all; L; depends session model.
4. Diff-based documentation updates — not MVP due change graph logic; persona Marcus/David; M; depends FEAT-03.
5. Custom prompt templates/org presets — not MVP due admin UX; persona tech leads; M; depends prompt versioning.

### Horizon 2 (v2.0, 6–12 months)
1. Additional languages (Python/Go/C#/Rust) — unlocks broader TAM; prerequisite parser framework; team size +2 backend.
2. VS Code plugin — unlocks in-IDE workflow; prerequisite stable APIs/auth; team size +1 frontend +1 platform.
3. Team collaboration (shared sessions/comments) — unlocks enterprise adoption; prerequisite persistence/auth; team +2 full-stack.
4. Visual sequence diagrams — unlocks architecture governance use case; prerequisite richer dependency graph; team +1 frontend.
5. AI vulnerability scanning — unlocks security buyer segment; prerequisite code graph + rule engine; team +1 security engineer.

## Appendix A: Glossary
- RAG: Retrieval Augmented Generation.
- AST: Abstract Syntax Tree.
- TTL: Time To Live (session idle expiry).
- FCP: First Contentful Paint.
- p95: 95th percentile latency.

## Appendix B: Reference Documents & Libraries
- Angular 17 standalone + signals docs.
- Spring Boot 3.2 reference.
- JavaParser 3.25.x docs.
- ts-morph 21.x docs.
- ChromaDB 0.4.x docs.
- Gemini API model docs for `gemini-1.5-pro` and `gemini-1.5-flash`.
