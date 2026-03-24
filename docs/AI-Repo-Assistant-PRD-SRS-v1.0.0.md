## 0. Pre-flight Analysis
1. [DEV] The single highest kill-risk is end-to-end latency under realistic repository sizes when combining ZIP parse, AST extraction, embedding, and Gemini calls. [PM] If time-to-first-value crosses 15 minutes, the core promise fails and adoption drops regardless of feature richness. Resolution: enforce hard MVP limits (50MB, 500 files, 50k LOC), background indexing, and observable SLAs with circuit breakers.

2. [PM] The most likely scope creep is “chat intelligence” expanding into autonomous refactoring, architecture redesign, and IDE-grade navigation. [DEV] RAG quality tuning can absorb unlimited effort if not constrained by explicit acceptance tests. Guardrail: lock MVP chat to top-5 retrieval, citation-only grounded answers, 10-turn memory, and explicit `INSUFFICIENT_CONTEXT` fallback.

3. [DEV] Hardest challenge is building deterministic, language-aware extraction and summarization across Java + TypeScript while keeping response times inside NFR targets. AST outputs, chunking strategy, and prompt token budgeting must align or generated docs degrade. Solution: canonical intermediate model (`CodeElement`, `ParseSummary`, `VectorChunk`) and strict output validators before UI render.

4. [PM] QA will flag missing executable test matrices for cross-platform file handling, encoding, and malformed archive behavior. [DEV] They also need deterministic fixtures for AI output validation (schema conformance, retry policy, malformed JSON repair path). This spec adds scenario-based error matrix, endpoint-level validations, and environment-defined integration suites.

5. [DEV] A new engineer needs a “first 2 days” blueprint: architecture boundaries, folder structure, endpoint contracts, and runbook commands. [PM] Without this, onboarding cost erodes the business case for a fast-moving MVP team. This document therefore acts as the single source of truth with implementation-ready contracts and sprint-linked delivery sequencing.

## 1. Document Control
| Field | Value |
|---|---|
| Product | AI Repo Assistant |
| Version | v1.0.0 |
| Status | Draft — Pending Stakeholder Review |
| Last Updated | 2026-03-24 |
| Authors | [PM] Senior Product Manager, [DEV] Senior Full Stack Developer |
| Reviewers | Tech Lead, QA Lead, Sponsor Stakeholder |
| Approval Required | PM + Tech Lead + Sponsor |

## 2. Executive Summary
### 2a. For Stakeholders (non-technical)
AI Repo Assistant helps developers understand unfamiliar Java/TypeScript repositories in minutes instead of days. Users upload a code repository and quickly receive architecture documentation, API summaries, and structured test cases. The initial users are senior developers, QA leads, tech leads, and new joiners who waste time reverse-engineering code. Business value is faster onboarding, fewer documentation bottlenecks, and more consistent test quality. MVP delivery is planned over 12 weeks with strict scope controls to hit a 15-minute time-to-first-value target. **Ask:** approve MVP scope boundaries, success metrics, and sprint sequencing so the team can execute without mid-sprint scope inflation.

### 2b. For Engineering Team (technical)
✅ Architecture is Angular 17 SPA + Spring Boot 3.2 REST + Gemini integration + ChromaDB + in-memory session state. AST extraction uses JavaParser and ts-morph into a normalized model used by docs, tests, and RAG retrieval. MVP boundaries: ZIP upload/path ingest, parse summary, code understanding, doc generation, test generation + CSV, and basic RAG chat with citations. ❌ Not in MVP: auth/accounts, persistent history, collaboration, visual graph diagrams, Git provider integration. Critical dependencies are Gemini API reliability, ChromaDB availability, robust archive parsing safeguards, and strong validation wrappers for AI output contracts.

## 3. Success Metrics & KPIs
| Metric | Baseline | Target | Measurement Method | Owner | Cadence |
|---|---:|---:|---|---|---|
| Time-to-first-value | 0 | ≤15 min | UI telemetry from upload start to first rendered doc/test artifact | PM | Weekly |
| Sessions generating doc OR tests | 0% | >70% | Backend event `artifact_generated` / `session_started` | PM | Weekly |
| User rating score | 0 | >3.5/5 | In-app feedback widget post-generation | PM | Monthly |
| 7-day second upload rate | 0% | >30% | Session analytics by pseudonymous user key | PM | Monthly |
| API latency by endpoint | N/A | per NFR table | OpenTelemetry timings + percentile dashboards | Dev | Weekly |
| AI call success incl. retries | 0% | >95% | Integration metrics counters by model + retry outcome | Dev | Weekly |
| Memory per active session | N/A | <512MB | JVM metrics + session heap estimate sampler | Dev | Weekly |
| Service layer unit coverage | 0% | >80% | JaCoCo report in CI | Dev/QA | Every PR |
| Completion vs commitment | 0% | >85% | Sprint board closed points / committed points | PM | Sprint end |
| Bug escape to QA | N/A | <10% stories | QA defect tags by originating story | QA | Sprint end |
| Blocked story ratio | N/A | <15% capacity | Sprint blocked points / committed points | PM | Sprint end |

