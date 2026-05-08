You are working as an integration engineer on my existing React + Vite app with a backend already present.

Figma is connected through MCP. Use the existing Figma-generated UI/style as the visual source of truth.

IMPORTANT PRODUCT CONTEXT:
This app is called Logos, a STEM learning companion. It lets an instructor/admin create or select a module, provide syllabus/objective context, upload rubrics, and then lets students submit work. The AI grades work against the module rubrics and gives actionable feedback. Rubrics may be linked to student skills. Skill growth should be based on meaningful improvement across attempts, not just repeated submissions.

DO NOT:
- Do not redesign the UI.
- Do not change the overall visual style, typography, spacing system, or aesthetic.
- Do not replace the React/Vite stack.
- Do not introduce a completely new architecture.
- Do not delete working backend functionality.
- Do not invent unrelated features.
- Do not create a massive single-file implementation.
- Do not make the AI feedback generic if rubrics exist.
- Do not auto-award skill points on every resubmission.

DO:
- Preserve the existing Figma UI style.
- Refactor only where needed to support the new flow.
- Keep changes modular.
- Reuse existing components where possible.
- Add backend support only where necessary.
- Add clear TypeScript types/interfaces where applicable.
- Add loading/error states where API calls are involved.
- Keep the app usable even if rubrics are not provided.

Before coding, inspect the repo and report:
1. Frontend framework confirmation.
2. Backend framework confirmation.
3. Existing routes/API endpoints.
4. Current module creation files/components.
5. Current student feedback/submission files/components.
6. Current mock data locations.
7. Current database/storage model, if any.
8. Proposed file-by-file change plan.

Only after that, implement the changes.

====================================================
FEATURE 1: MODULE CREATION FLOW
====================================================

Current issue:
The create module screen has both:
- Module Name textbox
- Existing Module dropdown

This is redundant.

Required new behaviour:

Default mode: Existing Module mode
Show:
- Existing Module dropdown
- Add Module button next to the dropdown
- Syllabus / Objective textarea
- Evaluation Rubrics upload area
- Template selection, if already present
- Create/Save Module button

Do NOT show the Module Name textbox in this mode.

When the user clicks Add Module:
Switch to New Module mode.

New Module mode should show:
- New Module Name textbox
- Syllabus / Objective textarea
- Evaluation Rubrics upload area
- Template selection, if already present
- Create Module button

Do NOT show:
- Existing Module dropdown
- Add Module button

The Syllabus / Objective field is shared across both modes.

Preserve the existing visual style from the Figma UI.

====================================================
FEATURE 2: RUBRIC EXTRACTION AND EDITING
====================================================

When a user uploads an evaluation rubric file, the AI/backend should extract the main rubrics and return structured rubric objects.

The UI should then display editable rubric cards/blocks below the upload area.

Each rubric should contain:
- Rubric name
- Editable description
- Optional scoring guidance / default prompt
- Optional weight
- Optional tags linked to skills
- Button to remove rubric
- Button to add another rubric

Rubric description default/help text:
"Add what you want to see in a strong submission for this criterion."

The user should be able to edit all extracted rubrics before saving the module.

Rubric tags:
Rubrics can be linked to core and personal skills selected by the student/onboarding flow.
Tags are optional.
Use the existing skills from the app if they already exist.
If skills are not already in backend storage, create minimal support for them.

Example extracted rubrics for NLP may look like:
- Technical understanding
- Evaluation and evidence
- Error analysis
- Communication and structure
- Responsible communication

The AI extraction output should be structured, not plain text.

Expected shape:

type Rubric = {
  id?: string;
  name: string;
  description: string;
  scoringGuidance?: string;
  weight?: number;
  linkedSkillIds?: string[];
};

If the backend uses another naming convention, adapt it cleanly but keep this conceptual model.

If no AI extraction endpoint exists yet, create one or stub it clearly in the backend so the frontend can call it.

The endpoint should be something like:
POST /api/rubrics/extract

It should accept the uploaded rubric file and return:
{
  rubrics: Rubric[]
}

If actual LLM integration is already present, use it.
If no LLM integration is present, implement a placeholder extraction path that can be replaced later, but keep the frontend flow working.

====================================================
FEATURE 3: STUDENT FEEDBACK DISPLAY ORDER
====================================================

Change the feedback display to this order exactly:

1. Score: x/100

2. One short summary line:
A concise sentence saying what is good and what is not yet working.

Example:
"Your submission explains the high-level idea clearly, but it needs stronger evidence, metrics, and error analysis."

3. Rubrics section

For each rubric, display a block in this structure:

Rubric name: Score

What's good:
- Short explanation of what the student did well for this rubric.

What's missing:
- Short explanation of what is missing or weak for this rubric.

Button:
"Answer with Logos"

Repeat for all rubrics.

The button may be either:
Option A: one button inside each rubric block
OR
Option B: one common button after all rubric blocks

Choose the option that best fits the existing UI style. Prefer per-rubric buttons if the UI can support it cleanly, because rubric-specific help is more useful.

The button should not auto-edit the student’s answer yet.
For now, it should trigger or prepare rubric-specific assistance/hints.

Do not remove generic feedback entirely.
Generic feedback should remain as fallback only when no rubrics are available.

Priority logic:
- If rubrics exist: use rubric-based feedback.
- If no rubrics exist: use existing generic feedback format as fallback.

