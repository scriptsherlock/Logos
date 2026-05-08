# Logos Implementation Log

## 2026-05-08 - Lightweight Login and User-Linked Student Flow

Implemented:
- Added JSON-backed `users` and `studentProfiles` to the backend data shape.
- Added demo users for existing seeded students and a demo teacher.
- Added `POST /api/auth/login` for lightweight MVP login/profile creation.
- Added `PATCH /api/students/:id/skills` so selected personal skills persist per student.
- Added frontend login route: `/login/student` and `/login/teacher`.
- Updated home cards to route through login before student/teacher pages.
- Added active-user localStorage helper in `frontend/src/hooks/useActiveUser.ts`.
- Updated student path, skills, workspace, and progress pages to use the logged-in student instead of `students[0]`.
- Updated teacher setup/dashboard pages to require a teacher login.
- Added a simple logout action in the header menu.

Verified:
- `npm run check` passed.
- Smoke test passed:
  - new student login creates/reopens a user
  - student profile is created
  - selected personal skills save
  - submission is linked to the logged-in student ID
  - rubric feedback still returns correctly

Notes:
- This is not production authentication. It is an MVP identity/profile layer using email + role, localStorage on the frontend, and JSON persistence on the backend.
- Passwords, sessions, route tokens, and production auth provider integration remain future work.
- Teacher dashboards can now aggregate multiple student submissions because new student submissions use separate student IDs.

## 2026-05-08 - Login Persistence and Skill Selection Fixes

Implemented:
- Fixed active-user state propagation so the app shell updates immediately after login/logout in the same browser tab.
- Added a visible signed-in user label in the header for desktop layouts.
- Updated the Home page to show "Welcome back" and a "Continue as..." action when a user is already signed in.
- Kept Student/Teacher login cards available for switching users.
- Fixed the student skill selection page so it shows the full Industry/Research skill catalog rather than only the previously selected tracked skills.
- Preserved saved personal skills by preselecting them without hiding the remaining available options.

Verified:
- `npm run check` passed.

Notes:
- A SQL database is still a future migration, not required for this bug fix. Current JSON persistence is enough to keep multiple MVP users and submissions, but it is not the final production storage model.

## 2026-05-08 - Student Growth Dashboard Tabs

Implemented:
- Added Core / Personal tabs to the student Growth Dashboard profile radar.
- Core tab shows foundational STEM skills from the logged-in student's growth profile.
- Personal tab shows the logged-in student's selected personal/path skills.
- Added a subtle selected-skills list below the radar so the dashboard clearly shows which skills are being viewed.
- Added weakest-skill text for the currently selected tab.
- Changed Teacher Dashboard module cards from "entries" to "students" for now.

Verified:
- `npm run check` passed.

## 2026-05-08 - Dashboard Submission Accuracy

Implemented:
- Teacher dashboard module cards now use per-module submitted-student counts from actual feedback records.
- Teacher dashboard overview student count now means unique students who submitted for the selected module.
- Module summaries now include submitted student count, submission count, average score, and latest activity timestamp.
- Student Growth Dashboard now includes a Recent Submissions section with module name, score, attempt number, date, and summary.
- Student dashboard "Time Engaged" now reflects recent analysed submissions rather than growth-event timeline points.

Verified:
- `npm run check` passed.
- Smoke test confirmed:
  - a new student submission appears in that student's growth profile `recentFeedback`
  - teacher dashboard module submitted-student count is based on module feedback records

## 2026-05-08 - Dashboard Count and History Fixes

Implemented:
- Removed the six-item cap from student `recentFeedback`; older analysed submissions are now returned instead of being hidden.
- Hardened teacher module summaries to expose both `studentCount` and `submittedStudentCount` based on unique students with feedback records for that module.
- Teacher module cards now fall back across `submittedStudentCount` and `studentCount` so stale frontend/backend response shape mismatches do not show zero incorrectly.
- Recent submission cards now fall back to module id and a generic summary when older records are missing newer display fields.

Verified:
- `npm run check` passed.
- Live API check against current `data/db.json` showed:
  - Natural Language Processing submitted students: 3
  - Natural Language Processing submissions: 29
  - Maya recent submissions returned: 12

## 2026-05-08 - Rubric-Specific Scoring Correctness

Implemented:
- Updated the AI grading prompt to explicitly evaluate each rubric independently using rubric name, description, scoring guidance, keywords, and skill links.
- Added scoring guidance that AI responses must return percentage scores, not raw rubric points.
- Reworked local fallback scoring so each rubric depends more heavily on rubric-specific signals instead of shared global text metrics.
- Local scoring now extracts rubric-specific evidence snippets and missing rubric signals.
- Added backend scoring diagnostics to feedback records when rubric scores are identical or unusually tightly clustered.