## 4. User Personas
### 4.1 Marcus — Senior Backend Developer at a 60-person fintech startup
- Experience: 9 years; strong Java/Spring, moderate TypeScript.
- Daily tools: IntelliJ, GitHub Actions, Datadog, Postman.
- Goals: reduce onboarding support requests by 30%; generate module docs under 10 minutes; identify inter-service call paths in one session.
- Pain points: spends 2+ hours per sprint writing docs; architecture knowledge trapped in senior dev heads; handoff failures during incident rotation.
- Quote: “If I can’t explain this repo in 15 minutes, onboarding burns my sprint.”
- Usage: primary=Documentation Generator; secondary=Code Understanding; never use=manual CSV export editing (prefers direct tooling).
- Success: gets accurate README/API/module summary without manually tracing every class.
- Abandon threshold: closes product if first full-repo docs take >30 seconds repeatedly.

### 4.2 Priya — QA Lead at an enterprise platform team managing 3 junior QAs
- Experience: 11 years; advanced test design, moderate Java, basic Angular.
- Daily tools: Jira, TestRail, Selenium, Jenkins.
- Goals: produce scenario-complete test cases in <20 minutes per story; cut missed negative-path defects by 25%; standardize CSV test artifacts for audits.
- Pain points: vague requirements produce inconsistent cases; juniors miss edge cases; export formats break in Excel.
- Quote: “I need test cases that catch real failures, not boilerplate checklists.”
- Usage: primary=Test Case Generator; secondary=CSV Export; never use=deep AST explorer (delegates to devs).
- Success: receives ready-to-review positive/negative/edge tests with clean CSV compatibility.
- Abandon threshold: leaves if generated output lacks required CSV columns or repeats generic tests.

### 4.3 David — Tech Lead onboarding 2 developers per quarter
- Experience: 12 years; expert Java + architecture.
- Daily tools: IntelliJ, Confluence, GitHub, Slack.
- Goals: reduce onboarding ramp from 3 weeks to 1.5 weeks; produce architecture handoff docs per release; answer codebase questions faster.
- Pain points: onboarding drains lead time; docs become stale after each merge; module ownership is unclear.
- Quote: “Every new hire asks the same questions because our docs rot in days.”
- Usage: primary=Chat with Repository; secondary=README/API regeneration; never use=raw diff-based test entry.
- Success: new hires self-serve architecture answers with citations.
- Abandon threshold: rejects tool if chat citations are missing or unverifiable.

### 4.4 Aisha — Junior Developer, 3 months into a legacy Java monolith
- Experience: 1 year; beginner Java/Spring, intermediate frontend.
- Daily tools: VS Code, Maven, Git, browser docs.
- Goals: understand one module/day; avoid breaking shared services; map entry points quickly.
- Pain points: no clear package map; fear of touching old code; overloaded by giant classes.
- Quote: “I spend more time guessing where logic lives than writing code.”
- Usage: primary=Module-level explanations; secondary=chat Q&A; never use=advanced config tuning.
- Success: can locate controller→service→repo flow for assigned task.
- Abandon threshold: exits if parse summary fails without actionable recovery steps.

## 5. Functional Requirements
### FEAT-01 Repository Ingestion (P0, Sprint 1, 13 pts)
Owner: [PM] Product Manager + [DEV] Full Stack Lead
- Stories:
  - US-01 (5, Must): As Marcus, upload ZIP/path to start analysis.
  - US-02 (3, Must): As Aisha, view parse summary and skipped file reasons.
  - US-03 (3, Must): As David, receive sessionId for follow-up operations.
  - US-04 (2, Should): As any user, observe indexing progress.
- Acceptance:
  1. Given ZIP ≤50MB, when uploaded, then API returns `sessionId` UUIDv4 and parse summary within 10s.
  2. Given unsupported files, when parse completes, then skipped list includes filename + reason.
  3. Given idle session 30 minutes, when no API traffic occurs, then session is deleted and future calls return `SESSION_EXPIRED`.
  4. Given indexing in progress, when user opens chat tab, then UI shows progress and disables submit.
