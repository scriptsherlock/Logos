
You are working as an integration engineer and product-aware full-stack engineer on my existing app, Logos.

Logos is a STEM learning companion with:
- React + Vite frontend
- Backend already present
- Figma connected through MCP
- Existing Logos UI style must remain the visual source of truth

IMPORTANT:
Do not redesign the UI.
Do not change the overall Logos visual style.
Do not introduce loud dashboards, gradients, unrelated gamification, or visual clutter.
Preserve the current minimal/editorial style:
- light background
- serif headings
- subtle borders
- spacious cards
- muted text
- black primary buttons
- delicate form controls

This prompt is for planning and proposing changes first.
Do not implement immediately.
First inspect the repo and produce a careful implementation plan.

====================================================
CURRENT PRODUCT CONTEXT
====================================================

The app currently supports:
- Teacher/faculty module creation
- Rubric upload/extraction
- Student work submission
- AI feedback
- Growth dashboard
- Faculty dashboard

We are moving from a single-user/static prototype toward a persistent multi-user product where:

1. Teachers create modules.
2. Teachers upload/edit/save rubrics for each module.
3. Students log in and submit work against saved modules.
4. AI grades student work against saved rubrics.
5. Students can revise/resubmit.
6. Skill growth is tracked based on meaningful rubric improvement.
7. Teachers see cohort analytics across multiple students.

====================================================
HIGH-LEVEL PRODUCT FLOW TO SUPPORT
====================================================

Faculty flow:
1. Teacher logs in.
2. Teacher creates or selects a module.
3. Teacher enters syllabus/objective.
4. Teacher uploads rubric file or selects a template.
5. AI extracts rubric criteria.
6. Teacher reviews/edits rubrics.
7. Teacher links rubrics to skills.
8. Teacher saves the module.
9. The saved module and rubrics become available to students.

Student flow:
1. Student logs in.
2. Student has selected core and personal/industry skills.
3. Student selects a module.
4. Student writes or uploads work.
5. Student submits work for analysis.
6. AI evaluates against that module’s saved rubrics.
7. Student sees:
   - Score: x/100
   - one summary line
   - rubric-by-rubric feedback
8. Student revises and resubmits.
9. Skill growth is tracked only when meaningful rubric improvement occurs.

Teacher review flow:
1. Teacher opens dashboard.
2. Teacher sees modules/cohorts.
3. Teacher sees how many students are struggling.
4. Teacher sees which rubrics are most commonly failed.
5. Teacher sees AI-generated mitigation suggestions.
6. Teacher can drill down into students/module/rubric performance later.

====================================================
IMPORTANT ARCHITECTURE QUESTION
====================================================

We now likely need authentication, roles, and a database.

Please inspect the repo and tell me:
1. Does auth already exist?
2. Does a DB already exist?
3. Is storage currently in memory, local storage, static mock data, JSON files, or real database?
4. What backend framework is being used?
5. What frontend routing is being used?
6. What APIs already exist?
7. What is the lowest-risk way to add persistence and multiple users?

Do not add auth/db immediately without explaining the tradeoffs.

However, I expect that for the real multi-student flow, we need at minimum:
- User authentication
- User roles: teacher and student
- Persistent modules
- Persistent rubrics
- Persistent student profiles
- Persistent submissions
- Persistent attempts
- Persistent rubric scores
- Persistent skill growth events

====================================================
PROPOSED DATA MODEL
====================================================

Inspect the existing data model first. If no real data model exists, propose one.

Conceptual entities:

User:
- id
- name
- email
- role: "teacher" | "student"
- createdAt

StudentProfile:
- id
- userId
- selectedCoreSkillIds
- selectedPersonalSkillIds

Skill:
- id
- name
- type: "core" | "personal"
- description?

Module:
- id
- teacherId
- title
- syllabusObjective
- createdAt
- updatedAt

Rubric:
- id
- moduleId
- name
- description
- scoringGuidance
- weight
- maxScore
- createdAt
- updatedAt

RubricSkillLink:
- id
- rubricId
- skillId

SubmissionSession:
- id
- studentId
- moduleId
- createdAt
- updatedAt
- status

SubmissionAttempt:
- id
- sessionId
- attemptNumber
- text
- uploadedFilePath?
- createdAt

AttemptRubricScore:
- id
- attemptId
- rubricId
- score
- maxScore
- normalizedScore
- whatsGood
- whatsMissing
- evidence?
- createdAt

