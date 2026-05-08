import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { Welcome } from "./components/Welcome";
import { StudentPath } from "./components/StudentPath";
import { StudentSkills } from "./components/StudentSkills";
import { StudentWorkspace } from "./components/StudentWorkspace";
import { StudentProgress } from "./components/StudentProgress";
import { TeacherSetup } from "./components/TeacherSetup";
import { TeacherDashboard } from "./components/TeacherDashboard";
import { Login } from "./components/Login";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Welcome },
      { path: "login/:role", Component: Login },
      { path: "student/path", Component: StudentPath },
      { path: "student/skills", Component: StudentSkills },
      { path: "student/workspace", Component: StudentWorkspace },
      { path: "student/progress", Component: StudentProgress },
      { path: "teacher/setup", Component: TeacherSetup },
      { path: "teacher/dashboard", Component: TeacherDashboard },
    ],
  },
]);