- DoD: unit/integration tests, API docs, QA signoff, PM demo, no P0/P1 open, upload+parse <10s benchmark.
- Out of scope: Git URL clone, archives >50MB, persistent repo storage.
- Edge/errors:
  - ZIP >50MB → reject → “Repository exceeds 50MB limit.”
  - Password ZIP → reject → “Password-protected archives are not supported.”
  - No supported files → reject → “No Java/JS/TS files were found.”
  - ZIP bomb signal → reject → “Archive structure is unsafe and was blocked.”
- UI states: empty, loading(progress bar), success(summary), error, partial(skipped files). Mobile: **No** for MVP.
- [DEV NOTE] classes: `RepoUploadController`, `RepoIngestionService`, `ZipSafetyScanner`, `SessionStoreService`; risk: archive traversal/zip bomb.

### FEAT-02 Code Understanding Engine (P0, Sprint 1-2, 13 pts)
- Stories US-05..08: extract AST, layer detection, module explain, dependency textual map.
- Acceptance:
  1. Given parsed repo, when understand called, then response contains classes/interfaces/methods/functions/imports counts.
  2. Given Java Spring patterns, when analyzed, then controllers/services/repositories/models are tagged.
  3. Given selected module path, when explanation requested, then summary includes purpose, key files, dependencies.
  4. Given unresolved syntax files, when parsing runs, then file-level parse errors are returned without aborting session.
- Out of scope: graphical dependency graph, runtime tracing, non-supported languages.
- Edge/errors: malformed file parse fallback; huge file skipped >100KB; cyclic deps summarized; empty module selection validation.
- UI: tree selection + loading skeleton + textual dependency list. Mobile: No.
- [DEV NOTE] `AstExtractionService`, `JavaAstAdapter`, `TsAstAdapter`, `CodeUnderstandingService`.

### FEAT-03 Documentation Generator (P0, Sprint 2, 13 pts)
- Stories US-09..12 covering README/API/class docs, scope selector, preview/download, regenerate.
- Acceptance:
  1. Given valid session/scope, when generate README, then output includes overview, prereqs, setup per OS, architecture, module index.
  2. Given REST endpoints detected, when API docs generated, then each endpoint lists method/path/request/response inference.
  3. Given file scope, when class/method docs generated, then output is Javadoc/JSDoc style markdown sections.
  4. Given regenerate clicked, when request completes, then new artifact version timestamp is updated.
- Out of scope: Confluence push, multilingual docs, diagram images.
- Edge/errors: AI timeout retry then fail; malformed AI markdown repaired once; zero endpoints yields explicit section text; scope path invalid.
- UI: markdown preview pane + raw download button + regenerate spinner. Mobile: No.
- [DEV NOTE] `DocumentationService`, `PromptOrchestrator`, `MarkdownSanitizer`.

### FEAT-04 Test Case Generator (P0, Sprint 2-3, 8 pts)
- Stories US-13..16 for 3 input modes and strict case composition + preview.
- Acceptance:
  1. Given NL input ≤2000 chars, when generate called, then output contains ≥3 positive, ≥3 negative, ≥2 edge cases.
  2. Given diff input >5000 chars, when submitted, then API rejects with `INPUT_TOO_LONG`.
  3. Given valid output, when rendered, then table columns match fixed order exactly.
  4. Given regenerate, when called, then fresh AI request id differs from prior request.
- Out of scope: direct Jira sync, custom column order, executable automation scripts.
- Edge/errors: unsupported diff format; empty input; malformed JSON AI output; concurrent generate blocked.
- UI: radio selector + input box + preview table + download CTA. Mobile: No.
- [DEV NOTE] `TestGenerationService`, JSON schema validator (Jackson), retry with strict prompt.

### FEAT-05 Chat with Repository (P1, Sprint 3, 8 pts)
- Stories US-17..20: ask questions with top-5 retrieval, citations, insufficient context, 10-turn memory.
- Acceptance:
  1. Given indexed session, when question asked, then response includes answer + citations(file path + line range).
  2. Given low retrieval confidence, when answer generated, then returns `INSUFFICIENT_CONTEXT` and no fabricated claim.
  3. Given >10 turns, when 11th added, then oldest turn dropped from context window.
  4. Given indexing incomplete, when chat opened, then input disabled and progress shown.
- Out of scope: voice chat, long-term memory, cross-session analytics.
- Edge/errors: vector db down; no relevant chunks; citation mismatch blocked; token overflow condensed.
- UI: chat panel, cited sources chip list, suggested prompts. Mobile: No.
- [DEV NOTE] `RagService`, `ChromaQueryService`, `CitationVerifier`.