SkillGrowthEvent:
- id
- studentId
- skillId
- rubricId
- sessionId
- pointsAwarded
- reason
- createdAt

Hint:
- id
- attemptId
- rubricId
- hintText
- suggestedRevision?
- targetText?
- createdAt

If the current app is not ready for all of this, propose an incremental version.

====================================================
UI CHANGE 1: GROWTH DASHBOARD
====================================================

Problem:
The current Growth Dashboard does not clearly show the student’s selected skills. The radar/pentagon chart looks generic.

Required change:
The radar/pentagon chart should have two tabs:

1. Core
2. Personal

Core tab:
Shows foundational/core skills:
- Technical understanding
- Mathematical reasoning
- Data literacy
- Problem decomposition
- Critical thinking

Personal tab:
Shows the student’s selected personal/industry skills, for example:
- Stakeholder awareness
- Practical problem solving
- Delivery and execution
- Testing and quality
- Tool fluency

Requirements:
- Use the student’s actual selected skills where available.
- If no real user/auth exists yet, use the current mock selected skills but structure the code so it can connect to real data later.
- Keep the visual style consistent with the current dashboard.
- Do not add flashy gamification.
- Keep the existing cards like Highest Skill, Most Improved, Time Engaged, but make sure they are based on real or mock skill data.
- Add subtle clarity around whether the user is viewing Core or Personal skills.

Optional additions:
- Show weakest skill.
- Show number of growth events.
- Show selected skills below the chart in a subtle list.

====================================================
UI CHANGE 2: STUDENT SUBMISSION TEXTBOX
====================================================

Problem:
The current student writing/input box is too small. It feels like a comment box, not a writing workspace.

Required change:
Make the text writing area larger and make it take up most of the available screen/card.

Requirements:
- Keep module selector at the top.
- Keep upload file option.
- Make the text area taller and wider.
- The submit button can stay bottom-right.
- Preserve Logos UI style.
- Do not make the page visually cluttered.
- The writing space should feel like a proper submission editor.

Suggested layout:
- A central large card
- Header row: module dropdown + upload file
- Large writing area
- Footer row: submit button

====================================================
UI CHANGE 3: POST-ANALYSIS SPLIT VIEW
====================================================

Problem:
After analysis, the full page becomes vertically long because the rubrics stack downward. This breaks the reading/review experience.

Required change:
After analysis, lock the review page into a stable split view.

Layout:
- Left side: student submission text
- Right side: score + summary + rubric feedback
- The overall page should not become one endless vertical scroll.
- The rubric feedback panel should be internally scrollable.
- The student text panel may also scroll independently if needed.

Requirements:
- Keep the header stable.
- Keep both panes visible.
- The right panel should show:
  1. Score: x/100
  2. One short summary line
  3. Rubrics section
- Rubrics should scroll inside their panel.
- Preserve the existing two-column Logos review style.
- Avoid viewport overflow issues.

====================================================
UI CHANGE 4: FEEDBACK FORMAT
====================================================

Required feedback display order:

1. Score: x/100

2. One short summary line:
Example:
"Your submission explains the high-level idea clearly, but it needs stronger evidence, metrics, and error analysis."

3. Rubrics:

For each rubric block:

Rubric name: Score

What's good:
- short explanation

What's missing:
- short explanation

Button:
"Answer with Logos"

Example:

Problem framing and clarity: 7/10

What's good:
The task is framed as binary sentiment classification and the label setup is mostly clear.

What's missing:
The report does not clearly explain constraints, assumptions, or why the setup is appropriate for the dataset.

[Answer with Logos]

Requirements:
- Use rubric-based feedback if rubrics exist.
- Use generic feedback only as fallback if no rubrics exist.
- Do not show generic “Strengths / Areas to Refine / Editorial Guidance” as the primary format when rubrics exist.
- Keep the UI consistent with Logos.
- Each rubric block should feel like a clean editorial card.

====================================================
UI CHANGE 5: FACULTY DASHBOARD
====================================================

Problem:
The current faculty dashboard has placeholder-style insights and mitigation text. It should become useful for multiple students.

Required change:
Faculty dashboard should show cohort-level insight.

For each module, show:
- number of students
- number of submissions
- median or average overall score
- number of students below support threshold
- most failed rubric
- latest activity if available

