# AI Repo Assistant - Business User Guide

## Purpose
This guide explains the platform in business terms so product managers, QA leads, delivery managers, and operations stakeholders can use it without deep code knowledge.

## What Problem It Solves
- Speeds up repository onboarding for non-engineering stakeholders.
- Converts source code into understandable summaries and documentation.
- Produces test scenarios that can be reused for acceptance planning.
- Answers repository questions with traceable citations.

## Target Users
- Product Managers
- Business Analysts
- QA / Test Managers
- Delivery / Project Managers
- Engineering Managers (high-level review mode)

## End-to-End Workflow
1. **Upload Repository**
   - Upload a ZIP package to start a new analysis session.
   - Receive a `sessionId` that is used in follow-up actions.

2. **Understand Repository**
   - Generate a high-level summary of the repository contents and limits.
   - Review file volume, LOC indicators, and skipped files (if any).

3. **Generate Documentation**
   - Create business-oriented documentation from the analyzed session.
   - Reuse output for stakeholder briefings and planning workshops.

4. **Generate Test Scenarios**
   - Produce user-friendly positive, negative, and edge test scenarios.
   - Use scenarios as a baseline for UAT and release readiness checks.

5. **Ask Questions**
   - Ask product/behavior questions about the repository.
   - Validate answers through provided citations.

## Business Outputs
- Executive-readable repository summary
- Business + technical markdown documentation
- Structured test scenarios for QA planning
- Citation-backed Q&A responses

## Success Indicators
- Stakeholders understand core repository behavior in one session.
- Time to produce review documentation is reduced.
- QA can initiate acceptance planning from generated scenarios.
- Fewer clarification cycles between product and engineering teams.

## Operational Notes
- Sessions are temporary and may expire; re-upload if needed.
- Input size limits are enforced to keep response quality stable.
- This is an assistant for acceleration, not a replacement for final engineering validation.

## Recommended Governance
- Assign an owner for each generated artifact before release use.
- Include generated outputs in sprint/release evidence folders.
- Confirm critical business flows with engineering sign-off.