### FEAT-06 CSV Export (P0, Sprint 3, 3 pts)
- Stories US-21..23: download and re-download with timestamp filename and BOM.
- Acceptance:
  1. Given generated tests exist, when download clicked, then file name matches `testcases_{repo}_{yyyyMMdd_HHmmss}.csv`.
  2. Given CSV opened in Excel, then characters render correctly using UTF-8 BOM.
  3. Given same session, when re-download clicked, then latest generated test set is exported.
  4. Given no testcases, when export requested, then API returns `INVALID_INPUT` with guidance.
- Out of scope: XLSX/PDF export, custom delimiter, cloud storage export links.
- Edge/errors: encoding exception; stale session; empty test list; illegal filename chars sanitized.
- UI: button appears post-generation only. Mobile: No.
- [DEV NOTE] `CsvExportService` using Apache Commons CSV.

## 6. Non-Functional Requirements
### Performance
| ID | Requirement | Target Metric | Measurement | Failure Behavior | Priority | [DEV] Note |
|---|---|---|---|---|---|---|
| NFR-PERF-01 | Upload+parse | <10s @50MB | endpoint p95 | show timeout + retry | P0 | async parse + stream unzip |
| NFR-PERF-02 | AST parse | <8s @50k LOC | service timer | partial parse output | P0 | parallel per file type |
| NFR-PERF-03 | Doc gen full repo | <10s | p95 `/doc/generate` | return retryable AI timeout | P0 | prompt budget + cache AST |
| NFR-PERF-04 | Doc gen single file | <3s | p95 | fallback concise mode | P1 | smaller prompt template |
| NFR-PERF-05 | Test generation | <5s | p95 | retry once then fail | P0 | strict JSON prompt |
| NFR-PERF-06 | RAG chat | <4s | p95 | insufficient context | P1 | top-5 retrieval cap |
| NFR-PERF-07 | CSV export | <1s | endpoint timer | return CSV_GENERATION_FAILED | P0 | in-memory rows |
| NFR-PERF-08 | FCP | <2s | Lighthouse CI | display lightweight shell | P1 | code split routes |
| NFR-PERF-09 | Route nav | <300ms | web vitals | keep previous view while loading | P1 | prefetch route chunks |

### Scalability
| ID | Requirement | Target | Measurement | Failure Behavior | Priority | Note |
|---|---|---:|---|---|---|---|
| NFR-SCALE-01 | Concurrent sessions | ≥10 MVP / ≥50 post | load test | reject new with retry-after | P1 | semaphore throttling |
| NFR-SCALE-02 | Repo size | 50MB max | request validator | REPO_TOO_LARGE | P0 | multipart cap |
| NFR-SCALE-03 | Max files | 500 | parse counter | stop parse with message | P0 | hard cap |
| NFR-SCALE-04 | Max LOC | 50,000 | parser counter | partial parse + warning | P1 | per-file truncation |
| NFR-SCALE-05 | Chunks/session | 10,000 | chunk metric | stop indexing + warn | P1 | chunk pruning |
| NFR-SCALE-06 | Chat history | 10 turns | session state check | drop oldest | P1 | ring buffer |

### Reliability/Security/Usability (condensed)
- Retry policy: exponential backoff 3 attempts for Gemini transient errors; no retry on invalid key.
- Source code logging forbidden; hash fingerprints only.
- Allowlist archive entries: `.java`, `.ts`, `.js`, `pom.xml`, `build.gradle`, `package.json`.
- Request size limits enforced in gateway + Spring multipart.
- CORS restricted to configured origins in prod.
- All async operations must show feedback in <300ms and cancel action where safe.

## 7. System Architecture
### 7a Overview
```text
[Angular SPA]
   | HTTPS JSON
   v
[Spring Boot API]
   |-- In-memory Session Store (ConcurrentHashMap)
   |-- AST Parsers (JavaParser, ts-morph sidecar)
   |-- Prompt Orchestrator
   |        |
   |        v
   |    [Gemini API]
   |
   v
[ChromaDB] <-> Embeddings/Top-5 Retrieval
```

### 7b Backend Layers
- Controller `com.airepoassistant.controller`: request validation, response envelope, rate limiting headers. MUST NOT contain business logic.
- Service `com.airepoassistant.service`: orchestration, business rules, session lifecycle. MUST NOT call HTTP directly except through integration layer.
- Integration `com.airepoassistant.integration`: Gemini + Chroma adapters, retry/backoff, serialization guards. MUST NOT know web DTOs.
- Domain `com.airepoassistant.domain`: entities and value objects. MUST NOT depend on Spring web.
- Config `com.airepoassistant.config`: bean wiring, properties, CORS, interceptors.
- Exception `com.airepoassistant.exception`: error codes, global handlers, mapping.