Cohort Insights panel should include:
- failing rubric alerts
- student count affected
- module name
- AI-generated mitigation

Example:

Feedback Alert:
7 students are currently below threshold in "Evaluation & Evidence" for Natural Language Processing.

AI-generated mitigation:
Students are consistently missing quantitative evaluation evidence. In the next workshop, reinforce how to report accuracy, precision, recall, and F1 with short interpretation. Consider giving students a small comparison exercise where they justify which metric is most appropriate for a sentiment classifier.

Requirements:
- Do not hardcode nonsensical mitigation.
- If no AI mitigation endpoint exists, create a clear placeholder function that receives:
  - module
  - weak rubric
  - failing student count
  - common missing evidence
  and returns an AI-generated or stubbed mitigation.
- Make the data model ready for multiple students.
- If the app currently only has one student/mock submission, create mock cohort data in a clean place until persistence is added.
- Keep the design subtle.

====================================================
PRODUCT CHANGE 6: TEACHER-SAVED RUBRICS AND PERSISTENCE
====================================================

Confirm and support this flow:

Teacher saves module + rubrics first.
Students then submit work against the saved persistent module.

Required:
- Modules should persist.
- Rubrics should persist with modules.
- Multiple students should be able to submit against the same module.
- Teacher dashboard should aggregate results for a module.

If there is no DB yet:
- Propose the best minimal DB option for this repo.
- Do not implement a complex DB migration until I approve.
- Provide a staged plan.

If local/mock persistence exists:
- Explain what needs to change to support real multi-user persistence.

====================================================
PRODUCT CHANGE 7: AUTH AND ROLES
====================================================

Question:
Would adding auth now be a good idea?

Expected answer:
Probably yes, because multiple students and teacher dashboards require identity.

Please propose:
- minimal auth strategy
- user roles: teacher, student
- route protection
- how existing pages map to roles
- what can be stubbed for MVP

Role-based routing concept:

Teacher can access:
- faculty dashboard
- module creation
- rubric management
- cohort analytics

Student can access:
- skill selection/onboarding
- submission page
- feedback page
- growth dashboard

Do not implement auth until the plan is approved unless I explicitly ask you to proceed.

====================================================
PRODUCT CHANGE 8: ANSWER WITH LOGOS
====================================================

Problem:
Currently, Answer with Logos only gives more generic suggestions.

Required future behavior:
Answer with Logos should become rubric-specific writing help.

When clicked for a rubric:
1. Identify the weak part of the student submission relevant to that rubric.
2. Highlight or reference the relevant part of the student text.
3. Generate a suggested revision or insertion.
4. Explain why the revision helps the rubric.
5. Do not automatically rewrite the full answer.
6. Do not auto-submit the answer.

Example:
For Evaluation & Evidence:

Highlighted issue:
"The model performed well on the dataset."

Suggested revision:
"The model achieved 84% accuracy and an F1 score of 0.82 on the test set, suggesting reasonably balanced performance across positive and negative classes."

Explanation:
This adds measurable evidence and interprets the model’s performance, which directly improves the Evaluation & Evidence rubric.

MVP behavior:
- Show suggestion in a side panel or inline under the rubric.
- Optionally provide a button like "Insert into draft" later.
- Do not auto-apply unless explicitly implemented as a transparent user action.

Hint unlock rule:
Detailed Answer with Logos help unlocks if:
- student has made at least 3 attempts in this session
AND
- that rubric score is still below 70%

Before unlock:
Show locked/disabled state:
"Detailed help unlocks after 3 attempts if this rubric is still below 70%."

After unlock:
Show rubric-specific targeted help.

====================================================
PRODUCT CHANGE 9: RUBRIC-SPECIFIC SCORING BUG
====================================================

Observed issue:
For a strong/perfect student response, the app gave the same score for all rubrics, e.g. 96/100 for every rubric.

This is likely wrong.

Please investigate the scoring pipeline.

Possible causes:
1. Backend computes one generic overall score and copies it to every rubric.
2. Rubric prompts are too generic or identical.
3. Rubrics are displayed in UI but not actually used during scoring.
4. The model evaluates the whole answer once and then templates every rubric block.
5. Same normalized score is assigned to each rubric.
6. The scoring parser ignores per-rubric model output.

Required fix:
Each rubric must be evaluated independently.