====================================================
FEATURE 4: BACKEND FEEDBACK RESPONSE STRUCTURE
====================================================

Update or add the backend response shape for grading so the frontend can render the new feedback order.

Expected conceptual response:

type FeedbackResponse = {
  overallScore: number; // 0-100
  summary: string;
  rubricFeedback: Array<{
    rubricId: string;
    rubricName: string;
    score: number;
    maxScore: number;
    normalizedScore: number; // 0-100 if useful
    whatsGood: string;
    whatsMissing: string;
    linkedSkillIds?: string[];
  }>;
  genericFeedback?: {
    strengths: string[];
    areasToRefine: string[];
    editorialGuidance: string[];
  };
  skillGrowthEvents?: Array<{
    skillId: string;
    skillName: string;
    reason: string;
    pointsAwarded: number;
    rubricId?: string;
  }>;
};

If the app already has a feedback response format, migrate it carefully and update the frontend accordingly.

====================================================
FEATURE 5: RUBRIC-BASED GRADING LOGIC
====================================================

When a student submits work:
- If the selected module has rubrics, grade against those rubrics.
- Give an overall score out of 100.
- Give a score for each rubric.
- Give “what’s good” and “what’s missing” for each rubric.
- Use the module syllabus/objective as additional context.
- Use generic feedback only as fallback when no rubrics exist.

Overall score:
If rubric weights exist, calculate weighted score.
If weights do not exist, average rubric scores.

====================================================
FEATURE 6: SKILL GROWTH LOGIC
====================================================

Implement simple, explainable skill growth tracking.

Important principle:
Performance score and growth score are separate.

Do NOT add skill points every time the student resubmits.

Skill growth should be awarded only when a student meaningfully improves on a rubric linked to a skill.

Use this MVP rule:

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

If the backend does not yet have sessions/attempts, create a minimal data model to support:
- Submission/session id
- Attempt number
- Rubric scores per attempt
- Initial score
- Best score
- Awarded skill growth events

Do not over-engineer the gamification system.

====================================================
FEATURE 7: ANSWER WITH LOGOS / HINT UNLOCK
====================================================

Add support for the “Answer with Logos” button in the rubric block.

For MVP:
- The button should provide rubric-specific help/hinting.
- It should not auto-write the full answer.
- It should not auto-apply changes to the student’s submission.

Hint unlock logic:
Detailed hints should unlock if:
- The student has made at least 3 attempts in the current session
AND
- The rubric score is still below 70%

Before unlocking, show a locked state or disabled button with text like:
"Detailed help unlocks after 3 attempts if this rubric is still below 70%."

After unlocking, clicking “Answer with Logos” should show:
- A targeted hint for that rubric
- A suggestion of what kind of sentence/evidence/example the student should add
- Optionally an example revision, but do not auto-insert it

Keep this simple and aligned with the current UI.

====================================================
FEATURE 8: UI STYLE CONSTRAINTS
====================================================

Use the existing Figma/MCP UI as the visual source of truth.

The current style is:
- Minimal
- Editorial
- Light background
- Serif headings
- Subtle borders
- Spacious cards
- Muted text
- Black primary buttons
- Delicate form controls

Do not convert it into a colorful dashboard.
Do not add loud gradients, badges, charts, or gamified visuals yet.
Do not change typography unless necessary.

The feedback page should still look like the current Logos UI, just with rubric-based structure.

====================================================
IMPLEMENTATION EXPECTATIONS
====================================================

After inspecting the project, implement in small clean commits/sections:

1. Types/models update
2. Module creation UI update
3. Rubric extraction upload + editable rubric cards
4. Backend rubric extraction endpoint or stub
5. Feedback response shape update
6. Rubric-based grading flow
7. Skill growth event logic
8. Feedback UI restructure
9. Answer with Logos hint unlock logic
10. Basic tests or sanity checks if test setup exists

For each changed file, explain:
- Why this file changed
- What changed
- How to test it

====================================================
ACCEPTANCE CRITERIA
====================================================

The work is complete when:

A. Module creation:
- Existing module mode no longer shows Module Name textbox.
- Existing module dropdown has Add Module button next to it.
- Clicking Add Module switches to New Module mode.
- New Module mode shows module name textbox and hides existing module dropdown/add button.
- Syllabus/objective works in both modes.

B. Rubrics:
- Uploading a rubric file extracts structured rubrics or uses a clear placeholder.
- Extracted rubrics are editable.
- User can add/remove rubrics.
- Rubrics can be tagged with skills if skills exist.
- Module can save rubrics.

C. Feedback:
- Feedback displays in this order:
  1. Score: x/100
  2. One summary line
  3. Rubric blocks
- Each rubric block shows:
  - Rubric name and score
  - What's good
  - What's missing
  - Answer with Logos button or locked hint state
- Generic feedback only appears when no rubrics are available.

D. Skill growth:
- Skill points are not awarded just for submitting repeatedly.
- Skill growth is awarded only when rubric improvement is >= 10 percentage points, best score >= 60%, and credit has not already been awarded for that rubric/session.
- Skill growth events are stored or represented clearly.

E. Style:
- UI remains visually consistent with the Figma-generated Logos style.
- No major redesign.
- No unrelated features added.

Start by analyzing the repository and showing me the proposed file-by-file plan before making changes.