### 7c Frontend Architecture
- `src/app/core`: `api-client.service.ts`, interceptors, guards.
- `src/app/shared`: table, markdown-viewer, error-banner, progress components.
- `src/app/features/upload|explorer|documentation|test-generator|chat` standalone components.
- Signals for app/session state; HTTP services only for API calls; interceptors: loading and error normalization.
- Routes: `/upload`, `/explorer/:sessionId`, `/docs/:sessionId`, `/tests/:sessionId`, `/chat/:sessionId`.

### 7d Project Structure
```text
backend/src/main/java/com/airepoassistant/{controller,service,integration,domain,config,exception}
frontend/src/app/{core,shared,features/{upload,explorer,documentation,test-generator,chat},layouts}
```

### 7e Data Flows
- Flow A: browser upload → `POST /repo/upload` → zip safety scan → parse summary → create session UUID → async indexing kickoff → response.
- Flow B: docs click → `POST /doc/generate` with scope → gather AST/module context → Gemini pro call → markdown validate → return preview + download content.
- Flow C: test input submit → `POST /test/generate` → strict JSON parse/validate → table preview state → `GET /export/csv/{sessionId}` download.
- Flow D: upload triggers indexing → chunks to ChromaDB → user asks chat → top-5 retrieval → Gemini flash grounded response + citations.

### 7f Sequence (text)
- Upload: Browser→RepoController→RepoIngestionService→ZipSafetyScanner→AstService→SessionStore→Browser.
- Test gen: Browser→TestController→TestGenerationService→GeminiIntegration→ValidationService→Browser.
- Chat: Browser→ChatController→RagService→ChromaIntegration→GeminiIntegration→CitationVerifier→Browser.

### 7g Tech Rationale
| Technology | Chosen | Alternatives | Reason | Risk | Mitigation |
|---|---|---|---|---|---|
| Gemini API | 1.5 pro/flash | OpenAI, Claude | large context + speed tier split | cost/limits | quotas + retries + prompt budgets |
| ChromaDB | 0.4 self-host | Pinecone, Weaviate | local Docker simplicity | memory pressure | chunk cap + cleanup |
| JavaParser | 3.25 | Eclipse JDT | mature Java AST | exotic syntax edge cases | parse fallback |
| ts-morph | 21 | Babel parser | TS-friendly symbols | node sidecar complexity | adapter interface |
| Angular signals | Angular 17 | NgRx | lower MVP complexity | misuse for complex state | state boundaries |
| Spring Boot 3 | Java 17 | Micronaut | team familiarity | startup memory | tune JVM |
| In-memory store | ConcurrentHashMap | PostgreSQL/Redis | fastest MVP iteration | data loss on restart | explicit MVP constraint |

## 8. Environment & DevOps
### 8a Local Setup
```bash
git clone <repo>
cd ai-repo-assistant/backend
cp src/main/resources/application-dev.yml.example src/main/resources/application-dev.yml
mvn clean install -DskipTests
mvn spring-boot:run -Dspring-boot.run.profiles=dev

docker run -p 8000:8000 chromadb/chroma

cd ../frontend
npm install
ng serve --proxy-config proxy.conf.json
```

### 8b Environment Variables
| Variable | Required | Default | Description | Where to Get |
|---|---|---|---|---|
| GEMINI_API_KEY | Yes | none | Gemini auth key | Google AI Studio |
| GEMINI_MODEL_PRO | Yes | gemini-1.5-pro | docs/tests model | config |
| GEMINI_MODEL_FLASH | Yes | gemini-1.5-flash | chat model | config |
| CHROMADB_HOST | Yes | localhost | vector host | docker compose |
| CHROMADB_PORT | Yes | 8000 | vector port | docker compose |
| SESSION_TTL_MINUTES | Yes | 30 | idle expiry | app config |
| MAX_REPO_SIZE_MB | Yes | 50 | upload cap | app config |
| MAX_FILES_PER_SESSION | Yes | 500 | parse cap | app config |
| ALLOWED_ORIGINS | Yes | http://localhost:4200 | CORS | env |
| SPRING_PROFILES_ACTIVE | Yes | dev | profile | runtime |

