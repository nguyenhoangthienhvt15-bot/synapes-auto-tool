# AGENTS.md — Synapes Auto Video AI Engineering & Anti-Fake Guardrails

This repository powers the Synapes Auto Video Studio (React + Vite + Three.js + Wawa-Lipsync + Mediabunny WebCodecs + Node/FastAPI Backend + Manifest V3 Companion + Cloud Railway/Kaggle ComfyUI GPU Pipeline).

## Core Architectural Invariants
1. **Zero Fake Activity**:
   - Research APIs (`server/topicResearchService.ts`, `/api/topic-research`, `/api/video-broll-search`) MUST return exact HTTP 400 on empty input, honest `[]` / `''` when zero verifiable sources exist, and propagate real network errors instead of Unsplash/placeholder URLs.
   - Render & Webhook services (`src/services/pluginWebhookService.ts`, `/api/render-jobs/submit`, `/api/plugin/dispatch`) MUST enforce `>= 60000ms` timeout thresholds and return real HTTP errors / honest async job IDs (`queued` / `processing` / `completed`).
2. **Semantic Pipeline Isolation (`src/services/semanticPipelineRouter.ts`)**:
   - Flow 1 (`news_finance`): Verified RSS + Wikimedia/NASA B-roll + Financial Disclaimers.
   - Flow 2 (`3d_animation_kids`): Automatically locks Wikimedia news search (`lockWikimediaSearch = true`), binds Character Consistency Vault + COPPA `Made for Kids` safety flags + ComfyUI Wan2.1 / Three.js GLTFLoader + Wawa-Lipsync.
   - Flow 3 (`science_math_explainer`): Three.js 3D geometric / Manim visual stage.
3. **Cloud-Offload Hardware Boundary**:
   - Do not execute Docker Compose or local AI checkpoints on developer laptops with 8GB RAM. All CI checks run lightweight static analysis, Semgrep, Gitleaks, Vitest, and Integrity checks in GitHub Actions.