For each rubric:
- use rubric name
- use rubric description
- use scoring guidance
- use max score / weight
- evaluate the student submission specifically against that rubric
- produce:
  - rubric score
  - max score
  - normalized score
  - what’s good
  - what’s missing
  - evidence from submission if available

Overall score should be computed from rubric scores:
- weighted average if weights exist
- simple average if no weights exist

Do not assign the same score to all rubrics unless the independent rubric evaluation genuinely returns the same score.

Please inspect existing code and explain exactly why identical scores are happening before changing it.

====================================================
PRODUCT CHANGE 10: SKILL GROWTH LOGIC
====================================================

Keep the previously agreed logic.

Important principle:
Performance score and growth score are separate.

Do not award skill points for every resubmission.

Skill growth should be awarded only when a student meaningfully improves on a rubric linked to a skill.

MVP rule:

For each assignment/session and rubric:
- Track the initial rubric score percentage.
- Track the best rubric score percentage across attempts.
- Calculate improvement = best - initial.
- If improvement >= 10 percentage points
  AND best rubric score >= 60%
  AND skill credit has not already been awarded for this rubric in this session,
  THEN award +1 point to each linked skill for that rubric.

Definitions:
- A session means one student submission task/assignment with multiple attempts.
- A rubric score percentage means score / maxScore * 100.
- Award at most once per skill per rubric per session.

Example:
Attempt 1 Technical understanding = 40%
Attempt 2 Technical understanding = 52%
Attempt 3 Technical understanding = 65%

Improvement = 25 percentage points.
If Technical understanding rubric is linked to:
- Technical understanding
- Tool fluency

Then award:
- Technical understanding +1
- Tool fluency +1

Only once for that session.

This growth data should feed the Growth Dashboard.

====================================================
REQUESTED OUTPUT BEFORE IMPLEMENTING
====================================================

Do not code yet.

First inspect the repo and produce this structured report:

1. Current architecture summary
   - frontend framework
   - backend framework
   - routing
   - API routes
   - data storage
   - auth status
   - LLM/AI integration status

2. Current relevant files
   - growth dashboard files
   - student submission page files
   - feedback/review page files
   - faculty dashboard files
   - module/rubric files
   - backend grading files
   - backend routes
   - mock data locations

3. Confirmed issues
   - why growth dashboard is not using selected skills
   - why textbox is small
   - why review page becomes vertically long
   - whether faculty dashboard is static/mock
   - whether rubrics persist
   - whether multiple students are supported
   - why rubric scores are identical

4. Proposed data model
   - what already exists
   - what needs to be added
   - what can be stubbed first

5. Proposed implementation phases
   Keep this incremental.

   Phase 1: UI restructuring only
   - Growth dashboard Core/Personal tabs
   - larger student writing area
   - post-analysis split view with scrollable rubric panel

   Phase 2: scoring correctness
   - investigate identical rubric scores
   - make grading truly rubric-specific
   - compute overall score from rubric scores

   Phase 3: teacher dashboard cohort insights
   - support mock multi-student cohort data if DB not ready
   - failing rubric counts
   - AI/stub mitigation based on weak rubrics

   Phase 4: persistence/auth proposal
   - propose auth + roles
   - propose DB
   - propose migration/staged rollout
   - do not implement until approved

   Phase 5: Answer with Logos
   - targeted rubric-specific help
   - highlight/reference weak part of text
   - suggested revision text
   - hint unlock behavior

   Phase 6: skill growth persistence
   - sessions/attempts
   - growth events
   - dashboard integration

6. Risks / decisions needed
   - auth provider choice
   - DB choice
   - whether to implement mock persistence first
   - whether Answer with Logos should insert text or only suggest
   - how to handle uploaded files

7. Recommended immediate next step
   Tell me what single slice should be implemented first and why.

====================================================
CONSTRAINTS
====================================================

- Do not implement everything at once.
- Do not redesign the app.
- Do not break the existing UI style.
- Do not replace Vite/React.
- Do not create giant files.
- Do not delete working functionality.
- Do not invent new product areas.
- Keep all changes explainable and incremental.
- Use existing Figma/MCP components and visual style where useful.
- Update docs/implementation-log.md after any future implementation.
- If docs/logos-spec.md exists, update it with any corrected understanding.
- If it does not exist, propose creating it.

Start by inspecting the repo and producing the structured report only.