### 8c GitHub Actions CI
```yaml
name: ci
on:
  pull_request:
  push:
    branches: [main]
    tags: ['v*']
jobs:
  build-test:
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with: {distribution: temurin, java-version: '17'}
      - uses: actions/setup-node@v4
        with: {node-version: '20'}
      - run: mvn clean test
      - run: npm ci --prefix frontend
      - run: npx ng test --watch=false --browsers=ChromeHeadless --code-coverage --project frontend
  integration:
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    services:
      chromadb:
        image: chromadb/chroma
        ports: ['8000:8000']
    steps:
      - uses: actions/checkout@v4
      - run: mvn verify -Pintegration-tests
  artifacts:
    if: startsWith(github.ref, 'refs/tags/v')
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: mvn package -DskipTests
      - run: npm ci --prefix frontend && npx ng build --configuration=production --project frontend
```

### 8d Standards
- Java: `@Slf4j`, Javadoc on public methods, unchecked custom exceptions, `ResponseEntity` from controllers.
- Angular: standalone components, `inject()`, signals for state, no inline styles, BEM CSS.

### 8e Git Workflow
- Branch: `feature/FEAT-XX-short-description`.
- Commit: `feat(FEAT-01): add repository upload endpoint`.
- PR: 1+ reviewer, passing CI, no conflicts.

## 9. API Specifications
All endpoints use envelope `{success,data,error,meta}` and `X-Session-Id` where relevant.

### Endpoint list
1) `POST /api/v1/repo/upload` (30 rpm/sessionless IP)
2) `GET /api/v1/repo/{sessionId}/structure` (60 rpm/session)
3) `POST /api/v1/repo/{sessionId}/understand` (30 rpm/session)
4) `POST /api/v1/doc/generate` (20 rpm/session)
5) `POST /api/v1/test/generate` (20 rpm/session)
6) `POST /api/v1/chat` (30 rpm/session)
7) `GET /api/v1/export/csv/{sessionId}` (30 rpm/session)
8) `DELETE /api/v1/repo/{sessionId}` (10 rpm/session)

#### Example: POST /api/v1/test/generate
```bash
curl -X POST http://localhost:8080/api/v1/test/generate \
 -H 'Content-Type: application/json' \
 -d '{
  "sessionId":"8f8cf37f-f7f4-494d-8d12-63686b395d25",
  "inputType":"NATURAL_LANGUAGE",
  "inputText":"As a loan officer, reject applications when debtToIncomeRatio > 0.45 and return HTTP 422.",
  "scope":"com.acme.loan.underwriting"
 }'
```
Success 200: returns array of 8+ cases with fixed columns.
Controller signature:
```java
@PostMapping("/api/v1/test/generate")
public ResponseEntity<ApiResponse<TestCaseGenerationResponse>> generateTests(@Valid @RequestBody TestCaseGenerationRequest request)
```
Validation: `@NotNull sessionId`, `@NotBlank inputType`, `@Size(max=5000) inputText`.

### Error Code Registry
| Error Code | HTTP | Retryable | Trigger | User Message | Where thrown |
|---|---:|---|---|---|---|
| REPO_TOO_LARGE | 413 | No | zip >50MB | Repository exceeds 50MB | Upload validator |
| REPO_PARSE_FAILED | 422 | No | parse exception | Could not parse repository | Parse service |
| REPO_EMPTY | 422 | No | archive empty | Uploaded repository is empty | Upload service |
| REPO_NO_SUPPORTED_FILES | 422 | No | none java/js/ts | No supported files found | Parse service |
| REPO_CORRUPTED | 400 | No | invalid zip | Archive is corrupted | Zip scanner |
| REPO_PASSWORD_PROTECTED | 400 | No | encrypted zip | Password ZIP not supported | Zip scanner |
| FILE_TOO_LARGE | 200 | N/A | >100KB file | File skipped due to size | Parse summary |
| AI_RATE_LIMIT_EXCEEDED | 429 | Yes | Gemini 429 | AI service busy | Gemini integration |
| AI_TIMEOUT | 504 | Yes | >30s | AI response timed out | Gemini integration |
| AI_RESPONSE_MALFORMED | 502 | Yes | invalid format | AI returned unusable data | Output validator |
| AI_EMPTY_RESPONSE | 502 | Yes | empty text | AI returned empty output | Output validator |
| AI_KEY_INVALID | 401 | No | bad key | AI credentials invalid | Gemini integration |
| SESSION_NOT_FOUND | 404 | No | unknown id | Session not found | Session store |
| SESSION_EXPIRED | 410 | No | ttl exceeded | Session expired; re-upload repository | Session store |
| SESSION_UNDERSTANDING_REQUIRED | 409 | No | precondition | Run code understanding first | Guard service |
| VECTOR_INDEX_NOT_READY | 409 | Yes | indexing pending | Indexing in progress | Rag service |
| VECTOR_DB_UNAVAILABLE | 503 | Yes | chroma down | Vector DB unavailable | Vector adapter |
| INVALID_INPUT | 400 | No | validation failed | Check request input | Controllers |
| INPUT_TOO_LONG | 413 | No | text too long | Input exceeds maximum length | Validators |
| UNSUPPORTED_DIFF_FORMAT | 422 | No | diff parse fail | Diff must be unified format | Test service |
| CSV_GENERATION_FAILED | 500 | Yes | encoding/write fail | Could not generate CSV | Csv service |
| CONCURRENT_REQUEST_REJECTED | 409 | Yes | in-flight lock | Request already in progress | Session lock service |

