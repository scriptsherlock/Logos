import type {
  AnalyseSubmissionResponse,
  BootstrapResponse,
  GrowthProfile,
  RubricCriterion,
  TeacherDashboardResponse,
} from "./types";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error || "Request failed");
  }
  return data as T;
}

export function getBootstrap() {
  return request<BootstrapResponse>("/api/bootstrap");
}

export function getStudentGrowth(studentId: string) {
  return request<GrowthProfile>(`/api/students/${studentId}/growth`);
}

export function analyseSubmission(payload: { studentId: string; moduleId: string; workText: string }) {
  return request<AnalyseSubmissionResponse>("/api/submissions/analyse", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateStudentPersona(studentId: string, personaId: string) {
  return request<{ student: unknown }>(`/api/students/${studentId}/persona`, {
    method: "PATCH",
    body: JSON.stringify({ personaId }),
  });
}

export function getTeacherDashboard(moduleId?: string) {
  return request<TeacherDashboardResponse>(`/api/teachers/dashboard${moduleId ? `/${moduleId}` : ""}`);
}

export function saveModuleRubric(moduleId: string, payload: { teacherFocus?: string; criteria: RubricCriterion[] }) {
  return request<{ dashboard: TeacherDashboardResponse }>(`/api/teachers/modules/${moduleId}/rubric`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}
