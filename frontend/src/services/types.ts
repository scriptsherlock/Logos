export type SkillLink = {
  skillId: string;
  weight: number;
};

export type RubricCriterion = {
  id: string;
  name?: string;
  title: string;
  description: string;
  lookingFor?: string;
  scoringGuidance?: string;
  expectedScoring?: string;
  weight?: number;
  skillLinks?: SkillLink[];
  linkedSkillIds?: string[];
  keywords?: string[];
};

export type Rubric = RubricCriterion;

export type Module = {
  id: string;
  name: string;
  description: string;
  sampleWork: string;
  teacherFocus?: string;
  rubric: RubricCriterion[];
  rubricUpdatedAt?: string | null;
  studentCount?: number;
  submittedStudentCount?: number;
  submissionCount?: number;
  averageScore?: number;
  latestActivityAt?: string | null;
};

export type Student = {
  id: string;
  name: string;
  programme: string;
  selectedPersonaId: string;
};

export type User = {
  id: string;
  name: string;
  email: string;
  role: "teacher" | "student";
  studentId?: string;
};

export type StudentProfile = {
  id: string;
  userId: string;
  studentId: string;
  selectedCoreSkillIds: string[];
  selectedPersonalSkillIds: string[];
};

export type Persona = {
  id: string;
  name: string;
  pathLabel: string;
};

export type Skill = {
  id: string;
  name: string;
  category: string;
  path?: string;
};

export type BootstrapResponse = {
  modules: Module[];
  students: Student[];
  users: User[];
  studentProfiles: StudentProfile[];
  personas: Persona[];
  skills: Skill[];
  brainStatus: Record<string, unknown>;
};

export type AuthResponse = {
  user: User;
  student?: Student;
  studentProfile?: StudentProfile;
  growthProfile?: GrowthProfile;
};

export type CriterionResult = RubricCriterion & {
  score: number;
  evidenceSummary: string;
  strength?: string;
  gap?: string;
  nextStep?: string;
};

export type FeedbackGap = {
  criterionId: string;
  label: string;
  message: string;
  nextStep?: string;
};

export type FeedbackRecord = {
  id: string;
  submissionId?: string;
  moduleId: string;
  studentId: string;
  attemptNumber?: number;
  overallScore: number;
  strengths: string[];
  gaps: FeedbackGap[];
  criteriaResults: CriterionResult[];
  nextBestAction?: string;
  belongingnessMessage?: string;
  createdAt?: string;
};

export type RubricHint = {
  unlocked: boolean;
  lockedReason?: string;
  hint?: string;
};

export type RubricFeedback = {
  rubricId: string;
  criterionId?: string;
  rubricName: string;
  name?: string;
  score: number;
  maxScore: number;
  normalizedScore: number;
  whatsGood: string;
  whatsMissing: string;
  evidenceSummary?: string;
  linkedSkillIds?: string[];
  answerWithLogos: RubricHint;
};

export type SkillGrowthEvent = {
  id: string;
  studentId: string;
  skillId: string;
  skillName?: string;
  feedbackRecordId?: string;
  sessionId?: string;
  rubricId?: string;
  rubricName?: string;
  previousScore: number;
  newScore: number;
  changeAmount: number;
  evidenceSummary: string;
  createdAt: string;
};

export type SkillGrowthDiagnostic = {
  rubricId: string;
  rubricName: string;
  score: number;
  initialScore: number;
  previousBest: number;
  bestScore: number;
  improvement: number;
  linkedSkillIds: string[];
  awarded: Array<{ skillId: string; changeAmount: number }>;
  blockedReason?: string;
};

export type SubmissionSession = {
  id: string;
  studentId: string;
  moduleId: string;
  attemptCount: number;
  initialRubricScores: Record<string, number>;
  bestRubricScores: Record<string, number>;
  awardedSkillCredits: string[];
};

export type RubricExtractionResponse = {
  rubrics: Rubric[];
  source?: {
    fileName: string;
    extractor: string;
  };
};

export type FeedbackResponse = {
  overallScore: number;
  summary: string;
  rubricFeedback: RubricFeedback[];
  genericFeedback?: {
    strengths: string[];
    gaps: FeedbackGap[];
    nextBestAction?: string;
    belongingnessMessage?: string;
  };
  skillGrowthEvents: SkillGrowthEvent[];
  skillGrowthDiagnostics?: SkillGrowthDiagnostic[];
  sessionId: string;
  attemptNumber: number;
};

export type GrowthSkillState = {
  studentId: string;
  skillId: string;
  current: number;
  baseline: number;
  target: number;
  growth: number;
  stage: string;
  skill?: {
    id: string;
    name: string;
    category: string;
  };
};

export type GrowthProfile = {
  student: Student;
  persona: Persona;
  groups: {
    core: GrowthSkillState[];
    path: GrowthSkillState[];
    belongingness: GrowthSkillState[];
  };
  summary: {
    coreAverage: number;
    pathAverage: number;
    belongingnessAverage: number;
    totalGrowth: number;
  };
  timeline: Array<{ date: string; value: number }>;
  recentGrowthEvents?: SkillGrowthEvent[];
  recentFeedback?: Array<{
    id: string;
    submissionId?: string;
    moduleId: string;
    moduleName: string;
    overallScore: number;
    attemptNumber: number;
    createdAt?: string;
    summary: string;
  }>;
};

export type AnalyseSubmissionResponse = {
  submission?: {
    id: string;
    studentId: string;
    moduleId: string;
    sessionId: string;
    attemptNumber: number;
  };
  feedbackRecord: FeedbackRecord;
  skillGrowth?: SkillGrowthEvent[];
  growthProfile: GrowthProfile;
} & FeedbackResponse;

export type TeacherCriterionStatus = RubricCriterion & {
  criterionId: string;
  averageScore: number | null;
  submissions: number;
  affectedStudents: number;
  status: "quiet" | "alert" | "watch" | "healthy";
  mitigationStep: string;
  commonMissingEvidence?: string;
  students: Array<{
    studentId: string;
    studentName: string;
    overallScore: number;
    criterionScore: number;
    attemptNumber: number;
    sessionId?: string | null;
    submissionId?: string | null;
    feedbackRecordId?: string;
    createdAt?: string | null;
    needsSupport?: boolean;
    evidenceSummary?: string;
    message: string;
  }>;
};

export type TeacherDashboardResponse = {
  modules: Module[];
  selectedModule: Module | null;
  overview: {
    feedbackCount: number;
    studentCount: number;
    awaitingSubmission: number;
    averageScore: number;
    atRiskCount: number;
    strongestCriterion?: TeacherCriterionStatus | null;
    weakestCriterion?: TeacherCriterionStatus | null;
  } | null;
  criterionStatuses: TeacherCriterionStatus[];
};