## 10. Data Model
Entities: `RepoSession`, `FileNode`, `CodeElement`, `GeneratedDocument`, `TestCase`, `ChatMessage`, `VectorChunk`, `ParseSummary`.

```java
public class RepoSession {
  @NotNull UUID sessionId;
  @NotBlank String repoName;
  Instant createdAt;
  Instant lastActivityAt;
  ParseSummary parseSummary;
  List<FileNode> fileTree;
  Map<String, GeneratedDocument> generatedDocs;
  List<TestCase> testCases;
  Deque<ChatMessage> chatHistory;
}
```
Storage key format: `session:{uuid}` in `ConcurrentHashMap<String, RepoSession>`.
Cleanup order on TTL: lock session → delete generated docs/tests/chat → delete vector chunks in Chroma (`collection=sessionId`) → remove map entry.
Jackson notes: use `@JsonInclude(NON_NULL)`, `@JsonFormat` for timestamps, `@JsonProperty` fixed CSV field names.

## 11. Prompt Engineering Templates
Prompts are stored in `src/main/resources/prompts/*.txt` and versioned in git.

### Template A (README/Architecture, gemini-1.5-pro)
```text
SYSTEM:
You are a senior software architect and technical writer. Produce deterministic Markdown documentation for a Java/TypeScript repository. Use only provided context. If information is missing, state "Not found in provided repository context".
Required sections in order:
1. Project Overview
2. Prerequisites
3. Setup Steps (Windows, macOS, Linux)
4. Architecture Summary
5. Module Index
6. API Summary
7. Known Gaps
Never invent endpoints, classes, or dependencies.
```
```text
USER TEMPLATE:
Repository Name: {{REPO_NAME}}
Language Breakdown: {{LANG_BREAKDOWN}}
Build Tools: {{BUILD_TOOLS}}
AST Summary JSON: {{AST_SUMMARY_JSON}}
Detected Endpoints JSON: {{ENDPOINTS_JSON}}
Selected Scope: {{SCOPE}}
Produce Markdown only.
```

### Template B (Test cases JSON, gemini-1.5-pro)
```text
SYSTEM:
Return ONLY valid JSON array. No markdown. No prose.
Each object keys in exact order:
Test_Case_ID,Category,Test_Scenario,Preconditions,Test_Steps,Expected_Result,Priority,Automation_Feasibility
Generate at least 8 items: >=3 Positive, >=3 Negative, >=2 Edge.
Allowed Priority: High|Medium|Low
Allowed Automation_Feasibility: Automatable|Manual Only|Conditional
```

### Template C (RAG chat, gemini-1.5-flash)
```text
SYSTEM:
Answer only from provided retrieved chunks.
If evidence confidence < {{CONFIDENCE_THRESHOLD}}, output exactly:
{"status":"INSUFFICIENT_CONTEXT","answer":"Insufficient repository context to answer safely.","citations":[]}
Else output JSON:
{"status":"OK","answer":"...","citations":[{"file":"...","startLine":1,"endLine":10}]}
Never fabricate file paths or line ranges.
```
Validation pseudo-code: parse JSON → required fields present → enum checks → citations map to known files/ranges.
Fallback: one retry with stricter reminder; then error code `AI_RESPONSE_MALFORMED`.

## 12. User Flows
1. First-time upload→README download (Marcus): upload, parse, generate docs, preview, download.
2. QA requirement→CSV (Priya): paste requirement, generate tests, preview table, export CSV.
3. New dev RAG chat (Aisha): wait for indexing, ask question, see cited response.
4. Tech lead module API docs (David): select package scope, generate API docs only.
5. Invalid ZIP recovery: error banner + actionable retry instructions.
Application state machine: `Idle -> Uploading -> Parsed -> Indexing -> Ready -> GeneratingDocs/GeneratingTests/Chatting -> Exported -> Expired/Deleted`; impossible transition: `Idle -> Chatting`.

## 13. Error Handling Matrix
Global handler: `@RestControllerAdvice GlobalExceptionHandler` mapping domain exceptions to envelope + requestId.
20 scenarios mapped to codes listed in section 9 with log levels: validation=INFO, retriable external= WARN, security violations=ERROR+alert.