Verified:
- `npm run check` passed.
- Local scoring smoke test produced differentiated rubric scores for a partial NLP submission:
  - spread across rubric scores: 23 points
  - no identical-score diagnostic warning

## 2026-05-08 - Locked Workspace and Growth Event Visibility

Implemented:
- Locked the Student Workspace review layout to a viewport-height two-pane workspace.
- Added explicit `min-h-0` and independent overflow scrolling to both the student text pane and rubric feedback pane.
- Added `recentGrowthEvents` to the student growth profile response.
- Added a Skill Growth Events panel to the student Growth Dashboard.
- Added an empty state explaining that growth credits appear only after a rubric improves by at least 10 percentage points and reaches 60%.

Verified:
- `npm run check` passed.
- API check confirmed Maya currently has:
  - recent submissions: 20
  - recent growth events: 0
  - total growth: 0

Notes:
- Existing older submissions do not retroactively create growth events. Growth credits are only awarded on future qualifying resubmissions in the same session.

## 2026-05-08 - Strict Workspace Scroll Enforcement

Implemented:
- Made the `/student/workspace` route use a locked `h-screen` app shell with `main` set to `overflow-hidden` only for this route.
- Refactored Student Workspace into explicit scroll regions marked with `data-scroll-region` debug attributes.
- Left pane now uses a fixed top bar, internal editor scroll area, and pinned bottom action bar.
- Right pane now keeps score and summary outside the rubric scroll area; only rubric/generic feedback blocks scroll.
- Mobile layout stacks the panes inside the same locked workspace height, with fixed pane percentages and internal scroll areas.

Verified:
- `npm run check` passed.
- The intended scroll regions are:
  - `left-editor-scroll`
  - `right-rubric-scroll`

Notes:
- No business logic changed in this step.
- Skill Growth Events were already implemented; the dashboard shows the empty state when the signed-in student has no qualifying growth credits yet.

## 2026-05-08 - Strict AI Error Handling

Implemented:
- Kept the grading prompt in `server.js` inside `buildBrainSystemPrompt()`, which is passed to the OpenAI-compatible chat call in `runOpenAiBrain()`.
- Changed strict `BRAIN_MODE=openai` behaviour so provider failures no longer silently fall back to local keyword scoring.
- Added structured API error fields for failed AI grading: `code`, `providerStatus`, and a user-facing error message.
- Updated the frontend API client to preserve response status/code metadata.
- Updated Student Workspace to show an in-page AI grading notification when the provider returns an error such as 429, 503, or another unavailable state.

Verified:
- `npm run check` passed.

Notes:
- `BRAIN_MODE=auto` can still fall back to local scoring for development.
- `BRAIN_MODE=openai` should be used when rubric grading must be AI inference only.
- Database cleanup should be done into a fresh database file or SQL store, not by merging duplicate demo identities into the existing active `db.json`.

## 2026-05-08 - Clean DB and AI-First Rubric Grading

Implemented:
- Added `LOGOS_DB_PATH` support and changed the default runtime database to `data/logos.db.json`.
- Created a clean `data/logos.db.json` with the two required modules, clean skills/personas, and no old submissions, feedback, sessions, or duplicate demo users.
- Left `data/db.json` untouched as the old noisy data file.
- Rewrote the grading system prompt to require rubric-by-rubric inference, evidence citation, conservative scoring when evidence is missing, and no keyword-based grading.
- Renamed the local grading provider to `deterministic-dev-fallback` so local scoring is clearly not production AI grading.
- Added `strictAi` to brain status.
- Added `skillGrowthDiagnostics` to submission analysis responses so growth/no-growth decisions can be inspected per rubric.
- Added frontend typing for `skillGrowthDiagnostics`.

Verified:
- `npm run check` passed.

Notes:
- Full SQLite persistence is still pending. This pass chooses the lower-risk clean JSON database path first.
- A deeper `server.js` split is still pending; no working backend routes were deleted.

## 2026-05-08 - Removed Legacy Quick Feedback State

Implemented:
- Removed `quickFeedbackConfig` from `data/logos.db.json`.
- Stopped `ensureDataShape()` from re-injecting quick feedback state into the active Logos DB.
- Removed the unused legacy quick feedback configuration, OpenAI call, prompt, and normalisation helpers from `server.js`.
- Left the legacy `/api/quick-feedback/*` route paths returning `410 Gone` so old callers get an explicit removal response.

Verified:
- `npm run check` passed.
- Search confirmed no quick feedback config or helper functions remain, aside from the intentional cleanup guard and `410 Gone` route responses.

## 2026-05-08 - Removed Belongingness Skills From Clean DB

