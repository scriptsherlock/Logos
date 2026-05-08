export type SkillLink = {
  skillId: string;
  weight: number;
};

export type RubricCriterion = {
  id: string;
  title: string;
  description: string;
  lookingFor?: string;
  expectedScoring?: string;
  skillLinks?: SkillLink[];
  keywords?: string[];
};

export type Module = {
  id: string;
  name: string;
  description: string;
  sampleWork: string;
  teacherFocus?: string;
  rubric: RubricCriterion[];
  rubricUpdatedAt?: string | null;
};

export type Student = {
  id: string;
  name: string;
  programme: string;
  selectedPersonaId: string;
};

export type Persona = {
  id: string;
  name: string;
  pathLabel: string;
};

export type BootstrapResponse = {
  modules: Module[];
  students: Student[];
  personas: Persona[];
  brainStatus: Record<string, unknown>;
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
  moduleId: string;
  studentId: string;
  overallScore: number;
  strengths: string[];
  gaps: FeedbackGap[];
  criteriaResults: CriterionResult[];
  nextBestAction?: string;
  belongingnessMessage?: string;
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
};

export type AnalyseSubmissionResponse = {
  feedbackRecord: FeedbackRecord;
  growthProfile: GrowthProfile;
};

export type TeacherCriterionStatus = RubricCriterion & {
  criterionId: string;
  averageScore: number | null;
  submissions: number;
  affectedStudents: number;
  status: "quiet" | "alert" | "watch" | "healthy";
  mitigationStep: string;
  students: Array<{
    studentId: string;
    studentName: string;
    criterionScore: number;
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