## 14. Risk Register
| ID | Category | Description | L | I | Score | Mitigation | Owner | Early Signal |
|---|---|---|---:|---:|---:|---|---|---|
| R-01 | Technical | AI hallucination in docs/tests | 4 | 5 | 20 | citations + validator + warning label | PM/Dev | QA finds fabricated refs |
| R-02 | Cost | Gemini cost overrun | 4 | 4 | 16 | token budgets + model routing + quotas | PM | spend exceeds weekly cap |
| R-03 | Security | ZIP bomb/malicious upload | 3 | 5 | 15 | recursive depth + expansion ratio limits | Dev | scanner rejects spikes |
| R-04 | Timeline | Sprint1 slippage cascades | 4 | 4 | 16 | freeze scope + critical path monitoring | PM | blocked >15% capacity |
| R-05 | Technical | Chroma memory exhaustion | 3 | 4 | 12 | chunk cap + TTL cleanup | Dev | OOM warnings |
| R-06 | Product | generic unusable testcases | 3 | 4 | 12 | template constraints + QA rubric | PM | user rating <3.5 |
| R-07 | Security | CORS misconfiguration | 2 | 5 | 10 | env-based allowlist + integration test | DevOps | security scan alert |
| R-08 | Team | single-dev bus factor | 3 | 4 | 12 | pairing + docs + code ownership map | PM | PR bottleneck |
| R-09 | Technical | token limit exceeded | 3 | 4 | 12 | chunking + scope selector | Dev | frequent truncation logs |
| R-10 | Technical | AST parse edge failures | 3 | 3 | 9 | resilient parser + skip summaries | Dev | parse-failed ratio>
5% |
| R-11 | Product | fake citation trust loss | 2 | 5 | 10 | citation verifier hard-fail | PM/Dev | support tickets |
| R-12 | Technical | Angular/Spring version mismatch | 2 | 3 | 6 | pinned versions + CI smoke tests | Dev | dependency update failure |

## 15. Sprint Plan
- Sprint 1 goal: ingest+parse+session lifecycle demo (40 pts).
- Sprint 2 goal: docs + understanding engine end-to-end (40 pts).
- Sprint 3 goal: test generation, CSV export, basic RAG, perf hardening (40 pts).
Milestones: week2 upload/parse; week4 docs e2e; week6 test+csv; week8 rag basic; week10 integration/perf; week12 QA hardening.
Change protocol: PM requests; PM+Tech Lead approve; request ≥3 business days pre-sprint; Dev impact estimate <24h; log in CHANGELOG.

## 16. Stakeholder Matrix
Sign-off matrix includes PM, Tech Lead, QA Lead, Sponsor with weekly review cadence.
RACI:
- Scope changes: PM(A), Tech Lead(R), QA(C), Stakeholder(I).
- API design: Tech Lead(A/R), Backend(R), PM(C).
- Launch go/no-go: PM(A), Tech Lead(R), QA(R), Stakeholder(C).
Assumptions:
- [ASSUMPTION: Users allow source upload]. Risk if wrong: adoption blocked. Validate via pilot security questionnaire.
- [ASSUMPTION: Team has Spring/Angular proficiency]. Risk: velocity drop. Validate in week1 spike.
- [ASSUMPTION: Gemini pricing stable during MVP]. Risk: budget breach. Validate monthly vendor review.

## 17. Future Enhancements
### Horizon 1 (1–3 months)
1. Git URL clone/webhooks (not MVP due auth complexity) — David/Marcus.
2. Jira/TestRail/Azure export (not MVP due integration breadth) — Priya.
3. Diff-based doc update (not MVP due change graph complexity) — Marcus.
4. Visual sequence diagrams (not MVP due rendering stack) — David.
5. Authentication + persisted history (not MVP due DB + compliance) — all personas.

### Horizon 2 (6–12 months)
1. Additional languages (Python/Go/C#/Rust) unlock enterprise adoption.
2. VS Code plugin unlocks in-IDE workflow.
3. Team collaboration/shared sessions unlocks multi-role adoption.
4. Custom org prompt templates unlocks platform monetization.
5. AI vulnerability scanning unlocks security engineering use-cases.

## Appendix A: Glossary
- Time-to-first-value: upload to first usable artifact duration.
- RAG: retrieval augmented generation using vector similarity.
- TTL: idle session expiration window.

## Appendix B: Reference Docs & Libraries
- Spring Boot 3.2, Angular 17 standalone/signals, JavaParser 3.25, ts-morph 21, ChromaDB 0.4, Gemini 1.5 pro/flash.