Implemented:
- Removed belongingness skill rows from `data/logos.db.json`.
- Removed belongingness skills from the backend seed catalog so reset/fresh DB creation does not bring them back.
- Stopped `getTrackedSkillIds()` from automatically adding belongingness skills to each student profile.

Verified:
- `npm run check` passed.

Notes:
- `users` are login identity records: name, email, role, and the linked student profile id for student accounts.
- The old belongingness check-in endpoint remains disconnected for now; without belongingness skills in the catalog, it does not create visible growth skills.

## 2026-05-08 - Hardened Model JSON Parsing

Implemented:
- Added strict prompt language requiring a single JSON object with no markdown, XML tags, thought blocks, or prose.
- Added tolerant model response parsing for providers that wrap JSON in `<thought>`, `<think>`, or fenced code blocks.
- Added a clearer invalid-JSON provider error message for models that do not support reliable JSON output.

Verified:
- `npm run check` passed.

Notes:
- Gemma-style models may emit reasoning text even when JSON is requested. The parser now recovers when valid JSON is still present in the response.

## 2026-05-08 - Submission Session Continuity Fix

Implemented:
- Updated `getSubmissionSession()` so a new analysis request without an explicit `sessionId` reuses the latest session for the same student and module.
- This prevents revised submissions from becoming separate attempt-1 sessions after navigation or refresh.

Verified:
- `npm run check` passed.

Notes:
- Rick's existing 65 and 88 feedback records are already stored as two separate sessions, both attempt 1, so they did not trigger session-based growth retroactively.
- Future revisions for the same student/module will now count as later attempts in the latest session unless a new assignment/session concept is added.

## 2026-05-08 - Reset Clean Logos DB

Implemented:
- Reset `data/logos.db.json` back to the clean starter state.
- Preserved only the skills/personas, Natural Language Processing, and Green Chemistry seed modules.
- Cleared users, students, submissions, sessions, feedback records, growth events, custom modules, and teacher module configs.

Verified:
- JSON validation confirmed:
  - modules: 2
  - users/students/submissions/feedback/growth: 0
  - belongingness skills: 0
  - quick feedback config: false
- `npm run check` passed.

## 2026-05-08 - Growth Chart and Scaled Awards

Implemented:
- Replaced the Growth Dashboard trajectory placeholder series with real per-skill growth event lines.
- The chart now uses `recentGrowthEvents` and plots cumulative growth per awarded skill.
- Changed rubric-improvement awards from a flat `+1` to scaled credit:
  - `+1` for 10-19 point improvement
  - `+2` for 20-34 point improvement
  - `+3` for 35-59 point improvement
  - `+4` for 60+ point improvement
- Preserved the gate that a skill/rubric/session can only award once.

Verified:
- `npm run check` passed.

Notes:
- Previous graph labels were placeholder series, so the graph did not clearly reflect real skill growth even when growth events existed.

## 2026-05-08 - Frontend Rename, Skill Graph Selector, Teacher Drill-Down, and Clean Reset

Implemented:
- Renamed the React app folder from `AI Collab` to `frontend`.
- Updated root scripts, backend static file serving, docs, and visible app title references to use `frontend` / Logos.
- Replaced the multi-series skill trajectory graph with a skill dropdown and single selected-skill trajectory line to avoid label/line overlap.
- Added module selection and rubric drill-down to the teacher dashboard.
- Added richer teacher mitigation text using affected student count, common missing evidence, and rubric scoring guidance.
- Upgraded per-rubric Answer with Logos hints into structured targeted guidance paragraphs.
- Changed backend DB shape handling so `logos.db.json` modules are preserved instead of being overwritten by fallback seed modules on load.
- Reset `data/logos.db.json` again to a clean Logos-only starter with two modules, no users, no students, no submissions, no feedback, and no growth events.

Verified:
- `npm run check` passed.
- Temporary server bootstrap on port 3100 returned:
  - modules: Natural Language Processing, Green Chemistry
  - users: 0
  - students: 0
  - submissions: 0
  - growth events: 0

## 2026-05-08 - Collapsible Teacher Rubric Drill-Down and AI Mitigation

Implemented:
- Made teacher rubric drill-down rows collapsed by default.
- Clicking a rubric row expands student-level details:
  - student name
  - latest attempt number
  - rubric score
  - overall score
  - latest submission date
  - targeted missing-evidence message
- Backend now returns all latest student rows per rubric instead of only the first failing students.
- Added AI-generated teacher mitigation when the configured OpenAI-compatible provider is available.
- Kept deterministic mitigation as a fallback and marks the source as `AI generated` or `Local fallback` in the UI.

Verified:
- `npm run check` passed.
- Temporary dashboard smoke test on port 3100 returned 2 modules, 7 NLP criteria, and local mitigation source with the clean DB.
